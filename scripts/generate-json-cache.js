/* eslint-disable */
/**
 * JSON API Cache Pre-Warmer
 *
 * Reads src/app/url.csv (3,462 URLs), parses each path into WP API query params,
 * calls the WP API directly, and stores the JSON response in Cloudflare KV.
 *
 * This pre-warms the JSON cache layer in the Cloudflare Worker so that when a user
 * visits a listing page and React hydrates, the client-side /api/listings fetch is
 * served from KV with X-Cache: HIT instead of hitting the WP API.
 *
 * KV key format (must match worker.js buildJsonCacheKey):
 *   json:api:{sorted-params}
 *   e.g. json:api:category=off-road&page=1&state=victoria
 *
 * Concurrency: 5 parallel requests — safe for live WP server.
 * Estimated time: ~35 min for all 3,462 URLs at concurrency 5.
 *
 * IMPORTANT: This script only pre-warms page=1 for each URL.
 * Subsequent pages (page=2, page=3…) are cached on first real user request.
 */

const fetch = require('node-fetch');
const fs    = require('fs');
const path  = require('path');

// ── Environment ──────────────────────────────────────────────────────────────
const WP_API_BASE        = process.env.WP_API_BASE || 'https://admin.caravansforsale.com.au/wp-json/cfs/v1/new_optimize_code';
const WP_API_KEY         = process.env.WP_API_KEY || '';
const WARMER_BYPASS_KEY  = process.env.WARMER_BYPASS_KEY || '';
const CF_ACCOUNT_ID      = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN      = process.env.CF_API_TOKEN;
const URLS_CSV          = process.env.URLS_CSV || path.join(__dirname, '../src/app/url.csv');
const BATCH_SIZE        = process.env.BATCH_SIZE   ? parseInt(process.env.BATCH_SIZE)   : null;
const BATCH_NUMBER      = process.env.BATCH_NUMBER ? parseInt(process.env.BATCH_NUMBER) : null;

// ── Configuration ────────────────────────────────────────────────────────────
const CONCURRENCY           = 1;    // 1 sequential request per batch — prevents sgcaptcha rate trigger
const DELAY_BETWEEN_URLS    = 500;  // ms between requests
const KV_STALE_TTL          = 86400; // 24 hours — matches worker JSON_CACHE_STALE_TTL
const KV_UPLOAD_RETRIES     = 3;
const KV_RETRY_DELAY        = 2000;

// HTTP statuses that should be skipped immediately (no retries, no KV store)
const SKIP_IMMEDIATELY = new Set([500, 502, 503]);

// ── URL CSV parsing ──────────────────────────────────────────────────────────
function readUrlsFromCsv(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.trim().split('\n');
  const urls = [];
  for (let i = 1; i < lines.length; i++) { // skip header row
    const cols = lines[i].split('\t');
    const url = (cols[1] || '').trim();
    if (url && url.startsWith('http')) {
      urls.push(url);
    }
  }
  return urls;
}

// ── Path → API params parser ──────────────────────────────────────────────────
/**
 * Parse a /listings/{slug1}/{slug2}/... path into URLSearchParams for the WP API.
 * Mirrors the logic in src/app/components/urlBuilder.ts → parseSlugToFilters.
 */
