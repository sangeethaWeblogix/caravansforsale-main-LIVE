/* eslint-disable */
/**
 * Unified Cache Generation Script
 * Generates both static pages and sitemap-based pages with proper KV key structure
 * 
 * Priority Pages (High-value, manually defined):
 * - Homepage: / → homepage-v1, homepage-v2, etc.
 * - Listings Home: /listings/ → listings-home-v1, listings-home-v2, etc.
 * 
 * Sitemap Pages (Auto-discovered from sitemaps):
 * - From XML sitemaps → Proper slug-based keys
 * 
 * All variants stored with consistent naming: {slug}-v{1-5}
 */

const fetch = require('node-fetch');
const { parseString } = require('xml2js');
const { promisify } = require('util');

const parseXML = promisify(parseString);

// Puppeteer is optional - only needed for priority pages with USE_PUPPETEER=true
let puppeteer = null;
async function loadPuppeteer() {
  if (!puppeteer) {
    try {
      puppeteer = require('puppeteer');
      return puppeteer;
    } catch (error) {
      console.error('⚠️  Puppeteer not installed. Install with: npm install puppeteer');
      console.error('   Falling back to HTTP fetch for all pages.');
      return null;
    }
  }
  return puppeteer;
}

// Environment variables
const VERCEL_BASE_URL = process.env.VERCEL_BASE_URL || 'https://caravansforsale-main-live.vercel.app';
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://www.caravansforsale.com.au';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const TARGET = process.env.TARGET || 'all'; // all, priority, sitemap, {specific-sitemap-name}
const USE_PUPPETEER = process.env.USE_PUPPETEER === 'true'; // Use for priority pages only

// Configuration
const VARIANTS_PER_URL = 5;
const BATCH_SIZE = 5;
const DELAY_BETWEEN_VARIANTS = 300;
const DELAY_BETWEEN_URLS = 800;

// Priority pages - high value pages that need Puppeteer for proper rendering
const PRIORITY_PAGES = [
  { 
    path: '/', 
    slug: 'homepage',
    usePuppeteer: true,
    waitForSelector: null
  },
  { 
    path: '/listings/', 
    slug: 'listings-home',
    usePuppeteer: true,
    waitForSelector: null
  },
];

// All sitemap URLs for auto-discovery
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
  /**
   * Converts URL path to KV-compatible slug
   * /listings/victoria/ → victoria-state
   * /listings/family-category/ → family-category
   * /listings/family-category/victoria/ → family-category-victoria-state
   */
  let pathSlug = path;
  
  // Remove /listings/ prefix
  if (pathSlug.startsWith('/listings/')) {
    pathSlug = pathSlug.substring(10);
  }
  
  // Remove leading/trailing slashes
  pathSlug = pathSlug.replace(/^\/+|\/+$/g, '');
  
  // Replace slashes with hyphens
  pathSlug = pathSlug.replace(/\//g, '-');
  
  // Remove special characters except hyphens
  pathSlug = pathSlug.replace(/[^a-z0-9-]/g, '');
  
  // Truncate to reasonable length
  if (pathSlug.length > 150) {
    pathSlug = pathSlug.substring(0, 150);
  }
  
  return pathSlug || 'home';
}

