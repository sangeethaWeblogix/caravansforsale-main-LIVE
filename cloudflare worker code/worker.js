/**
 * CFS Cloudflare Worker - Optimized Smart Cache
 * 
 * Cache Priority:
 * 1. Images (30-day cache)
 * 2. /api/pool-listings JSON cache — serve from KV (new listing design, json:pool: prefix)
 * 3. Static HTML from KV (routes-mapping lookup) — ONLY for clean paths (no query params)
 * 4. Pass through to origin (Vercel) — for filtered/sorted/paginated pages
 *
 * Features:
 * - JSON cache for /api/pool-listings: KV-backed, passive (admin-controlled).
 *   No stale-while-revalidate, no predictive pre-warming — KV is served as-is until the
 *   WP admin warmer overwrites it. Non-indexed (noindex) requests skip KV entirely.
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

const VARIANT_COUNT = 7; // Must match generation scripts (HTML_VARIANTS in generate-affected-html-cache.js)

// Secret header added to every Worker subrequest so the Cloudflare WAF geo-block
// rule can skip it. Without this, fetchFresh() subrequests arrive at the WAF with
// a Cloudflare Worker IP (non-AU, not in $whitelist_ips) and get blocked.
// Add a WAF Skip rule: http.request.headers["x-cfs-worker-token"][0] eq "<same value>"
// NOTE: In Module-format Workers, secrets are on `env`, not global scope.
// fetchFresh(request, env) reads env.CFS_WORKER_TOKEN directly.
const IMAGE_CACHE_TTL = 2592000; // 30 days
// HTML_CACHE_TTL intentionally removed — KV HTML must NOT be cached by browser or CDN.
// Caching the HTML response would lock users into the same variant for the cache duration,
// completely defeating the random-variant shuffle. Every request must reach the worker
// so it can pick a fresh random variant from the 5 KV keys.

// JSON API cache: entries are written exclusively by the WP admin cache warmer.
// The Worker is read-only — it serves KV hits instantly and live-proxies misses.
// No writes, no background refreshes, no TTL management here.

// In-memory routes-mapping cache (per isolate)
let cachedRoutesMapping = null;
let cacheTimestamp = 0;
const ROUTES_CACHE_TTL = 300000; // 5 minutes


export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ============================================
    // BYPASS: Cloudflare system paths (/cdn-cgi/)
    // These are handled internally by Cloudflare and must never reach Vercel.
    // ============================================
    if (url.pathname.startsWith('/cdn-cgi/')) {
      return fetch(request);
    }

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
      // PRIORITY 2: JSON Cache for /api/pool-listings (new listing design)
      // ============================================
      // Uses json:pool: key prefix. Strips seed, per_page from key so variant/paging
      // do not fragment the cache. Warmer populates json:pool: keys; MISS falls through to Vercel.
      // Strips seed, per_page from key so variant/paging don't fragment the cache.
      // Warmer populates json:pool: keys; MISS falls through to Vercel → WP.
      // ============================================
      if (url.pathname === '/api/pool-listings' || url.pathname === '/api/pool-listings/') {
        return await handlePoolApiCache(request, url, env);
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
        const response = await fetchFresh(request, env);
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
        // RSC payloads must always come from Vercel origin — never from Cloudflare's edge
        // cache, which may hold an RSC response for the previous buildId. A stale RSC
        // response makes the client render nothing (silent failure) until hard-refresh.
        const response = await fetchFresh(request, env);
        return addDebugHeaders(response, 'BYPASS-RSC', null, null);
      }

      // ============================================
      // PRIORITY 4: Serve Static HTML from KV (clean paths only)
      // ============================================
      const { response: cachedHtml, missReason } = await getStaticHtmlFromKV(url, env);
      if (cachedHtml) {
        return cachedHtml;
      }

      // ============================================
      // PRIORITY 5: Pass Through to Origin
      // ============================================
      // Use fetchFresh (Cache-Control: no-cache) so Cloudflare does not serve
      // a stale edge-cached copy of the page from a previous buildId.  This is
      // the most common cause of "all pages blank on navigation, works after
      // hard-refresh": the BYPASS path returns old Cloudflare-cached HTML with
      // the old buildId, the client loads old JS, and RSC navigation fails.
      const response = await fetchFresh(request, env);
      return addDebugHeaders(response, 'BYPASS-NO-CACHE', null, missReason);

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
// JSON POOL CACHE (/api/pool-listings)
// ============================================
/**
 * Builds a normalised KV cache key for pool-listings requests.
 * Strips non-filter params (seed, per_page, clickid, msid, indexed) so every
 * seed variant and page size maps to the same cache entry.
 * Keeps `page` in the key because page > 1 has a different response shape
 * (no slot_bucket) and the warmer only populates page=1 entries.
 * Prefix: json:pool:
 */