function parsePathToApiParams(urlString) {
  try {
    const urlObj = new URL(urlString);
    // Remove /listings/ prefix and trailing slash
    const pathAfterListings = urlObj.pathname
      .replace(/^\/listings\//, '')
      .replace(/\/$/, '');

    if (!pathAfterListings) {
      // Root /listings/ page
      return buildParams({});
    }

    const segments = pathAfterListings.split('/').filter(Boolean);
    const filters = {};

    for (const rawSeg of segments) {
      const seg = decodeURIComponent(rawSeg).split('?')[0].trim().toLowerCase();
      if (!seg) continue;

      // ── Category: {slug}-category ─────────────────────────────────
      if (seg.endsWith('-category')) {
        filters.category = seg.slice(0, -'-category'.length);
        continue;
      }

      // ── Condition: {slug}-condition ───────────────────────────────
      if (seg.endsWith('-condition')) {
        const slug = seg.slice(0, -'-condition'.length);
        filters.condition = slug === 'new' ? 'New' : slug === 'used' ? 'Used' : slug;
        continue;
      }

      // ── State: {slug}-state ───────────────────────────────────────
      if (seg.endsWith('-state')) {
        filters.state = seg.slice(0, -'-state'.length).replace(/-/g, ' ');
        continue;
      }

      // ── Region: {slug}-region ─────────────────────────────────────
      if (seg.endsWith('-region')) {
        filters.region = seg.slice(0, -'-region'.length).replace(/-/g, ' ');
        continue;
      }

      // ── Make: {slug}-make ─────────────────────────────────────────
      if (seg.endsWith('-make')) {
        filters.make = seg.slice(0, -'-make'.length);
        continue;
      }

      // ── Model: {slug}-model ───────────────────────────────────────
      if (seg.endsWith('-model')) {
        filters.model = seg.slice(0, -'-model'.length);
        continue;
      }

      // ── Suburb with pincode: {suburb}-{4digits}-suburb ────────────
      const suburbPin = seg.match(/^([a-z0-9-]+)-(\d{4})-suburb$/);
      if (suburbPin) {
        filters.suburb  = suburbPin[1].replace(/-/g, ' ');
        filters.pincode = suburbPin[2];
        continue;
      }

      // ── Suburb only: {slug}-suburb ────────────────────────────────
      if (seg.endsWith('-suburb')) {
        filters.suburb = seg.slice(0, -'-suburb'.length).replace(/-/g, ' ');
        continue;
      }

      // ── Pincode only: 4 digits ────────────────────────────────────
      if (/^\d{4}$/.test(seg)) {
        filters.pincode = seg;
        continue;
      }

      // ── ATM: between-{n}-kg-{m}-kg-atm  OR  between-{n}-{m}-kg-atm ──
      let m;
      m = seg.match(/^between-(\d+)-kg-(\d+)-kg-atm$/);
      if (m) { filters.minKg = m[1]; filters.maxKg = m[2]; continue; }

      m = seg.match(/^between-(\d+)-(\d+)-kg-atm$/);
      if (m) { filters.minKg = m[1]; filters.maxKg = m[2]; continue; }

      m = seg.match(/^between-(\d+)-kg-(\d+)-atm$/); // rare variant
      if (m) { filters.minKg = m[1]; filters.maxKg = m[2]; continue; }

      m = seg.match(/^between-(\d+)-and-(\d+)-kg-atm$/);
      if (m) { filters.minKg = m[1]; filters.maxKg = m[2]; continue; }

      // ── ATM under/over ────────────────────────────────────────────
      m = seg.match(/^under-(\d+)-kg-atm$/);
      if (m) { filters.maxKg = m[1]; continue; }
      m = seg.match(/^over-(\d+)-kg-atm$/);
      if (m) { filters.minKg = m[1]; continue; }

      // ── Length: between-{n}-{m}-length-in-feet  OR  between-{n}-ft-{m}-ft-length-in-feet ──
      m = seg.match(/^between-(\d+)-(\d+)-length-in-feet$/);
      if (m) { filters.from_length = m[1]; filters.to_length = m[2]; continue; }

      m = seg.match(/^between-(\d+)-ft-(\d+)-ft-length-in-feet$/);
      if (m) { filters.from_length = m[1]; filters.to_length = m[2]; continue; }

      m = seg.match(/^between-(\d+)-and-(\d+)-length-in-feet$/);
      if (m) { filters.from_length = m[1]; filters.to_length = m[2]; continue; }

      // ── Sleeping capacity: {n}-people-sleeping-capacity  OR  {n}-to-{m}-people-sleeping-capacity ──
      m = seg.match(/^(\d+)-to-(\d+)-people-sleeping-capacity$/);
      if (m) { filters.from_sleep = m[1]; filters.to_sleep = m[2]; continue; }

      m = seg.match(/^between-(\d+)-(\d+)-people-sleeping-capacity$/);
      if (m) { filters.from_sleep = m[1]; filters.to_sleep = m[2]; continue; }

      m = seg.match(/^over-(\d+)-people-sleeping-capacity$/);
      if (m) { filters.from_sleep = m[1]; continue; }

      m = seg.match(/^under-(\d+)-people-sleeping-capacity$/);
      if (m) { filters.to_sleep = m[1]; continue; }

      m = seg.match(/^(\d+)-people-sleeping-capacity$/);
      if (m) { filters.from_sleep = m[1]; filters.to_sleep = m[1]; continue; }

      // ── Price: between-{n}-{m} (no suffix = price range) ─────────
      m = seg.match(/^between-(\d+)-(\d+)$/);
      if (m) { filters.from_price = m[1]; filters.to_price = m[2]; continue; }

      m = seg.match(/^between-(\d+)-and-(\d+)$/);
      if (m) { filters.from_price = m[1]; filters.to_price = m[2]; continue; }

      m = seg.match(/^under-(\d+)$/);
      if (m) { filters.to_price = m[1]; continue; }

      m = seg.match(/^over-(\d+)$/);
      if (m) { filters.from_price = m[1]; continue; }

      // ── Year: {4digit}-{4digit} ───────────────────────────────────
      m = seg.match(/^(\d{4})-(\d{4})$/);
      if (m) { filters.acustom_fromyears = m[1]; filters.acustom_toyears = m[2]; continue; }

      // ── Unrecognised segment — treat as make/keyword slug ─────────
      // (e.g. "avan", "jayco" — bare slugs in url.csv that are make names)
      if (!filters.make && !seg.includes('-')) {
        filters.make = seg;
      } else if (!filters.make) {
        // Multi-word make slug like "austrack-campers"
        filters.make = seg;
      }
    }

    return buildParams(filters);
  } catch (e) {
    return null;
  }
}

/**
 * Convert a filters object into URLSearchParams for the WP API.
 * Mirrors the params construction in src/api/listings/api.ts → fetchListings.
 */
function buildParams(filters) {
  const p = new URLSearchParams();
  p.append('page', '1');

  if (filters.category) p.append('category', filters.category);
  if (filters.make)     p.append('make', filters.make);
  if (filters.model)    p.append('model', filters.model);
  if (filters.state)    p.append('state', filters.state);
  if (filters.region)   p.append('region', filters.region);
  if (filters.suburb)   p.append('suburb', filters.suburb);
  if (filters.pincode)  p.append('pincode', filters.pincode);
  if (filters.condition) p.append('condition', filters.condition);
  if (filters.from_price) p.append('from_price', filters.from_price);
  if (filters.to_price)   p.append('to_price', filters.to_price);
  if (filters.minKg)      p.append('from_atm', filters.minKg);
  if (filters.maxKg)      p.append('to_atm', filters.maxKg);
  if (filters.from_length) p.append('from_length', filters.from_length);
  if (filters.to_length)   p.append('to_length', filters.to_length);
  if (filters.from_sleep)  p.append('from_sleep', filters.from_sleep);
  if (filters.to_sleep)    p.append('to_sleep', filters.to_sleep);
  if (filters.acustom_fromyears) p.append('acustom_fromyears', filters.acustom_fromyears);
  if (filters.acustom_toyears)   p.append('acustom_toyears', filters.acustom_toyears);

  return p;
}

/**
 * Build the KV cache key from URLSearchParams — must exactly match
 * buildJsonCacheKey() in worker.js.
 */
function buildKvKey(params) {
  const sorted = [...params.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return `json:api:${sorted || '_root'}`;
}

// ── Cloudflare KV upload ─────────────────────────────────────────────────────
async function uploadToKV(key, value, metadata) {
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;

  for (let attempt = 1; attempt <= KV_UPLOAD_RETRIES; attempt++) {
    try {
      const boundary = '----CFSJsonBoundary' + Date.now();
      const metaJson = JSON.stringify(metadata);

      const bodyParts = [
        `--${boundary}\r\nContent-Disposition: form-data; name="value"; filename="blob"\r\nContent-Type: application/json\r\n\r\n`,
        value,
        `\r\n--${boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n`,
        metaJson,
        `\r\n--${boundary}--\r\n`,
      ];
      const body = bodyParts.join('');

      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      if (!res.ok) {
        const txt = await res.text();
        if (attempt < KV_UPLOAD_RETRIES) {
          await delay(KV_RETRY_DELAY * attempt);
          continue;
        }
        throw new Error(`KV upload failed: HTTP ${res.status} — ${txt.substring(0, 200)}`);
      }
      return; // success
    } catch (e) {
      if (attempt === KV_UPLOAD_RETRIES) throw e;
      await delay(KV_RETRY_DELAY * attempt);
    }
  }
}

// ── Fetch with sgcaptcha retry ────────────────────────────────────────────────
// LiteSpeed rate-limiter can re-trigger sgcaptcha (HTTP 202) mid-batch even with
// the bypass header set. Back off and retry up to 3 times before giving up.
const CAPTCHA_RETRIES    = 3;
const CAPTCHA_BACKOFF_MS = 8000; // wait 8s before each retry

async function fetchWithCaptchaRetry(apiUrl, attempt = 1) {
  const res = await fetch(apiUrl, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; CFS-CacheWarmer/1.0)',
      ...(WP_API_KEY        ? { 'X-API-Key':    WP_API_KEY }        : {}),
      ...(WARMER_BYPASS_KEY ? { 'X-Warmer-Key': WARMER_BYPASS_KEY } : {}),
    },
    timeout: 30000,
  });

  // 202 = sgcaptcha challenge — back off and retry
  if (res.status === 202 && attempt <= CAPTCHA_RETRIES) {
    console.log(`[WAIT]  sgcaptcha triggered (attempt ${attempt}/${CAPTCHA_RETRIES}) — waiting ${CAPTCHA_BACKOFF_MS / 1000}s...`);
    await delay(CAPTCHA_BACKOFF_MS * attempt); // 8s, 16s, 24s
    return fetchWithCaptchaRetry(apiUrl, attempt + 1);
  }

  return res;
}