async function uploadToKV(key, value, metadata = {}) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${key}`;
  
  const headers = {
    'Authorization': `Bearer ${CF_API_TOKEN}`,
    'Content-Type': 'text/html'
  };
  
  // Add metadata if provided
  if (Object.keys(metadata).length > 0) {
    headers['metadata'] = JSON.stringify(metadata);
  }
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: value
    });
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`KV upload error for ${key}:`, error.message);
    return false;
  }
}

function injectSEOTags(html, canonicalUrl, variantNumber, source) {
  const seoTags = `
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">
    <meta name="generated-at" content="${new Date().toISOString()}">
    <meta name="static-variant" content="${variantNumber}">
    <meta name="static-source" content="${source}">`;
  
  // Remove any existing noindex tags
  html = html.replace(/<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/gi, '');
  
  // Inject SEO tags before </head>
  html = html.replace('</head>', `${seoTags}\n</head>`);
  
  return html;
}

function shouldCachePage(html) {
  /**
   * Check if page should be cached based on robots meta tag
   */
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
// FETCH METHODS
// ============================================

async function fetchWithPuppeteer(url, browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  await page.goto(url, { 
    waitUntil: 'networkidle0',
    timeout: 45000
  });
  
  // Wait a bit for any client-side rendering
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const html = await page.content();
  await page.close();
  
  return html;
}

async function fetchWithHttp(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'CFS-CacheGenerator/2.0',
      'Accept': 'text/html'
    },
    timeout: 30000
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.text();
}

// ============================================
// GENERATION FUNCTIONS
// ============================================

async function generatePageVariant(pageConfig, variantNumber, browser = null) {
  const { path, slug, usePuppeteer } = pageConfig;
  
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
    let html;
    const fetchStart = Date.now();
    
    if (usePuppeteer && browser) {
      console.log(`   🌐 Using Puppeteer...`);
      html = await fetchWithPuppeteer(fetchUrl, browser);
    } else {
      console.log(`   🌐 Using HTTP Fetch...`);
      html = await fetchWithHttp(fetchUrl);
    }
    
    const fetchDuration = Date.now() - fetchStart;
    console.log(`   ⏱️  Fetched in ${Math.round(fetchDuration / 1000)}s`);
    
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
    const canonicalUrl = `${PRODUCTION_DOMAIN}${path}`;
    html = injectSEOTags(html, canonicalUrl, variantNumber, usePuppeteer ? 'puppeteer' : 'http');
    
    // Upload to KV
    const sizeKB = Math.round(html.length / 1024);
    console.log(`   ℹ️  Uploading (${sizeKB}KB)...`);
    
    const metadata = {
      path,
      variant: variantNumber,
      generated: new Date().toISOString()
    };
    
    const uploadStart = Date.now();
    const uploaded = await uploadToKV(kvKey, html, metadata);
    const uploadDuration = Date.now() - uploadStart;
    
    if (uploaded) {
      console.log(`   ✅ Success! Uploaded in ${Math.round(uploadDuration / 1000)}s`);
      return {
        status: 'success',
        path,
        kvKey,
        variant: variantNumber,
        size: sizeKB + 'KB',
        fetchTime: fetchDuration,
        uploadTime: uploadDuration
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
          
          // Normalize path
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

// ============================================
// MAIN GENERATION LOGIC
// ============================================

async function generatePriorityPages() {
  console.log('\n' + '='.repeat(70));
  console.log('🎯 GENERATING PRIORITY PAGES (Homepage & Listings)');
  console.log('='.repeat(70));
  console.log(`📋 Pages to generate: ${PRIORITY_PAGES.length}`);
  console.log(`🔢 Variants per page: ${VARIANTS_PER_URL}`);
  console.log(`📦 Total variants: ${PRIORITY_PAGES.length * VARIANTS_PER_URL}`);
  console.log('='.repeat(70));
  
  const results = { success: 0, failed: 0, skipped: 0, pages: [] };
  let browser = null;
  
  try {
    // Launch browser if using Puppeteer
    if (USE_PUPPETEER) {
      console.log('\n🌐 Loading Puppeteer...');
      const pptr = await loadPuppeteer();
      
      if (pptr) {
        console.log('🌐 Launching headless browser...');
        browser = await pptr.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        console.log('✅ Browser launched!\n');
      } else {
        console.log('⚠️  Puppeteer not available, using HTTP fetch instead\n');
      }
    }
    
    let totalGenerated = 0;
    const totalVariants = PRIORITY_PAGES.length * VARIANTS_PER_URL;
    
    for (const page of PRIORITY_PAGES) {
      console.log('\n' + '-'.repeat(70));
      console.log(`📍 Processing: ${page.path}`);
      console.log('-'.repeat(70));
      
      for (let variant = 1; variant <= VARIANTS_PER_URL; variant++) {
        totalGenerated++;
        const progress = Math.round((totalGenerated / totalVariants) * 100);
        
        console.log(`\n[${totalGenerated}/${totalVariants}] Progress: ${progress}%`);
        
        const result = await generatePageVariant(page, variant, browser);
        
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
    }
    
  } finally {
    if (browser) {
      console.log('\n🔒 Closing browser...');
      await browser.close();
      console.log('✅ Browser closed');
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 PRIORITY PAGES - SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Success: ${results.success} variants`);
  console.log(`⏭️  Skipped: ${results.skipped} variants`);
  console.log(`❌ Failed: ${results.failed} variants`);
  console.log('='.repeat(70));
  
  return results;
}

