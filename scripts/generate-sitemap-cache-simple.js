/* eslint-disable */
/**
 * Sitemap Cache Generation Script
 * Generates HTML cache for all pages using WordPress API (no XML sitemaps needed)
 * NO PUPPETEER REQUIRED
 *
 * API endpoint: https://admin.caravansforsale.com.au/wp-json/cfs/v1/sitemap/{type}
 * Returns: { success, type, count, paths: ["family-category/", ...], generated_at }
 * Paths are prepended with /listings/ to form the full URL path.
 *
 * OPTIMISATIONS (applied):
 *  1. HTTP 500/502/503 → immediate skip, zero retries (saves ~6s wasted per bad variant)
 *  2. Reduced delays: 100ms between variants, 300ms between URLs (was 300ms/800ms)
 *  3. Error pages skipped immediately before KV upload (already present, kept)
 *
 * SEO META CHECK:
 *  Removed. The WordPress API only returns URLs that should be cached (indexable pages).
 *  Noindex pages will have a robots meta tag; index/follow pages will have NO meta robots tag.
 *  Checking for index/follow is therefore unnecessary — all API URLs are cached unless they
 *  are error pages (isErrorPage) or return a bad HTTP status.
 *
 * IMPORTANT - SLUG FORMAT (DO NOT CHANGE):
 * Path: /listings/caravans/nsw/ → Slug: caravans-nsw → KV keys: caravans-nsw-v1, caravans-nsw-v2, ...
 * Path: /listings/motorhomes/    → Slug: motorhomes   → KV keys: motorhomes-v1, motorhomes-v2, ...
 *
 * Routes-mapping format (DO NOT CHANGE):
 * { "/listings/caravans/nsw/": ["caravans-nsw-v1", "caravans-nsw-v2", "caravans-nsw-v3", "caravans-nsw-v4"] }
 * Values are ALWAYS arrays, never strings.
 *
 * VARIANT SHUFFLE:
 * Each variant uses a unique shuffle_seed to get different listing orders.
 * Seeds are: 1, 2, 3, 4 (matching variant numbers).
 * The worker randomly picks one variant per request → different order each visit.
 */

const fetch = require('node-fetch');

// Environment variables
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://www.caravansforsale.com.au';
const WP_API_BASE = process.env.WP_API_BASE || 'https://admin.caravansforsale.com.au/wp-json/cfs/v1/sitemap';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const TARGET_SITEMAP = process.env.TARGET_SITEMAP || 'all';

// Configuration
const VARIANTS_PER_URL = 4;
const DELAY_BETWEEN_VARIANTS = 100; // ms — reduced from 300ms (optimisation #2)
const DELAY_BETWEEN_URLS = 300;     // ms — reduced from 800ms (optimisation #2)
const BATCH_SIZE = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : null;
const BATCH_NUMBER = process.env.BATCH_NUMBER ? parseInt(process.env.BATCH_NUMBER) : null;
const KV_UPLOAD_RETRIES = 3;
const KV_RETRY_DELAY = 2000;

// OPTIMISATION #1: HTTP status codes that must be skipped immediately with no retries.
// 500/502/503 are transient server errors — retrying them burns 6s each (3 attempts × 2s).
// With 21 failures × 4 variants = 84 retries = ~8 wasted minutes per batch.
const SKIP_IMMEDIATELY_STATUSES = new Set([404, 500, 502, 503]);

// SKIP_ROUTES_UPDATE: When running in parallel (matrix strategy),
// skip routes mapping update to avoid race conditions.
// The update-routes-mapping job rebuilds from KV metadata after all jobs complete.
const SKIP_ROUTES_UPDATE = process.env.SKIP_ROUTES_UPDATE === 'true';

