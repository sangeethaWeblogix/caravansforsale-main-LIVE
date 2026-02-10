/* eslint-disable */
/**
 * Sitemap Cache Generation Script
 * Generates HTML cache for all sitemap pages using HTTP fetch only
 * NO PUPPETEER REQUIRED
 */

const fetch = require('node-fetch');
const { parseString } = require('xml2js');
const { promisify } = require('util');

const parseXML = promisify(parseString);

// Environment variables
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://www.caravansforsale.com.au';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const TARGET_SITEMAP = process.env.TARGET_SITEMAP || 'all'; // all, categories, states, etc.

// Configuration
const VARIANTS_PER_URL = 4;
const DELAY_BETWEEN_VARIANTS = 300; // 300ms
const DELAY_BETWEEN_URLS = 800; // 800ms
const BATCH_SIZE = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : null;
const BATCH_NUMBER = process.env.BATCH_NUMBER ? parseInt(process.env.BATCH_NUMBER) : null;

// All sitemap URLs
const SITEMAP_URLS = [
  '/categories-sitemap.xml',
  '/states-sitemap.xml',
  '/regions-sitemap.xml',
  '/makes-sitemap.xml',
  '/weights-sitemap.xml',
  '/prices-sitemap.xml',
  '/conditions-sitemap.xml',
  '/length-sitemap.xml',
  '/sleep-sitemap.xml',
  '/category-state-sitemap.xml',
  '/category-region-sitemap.xml',
  '/region-length-sitemap.xml',
  '/state-used-sitemap.xml',
  '/region-used-sitemap.xml',
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

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
  
  // Remove special characters
  pathSlug = pathSlug.replace(/[^a-z0-9-]/g, '');
  
  // Truncate to 150 chars
  if (pathSlug.length > 150) {
    pathSlug = pathSlug.substring(0, 150);
  }
  
  return pathSlug || 'home';
}

async function uploadToKV(key, value) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${key}`;
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'text/html'
      },
      body: value
    });
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`   ❌ KV upload error: ${error.message}`);
    return false;
  }
}

function injectSEOTags(html, canonicalUrl, variantNumber) {
  // Add performance optimizations for images ONLY
  const imageOptimizations = `
    <link rel="dns-prefetch" href="https://caravansforsale.imagestack.net" />
    <link rel="preconnect" href="https://caravansforsale.imagestack.net" crossorigin />`;
  
  // Extract and preload first 6 images
  const imageMatches = [...html.matchAll(/src="([^"]+\/(CFS-[^/]+)\/[^"]+\.(jpg|jpeg|png|webp))"/gi)];
  const firstImages = imageMatches.slice(0, 6).map(match => {
    const imgPath = match[1];
    if (imgPath.includes('caravansforsale.imagestack.net')) {
      return imgPath;
    }
    const fileName = imgPath.split('/').slice(-2).join('/');
    return `https://caravansforsale.imagestack.net/800x800/${fileName}`;
  });
  
  const preloadLinks = firstImages
    .map(url => `<link rel="preload" as="image" href="${url}" fetchpriority="high" />`)
    .join('\n');
  
  // ⚠️ NO SEO TAGS - Only image optimization
  const performanceTags = `${imageOptimizations}
    ${preloadLinks}`;
  
  // Remove noindex tags
  html = html.replace(/<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/gi, '');
  
  // Inject performance tags only (no SEO)
  html = html.replace('</head>', `${performanceTags}\n</head>`);
  
  return html;
}

