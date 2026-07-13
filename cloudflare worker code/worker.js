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
 * - JSON cache for /api/listings: KV-backed, passive (admin-controlled), API-down resilience.
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

const VARIANT_COUNT = 5; // Must match generation scripts
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

// ============================================
// GEO-BLOCK: Australia-only (defense-in-depth)
// Whitelist IPs are read from Cloudflare Custom List "whitelist_ips".
// To add/remove IPs: Cloudflare dashboard → Configurations → Lists → whitelist_ips
// Changes take effect within 5 minutes (cache TTL) — no redeployment needed.
// Requires Worker secret: CF_API_TOKEN (Account Filter Lists: Read permission)
// ============================================

const CF_ACCOUNT_ID = '22d65edb10b8bf056c919186882a46b7';
const CF_WHITELIST_LIST_ID = '9801142e49d84a109155c8ab46295322';

// In-memory whitelist cache (per isolate, refreshed every 5 minutes)
let cachedWhitelistIPs = null;
let whitelistCacheTimestamp = 0;
const WHITELIST_CACHE_TTL = 300000; // 5 minutes

async function getWhitelistEntries(env) {
  const now = Date.now();
  if (cachedWhitelistIPs !== null && (now - whitelistCacheTimestamp) < WHITELIST_CACHE_TTL) {
    return cachedWhitelistIPs;
  }
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/rules/lists/${CF_WHITELIST_LIST_ID}/items?per_page=100`,
      {
        headers: {
          'Authorization': `Bearer ${env.CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await response.json();
    if (data.success && Array.isArray(data.result)) {
      cachedWhitelistIPs = data.result.map(item => item.ip).filter(Boolean);
      console.log(`Whitelist loaded: ${cachedWhitelistIPs.length} entries`);
    } else {
      console.error('CF API whitelist fetch failed:', JSON.stringify(data.errors));
      cachedWhitelistIPs = cachedWhitelistIPs || [];
    }
  } catch (e) {
    console.error('Failed to fetch whitelist from CF API:', e.message);
    cachedWhitelistIPs = cachedWhitelistIPs || [];
  }
  whitelistCacheTimestamp = now;
  return cachedWhitelistIPs;
}

// Check if an IP matches a whitelist entry (exact match or CIDR range)
function ipMatchesEntry(clientIp, entry) {
  if (!entry.includes('/')) return clientIp === entry; // exact match

  // CIDR match
  const [network, prefixStr] = entry.split('/');
  const prefix = parseInt(prefixStr, 10);
  const isIPv6 = network.includes(':');

  try {
    if (isIPv6) {
      return ipv6InCidr(clientIp, network, prefix);
    } else {
      return ipv4InCidr(clientIp, network, prefix);
    }
  } catch (e) {
    return false;
  }
}

function ipv4InCidr(ip, network, prefix) {
  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
  const netNum = network.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipNum & mask) === (netNum & mask);
}

