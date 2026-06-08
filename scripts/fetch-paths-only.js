/* eslint-disable */
/**
 * fetch-paths-only.js
 *
 * Fetches all paths for a single sitemap type from the WordPress API
 * and saves them to /tmp/paths-{type}.json.
 *
 * Used as the first step in a two-phase cache generation workflow:
 *   1. This script runs ONCE — one IP, one API call, no bot-protection triggers.
 *   2. Batch jobs download the saved artifact and skip the API entirely.
 *
 * Usage:
 *   TARGET_SITEMAP=region-make WP_API_KEY=xxx node scripts/fetch-paths-only.js
 *
 * Output file format:
 *   { "type": "region-make", "count": 1154, "paths": [...url objects...] }
 */

const fetch = require('node-fetch');
const fs    = require('fs');
const path  = require('path');

const WP_API_BASE      = process.env.WP_API_BASE || 'https://admin.caravansforsale.com.au/wp-json/cfs/v1/sitemap';
const WP_API_KEY       = process.env.WP_API_KEY  || '';
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://www.caravansforsale.com.au';
const TARGET_SITEMAP   = process.env.TARGET_SITEMAP;
const OUTPUT_DIR       = process.env.PATHS_OUTPUT_DIR || '/tmp';

if (!TARGET_SITEMAP) {
  console.error('❌ TARGET_SITEMAP env var is required');
  process.exit(1);
}

async function fetchAndSave(type) {
  const apiUrl    = `${WP_API_BASE}/${type}`;
  const outputFile = path.join(OUTPUT_DIR, `paths-${type}.json`);

  console.log(`📥 Fetching paths from API: ${apiUrl}`);

  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'CFS-CacheGenerator/3.0',
      'Accept':     'application/json',
      ...(WP_API_KEY && { 'X-API-Key': WP_API_KEY })
    },
    timeout: 30000
  });

  const responseText = await response.text();

  if (!response.ok) {
    const preview = responseText.slice(0, 200).replace(/\s+/g, ' ');
    throw new Error(`HTTP ${response.status}: ${response.statusText} — body: ${preview}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const preview = responseText.slice(0, 200).replace(/\s+/g, ' ');
    throw new Error(`Expected JSON but got "${contentType}" (bot protection?). Final URL: ${response.url} — body: ${preview}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    const preview = responseText.slice(0, 200).replace(/\s+/g, ' ');
    throw new Error(`JSON parse failed: ${e.message} — body: ${preview}`);
  }

  if (!data.success) {
    throw new Error(`API returned success=false for type "${type}"`);
  }

  const rawPaths = Array.isArray(data.paths) ? data.paths : [];

  // Convert raw API paths → full URL objects (same logic as generate-sitemap-cache-simple.js)
  const urls = rawPaths.map(rawPath => {
    let cleanPath = rawPath.replace(/^\/+/, '');
    if (!cleanPath.endsWith('/')) cleanPath += '/';
    const urlPath = `/listings/${cleanPath}`;
    return {
      path:       urlPath,
      fullUrl:    `${PRODUCTION_DOMAIN}${urlPath}`,
      sourceType: type
    };
  });

  const output = { type, count: urls.length, paths: urls };
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log(`✅ Saved ${urls.length} paths → ${outputFile}`);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `path_count=${urls.length}\n`);
  }
}

fetchAndSave(TARGET_SITEMAP).catch(err => {
  console.error(`❌ fetch-paths-only failed: ${err.message}`);
  process.exit(1);
});
