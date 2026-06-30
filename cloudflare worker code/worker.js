/**
 * CFS Cloudflare Worker - Optimized Smart Cache
 * 
 * Cache Priority:
 * 1. Images (30-day cache)
 * 2. /api/listings JSON cache — serve from KV, stale fallback when API down
 * 3. Static HTML from KV (routes-mapping lookup) — ONLY for clean paths (no query params)
 * 4. Pass through to origin (Vercel) — for filtered/sorted/paginated pages
 *
 * Features:
 * - JSON cache for /api/listings: KV-backed, 1-hr TTL, stale-while-revalidate, API-down resilience
 * - Bypasses HTML cache for ANY query params to prevent hydration errors
 * - Random variant selection (5 variants) for shuffle effect on cached HTML pages
 * - Routes-mapping cached in memory with TTL to reduce KV reads
 * - Proper error handling with origin fallback
 * - Clear debugging headers
 *
 * IMPORTANT SLUG FORMAT:
 * - Priority pages: homepage-v1 … homepage-v5, listings-home-v1 … listings-home-v5
 * - Sitemap pages: {slug}-v1 … {slug}-v5 where slug = path with /listings/ stripped, slashes→hyphens
 * - Routes-mapping values are ALWAYS arrays: ["{slug}-v1", ..., "{slug}-v5"]
 */

const VARIANT_COUNT = 5; // Must match generation scripts
const IMAGE_CACHE_TTL = 2592000; // 30 days
// HTML_CACHE_TTL intentionally removed — KV HTML must NOT be cached by browser or CDN.
// Caching the HTML response would lock users into the same variant for the cache duration,
// completely defeating the random-variant shuffle. Every request must reach the worker
// so it can pick a fresh random variant from the 5 KV keys.

// JSON API cache TTL (1 hour fresh, 24 hours stale-available)
const JSON_CACHE_FRESH_TTL = 3600;       // 1 hour — serve as HIT
const JSON_CACHE_STALE_TTL = 86400;      // 24 hours — kept in KV for stale fallback

// In-memory routes-mapping cache (per isolate)
let cachedRoutesMapping = null;
let cacheTimestamp = 0;
const ROUTES_CACHE_TTL = 300000; // 5 minutes

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only process GET requests
    if (request.method !== 'GET') {
      return fetch(request);
    }

    try {
      // ============================================
      // PRIORITY 1: Cache Images
      // ============================================
      if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
        return await handleImageRequest(request, ctx);
      }

      // ============================================
      // PRIORITY 2: JSON Cache for /api/listings
      // ============================================
      // Intercept the client-side JSON API requests that fire after React hydration.
      // Serves from KV (X-Cache: HIT), refreshes in background when stale,
      // and falls back to stale KV when origin/WP API is down.
      // ============================================
      if (url.pathname === '/api/listings' || url.pathname === '/api/listings/') {
        return await handleJsonApiCache(request, url, env, ctx);
      }

      // ============================================
      // PRIORITY 3: Bypass HTML cache for ANY query parameters
      // ============================================
      // This is CRITICAL for preventing hydration errors.
      // When a user applies filters (orderby, page, type, state, etc.),
      // the URL gets query params. If we serve cached HTML for these,
      // React hydrates expecting filtered data but gets the cached
      // (unfiltered/differently-ordered) HTML → hydration mismatch → Sentry errors.
      //
      // By passing ALL query-param URLs to Vercel, we ensure:
      // - orderby=year-asc shows correct sort order
      // - page=2 shows correct pagination
      // - filter combos show correct results
      // - React hydration always matches server HTML
      // ============================================
      if (url.search && url.search.length > 0) {
        const response = await fetch(request);
        return addDebugHeaders(response, 'BYPASS-HAS-PARAMS', null, null);
      }

      // ============================================
      // PRIORITY 3b: Bypass KV HTML for Next.js client-side navigation (RSC requests)
      // ============================================
      // When the user clicks a link, Next.js does a client-side navigation by sending
      // a GET request to the new URL with the header "RSC: 1" (React Server Component
      // payload request). The server must respond with RSC payload text, NOT a full HTML page.
      // If we serve KV-cached HTML here, Next.js discards it (wrong format), the navigation
      // silently fails, and the page keeps showing the old content until a full refresh.
      // Solution: detect RSC/prefetch headers and pass through to Vercel (origin).
      const isRscRequest = request.headers.get('RSC') === '1'
        || request.headers.get('Next-Router-State-Tree') !== null
        || request.headers.get('Next-Router-Prefetch') !== null;
      if (isRscRequest) {
        const response = await fetch(request);
        return addDebugHeaders(response, 'BYPASS-RSC', null, null);
      }

      // ============================================
      // PRIORITY 4: Serve Static HTML from KV (clean paths only)
      // ============================================
      const cachedHtml = await getStaticHtmlFromKV(url, env);
      if (cachedHtml) {
        return cachedHtml;
      }

      // ============================================
      // PRIORITY 5: Pass Through to Origin
      // ============================================
      const response = await fetch(request);
      return addDebugHeaders(response, 'BYPASS-NO-CACHE', null, null);

    } catch (error) {
      console.error('Worker error:', error.message);

      // Fallback to origin
      try {
        const fallbackResponse = await fetch(request);
        return addDebugHeaders(fallbackResponse, 'ERROR-FALLBACK', null, error.message);
      } catch (fallbackError) {
        return new Response('Service temporarily unavailable', {
          status: 503,
          headers: {
            'Content-Type': 'text/html',
            'Retry-After': '30',
            'X-CFS-Cache': 'FATAL-ERROR'
          }
        });
      }
    }
  }
};