async function generateSitemapPages(targetSitemap = null) {
  console.log('\n' + '='.repeat(70));
  console.log('🗺️  GENERATING SITEMAP PAGES');
  console.log('='.repeat(70));
  
  const results = { success: 0, failed: 0, skipped: 0, pages: [] };
  
  // Determine which sitemaps to process
  let sitemapsToProcess = SITEMAP_URLS;
  if (targetSitemap) {
    const sitemapPath = `/${targetSitemap}-sitemap.xml`;
    if (SITEMAP_URLS.includes(sitemapPath)) {
      sitemapsToProcess = [sitemapPath];
      console.log(`🎯 Target: Single sitemap (${targetSitemap})`);
    } else {
      console.error(`❌ Unknown sitemap: ${targetSitemap}`);
      return results;
    }
  } else {
    console.log(`📑 Target: All sitemaps (${sitemapsToProcess.length})`);
  }
  console.log('='.repeat(70));
  
  // Step 1: Fetch all URLs
  console.log('\n📥 STEP 1: Fetching sitemap URLs...\n');
  
  let allUrls = [];
  for (let i = 0; i < sitemapsToProcess.length; i++) {
    const sitemapPath = sitemapsToProcess[i];
    console.log(`[${i + 1}/${sitemapsToProcess.length}] Fetching: ${sitemapPath}`);
    
    const urls = await fetchSitemapUrls(sitemapPath);
    allUrls = allUrls.concat(urls);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 SITEMAP FETCH COMPLETE');
  console.log('='.repeat(70));
  console.log(`📄 Total URLs found: ${allUrls.length}`);
  console.log(`🔢 Variants per URL: ${VARIANTS_PER_URL}`);
  console.log(`📦 Total variants to generate: ${allUrls.length * VARIANTS_PER_URL}`);
  
  const estimatedMinutes = Math.round(allUrls.length * VARIANTS_PER_URL * 2 / 60);
  console.log(`⏱️  Estimated time: ~${estimatedMinutes} minutes`);
  console.log('='.repeat(70));
  
  // Step 2: Generate variants
  console.log('\n🔨 STEP 2: Generating HTML variants...\n');
  
  let totalProcessed = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < allUrls.length; i++) {
    const urlData = allUrls[i];
    const slug = convertPathToSlug(urlData.path);
    
    const pageConfig = {
      path: urlData.path,
      slug,
      usePuppeteer: false
    };
    
    console.log('\n' + '-'.repeat(70));
    console.log(`📍 URL [${i + 1}/${allUrls.length}]: ${urlData.path}`);
    console.log(`   Slug: ${slug}`);
    console.log(`   Source: ${urlData.sourceSitemap}`);
    console.log('-'.repeat(70));
    
    for (let variant = 1; variant <= VARIANTS_PER_URL; variant++) {
      totalProcessed++;
      const overallProgress = Math.round((totalProcessed / (allUrls.length * VARIANTS_PER_URL)) * 100);
      
      console.log(`\n[Variant ${variant}/${VARIANTS_PER_URL}] Overall: ${totalProcessed}/${allUrls.length * VARIANTS_PER_URL} (${overallProgress}%)`);
      
      const result = await generatePageVariant(pageConfig, variant);
      
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
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 SITEMAP GENERATION - SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Success: ${results.success} variants`);
  console.log(`⏭️  Skipped: ${results.skipped} variants`);
  console.log(`❌ Failed: ${results.failed} variants`);
  console.log('='.repeat(70));
  
  return results;
}

async function updateRoutesMapping(results) {
  console.log('\n' + '='.repeat(70));
  console.log('📋 UPDATING ROUTES MAPPING');
  console.log('='.repeat(70));
  
  // Build mapping from results
  const mapping = {};
  
  console.log('🔨 Building mapping from generated pages...');
  
  for (const page of results.pages) {
    if (!mapping[page.path]) {
      mapping[page.path] = [];
    }
    mapping[page.path].push(page.kvKey);
  }
  
  // Sort variants for each path
  for (const path in mapping) {
    mapping[path].sort((a, b) => {
      const variantA = parseInt(a.match(/-v(\d+)$/)?.[1] || '0');
      const variantB = parseInt(b.match(/-v(\d+)$/)?.[1] || '0');
      return variantA - variantB;
    });
  }
  
  console.log(`✅ Built mapping for ${Object.keys(mapping).length} paths`);
  
  // Show sample paths
  console.log('\n📝 Sample routes mapping:');
  const samplePaths = Object.keys(mapping).slice(0, 5);
  samplePaths.forEach((path, idx) => {
    console.log(`\n${idx + 1}. ${path}`);
    console.log(`   Variants: ${mapping[path].join(', ')}`);
  });
  
  if (Object.keys(mapping).length > 5) {
    console.log(`\n   ... and ${Object.keys(mapping).length - 5} more paths`);
  }
  
  // Upload to KV
  console.log('\n⬆️  Uploading routes mapping to KV...');
  
  const mappingJson = JSON.stringify(mapping, null, 2);
  const sizeKB = Math.round(mappingJson.length / 1024);
  console.log(`   Size: ${sizeKB}KB`);
  
  const uploaded = await uploadToKV('routes-mapping', mappingJson);
  
  if (uploaded) {
    console.log('✅ Routes mapping uploaded successfully!');
    console.log(`   KV Key: routes-mapping`);
    console.log(`   Total paths: ${Object.keys(mapping).length}`);
    console.log(`   Total variants: ${results.pages.length}`);
  } else {
    console.error('❌ Routes mapping upload failed!');
  }
  
  console.log('='.repeat(70));
  
  return mapping;
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('\n' + '█'.repeat(70));
  console.log('🚀 CFS UNIFIED CACHE GENERATION');
  console.log('█'.repeat(70));
  console.log(`📍 Domain: ${PRODUCTION_DOMAIN}`);
  console.log(`🔢 Variants per URL: ${VARIANTS_PER_URL}`);
  console.log(`🎯 Target: ${TARGET}`);
  console.log(`🤖 Puppeteer: ${USE_PUPPETEER ? 'Enabled (Priority Pages)' : 'Disabled'}`);
  console.log('█'.repeat(70));
  
  const startTime = Date.now();
  let allResults = { success: 0, failed: 0, skipped: 0, pages: [] };
  
  try {
    // Generate based on target
    if (TARGET === 'all' || TARGET === 'priority') {
      const priorityResults = await generatePriorityPages();
      allResults.success += priorityResults.success;
      allResults.failed += priorityResults.failed;
      allResults.skipped += priorityResults.skipped;
      allResults.pages.push(...priorityResults.pages);
    }
    
    if (TARGET === 'all' || TARGET === 'sitemap') {
      const sitemapResults = await generateSitemapPages();
      allResults.success += sitemapResults.success;
      allResults.failed += sitemapResults.failed;
      allResults.skipped += sitemapResults.skipped;
      allResults.pages.push(...sitemapResults.pages);
    } else if (TARGET !== 'priority' && TARGET !== 'all') {
      // Specific sitemap
      const sitemapResults = await generateSitemapPages(TARGET);
      allResults.success += sitemapResults.success;
      allResults.failed += sitemapResults.failed;
      allResults.skipped += sitemapResults.skipped;
      allResults.pages.push(...sitemapResults.pages);
    }
    
    // Update routes mapping
    if (allResults.pages.length > 0) {
      await updateRoutesMapping(allResults);
    } else {
      console.log('\n⚠️  No pages generated - skipping routes mapping update');
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  }
  
  // Final summary
  const duration = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  console.log('\n\n' + '█'.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('█'.repeat(70));
  console.log(`🎯 Target: ${TARGET}`);
  console.log(`✅ Success: ${allResults.success} variants`);
  console.log(`⏭️  Skipped: ${allResults.skipped} variants (not index/follow)`);
  console.log(`❌ Failed: ${allResults.failed} variants`);
  console.log(`📄 Unique paths: ${new Set(allResults.pages.map(p => p.path)).size}`);
  console.log(`⏱️  Total duration: ${minutes}m ${seconds}s`);
  
  if (allResults.pages.length > 0) {
    const avgTime = Math.round(duration / allResults.pages.length * 10) / 10;
    console.log(`📦 Average: ${avgTime}s per variant`);
    
    const totalSize = allResults.pages.reduce((sum, p) => {
      const size = parseInt(p.size) || 0;
      return sum + size;
    }, 0);
    console.log(`💾 Total storage: ~${Math.round(totalSize / 1024)}MB`);
  }
  
  console.log('█'.repeat(70));
  
  // Success/failure indicators
  if (allResults.failed === 0 && allResults.success > 0) {
    console.log('✨ ALL VARIANTS GENERATED SUCCESSFULLY!');
  } else if (allResults.failed > 0 && allResults.success > 0) {
    console.log('⚠️  COMPLETED WITH SOME FAILURES');
  } else if (allResults.success === 0) {
    console.log('❌ NO VARIANTS GENERATED');
  }
  
  console.log('█'.repeat(70));
  console.log();
  
  process.exit(allResults.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