function expandIPv6(ip) {
  // Expand :: shorthand and pad each group to 4 hex digits
  let parts = ip.split('::');
  let left = parts[0] ? parts[0].split(':') : [];
  let right = parts[1] ? parts[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  const middle = Array(missing).fill('0000');
  return [...left, ...middle, ...right].map(g => g.padStart(4, '0')).join('');
}

function ipv6InCidr(ip, network, prefix) {
  const ipHex = expandIPv6(ip);
  const netHex = expandIPv6(network);
  // Compare the first `prefix` bits
  const hexChars = Math.floor(prefix / 4);
  const remainingBits = prefix % 4;
  if (ipHex.slice(0, hexChars) !== netHex.slice(0, hexChars)) return false;
  if (remainingBits === 0) return true;
  const mask = 0xF & (~0 << (4 - remainingBits));
  return (parseInt(ipHex[hexChars], 16) & mask) === (parseInt(netHex[hexChars], 16) & mask);
}

async function isGeoBlocked(request, env) {
  const country = request.cf?.country;
  if (country === 'AU') return false; // Allow Australia

  const clientIp = request.headers.get('CF-Connecting-IP') || '';
  const whitelist = await getWhitelistEntries(env);
  const isWhitelisted = whitelist.some(entry => ipMatchesEntry(clientIp, entry));
  if (isWhitelisted) {
    console.log(`Whitelist match for ${clientIp}`);
    return false;
  }

  // Only allow verified search engine crawlers (Googlebot, Bingbot etc.)
  const botCategory = request.cf?.verifiedBotCategory || '';
  if (botCategory === 'Search Engine Crawlers') return false;

  console.log(`Geo-blocked: ${clientIp} (${country})`);
  return true; // Block everyone else
}

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

    // ============================================
    // GEO-BLOCK CHECK (defense-in-depth)
    // ============================================
    if (await isGeoBlocked(request, env)) {
      return new Response(
        '<!DOCTYPE html><html><head><title>Access Restricted</title></head><body><h1>Access Restricted</h1><p>This website is only available in Australia.</p></body></html>',
        {
          status: 403,
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'X-CFS-Cache': 'GEO-BLOCKED',
            'Cache-Control': 'no-store',
          }
        }
      );
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
      // PRIORITY 2: JSON Cache for /api/listings
      // ============================================
      // Intercept the client-side JSON API requests that fire after React hydration.
      // Indexed pages: serve from KV as-is (X-Cache: HIT), or fetch-and-cache on a
      // genuine miss. Non-indexed pages: always live-proxied, never cached.
      // ============================================
      if (url.pathname === '/api/listings' || url.pathname === '/api/listings/') {
        return await handleJsonApiCache(request, url, env);
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
  params.delete('indexed'); // control flag for this Worker, not part of the page identity
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
 * Handle /api/listings with KV-backed JSON cache.
 *
 * The admin cache warmer is the SOLE writer to KV — the Worker never writes.
 * This keeps KV clean: only curated, admin-generated entries ever land there.
 *
 * Flow:
 *   - Not indexed  → live-proxy to origin, never touch KV
 *   - Indexed, HIT → serve KV immediately, no staleness check, no background work
 *   - Indexed, MISS → live-proxy to origin, do NOT write to KV
 */
async function handleJsonApiCache(request, url, env) {
  const isIndexed = url.searchParams.get('indexed') === '1';

  // ── Non-indexed: always live, never touch KV ──────────────────────
  if (!isIndexed) {
    try {
      const response = await fetch(request);
      return addDebugHeaders(response, 'BYPASS-NOINDEX', null, null);
    } catch (fetchErr) {
      console.error('Origin fetch failed (noindex):', fetchErr.message);
      return new Response(JSON.stringify({ success: false, error: 'Service unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'X-CFS-Cache': 'ERROR-ORIGIN-DOWN' }
      });
    }
  }

  const cacheKey = buildJsonCacheKey(url);

  // ── KV lookup ─────────────────────────────────────────────────────
  let kvResult;
  try {
    kvResult = await env.CFS_STATIC_PAGES.getWithMetadata(cacheKey);
  } catch (kvErr) {
    console.error('KV read error (json cache):', kvErr.message);
    kvResult = { value: null, metadata: null };
  }

  // ── HIT: serve immediately, no writes, no background work ─────────
  if (kvResult.value !== null) {
    const meta = kvResult.metadata || {};
    const originalStatus = meta.status || 200;
    return new Response(kvResult.value, {
      status: originalStatus,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'X-Cache': 'HIT',
        'X-CFS-Cache': 'HIT-JSON',
        'X-CFS-Key': cacheKey,
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  // ── MISS: live-proxy only, admin warmer will populate KV later ────
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

  // Redirects (e.g. Next.js trailingSlash 308) must carry their Location header
  // through, otherwise the client can't follow them.
  const passthroughHeaders = {
    'Content-Type': originResponse.headers.get('Content-Type') || 'application/json;charset=UTF-8',
    'Cache-Control': 'public, max-age=60, s-maxage=60',
    'X-Cache': 'MISS',
    'X-CFS-Cache': 'MISS-JSON',
    'X-CFS-Key': cacheKey,
    'Access-Control-Allow-Origin': '*',
  };
  const location = originResponse.headers.get('Location');
  if (location) passthroughHeaders['Location'] = location;

  return new Response(body, { status, headers: passthroughHeaders });
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
    //
    // "current-build-id" is written to KV by scripts/update-kv-build-id.js which runs
    // automatically after every "next build" (see package.json). If it is absent the
    // KV HTML is potentially stale — bypass conservatively rather than risk serving
    // broken CSS/JS.
    const currentBuildId = await env.CFS_STATIC_PAGES.get('current-build-id');
    if (!currentBuildId) {
      console.log(`No current-build-id in KV — bypassing KV HTML conservatively for ${kvKey}`);
      return null; // Falls through to PRIORITY 5 (Vercel origin)
    }
    const htmlBuildId = html.match(/"buildId":"([^"]+)"/)?.[1];
    if (!htmlBuildId || htmlBuildId !== currentBuildId) {
      console.log(`Build-ID mismatch: KV=${htmlBuildId}, live=${currentBuildId} — bypassing KV for ${kvKey}`);
      return null; // Falls through to PRIORITY 5 (Vercel origin)
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