// ── Process a single URL ─────────────────────────────────────────────────────
async function processUrl(url, index, total) {
  const params = parsePathToApiParams(url);
  if (!params) {
    console.log(`[SKIP] [${index}/${total}] Cannot parse: ${url}`);
    return { status: 'skip' };
  }

  const apiUrl = `${WP_API_BASE}?${params.toString()}`;
  const kvKey  = buildKvKey(params);

  let res;
  try {
    res = await fetchWithCaptchaRetry(apiUrl);
  } catch (fetchErr) {
    console.log(`[ERROR] [${index}/${total}] Network error: ${url} — ${fetchErr.message}`);
    return { status: 'error' };
  }

  if (SKIP_IMMEDIATELY.has(res.status)) {
    console.log(`[SKIP] [${index}/${total}] HTTP ${res.status}: ${url}`);
    return { status: 'skip' };
  }

  // Skip auth errors — log response body once to diagnose the exact cause
  if (res.status === 401 || res.status === 403) {
    const authBody = await res.text().catch(() => '(could not read body)');
    console.log(`[SKIP] [${index}/${total}] HTTP ${res.status} (auth error) URL: ${apiUrl}`);
    console.log(`         Response: ${authBody.substring(0, 300)}`);
    return { status: 'skip' };
  }

  let body;
  try {
    body = await res.text();
  } catch (bodyErr) {
    // Server dropped the connection before sending the full response (premature close).
    // Log and continue — don't crash the entire batch.
    console.log(`[ERROR] [${index}/${total}] Premature close reading response body: ${url} — ${bodyErr.message}`);
    return { status: 'error' };
  }

  // Still a captcha page after all retries — skip
  if (res.status === 202 || body.includes('sgcaptcha')) {
    console.log(`[SKIP] [${index}/${total}] sgcaptcha persists after retries: ${url}`);
    return { status: 'skip' };
  }

  // Don't cache error pages (HTML error responses instead of JSON)
  if (!body.trim().startsWith('{') && !body.includes('{"')) {
    console.log(`[SKIP] [${index}/${total}] Non-JSON response (HTTP ${res.status}): ${url}`);
    console.log(`         API URL: ${apiUrl}`);
    console.log(`         Response preview: ${body.substring(0, 150).replace(/\s+/g, ' ')}`);
    return { status: 'skip' };
  }

  // Don't cache WP REST API error responses (auth failures, route-not-found, etc.)
  if (body.includes('"code"') && (body.includes('"rest_forbidden"') || body.includes('"rest_no_route"') || body.includes('"status":401') || body.includes('"status":403'))) {
    console.log(`[SKIP] [${index}/${total}] WP API error response (HTTP ${res.status}): ${url}`);
    console.log(`         Response: ${body.substring(0, 200)}`);
    return { status: 'skip' };
  }

  try {
    await uploadToKV(kvKey, body, {
      savedAt: Date.now(),
      status: res.status,
      sourceUrl: url,
    });
    console.log(`[OK]   [${index}/${total}] HTTP ${res.status} → KV key: ${kvKey.substring(0, 80)}`);
    return { status: 'ok' };
  } catch (uploadErr) {
    console.log(`[ERROR] [${index}/${total}] KV upload failed: ${url} — ${uploadErr.message}`);
    return { status: 'error' };
  }
}