// ============================================
// ALL API TYPES
// Map of TARGET_SITEMAP value → WP API type slug
// To add a new type: add it here + add a job in the workflow .yml
// ============================================
const API_TYPES = [
  'categories',
  'states',
  'regions',
  'makes',
  'models',
  'price',
  'atm',
  'sleep',
  'length',
  'state-make',
  'region-make',
  'cat-state',
  'cat-region',
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert a URL path to a KV slug.
 *
 * CRITICAL: Do NOT change this function. The slug format must remain stable
 * because routes-mapping and regenerate-routes-mapping.js both depend on it.
 * Changing this will cause BYPASS-NO-CACHE for all pages until mapping is rebuilt.
 *
 * Examples:
 *   /listings/caravans/nsw/       → caravans-nsw
 *   /listings/motorhomes/         → motorhomes
 *   /listings/caravans/victoria/  → caravans-victoria
 */
function convertPathToSlug(path) {
  let pathSlug = path;

  // Remove /listings/ prefix
  if (pathSlug.startsWith('/listings/')) {
    pathSlug = pathSlug.substring(10);
  }

  // Remove leading/trailing slashes
  pathSlug = pathSlug.replace(/^\/+|\/+$/g, '');

  // Replace slashes with hyphens
  pathSlug = pathSlug.replace(/\//g, '-');

  // Keep lowercase alphanumeric and hyphens only
  pathSlug = pathSlug.replace(/[^a-z0-9-]/g, '');

  // Truncate to 150 chars
  if (pathSlug.length > 150) {
    pathSlug = pathSlug.substring(0, 150);
  }

  return pathSlug || 'home';
}

async function uploadToKV(key, value, metadata = null) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${key}`;

  for (let attempt = 1; attempt <= KV_UPLOAD_RETRIES; attempt++) {
    try {
      let requestOptions;

      if (metadata) {
        const boundary = '----CFSFormBoundary' + Date.now();
        let body = '';

        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="value"; filename="blob"\r\n`;
        body += `Content-Type: text/html\r\n\r\n`;
        body += value;
        body += `\r\n`;

        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="metadata"\r\n`;
        body += `Content-Type: application/json\r\n\r\n`;
        body += JSON.stringify(metadata);
        body += `\r\n`;

        body += `--${boundary}--\r\n`;

        requestOptions = {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${CF_API_TOKEN}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`
          },
          body,
          timeout: 60000
        };
      } else {
        requestOptions = {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${CF_API_TOKEN}`,
            'Content-Type': 'text/html'
          },
          body: value,
          timeout: 60000
        };
      }

      const response = await fetch(url, requestOptions);
      const responseText = await response.text();

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        if (attempt < KV_UPLOAD_RETRIES) {
          console.error(`   ⚠️  KV upload attempt ${attempt}/${KV_UPLOAD_RETRIES} failed (invalid response), retrying in ${KV_RETRY_DELAY / 1000}s...`);
          await new Promise(r => setTimeout(r, KV_RETRY_DELAY));
          continue;
        }
        console.error(`   ❌ KV upload error after ${KV_UPLOAD_RETRIES} attempts: Invalid JSON response`);
        return false;
      }

      if (result.success) return true;

      const errorMsg = result.errors?.map(e => e.message).join(', ') || 'Unknown error';
      if (attempt < KV_UPLOAD_RETRIES) {
        console.error(`   ⚠️  KV upload attempt ${attempt}/${KV_UPLOAD_RETRIES} failed: ${errorMsg}, retrying in ${KV_RETRY_DELAY / 1000}s...`);
        await new Promise(r => setTimeout(r, KV_RETRY_DELAY));
        continue;
      }
      console.error(`   ❌ KV upload error after ${KV_UPLOAD_RETRIES} attempts: ${errorMsg}`);
      return false;

    } catch (error) {
      if (attempt < KV_UPLOAD_RETRIES) {
        console.error(`   ⚠️  KV upload attempt ${attempt}/${KV_UPLOAD_RETRIES} failed: ${error.message}, retrying in ${KV_RETRY_DELAY / 1000}s...`);
        await new Promise(r => setTimeout(r, KV_RETRY_DELAY));
        continue;
      }
      console.error(`   ❌ KV upload error after ${KV_UPLOAD_RETRIES} attempts: ${error.message}`);
      return false;
    }
  }

  return false;
}

function injectPerformanceTags(html) {
  const imageOptimizations = `
    <link rel="dns-prefetch" href="https://caravansforsale.imagestack.net" />
    <link rel="preconnect" href="https://caravansforsale.imagestack.net" crossorigin />`;

  const imageMatches = [...html.matchAll(/src="([^"]+\/(CFS-[^/]+)\/[^"]+\.(jpg|jpeg|png|webp))"/gi)];
  const firstImages = imageMatches.slice(0, 6).map(match => {
    const imgPath = match[1];
    if (imgPath.includes('caravansforsale.imagestack.net')) return imgPath;
    const fileName = imgPath.split('/').slice(-2).join('/');
    return `https://caravansforsale.imagestack.net/800x800/${fileName}`;
  });

  const preloadLinks = firstImages
    .map(url => `<link rel="preload" as="image" href="${url}" fetchpriority="high" />`)
    .join('\n');

  const performanceTags = `${imageOptimizations}\n    ${preloadLinks}`;

  html = html.replace(/<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/gi, '');
  html = html.replace('</head>', `${performanceTags}\n</head>`);

  return html;
}