function buildPoolCacheKey(url) {
  const params = new URLSearchParams(url.search);
  params.delete('seed');
  params.delete('per_page');
  params.delete('clickid');
  params.delete('msid');
  params.delete('indexed');
  const sorted = [...params.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return `json:pool:${sorted || '_root'}`;
}

/**
 * Handle /api/pool-listings with KV-backed JSON cache.
 * Admin warmer is the sole writer.
 * Flow: MISS → live-proxy to origin (Vercel → WP pool_test endpoint).
 */
async function handlePoolApiCache(request, url, env) {
  const cacheKey = buildPoolCacheKey(url);

  // ── KV lookup ─────────────────────────────────────────────────────
  let kvResult;
  try {
    kvResult = await env.CFS_STATIC_PAGES.getWithMetadata(cacheKey);
  } catch (kvErr) {
    console.error('KV read error (pool cache):', kvErr.message);
    kvResult = { value: null, metadata: null };
  }

  // ── HIT: serve immediately ────────────────────────────────────────
  if (kvResult.value !== null) {
    const meta = kvResult.metadata || {};
    const originalStatus = meta.status || 200;
    return new Response(kvResult.value, {
      status: originalStatus,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'X-Cache': 'HIT',
        'X-CFS-Cache': 'HIT-POOL',
        'X-CFS-Key': cacheKey,
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  // ── MISS: pass through to Vercel (Next.js route.ts calls WP with X-API-Key) ──
  // Cloudflare Worker IPs (2a06:98c0::/29) are blocked by SiteGround's sgcaptcha
  // nginx module when calling WP directly. Vercel's IPs are not in that blocklist.
  //
  // Worker subrequests do NOT re-invoke this Worker (Cloudflare's design — subrequests
  // bypass Worker routes and go directly to origin). So fetchFresh(request) here sends
  // the request straight to Vercel without any infinite loop.
  //
  // Vercel's route.ts sends X-API-Key (via CFS_API_KEY env var) → Cloudflare WAF
  // fires the "Allow wp-json API calls with key" Skip rule → SiteGround receives the
  // request with a Vercel IP (not a Worker IP) → sgcaptcha does not trigger → 200 JSON.
  try {
    const vercelResponse = await fetchFresh(request, env);

    const responseHeaders = new Headers(vercelResponse.headers);
    responseHeaders.set('X-Cache', 'MISS');
    responseHeaders.set('X-CFS-Cache', 'MISS-POOL-VERCEL');
    responseHeaders.set('X-CFS-Key', cacheKey);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(vercelResponse.body, {
      status: vercelResponse.status,
      headers: responseHeaders,
    });
  } catch (fetchErr) {
    console.error('Vercel pass-through failed (pool cache miss):', fetchErr.message);
    return new Response(JSON.stringify({ success: false, error: 'Service unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'X-CFS-Cache': 'ERROR-VERCEL-DOWN' }
    });
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
// Returns { response, missReason }.
// response is non-null on a KV hit; missReason explains why we fell through
// (surfaces as X-CFS-Error on BYPASS-NO-CACHE for easy debugging).
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
      return { response: null, missReason: 'no-routes-mapping' };
    }

    const variantKeys = routesMapping[normalizedPath];

    if (!variantKeys) {
      return { response: null, missReason: 'path-not-in-routes-mapping' };
    }

    // Build the ordered list of variant keys to try, starting at a random index
    // so the shuffle effect is preserved, but falling back to other variants
    // when a randomly chosen key is missing from KV (e.g. a partial cache-warm
    // run wrote routes-mapping but failed to upload all HTML entries).
    let candidates;
    if (Array.isArray(variantKeys) && variantKeys.length > 0) {
      const startIndex = Math.floor(Math.random() * variantKeys.length);
      candidates = [
        ...variantKeys.slice(startIndex),
        ...variantKeys.slice(0, startIndex),
      ];
    } else if (typeof variantKeys === 'string') {
      // Legacy: single string value
      candidates = [variantKeys];
    } else {
      return { response: null, missReason: 'invalid-variant-keys' };
    }

    // Read current-build-id once (shared across all variant attempts)
    const currentBuildId = await env.CFS_STATIC_PAGES.get('current-build-id');
    if (!currentBuildId) {
      console.log(`No current-build-id in KV — bypassing KV HTML for ${normalizedPath}`);
      return { response: null, missReason: 'no-current-build-id' };
    }

    // Try each variant in order; skip missing/invalid entries rather than
    // falling all the way through to Vercel origin immediately.
    for (const kvKey of candidates) {
      // Fetch from KV
      const rawHtml = await env.CFS_STATIC_PAGES.get(kvKey);
      if (!rawHtml) {
        console.log(`KV miss for variant ${kvKey} — trying next variant`);
        continue;
      }

      // Guard: if the stored HTML is a Cloudflare challenge/block page (happens when
      // the cache generator ran from a non-AU IP and fetched through www instead of
      // the Vercel preview URL), skip this variant and try the next.
      // Real Next.js pages (both Pages Router and App Router) always reference
      // /_next/static/ for their JS/CSS assets; challenge pages never do.
      if (!rawHtml.includes('/_next/static/')) {
        console.log(`KV HTML for ${kvKey} is not a valid Next.js page — trying next variant`);
        continue;
      }

      // Build-ID handling:
      //
      // "current-build-id" is written to KV by scripts/update-kv-build-id.js on
      // every Vercel deployment. The KV HTML still embeds the OLD buildId until the
      // next cache warmup regenerates it.
      //
      // When buildIds differ, patch the old buildId strings inside the KV HTML and
      // serve the patched version. This keeps KV warm across all deployments. The
      // page content (listings, layout, text) is from the last cache warmup (slightly
      // stale until the evening scheduled run — acceptable). The JS/CSS paths now
      // point to the current Vercel build's files so the page loads and hydrates.
      //
      // The buildId appears in two places in the HTML:
      //   App Router:   /_next/static/{buildId}/_buildManifest.js  (script src)
      //   Pages Router: "buildId":"OLD"  (in __NEXT_DATA__ JSON)
      // replaceAll is safe because the buildId is a unique cryptographic hash.
      const htmlBuildId =
        rawHtml.match(/\/_next\/static\/([^/]+)\/_buildManifest\.js/)?.[1] || // App Router
        rawHtml.match(/"buildId":"([^"]+)"/)?.[1]; // Pages Router fallback
      let html = rawHtml;
      if (htmlBuildId && htmlBuildId !== currentBuildId) {
        // Patch stale buildId → current buildId so the client loads the right JS/CSS.
        html = rawHtml.replaceAll(htmlBuildId, currentBuildId);
        console.log(`Build-ID patched in KV HTML: ${htmlBuildId} → ${currentBuildId} (${kvKey})`);
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
      return {
        response: new Response(htmlWithSeed, {
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
        }),
        missReason: null,
      };
    }

    // All variants were missing or invalid
    console.log(`All ${candidates.length} KV variants missing/invalid for ${normalizedPath}`);
    return { response: null, missReason: `all-${candidates.length}-variants-missing` };

  } catch (error) {
    console.error('KV lookup error:', error.message);
    return { response: null, missReason: `kv-error:${error.message.substring(0, 80)}` };
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

/**
 * Fetch from origin while bypassing Cloudflare's edge cache.
 *
 * Plain `fetch(request)` inside a Worker checks Cloudflare's edge cache first.
 * If Cloudflare has a page cached from before the latest Vercel deployment (it uses
 * the old buildId), the Worker serves that stale HTML.  The client then loads old
 * JS, its RSC router-state-tree has the old buildId, and every client-side
 * navigation silently fails — the page goes blank until the user hard-refreshes.
 *
 * Adding `Cache-Control: no-cache` to the sub-request tells Cloudflare to bypass
 * its cache and always reach Vercel origin for fresh HTML / RSC payloads.
 *
 * Used for every BYPASS path (RSC, HAS-PARAMS, NO-CACHE) so that post-deployment
 * transitions are always served with the correct buildId HTML.
 */
function fetchFresh(request, env) {
  const headers = new Headers(request.headers);
  headers.set('Cache-Control', 'no-cache');
  // Identify this as a Worker subrequest so the Cloudflare WAF geo-block rule
  // can skip it (WAF Skip rule: http.request.headers["x-cfs-worker-token"][0] eq "<token>").
  // In Module-format Workers, secrets live on env — NOT as global variables.
  const bypassToken = env?.CFS_WORKER_TOKEN;
  if (bypassToken) headers.set('X-CFS-Worker-Token', bypassToken);
  return fetch(new Request(request, { headers }));
}

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