// ── Concurrency helpers ───────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runConcurrent(items, concurrency, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((item, j) => fn(item, i + j + 1, items.length)));
    results.push(...batchResults);
    if (i + concurrency < items.length) {
      await delay(DELAY_BETWEEN_URLS);
    }
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_API_TOKEN) {
    console.error('ERROR: CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, and CF_API_TOKEN are required.');
    process.exit(1);
  }

  console.log('=== JSON API Cache Pre-Warmer ===');
  console.log(`API Base:    ${WP_API_BASE}`);
  console.log(`CSV:         ${URLS_CSV}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`KV TTL:      ${KV_STALE_TTL}s`);
  console.log(`API Key:     ${WP_API_KEY ? '✓ set' : '✗ MISSING — requests will get 401'}`);
  console.log(`Bypass Key:  ${WARMER_BYPASS_KEY ? '✓ set' : '✗ MISSING — sgcaptcha may block requests'}`);
  console.log('');

  let allUrls = readUrlsFromCsv(URLS_CSV);
  console.log(`Loaded ${allUrls.length} URLs from CSV`);

  if (BATCH_SIZE && BATCH_NUMBER) {
    const start = (BATCH_NUMBER - 1) * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    allUrls = allUrls.slice(start, end);
    console.log(`Batch ${BATCH_NUMBER}: URLs ${start + 1}–${Math.min(end, allUrls.length + start)} (${allUrls.length} URLs)`);
  }

  const startTime = Date.now();
  const results = await runConcurrent(allUrls, CONCURRENCY, processUrl);

  const ok     = results.filter(r => r.status === 'ok').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const errors  = results.filter(r => r.status === 'error').length;
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('');
  console.log('=== Summary ===');
  console.log(`✅  Cached:  ${ok}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌  Errors:  ${errors}`);
  console.log(`⏱️  Time:    ${elapsed} min`);

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