// ============================================
// ERROR PAGE DETECTION
// If your app shows a new error UI, add its unique text here.
// These pages will be skipped and never written to KV.
// ============================================
function isErrorPage(html) {
  const errorSignatures = [
    // Image 1: API/listing load failure
    "Sorry, something went wrong",
    "We couldn't load the listings at this moment",
    // Image 2: Service error
    "Service error",
    "Our listing service encountered an error",
    // Next.js unhandled exception
    "Application error: a client-side exception has occurred",
    // Generic fallback
    "This page could not be found",
  ];

  for (const sig of errorSignatures) {
    if (html.includes(sig)) {
      return sig; // returns the matched string for logging
    }
  }
  return false; // not an error page
}

// ============================================
// FETCH PATHS FROM WP API (replaces fetchSitemapUrls)
// ============================================

/**
 * Fetch page paths from the WordPress API for a given type.
 *
 * API: GET https://admin.caravansforsale.com.au/wp-json/cfs/v1/sitemap/{type}
 * Response: { success, type, count, paths: ["family-category/", ...], generated_at }
 *
 * Each path is relative (e.g. "family-category/") and gets /listings/ prepended.
 * Result: /listings/family-category/
 */
async function fetchPathsFromAPI(type) {
  const apiUrl = `${WP_API_BASE}/${type}`;
  console.log(`\n📥 Fetching paths from API: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'CFS-CacheGenerator/3.0',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`API returned success=false for type "${type}"`);
    }

    if (!Array.isArray(data.paths) || data.paths.length === 0) {
      console.warn(`   ⚠️  API returned 0 paths for type "${type}"`);
      return [];
    }

    // Convert API paths → full URL objects
    // e.g. "family-category/" → { path: "/listings/family-category/", ... }
    const urls = data.paths.map(rawPath => {
      // Ensure no double slashes and always ends with /
      let cleanPath = rawPath.replace(/^\/+/, ''); // remove leading slashes
      if (!cleanPath.endsWith('/')) cleanPath += '/';

      const path = `/listings/${cleanPath}`;

      return {
        path,
        fullUrl: `${PRODUCTION_DOMAIN}${path}`,
        sourceType: type
      };
    });

    console.log(`   ✅ Found ${urls.length} paths for type "${type}"`);
    return urls;

  } catch (error) {
    console.error(`   ❌ Failed to fetch API for type "${type}": ${error.message}`);
    return [];
  }
}

// ============================================
// GENERATE A SINGLE PAGE VARIANT
// ============================================

async function generatePageVariant(urlData, variantNumber) {
  const { path } = urlData;
  const slug = convertPathToSlug(path);

  let fetchUrl = `${PRODUCTION_DOMAIN}${path}`;
  if (VARIANTS_PER_URL > 1) {
    fetchUrl += fetchUrl.includes('?') ? '&' : '?';
    fetchUrl += `shuffle_seed=${variantNumber}`;
  }

  const kvKey = `${slug}-v${variantNumber}`;

  console.log(`\n🔄 Generating: ${path} (variant ${variantNumber})`);
  console.log(`   Slug: ${kvKey}`);
  console.log(`   URL: ***?shuffle_seed=${variantNumber}`);

  try {
    console.log(`   🌐 Fetching...`);
    const fetchStart = Date.now();

    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'CFS-CacheGenerator/3.0',
        'Accept': 'text/html'
      },
      timeout: 30000
    });

    // OPTIMISATION #1: skip bad statuses immediately — no retries, no delay
    if (SKIP_IMMEDIATELY_STATUSES.has(response.status)) {
      if (response.status === 404) {
        console.log(`   ⏭️  Skipping: HTTP 404 (page not found)`);
        return { status: 'skipped_404', path, kvKey, variant: variantNumber };
      }
      console.log(`   ⏭️  Skipping: HTTP ${response.status} (immediate skip, no retries)`);
      return { status: 'skipped_server_error', path, kvKey, variant: variantNumber, httpStatus: response.status };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let html = await response.text();
    const fetchDuration = Math.round((Date.now() - fetchStart) / 1000);
    console.log(`   ⏱️  Fetched in ${fetchDuration}s`);

    if (!html.includes('</html>')) {
      throw new Error('Invalid HTML (no closing </html> tag)');
    }

    // Check for error pages — error pages must NEVER be cached
    const errorMatch = isErrorPage(html);
    if (errorMatch) {
      console.log(`   🚫 Skipping: Error page detected ("${errorMatch}")`);
      return { status: 'skipped_error', path, kvKey, variant: variantNumber };
    }

    // SEO meta check intentionally removed — API URLs are pre-validated indexable pages.
    // Noindex pages carry a robots meta tag; index/follow pages have no meta robots tag at all.

    html = injectPerformanceTags(html);

    const sizeKB = Math.round(html.length / 1024);
    console.log(`   ⬆️  Uploading (${sizeKB}KB)...`);

    const uploadStart = Date.now();
    const metadata = { path, source: 'api-cache' };
    const uploaded = await uploadToKV(kvKey, html, metadata);
    const uploadDuration = Math.round((Date.now() - uploadStart) / 1000);

    if (uploaded) {
      console.log(`   ✅ Success! Uploaded in ${uploadDuration}s`);
      return { status: 'success', path, kvKey, variant: variantNumber, size: sizeKB + 'KB' };
    } else {
      throw new Error('KV upload failed after retries');
    }

  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return { status: 'failed', path, kvKey, variant: variantNumber, error: error.message };
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n' + '█'.repeat(70));
  console.log('🗺️  API-BASED CACHE GENERATION');
  console.log('█'.repeat(70));
  console.log(`📍 Domain:   ${PRODUCTION_DOMAIN}`);
  console.log(`🔌 API Base: ${WP_API_BASE}`);
  console.log(`🔢 Variants: ${VARIANTS_PER_URL}`);
  console.log(`🎯 Target:   ${TARGET_SITEMAP}`);
  if (BATCH_SIZE && BATCH_NUMBER) {
    console.log(`📦 Batch mode: Batch ${BATCH_NUMBER}, Size ${BATCH_SIZE}`);
  }
  if (SKIP_ROUTES_UPDATE) {
    console.log(`⏭️  Routes mapping update: SKIPPED (handled by update-routes-mapping job)`);
  }
  console.log('█'.repeat(70));

  const results = { success: 0, failed: 0, skipped_error: 0, skipped_server_error: 0, skipped_404: 0, pages: [] };
  const failed404Paths = new Set();
  const startTime = Date.now();

  // Determine which API types to process
  let typesToProcess = [];

  if (TARGET_SITEMAP && TARGET_SITEMAP !== 'all') {
    // Single type
    if (!API_TYPES.includes(TARGET_SITEMAP)) {
      console.error(`\n❌ Unknown target: "${TARGET_SITEMAP}"`);
      console.error(`   Valid options: all, ${API_TYPES.join(', ')}`);
      process.exit(1);
    }
    typesToProcess = [TARGET_SITEMAP];
    console.log(`\n🎯 Processing single type: ${TARGET_SITEMAP}\n`);
  } else {
    typesToProcess = [...API_TYPES];
    console.log(`\n📋 Processing all ${typesToProcess.length} API types\n`);
  }

  // ============================================
  // STEP 1: Fetch all URLs from WP API
  // ============================================
  console.log('='.repeat(70));
  console.log('📥 STEP 1: Fetching paths from WordPress API');
  console.log('='.repeat(70));

  let allUrls = [];
  for (let i = 0; i < typesToProcess.length; i++) {
    const type = typesToProcess[i];
    console.log(`\n[${i + 1}/${typesToProcess.length}] Type: ${type}`);
    const urls = await fetchPathsFromAPI(type);
    allUrls = allUrls.concat(urls);
    await new Promise(r => setTimeout(r, 500));
  }

  // Apply batching if specified
  const totalUrlsBeforeBatch = allUrls.length;
  if (BATCH_SIZE && BATCH_NUMBER) {
    const start = (BATCH_NUMBER - 1) * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    allUrls = allUrls.slice(start, end);

    console.log('\n' + '='.repeat(70));
    console.log('📦 BATCH FILTERING APPLIED');
    console.log('='.repeat(70));
    console.log(`📊 Total URLs from API: ${totalUrlsBeforeBatch}`);
    console.log(`📦 Batch ${BATCH_NUMBER}: URLs ${start + 1}–${Math.min(end, totalUrlsBeforeBatch)}`);
    console.log(`🔄 URLs in this batch: ${allUrls.length}`);
    console.log('='.repeat(70));
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 API FETCH COMPLETE');
  console.log('='.repeat(70));
  console.log(`🔄 Total URLs to process: ${allUrls.length}`);
  console.log(`📦 Total variants to generate: ${allUrls.length * VARIANTS_PER_URL}`);
  const estimatedMinutes = Math.round(allUrls.length * VARIANTS_PER_URL * 2 / 60);
  const estimatedMinutesOptimised = Math.round(allUrls.length * VARIANTS_PER_URL * 1.2 / 60);
  console.log(`⏱️  Estimated time: ~${estimatedMinutesOptimised} minutes (optimised delays)`);
  console.log('='.repeat(70));

  if (allUrls.length === 0) {
    console.log('\n⚠️  No URLs to process. Exiting.');
    process.exit(0);
  }

  // ============================================
  // STEP 2: Generate HTML variants
  // ============================================
  console.log('\n🔨 STEP 2: Generating HTML variants\n');

  let totalProcessed = 0;

  for (let i = 0; i < allUrls.length; i++) {
    const urlData = allUrls[i];

    if (failed404Paths.has(urlData.path)) {
      console.log(`\n⏭️  Skipping all variants for ${urlData.path} (already 404'd)`);
      results.skipped_404 += VARIANTS_PER_URL;
      totalProcessed += VARIANTS_PER_URL;
      continue;
    }

    console.log('\n' + '-'.repeat(70));
    console.log(`📍 URL [${i + 1}/${allUrls.length}]: ${urlData.path}`);
    console.log(`   Source type: ${urlData.sourceType}`);
    console.log('-'.repeat(70));

    for (let variant = 1; variant <= VARIANTS_PER_URL; variant++) {
      totalProcessed++;
      const overallProgress = Math.round((totalProcessed / (allUrls.length * VARIANTS_PER_URL)) * 100);

      console.log(`\n[Variant ${variant}/${VARIANTS_PER_URL}] Overall: ${totalProcessed}/${allUrls.length * VARIANTS_PER_URL} (${overallProgress}%)`);

      const result = await generatePageVariant(urlData, variant);

      if (result.status === 'success') {
        results.success++;
        results.pages.push(result);
      } else if (result.status === 'skipped_404') {
        results.skipped_404++;
        failed404Paths.add(urlData.path);
        if (variant < VARIANTS_PER_URL) {
          const remainingVariants = VARIANTS_PER_URL - variant;
          console.log(`   ⏭️  Skipping ${remainingVariants} remaining variant(s) for this 404 URL`);
          results.skipped_404 += remainingVariants;
          totalProcessed += remainingVariants;
        }
        break;
      } else if (result.status === 'skipped_server_error') {
        results.skipped_server_error++;
      } else if (result.status === 'skipped_error') {
        results.skipped_error++;
      } else {
        results.failed++;
      }

      await new Promise(r => setTimeout(r, DELAY_BETWEEN_VARIANTS));
    }

    await new Promise(r => setTimeout(r, DELAY_BETWEEN_URLS));

    // Progress update every 10 URLs
    if ((i + 1) % 10 === 0 || i === allUrls.length - 1) {
      const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
      const remaining = Math.round((allUrls.length - i - 1) * VARIANTS_PER_URL * 2 / 60);

      console.log('\n' + '='.repeat(70));
      console.log('📈 PROGRESS UPDATE');
      console.log('='.repeat(70));
      console.log(`📊 URLs: ${i + 1}/${allUrls.length} (${Math.round((i + 1) / allUrls.length * 100)}%)`);
      console.log(`✅ Success: ${results.success} variants`);
      console.log(`🚫 Skipped (error page): ${results.skipped_error} variants`);
      console.log(`⚡ Skipped (500/502/503): ${results.skipped_server_error} variants`);
      console.log(`🔍 Skipped (404): ${results.skipped_404} variants (${failed404Paths.size} unique URLs)`);
      console.log(`❌ Failed: ${results.failed} variants`);
      console.log(`⏱️  Elapsed: ${elapsed} min | Remaining: ~${remaining} min`);
      console.log('='.repeat(70));
    }
  }

  // ============================================
  // STEP 3: Update routes mapping
  // ============================================
  const shouldUpdateMapping = !SKIP_ROUTES_UPDATE && (!BATCH_SIZE || !BATCH_NUMBER);

  if (shouldUpdateMapping) {
    console.log('\n' + '='.repeat(70));
    console.log('📋 UPDATING ROUTES MAPPING (Merging with existing)');
    console.log('='.repeat(70));

    let mapping = {};
    try {
      const existingMappingUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/routes-mapping`;
      const existingResponse = await fetch(existingMappingUrl, {
        headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` }
      });

      if (existingResponse.ok) {
        const existingText = await existingResponse.text();
        mapping = JSON.parse(existingText);
        console.log(`   ✅ Loaded existing mapping with ${Object.keys(mapping).length} paths`);
      } else {
        console.log(`   ℹ️  No existing mapping found, starting fresh`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not load existing mapping: ${error.message}`);
    }

    // Normalize legacy string values to arrays
    for (const path in mapping) {
      if (typeof mapping[path] === 'string') {
        mapping[path] = [mapping[path]];
      }
    }

    // Remove 404 paths
    if (failed404Paths.size > 0) {
      let removed404 = 0;
      for (const path404 of failed404Paths) {
        if (mapping[path404]) {
          delete mapping[path404];
          removed404++;
        }
      }
      if (removed404 > 0) {
        console.log(`   🧹 Removed ${removed404} stale 404 paths from mapping`);
      }
    }

    // Merge new pages
    let newPaths = 0;
    let updatedPaths = 0;

    for (const page of results.pages) {
      if (!mapping[page.path]) {
        mapping[page.path] = [];
        newPaths++;
      } else {
        if (!Array.isArray(mapping[page.path])) {
          mapping[page.path] = [mapping[page.path]];
        }
        updatedPaths++;
      }
      if (!mapping[page.path].includes(page.kvKey)) {
        mapping[page.path].push(page.kvKey);
      }
    }

    // Sort variants
    for (const path in mapping) {
      if (Array.isArray(mapping[path])) {
        mapping[path].sort((a, b) => {
          const variantA = parseInt(a.match(/-v(\d+)$/)?.[1] || '0');
          const variantB = parseInt(b.match(/-v(\d+)$/)?.[1] || '0');
          return variantA - variantB;
        });
      }
    }

    console.log(`   📊 New paths: ${newPaths}, Updated paths: ${updatedPaths}`);
    console.log(`   📦 Total paths in mapping: ${Object.keys(mapping).length}`);

    console.log('\n⬆️  Uploading merged routes mapping to KV...');
    const mappingJson = JSON.stringify(mapping, null, 2);
    const sizeKB = Math.round(mappingJson.length / 1024);
    console.log(`   Size: ${sizeKB}KB`);

    const uploaded = await uploadToKV('routes-mapping', mappingJson);
    if (uploaded) {
      console.log('✅ Routes mapping uploaded successfully!');
    } else {
      console.error('❌ Routes mapping upload failed!');
    }

    console.log('='.repeat(70));
  } else {
    console.log('\n' + '='.repeat(70));
    if (SKIP_ROUTES_UPDATE) {
      console.log('⏭️  SKIPPING ROUTES MAPPING UPDATE (Parallel mode - SKIP_ROUTES_UPDATE=true)');
      console.log('   The update-routes-mapping job will rebuild from KV metadata after all jobs complete.');
    } else {
      console.log('⏭️  SKIPPING ROUTES MAPPING UPDATE (Batch mode)');
      console.log('   Routes mapping will be regenerated after all batches complete.');
    }
    console.log('='.repeat(70));
  }

  // ============================================
  // FINAL SUMMARY
  // ============================================
  const duration = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  console.log('\n\n' + '█'.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('█'.repeat(70));
  console.log(`🎯 Target: ${TARGET_SITEMAP}`);
  if (BATCH_SIZE && BATCH_NUMBER) {
    console.log(`📦 Batch: ${BATCH_NUMBER} (size ${BATCH_SIZE})`);
  }
  console.log(`✅ Success: ${results.success} variants`);
  console.log(`🚫 Skipped (error page): ${results.skipped_error} variants`);
  console.log(`⚡ Skipped (500/502/503): ${results.skipped_server_error} variants`);
  console.log(`🔍 Skipped (404): ${results.skipped_404} variants (${failed404Paths.size} unique URLs)`);
  console.log(`❌ Failed: ${results.failed} variants`);
  console.log(`🔄 Unique paths cached: ${Object.keys(results.pages.reduce((acc, p) => ({ ...acc, [p.path]: true }), {})).length}`);
  console.log(`⏱️  Total duration: ${minutes}m ${seconds}s`);

  if (results.pages.length > 0) {
    const avgTime = Math.round(duration / results.pages.length * 10) / 10;
    console.log(`📦 Average: ${avgTime}s per variant`);
  }

  if (failed404Paths.size > 0) {
    console.log('\n' + '-'.repeat(70));
    console.log(`⚠️  ${failed404Paths.size} URLs returned 404 (check API data):`);
    for (const path404 of failed404Paths) {
      console.log(`   - ${path404}`);
    }
    console.log('-'.repeat(70));
  }

  console.log('█'.repeat(70));

  if (results.failed === 0 && results.success > 0) {
    console.log('✨ ALL VARIANTS GENERATED SUCCESSFULLY!');
  } else if (results.failed > 0 && results.success > 0) {
    console.log('⚠️  COMPLETED WITH SOME FAILURES');
  } else if (results.success === 0 && results.skipped_404 > 0) {
    console.log('⚠️  NO VARIANTS GENERATED (all URLs returned 404)');
  } else if (results.success === 0) {
    console.log('❌ NO VARIANTS GENERATED');
  }

  console.log('█'.repeat(70));
  console.log();

  if (results.failed > 0 && results.success === 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { main };