function shouldCachePage(html) {
  const hasJsonIndexFollow = html.includes('"index":"index"') && html.includes('"follow":"follow"');
  const hasMetaIndexFollow = 
    html.includes('content="index, follow"') || 
    html.includes("content='index, follow'") ||
    html.includes('content="index,follow"');
  
  const hasNoIndex = 
    html.includes('noindex') || 
    html.includes('"index":"noindex"');
  
  const hasNoRobotsTag = 
    !html.match(/<meta[^>]*name=["']robots["'][^>]*>/i) &&
    !html.includes('"index"');
  
  return (hasJsonIndexFollow || hasMetaIndexFollow || hasNoRobotsTag) && !hasNoIndex;
}

// ============================================
// FETCH AND GENERATE
// ============================================

async function fetchSitemapUrls(sitemapPath) {
  const url = `${PRODUCTION_DOMAIN}${sitemapPath}`;
  console.log(`\n📥 Fetching sitemap: ${sitemapPath}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CFS-CacheGenerator/2.0',
        'Accept': 'application/xml,text/xml'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xmlText = await response.text();
    const parsed = await parseXML(xmlText);
    
    const urls = [];
    if (parsed.urlset && parsed.urlset.url) {
      for (const urlEntry of parsed.urlset.url) {
        if (urlEntry.loc && urlEntry.loc[0]) {
          const fullUrl = urlEntry.loc[0];
          let urlPath = fullUrl.replace(PRODUCTION_DOMAIN, '');
          
          if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
          if (!urlPath.endsWith('/')) urlPath += '/';
          
          urls.push({
            path: urlPath,
            fullUrl,
            sourceSitemap: sitemapPath
          });
        }
      }
    }
    
    console.log(`   ✅ Found ${urls.length} URLs`);
    return urls;
    
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return [];
  }
}

async function generatePageVariant(urlData, variantNumber) {
  const { path, fullUrl } = urlData;
  const slug = convertPathToSlug(path);
  
  let fetchUrl = `${PRODUCTION_DOMAIN}${path}`;
  if (VARIANTS_PER_URL > 1) {
    fetchUrl += fetchUrl.includes('?') ? '&' : '?';
    fetchUrl += `shuffle_seed=${variantNumber}`;
  }
  
  const kvKey = `${slug}-v${variantNumber}`;
  
  console.log(`\n📄 Generating: ${path} (variant ${variantNumber})`);
  console.log(`   Slug: ${kvKey}`);
  console.log(`   URL: ***?shuffle_seed=${variantNumber}`);
  
  try {
    // Fetch HTML
    console.log(`   🌐 Fetching...`);
    const fetchStart = Date.now();
    
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'CFS-CacheGenerator/2.0',
        'Accept': 'text/html'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    let html = await response.text();
    const fetchDuration = Math.round((Date.now() - fetchStart) / 1000);
    console.log(`   ⏱️  Fetched in ${fetchDuration}s`);
    
    // Validate HTML
    if (!html.includes('</html>')) {
      throw new Error('Invalid HTML (no closing tag)');
    }
    
    // Check if should be cached
    const shouldCache = shouldCachePage(html);
    console.log(`   🔍 Index/Follow check: ${shouldCache ? '✅' : '❌'}`);
    
    if (!shouldCache) {
      console.log(`   ⏭️  Skipping: Not index/follow`);
      return { status: 'skipped', path, kvKey };
    }
    
    // Inject SEO tags
    html = injectSEOTags(html, fullUrl, variantNumber);
    
    // Upload to KV
    const sizeKB = Math.round(html.length / 1024);
    console.log(`   ⬆️  Uploading (${sizeKB}KB)...`);
    
    const uploadStart = Date.now();
    const uploaded = await uploadToKV(kvKey, html);
    const uploadDuration = Math.round((Date.now() - uploadStart) / 1000);
    
    if (uploaded) {
      console.log(`   ✅ Success! Uploaded in ${uploadDuration}s`);
      return {
        status: 'success',
        path,
        kvKey,
        variant: variantNumber,
        size: sizeKB + 'KB'
      };
    } else {
      throw new Error('KV upload failed');
    }
    
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return {
      status: 'failed',
      path,
      kvKey,
      variant: variantNumber,
      error: error.message
    };
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('\n' + '█'.repeat(70));
  console.log('🗺️  SITEMAP CACHE GENERATION');
  console.log('█'.repeat(70));
  console.log(`📍 Domain: ${PRODUCTION_DOMAIN}`);
  console.log(`🔢 Variants per URL: ${VARIANTS_PER_URL}`);
  console.log(`🎯 Target: ${TARGET_SITEMAP}`);
  if (BATCH_SIZE && BATCH_NUMBER) {
    console.log(`📦 Batch mode: Batch ${BATCH_NUMBER}, Size ${BATCH_SIZE}`);
  }
  console.log('█'.repeat(70));
  
  const results = { success: 0, failed: 0, skipped: 0, pages: [] };
  const startTime = Date.now();
  
  // Determine which sitemaps to process
  let sitemapsToProcess = SITEMAP_URLS;
  if (TARGET_SITEMAP && TARGET_SITEMAP !== 'all') {
    const sitemapPath = `/${TARGET_SITEMAP}-sitemap.xml`;
    if (SITEMAP_URLS.includes(sitemapPath)) {
      sitemapsToProcess = [sitemapPath];
      console.log(`\n🎯 Processing single sitemap: ${TARGET_SITEMAP}\n`);
    } else {
      console.error(`\n❌ Unknown sitemap: ${TARGET_SITEMAP}`);
      console.error(`   Valid options: categories, states, regions, makes, etc.`);
      process.exit(1);
    }
  } else {
    console.log(`\n📑 Processing all ${sitemapsToProcess.length} sitemaps\n`);
  }
  
  // Step 1: Fetch URLs from sitemaps
  console.log('='.repeat(70));
  console.log('📥 STEP 1: Fetching sitemap URLs');
  console.log('='.repeat(70));
  
  let allUrls = [];
  for (let i = 0; i < sitemapsToProcess.length; i++) {
    console.log(`\n[${i + 1}/${sitemapsToProcess.length}]`);
    const urls = await fetchSitemapUrls(sitemapsToProcess[i]);
    allUrls = allUrls.concat(urls);
    await new Promise(resolve => setTimeout(resolve, 500));
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
    console.log(`📊 Total URLs in sitemap: ${totalUrlsBeforeBatch}`);
    console.log(`📦 Batch ${BATCH_NUMBER}: Processing URLs ${start + 1} to ${Math.min(end, totalUrlsBeforeBatch)}`);
    console.log(`📄 URLs in this batch: ${allUrls.length}`);
    console.log('='.repeat(70));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 SITEMAP FETCH COMPLETE');
  console.log('='.repeat(70));
  console.log(`📄 Total URLs to process: ${allUrls.length}`);
  console.log(`📦 Total variants to generate: ${allUrls.length * VARIANTS_PER_URL}`);
  const estimatedMinutes = Math.round(allUrls.length * VARIANTS_PER_URL * 2 / 60);
  console.log(`⏱️  Estimated time: ~${estimatedMinutes} minutes`);
  console.log('='.repeat(70));
  
  // Step 2: Generate variants
  console.log('\n🔨 STEP 2: Generating HTML variants\n');
  
  let totalProcessed = 0;
  
  for (let i = 0; i < allUrls.length; i++) {
    const urlData = allUrls[i];
    
    console.log('\n' + '-'.repeat(70));
    console.log(`📍 URL [${i + 1}/${allUrls.length}]: ${urlData.path}`);
    console.log(`   Source: ${urlData.sourceSitemap}`);
    console.log('-'.repeat(70));
    
    for (let variant = 1; variant <= VARIANTS_PER_URL; variant++) {
      totalProcessed++;
      const overallProgress = Math.round((totalProcessed / (allUrls.length * VARIANTS_PER_URL)) * 100);
      
      console.log(`\n[Variant ${variant}/${VARIANTS_PER_URL}] Overall: ${totalProcessed}/${allUrls.length * VARIANTS_PER_URL} (${overallProgress}%)`);
      
      const result = await generatePageVariant(urlData, variant);
      
      if (result.status === 'success') {
        results.success++;
        results.pages.push(result);
      } else if (result.status === 'skipped') {
        results.skipped++;
      } else {
        results.failed++;
      }
      
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_VARIANTS));
    }
    
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_URLS));
    
    // Progress update every 10 URLs
    if ((i + 1) % 10 === 0 || i === allUrls.length - 1) {
      const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
      const remaining = Math.round((allUrls.length - i - 1) * VARIANTS_PER_URL * 2 / 60);
      
      console.log('\n' + '='.repeat(70));
      console.log('📈 PROGRESS UPDATE');
      console.log('='.repeat(70));
      console.log(`📊 URLs: ${i + 1}/${allUrls.length} (${Math.round((i + 1) / allUrls.length * 100)}%)`);
      console.log(`✅ Success: ${results.success} variants`);
      console.log(`⏭️  Skipped: ${results.skipped} variants`);
      console.log(`❌ Failed: ${results.failed} variants`);
      console.log(`⏱️  Elapsed: ${elapsed} min | Remaining: ~${remaining} min`);
      console.log('='.repeat(70));
    }
  }
  
  // Step 3: Update routes mapping (only if not in batch mode)
  const shouldUpdateMapping = !BATCH_SIZE || !BATCH_NUMBER;
  
  if (shouldUpdateMapping) {
    console.log('\n' + '='.repeat(70));
    console.log('📋 UPDATING ROUTES MAPPING (Merging with existing)');
    console.log('='.repeat(70));
    
    // Load existing mapping first
    let mapping = {};
    try {
      const existingMappingUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/routes-mapping`;
      const existingResponse = await fetch(existingMappingUrl, {
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`
        }
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
    
    // Merge new pages into existing mapping
    let newPaths = 0;
    let updatedPaths = 0;
    
    for (const page of results.pages) {
      if (!mapping[page.path]) {
        mapping[page.path] = [];
        newPaths++;
      } else {
        updatedPaths++;
      }
      
      // Add variant if not already present
      if (!mapping[page.path].includes(page.kvKey)) {
        mapping[page.path].push(page.kvKey);
      }
    }
    
    // Sort variants for each path
    for (const path in mapping) {
      mapping[path].sort((a, b) => {
        const variantA = parseInt(a.match(/-v(\d+)$/)?.[1] || '0');
        const variantB = parseInt(b.match(/-v(\d+)$/)?.[1] || '0');
        return variantA - variantB;
      });
    }
    
    console.log(`   📊 New paths: ${newPaths}, Updated paths: ${updatedPaths}`);
    console.log(`   📦 Total paths in mapping: ${Object.keys(mapping).length}`);
    
    // Upload merged mapping to KV
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
    console.log('⏭️  SKIPPING ROUTES MAPPING UPDATE (Batch mode)');
    console.log('   Note: Routes mapping should be regenerated after all batches complete');
    console.log('='.repeat(70));
  }
  
  // Final summary
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
  console.log(`⏭️  Skipped: ${results.skipped} variants`);
  console.log(`❌ Failed: ${results.failed} variants`);
  console.log(`📄 Unique paths: ${results.pages.length > 0 ? Object.keys(results.pages.reduce((acc, p) => ({ ...acc, [p.path]: true }), {})).length : 0}`);
  console.log(`⏱️  Total duration: ${minutes}m ${seconds}s`);
  
  if (results.pages.length > 0) {
    const avgTime = Math.round(duration / results.pages.length * 10) / 10;
    console.log(`📦 Average: ${avgTime}s per variant`);
  }
  
  console.log('█'.repeat(70));
  
  if (results.failed === 0 && results.success > 0) {
    console.log('✨ ALL VARIANTS GENERATED SUCCESSFULLY!');
  } else if (results.failed > 0 && results.success > 0) {
    console.log('⚠️  COMPLETED WITH SOME FAILURES');
  } else if (results.success === 0) {
    console.log('❌ NO VARIANTS GENERATED');
  }
  
  console.log('█'.repeat(70));
  console.log();
  
  process.exit(results.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { main };
