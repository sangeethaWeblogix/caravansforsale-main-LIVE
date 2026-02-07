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

const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const { parseString } = require('xml2js');
const { promisify } = require('util');

const parseXML = promisify(parseString);

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
  console.log(`   🌐 Using Puppeteer...`);
  
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
  console.log(`   🌐 Using HTTP Fetch...`);
  
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
  console.log(`   URL: ${fetchUrl}`);
  
  try {
    // Fetch HTML
    let html;
    if (usePuppeteer && browser) {
      html = await fetchWithPuppeteer(fetchUrl, browser);
    } else {
      html = await fetchWithHttp(fetchUrl);
    }
    
    // Validate HTML
    if (!html.includes('</html>')) {
      throw new Error('Invalid HTML (no closing tag)');
    }
    
    // Check if should be cached
    if (!shouldCachePage(html)) {
      console.log(`   ⚠️  Skipping: Not index/follow`);
      return { status: 'skipped', path, kvKey };
    }
    
    // Inject SEO tags
    const canonicalUrl = `${PRODUCTION_DOMAIN}${path}`;
    html = injectSEOTags(html, canonicalUrl, variantNumber, usePuppeteer ? 'puppeteer' : 'http');
    
    // Upload to KV
    console.log(`   ⬆️  Uploading (${Math.round(html.length / 1024)}KB)...`);
    
    const metadata = {
      path,
      variant: variantNumber,
      generated: new Date().toISOString()
    };
    
    const uploaded = await uploadToKV(kvKey, html, metadata);
    
    if (uploaded) {
      console.log(`   ✅ Success!`);
      return {
        status: 'success',
        path,
        kvKey,
        variant: variantNumber,
        size: Math.round(html.length / 1024) + 'KB'
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
  console.log('🎯 GENERATING PRIORITY PAGES');
  console.log('='.repeat(70));
  
  const results = { success: 0, failed: 0, skipped: 0, pages: [] };
  let browser = null;
  
  try {
    // Launch browser if using Puppeteer
    if (USE_PUPPETEER) {
      console.log('\n🌐 Launching browser...');
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log('✅ Browser ready\n');
    }
    
    for (const page of PRIORITY_PAGES) {
      for (let variant = 1; variant <= VARIANTS_PER_URL; variant++) {
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
      await browser.close();
      console.log('\n🔒 Browser closed');
    }
  }
  
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
      console.log(`🎯 Processing single sitemap: ${sitemapPath}\n`);
    } else {
      console.error(`❌ Unknown sitemap: ${targetSitemap}`);
      return results;
    }
  }
  
  // Step 1: Fetch all URLs
  let allUrls = [];
  for (const sitemapPath of sitemapsToProcess) {
    const urls = await fetchSitemapUrls(sitemapPath);
    allUrls = allUrls.concat(urls);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Total URLs to process: ${allUrls.length}`);
  console.log(`📦 Total variants: ${allUrls.length * VARIANTS_PER_URL}\n`);
  
  // Step 2: Generate variants
  for (let i = 0; i < allUrls.length; i++) {
    const urlData = allUrls[i];
    const slug = convertPathToSlug(urlData.path);
    
    const pageConfig = {
      path: urlData.path,
      slug,
      usePuppeteer: false
    };
    
    console.log(`\n[${i + 1}/${allUrls.length}] ${urlData.path}`);
    
    for (let variant = 1; variant <= VARIANTS_PER_URL; variant++) {
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
    if ((i + 1) % 10 === 0) {
      console.log(`\n📈 Progress: ${i + 1}/${allUrls.length} URLs | ✅ ${results.success} | ❌ ${results.failed} | ⏭️  ${results.skipped}`);
    }
  }
  
  return results;
}

async function updateRoutesMapping(results) {
  console.log('\n' + '='.repeat(70));
  console.log('📋 UPDATING ROUTES MAPPING');
  console.log('='.repeat(70));
  
  // Build mapping from results
  const mapping = {};
  
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
  
  console.log(`\n📊 Mapping contains ${Object.keys(mapping).length} paths`);
  
  // Upload to KV
  const mappingJson = JSON.stringify(mapping, null, 2);
  const uploaded = await uploadToKV('routes-mapping', mappingJson);
  
  if (uploaded) {
    console.log('✅ Routes mapping uploaded successfully!');
    console.log(`   Size: ${Math.round(mappingJson.length / 1024)}KB`);
  } else {
    console.error('❌ Routes mapping upload failed!');
  }
  
  return mapping;
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('🚀 CFS UNIFIED CACHE GENERATION');
  console.log('='.repeat(70));
  console.log(`📍 Domain: ${PRODUCTION_DOMAIN}`);
  console.log(`🔢 Variants: ${VARIANTS_PER_URL}`);
  console.log(`🎯 Target: ${TARGET}`);
  console.log(`🤖 Puppeteer: ${USE_PUPPETEER ? 'Enabled' : 'Disabled'}`);
  console.log('='.repeat(70));
  
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
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
  
  // Final summary
  const duration = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Success: ${allResults.success} variants`);
  console.log(`❌ Failed: ${allResults.failed} variants`);
  console.log(`⏭️  Skipped: ${allResults.skipped} variants`);
  console.log(`📄 Unique paths: ${new Set(allResults.pages.map(p => p.path)).size}`);
  console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
  console.log('='.repeat(70));
  console.log('✨ Done!\n');
  
  process.exit(allResults.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