// ============================================
// JSON API CACHE (/api/listings)
// ============================================
/**
 * Builds a normalized KV cache key from URLSearchParams.
 * Sorts params alphabetically and strips tracking params so
 * ?page=1&category=off-road and ?category=off-road&page=1 share the same key.
 */
function buildJsonCacheKey(url) {
  const params = new URLSearchParams(url.search);
  params.delete('clickid');
  params.delete('msid');
  params.delete('shuffle_seed'); // shuffle_seed is a client-side display hint, not a data filter
  return buildJsonCacheKeyFromParams(params);
}

function buildJsonCacheKeyFromParams(params) {
  const sorted = [...params.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return `json:api:${sorted || '_root'}`;
}

/**
 * Handle /api/listings with KV-backed JSON cache + predictive next-page pre-warming.
 *
 * Flow:
 *   1. Check KV for cached JSON
 *   2a. FRESH hit  → return immediately (X-Cache: HIT)  + pre-warm next page in background
 *   2b. STALE hit  → return stale immediately            + refresh current + pre-warm next
 *   3. MISS        → fetch from origin, store in KV      + pre-warm next page in background
 *   4. Origin fail → 503 (no stale available)
 *
 * Predictive pre-warming:
 *   After serving any page N response, the worker fires a background job that:
 *   - Parses total_pages from the JSON
 *   - If page N+1 exists and is not already fresh in KV, fetches and caches it
 *   This means by the time the user clicks "next page", it's already in KV.
 *   X-CFS-Prewarm: 1 header marks pre-warm requests so they don't chain infinitely.
 */
async function handleJsonApiCache(request, url, env, ctx) {
  const cacheKey = buildJsonCacheKey(url);
  const isPrewarm = request.headers.get('X-CFS-Prewarm') === '1';

  // ── Step 1: Check KV ──────────────────────────────────────────────
  let kvResult;
  try {
    kvResult = await env.CFS_STATIC_PAGES.getWithMetadata(cacheKey);
  } catch (kvErr) {
    console.error('KV read error (json cache):', kvErr.message);
    kvResult = { value: null, metadata: null };
  }

  if (kvResult.value !== null) {
    const meta = kvResult.metadata || {};
    const savedAt = meta.savedAt || 0;
    const originalStatus = meta.status || 200;
    const isStale = (Date.now() - savedAt) > JSON_CACHE_FRESH_TTL * 1000;

    if (isStale) {
      ctx.waitUntil(refreshJsonCache(request.url, env, cacheKey));
    }

    // ── Pre-warm next page ONLY on cache HIT ──────────────────────────
    // IMPORTANT: Never pre-warm on a cache MISS. A MISS means SiteGround is
    // already handling this request — adding a pre-warm call on top would double
    // the server load during a thundering herd (100 users × 2 calls each = 200 hits).
    // On a HIT the page is warm and SiteGround is idle, so 1 extra call is safe.
    // The freshness check inside prewarmNextPage ensures only 1 of 100 concurrent
    // HIT responses actually fires the API call — the other 99 see it as already fresh.
    if (!isPrewarm) {
      ctx.waitUntil(prewarmNextPage(url, kvResult.value, env));
    }

    return new Response(kvResult.value, {
      status: originalStatus,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'X-Cache': isStale ? 'STALE' : 'HIT',
        'X-CFS-Cache': isStale ? 'HIT-JSON-STALE' : 'HIT-JSON',
        'X-CFS-Key': cacheKey,
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  // ── Step 2: Cache MISS — fetch from origin ────────────────────────
  // No pre-warm here — SiteGround is already under load serving this request.
  let originResponse;
  try {
    originResponse = await fetch(request);
  } catch (fetchErr) {
    console.error('Origin fetch failed (json cache miss):', fetchErr.message);
    return new Response(JSON.stringify({ success: false, error: 'Service unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'X-CFS-Cache': 'ERROR-ORIGIN-DOWN' }
    });
  }

  const body = await originResponse.text();
  const status = originResponse.status;

  // Only cache successful responses — never store redirects (3xx) or server errors (5xx).
  // A stored 308 would be replayed to every future request for this key, breaking the API.
  if (status >= 200 && status < 300) {
    ctx.waitUntil(
      env.CFS_STATIC_PAGES.put(cacheKey, body, {
        expirationTtl: JSON_CACHE_STALE_TTL,
        metadata: { savedAt: Date.now(), status }
      }).catch(e => console.error('KV write error (json cache):', e.message))
    );
  }

  // No pre-warm on MISS — see comment above

  return new Response(body, {
    status,
    headers: {
      'Content-Type': originResponse.headers.get('Content-Type') || 'application/json;charset=UTF-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60',
      'X-Cache': 'MISS',
      'X-CFS-Cache': 'MISS-JSON',
      'X-CFS-Key': cacheKey,
      'Access-Control-Allow-Origin': '*',
    }
  });
}

/**
 * Predictive next-page pre-warmer.
 * Parses total_pages from the current page's JSON response, then fetches
 * and caches page N+1 if it isn't already fresh in KV.
 * Uses X-CFS-Prewarm: 1 header so the worker doesn't chain further.
 */
async function prewarmNextPage(url, responseBody, env) {
  try {
    // Parse pagination from response
    let totalPages = 1;
    try {
      const json = JSON.parse(responseBody);
      totalPages = json?.pagination?.total_pages || 1;
    } catch {
      return; // Non-JSON or unparseable — skip
    }

    const params = new URLSearchParams(url.search);
    params.delete('clickid');
    params.delete('msid');

    const currentPage = parseInt(params.get('page') || '1', 10);
    if (currentPage >= totalPages) return; // Already on last page

    // Build next-page params
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set('page', String(currentPage + 1));

    const nextKey = buildJsonCacheKeyFromParams(nextParams);

    // Skip if next page is already fresh in KV
    const existing = await env.CFS_STATIC_PAGES.getWithMetadata(nextKey);
    if (existing.value !== null) {
      const savedAt = existing.metadata?.savedAt || 0;
      const isFresh = (Date.now() - savedAt) < JSON_CACHE_FRESH_TTL * 1000;
      if (isFresh) return; // Already warm, nothing to do
    }

    // Fetch next page via origin (X-CFS-Prewarm prevents further chaining)
    const nextUrl = `${url.origin}/api/listings?${nextParams.toString()}`;
    const res = await fetch(nextUrl, {
      headers: { 'X-CFS-Prewarm': '1' }
    });
    const body = await res.text();

    // Only cache successful responses — never store redirects (3xx) or errors (4xx/5xx)
    if (res.status >= 200 && res.status < 300) {
      await env.CFS_STATIC_PAGES.put(nextKey, body, {
        expirationTtl: JSON_CACHE_STALE_TTL,
        metadata: { savedAt: Date.now(), status: res.status }
      });
    }
  } catch (e) {
    console.error('Pre-warm next page failed:', e.message);
  }
}

/**
 * Background refresh: re-fetch from origin and update KV.
 * Called via ctx.waitUntil so it doesn't block the response.
 */
async function refreshJsonCache(originalUrl, env, cacheKey) {
  try {
    const res = await fetch(originalUrl);
    const body = await res.text();
    // Only cache successful responses — never overwrite a valid entry with a redirect or error
    if (res.status >= 200 && res.status < 300) {
      await env.CFS_STATIC_PAGES.put(cacheKey, body, {
        expirationTtl: JSON_CACHE_STALE_TTL,
        metadata: { savedAt: Date.now(), status: res.status }
      });
    }
  } catch (e) {
    console.error('Background JSON refresh failed:', e.message);
  }
}

// ============================================
// IMAGE CACHING
// ============================================
async function handleImageRequest(request, ctx) {
  const cache = caches.default;
  
  // Try cache first
  let response = await cache.match(request);
  
  if (response) {
    return addDebugHeaders(response, 'HIT-IMAGE', null, null);
  }
  
  // Fetch from origin
  response = await fetch(request);
  
  // Cache successful responses
  if (response.ok) {
    const cacheResponse = new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        'Cache-Control': `public, max-age=${IMAGE_CACHE_TTL}`,
        'X-CFS-Cache': 'MISS-IMAGE'
      }
    });
    
    ctx.waitUntil(cache.put(request, cacheResponse.clone()));
    return cacheResponse;
  }
  
  return response;
}

// ============================================
// KV STATIC HTML RETRIEVAL
// ============================================
async function getStaticHtmlFromKV(url, env) {
  try {
    // Normalize path - ensure it ends with /
    let normalizedPath = url.pathname;
    if (!normalizedPath.endsWith('/')) {
      normalizedPath += '/';
    }
    
    // Load routes mapping (with in-memory caching)
    const routesMapping = await getRoutesMapping(env);
    if (!routesMapping) {
      return null;
    }
    
    const variantKeys = routesMapping[normalizedPath];
    
    if (!variantKeys) {
      return null;
    }
    
    // Select a random variant
    let kvKey;
    if (Array.isArray(variantKeys) && variantKeys.length > 0) {
      // Use crypto for better randomness than Math.random()
      const randomIndex = Math.floor(Math.random() * variantKeys.length);
      kvKey = variantKeys[randomIndex];
    } else if (typeof variantKeys === 'string') {
      // Legacy: single string value (shouldn't happen with current generation, but safe fallback)
      kvKey = variantKeys;
    } else {
      return null;
    }
    
    // Fetch from KV
    const html = await env.CFS_STATIC_PAGES.get(kvKey);

    if (!html) {
      return null;
    }

    // Build-ID mismatch check: if Vercel has been redeployed since the KV HTML was
    // generated, the embedded __NEXT_DATA__ buildId will be stale. Serving stale HTML
    // causes RSC client-side navigation to fail silently (filter apply doesn't update
    // the page) because the client's router state and Vercel's live build are out of sync.
    // Fix: bypass KV HTML and serve fresh from Vercel when buildIds differ.
    const currentBuildId = await env.CFS_STATIC_PAGES.get('current-build-id');
    if (currentBuildId) {
      const htmlBuildId = html.match(/"buildId":"([^"]+)"/)?.[1];
      if (htmlBuildId && htmlBuildId !== currentBuildId) {
        console.log(`Build-ID mismatch: KV=${htmlBuildId}, live=${currentBuildId} — bypassing KV for ${kvKey}`);
        return null; // Falls through to PRIORITY 5 (Vercel origin)
      }
    }

    // Inject shuffle seed so React hydration uses the same variant order.
    // e.g. kvKey = "listings-home-v3" → seed = 3
    const variantNumber = kvKey.match(/-v(\d+)$/)?.[1] || '1';
    const htmlWithSeed = html.replace(
      '</head>',
      `<script>window.__SHUFFLE_SEED__ = ${variantNumber};</script>\n</head>`
    );
    
    // Return with appropriate headers.
    // IMPORTANT: Cache-Control must be no-store so neither the browser nor Cloudflare's
    // CDN edge caches this response. If it were cached (e.g. max-age=3600), the browser
    // would serve the exact same variant for 1 hour on every refresh, and the worker's
    // random variant selection would have no effect after the first request.
    // The KV store is already the cache — no second caching layer is needed here.
    return new Response(htmlWithSeed, {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-store',
        'X-CFS-Cache': 'HIT-KV',
        'X-CFS-Route': normalizedPath,
        'X-CFS-Key': kvKey,
        'X-CFS-Source': 'cloudflare-kv',
        'Vary': 'Accept-Encoding'
      }
    });
    
  } catch (error) {
    console.error('KV lookup error:', error.message);
    return null;
  }
}

// ============================================
// ROUTES MAPPING CACHE
// ============================================
async function getRoutesMapping(env) {
  const now = Date.now();
  
  // Return cached version if still fresh
  if (cachedRoutesMapping && (now - cacheTimestamp) < ROUTES_CACHE_TTL) {
    return cachedRoutesMapping;
  }
  
  // Fetch fresh from KV
  const routesMappingJson = await env.CFS_STATIC_PAGES.get('routes-mapping');
  if (!routesMappingJson) {
    return null;
  }
  
  cachedRoutesMapping = JSON.parse(routesMappingJson);
  cacheTimestamp = now;
  
  return cachedRoutesMapping;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function addDebugHeaders(response, cacheStatus, kvKey, errorMsg) {
  const headers = new Headers(response.headers);
  
  headers.set('X-CFS-Cache', cacheStatus);
  
  if (kvKey) {
    headers.set('X-CFS-Key', kvKey);
  }
  
  if (errorMsg) {
    headers.set('X-CFS-Error', errorMsg.substring(0, 100));
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}