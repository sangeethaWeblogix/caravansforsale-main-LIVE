/* eslint-disable */
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

// ✅ USE PRODUCTION for fetching (more stable than Vercel preview)
const USE_PRODUCTION = process.env.USE_PRODUCTION !== 'false'; // Default to true

// ✅ ALL SITEMAP URLS
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

// Number of variants per URL
const VARIANTS_PER_URL = 5;
const BATCH_SIZE = 5; // Process 5 URLs at a time
const DELAY_BETWEEN_VARIANTS = 300; // 300ms between variants
const DELAY_BETWEEN_URLS = 800; // 800ms between URLs

async function uploadToKV(key, value) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${key}`;
  
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
}

async function fetchSitemapUrls(sitemapPath) {
  const url = `${PRODUCTION_DOMAIN}${sitemapPath}`;
  console.log(`\n📥 Fetching sitemap: ${sitemapPath}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'StaticGenerator/2.0',
        'Accept': 'application/xml,text/xml'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    const parsed = await parseXML(xmlText);
    
    const urls = [];
    if (parsed.urlset && parsed.urlset.url) {
      for (const urlEntry of parsed.urlset.url) {
        if (urlEntry.loc && urlEntry.loc[0]) {
          const fullUrl = urlEntry.loc[0];
          
          // ✅ Ensure path starts with / and ends with /
          let urlPath = fullUrl.replace(PRODUCTION_DOMAIN, '');
          
          // Ensure leading slash
          if (!urlPath.startsWith('/')) {
            urlPath = '/' + urlPath;
          }
          
          // Ensure trailing slash
          if (!urlPath.endsWith('/')) {
            urlPath = urlPath + '/';
          }
          
          urls.push({
            fullUrl: fullUrl,
            path: urlPath
          });
        }
      }
    }
    
    console.log(`   ✅ Found ${urls.length} URLs in ${sitemapPath}`);
    
    if (urls.length > 0 && urls.length <= 10) {
      console.log(`   📋 URLs:`);
      urls.forEach(u => {
        console.log(`      - ${u.path}`);
      });
    } else if (urls.length > 10) {
      console.log(`   📋 First 5 URLs:`);
      urls.slice(0, 5).forEach(u => {
        console.log(`      - ${u.path}`);
      });
      console.log(`      ... and ${urls.length - 5} more`);
    }
    
    return urls;
  } catch (error) {
    console.error(`   ❌ Failed to fetch sitemap: ${error.message}`);
    return [];
  }
}

async function generateVariantForUrl(urlData, variantNumber) {
  const { fullUrl, path } = urlData;
  console.log(`\n📄 Variant ${variantNumber}: ${path}`);
  
  try {
    // ✅ USE PRODUCTION DOMAIN (more stable than Vercel preview)
    const baseUrl = USE_PRODUCTION 
      ? PRODUCTION_DOMAIN.replace(/\/$/, '')
      : VERCEL_BASE_URL.replace(/\/$/, '');
    
    const urlPath = path.startsWith('/') ? path : `/${path}`;
    const fetchUrl = `${baseUrl}${urlPath}?shuffle_seed=${variantNumber}`;
    
    const source = USE_PRODUCTION ? 'PRODUCTION' : 'VERCEL';
    console.log(`   🔗 Fetching from ${source}: ${fetchUrl}`);
    
    let response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'StaticGenerator/2.0',
        'Accept': 'text/html'
      },
      timeout: 30000
    });
    
    // If production fails, try Vercel as fallback
    if (!response.ok && USE_PRODUCTION) {
      console.log(`   ⚠️  Production failed (${response.status}), trying Vercel fallback...`);
      const vercelUrl = `${VERCEL_BASE_URL.replace(/\/$/, '')}${urlPath}?shuffle_seed=${variantNumber}`;
      
      response = await fetch(vercelUrl, {
        headers: {
          'User-Agent': 'StaticGenerator/2.0',
          'Accept': 'text/html'
        },
        timeout: 30000
      });
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    let html = await response.text();
    
    // Validate HTML
    if (!html.includes('</html>')) {
      throw new Error('Invalid HTML response (missing closing html tag)');
    }
    
    // Check for error pages
    if (html.includes('Sorry, something went wrong')) {
      throw new Error('Page returned error state');
    }
    
    if (html.includes('We couldn\'t load the listings')) {
      throw new Error('Page returned loading error');
    }
    
    // ✅ Enhanced detection for index/follow
    const hasJsonIndexFollow = html.includes('"index":"index"') && html.includes('"follow":"follow"');
    const hasMetaIndexFollow = 
      html.includes('content="index, follow"') || 
      html.includes("content='index, follow'") ||
      html.includes('content="index,follow"') || 
      html.includes("content='index,follow'");
    
    // Check for explicit noindex
    const hasNoIndex = 
      html.includes('noindex') || 
      html.includes('"index":"noindex"');
    
    // If no robots meta tag exists, default is index/follow
    const hasNoRobotsTag = 
      !html.match(/<meta[^>]*name=["']robots["'][^>]*>/i) &&
      !html.includes('"index"') &&
      !html.includes('"follow"');
    
    const isIndexFollow = 
      (hasJsonIndexFollow || hasMetaIndexFollow || hasNoRobotsTag) && 
      !hasNoIndex;
    
    console.log(`   🔍 Detection:`);
    console.log(`      - JSON format (index/follow): ${hasJsonIndexFollow}`);
    console.log(`      - Meta tag (index, follow): ${hasMetaIndexFollow}`);
    console.log(`      - No robots tag (default): ${hasNoRobotsTag}`);
    console.log(`      - Contains noindex: ${hasNoIndex}`);
    console.log(`      - Final decision: ${isIndexFollow ? 'INDEX/FOLLOW ✅' : 'NOINDEX ❌'}`);
    
    if (!isIndexFollow) {
      console.log(`   ⚠️  Skipping: Not index/follow`);
      return null;
    }
    
    // Inject SEO tags
    const canonicalUrl = fullUrl;
    const seoTags = `
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">
    <meta name="generated-at" content="${new Date().toISOString()}">
    <meta name="static-variant" content="${variantNumber}">
    <meta name="static-source" content="${source}">`;
    
    html = html.replace('</head>', `${seoTags}\n</head>`);
    html = html.replace(/<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/gi, '');
    
    // Create KV key - handle all path formats
    let pathSlug = path;
    
    // Remove /listings/ prefix if present
    if (pathSlug.startsWith('/listings/')) {
      pathSlug = pathSlug.substring(10); // Remove '/listings/'
    }
    
    // Remove leading/trailing slashes
    pathSlug = pathSlug.replace(/^\/+|\/+$/g, '');
    
    // Replace remaining slashes with hyphens
    pathSlug = pathSlug.replace(/\//g, '-');
    
    // Limit length
    pathSlug = pathSlug.substring(0, 150);
    
    const kvKey = `${pathSlug}-v${variantNumber}`;
    
    console.log(`   💾 KV Key: ${kvKey}`);
    console.log(`   📦 Size: ${Math.round(html.length / 1024)}KB`);
    console.log(`   ⬆️  Uploading to KV...`);
    
    const uploaded = await uploadToKV(kvKey, html);
    
    if (uploaded) {
      console.log(`   ✅ Success!`);
      return {
        path: path,
        variant: variantNumber,
        kvKey: kvKey,
        size: Math.round(html.length / 1024) + 'KB',
        sourceSitemap: urlData.sourceSitemap,
        fetchedFrom: source
      };
    } else {
      throw new Error('KV upload returned false');
    }
    
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return null;
  }
}

async function processBatch(urlsData, startIdx, batchSize) {
  const batch = urlsData.slice(startIdx, startIdx + batchSize);
  const results = [];
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔄 Processing batch: URLs ${startIdx + 1}-${Math.min(startIdx + batchSize, urlsData.length)} of ${urlsData.length}`);
  console.log(`${'='.repeat(70)}`);
  
  for (const urlData of batch) {
    console.log(`\n📍 Processing: ${urlData.path}`);
    console.log(`   From: ${urlData.sourceSitemap}`);
    
    for (let variant = 1; variant <= VARIANTS_PER_URL; variant++) {
      const result = await generateVariantForUrl(urlData, variant);
      if (result) {
        results.push(result);
      }
      
      // Delay between variants
      if (variant < VARIANTS_PER_URL) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_VARIANTS));
      }
    }
    
    // Delay between URLs
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_URLS));
  }
  
  return results;
}

async function generateSitemapCache() {
  console.log('🚀 Starting Sitemap Cache Generation');
  console.log(`📍 Fetch Source: ${USE_PRODUCTION ? 'PRODUCTION' : 'VERCEL'}`);
  console.log(`📍 Production Domain: ${PRODUCTION_DOMAIN}`);
  console.log(`📍 Vercel URL: ${VERCEL_BASE_URL}`);
  console.log(`🔢 Variants per URL: ${VARIANTS_PER_URL}`);
  console.log(`📑 Sitemaps to process: ${SITEMAP_URLS.length}\n`);
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    pages: [],
    sitemapStats: {}
  };
  
  const startTime = Date.now();
  const routesMapping = {};
  
  // Step 1: Fetch all URLs from all sitemaps
  console.log('='.repeat(70));
  console.log('📥 STEP 1: Fetching all sitemaps');
  console.log('='.repeat(70));
  
  let allUrlsData = [];
  for (const sitemapPath of SITEMAP_URLS) {
    const urlsFromSitemap = await fetchSitemapUrls(sitemapPath);
    
    results.sitemapStats[sitemapPath] = {
      totalUrls: urlsFromSitemap.length,
      succeeded: 0,
      failed: 0,
      skipped: 0
    };
    
    allUrlsData = allUrlsData.concat(urlsFromSitemap.map(u => ({
      ...u,
      sourceSitemap: sitemapPath
    })));
    
    // Small delay between sitemap fetches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 SUMMARY: All Sitemaps Fetched`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📄 Total URLs to process: ${allUrlsData.length}`);
  console.log(`📦 Total variants to generate: ${allUrlsData.length * VARIANTS_PER_URL}`);
  console.log(`⏱️  Estimated time: ${Math.round(allUrlsData.length * VARIANTS_PER_URL * 2 / 60)} minutes`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Step 2: Generate variants for all URLs
  console.log('='.repeat(70));
  console.log('🔨 STEP 2: Generating variants');
  console.log('='.repeat(70));
  
  for (let i = 0; i < allUrlsData.length; i += BATCH_SIZE) {
    const batchResults = await processBatch(allUrlsData, i, BATCH_SIZE);
    
    for (const result of batchResults) {
      if (result) {
        results.success++;
        results.pages.push(result);
        
        const urlData = allUrlsData.find(u => u.path === result.path);
        if (urlData && urlData.sourceSitemap) {
          results.sitemapStats[urlData.sourceSitemap].succeeded++;
        }
        
        // Build routes mapping
        if (!routesMapping[result.path]) {
          routesMapping[result.path] = [];
        }
        routesMapping[result.path].push(result.kvKey);
      } else {
        results.failed++;
        
        // Track failures in sitemap stats
        const urlData = allUrlsData[Math.floor((i + results.pages.length + results.failed - 1) / VARIANTS_PER_URL)];
        if (urlData && urlData.sourceSitemap) {
          results.sitemapStats[urlData.sourceSitemap].failed++;
        }
      }
    }
    
    // Progress update
    const progress = Math.min(i + BATCH_SIZE, allUrlsData.length);
    const percentComplete = Math.round((progress / allUrlsData.length) * 100);
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📈 PROGRESS UPDATE`);
    console.log(`${'='.repeat(70)}`);
    console.log(`📊 URLs processed: ${progress}/${allUrlsData.length} (${percentComplete}%)`);
    console.log(`✅ Variants succeeded: ${results.success}`);
    console.log(`❌ Variants failed: ${results.failed}`);
    console.log(`⏱️  Elapsed time: ${Math.round((Date.now() - startTime) / 1000 / 60)} minutes`);
    console.log(`${'='.repeat(70)}`);
  }
  
  // Step 3: Upload routes mapping
  console.log('\n\n' + '='.repeat(70));
  console.log('📋 STEP 3: Creating and uploading routes mapping');
  console.log('='.repeat(70));
  
  console.log(`\n📊 Total paths mapped: ${Object.keys(routesMapping).length}`);
  console.log(`\n📝 Sample routes mapping (first 5):`);
  
  const samplePaths = Object.keys(routesMapping).slice(0, 5);
  samplePaths.forEach(path => {
    console.log(`\n${path}:`);
    routesMapping[path].forEach(key => console.log(`  - ${key}`));
  });
  
  console.log(`\n⬆️  Uploading routes mapping to KV...`);
  
  const mappingJson = JSON.stringify(routesMapping, null, 2);
  const mappingUploaded = await uploadToKV('sitemap-routes-mapping', mappingJson);
  
  if (mappingUploaded) {
    console.log('✅ Sitemap routes mapping uploaded successfully!');
    console.log(`   📊 Total paths mapped: ${Object.keys(routesMapping).length}`);
    console.log('   🔑 KV key: sitemap-routes-mapping');
  } else {
    console.error('❌ Sitemap routes mapping upload failed!');
  }
  
  // Final summary
  const duration = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Total variants succeeded: ${results.success}`);
  console.log(`❌ Total variants failed: ${results.failed}`);
  console.log(`📄 Total unique paths: ${Object.keys(routesMapping).length}`);
  console.log(`⏱️  Total duration: ${minutes}m ${seconds}s`);
  console.log(`📦 Average speed: ${Math.round(duration / allUrlsData.length * 10) / 10}s per URL`);
  
  // Per-sitemap breakdown
  console.log('\n📊 Per-Sitemap Breakdown:');
  console.log('-'.repeat(70));
  
  for (const [sitemap, stats] of Object.entries(results.sitemapStats)) {
    const successRate = stats.totalUrls > 0 
      ? Math.round((stats.succeeded / (stats.totalUrls * VARIANTS_PER_URL)) * 100) 
      : 0;
    
    console.log(`\n${sitemap}`);
    console.log(`  Total URLs: ${stats.totalUrls}`);
    console.log(`  Succeeded: ${stats.succeeded} variants (${successRate}%)`);
    console.log(`  Failed: ${stats.failed} variants`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✨ Generation Complete!');
  console.log('='.repeat(70));
  console.log('\n');
  
  return results;
}

// Run if called directly
if (require.main === module) {
  generateSitemapCache()
    .then((results) => {
      if (results.failed > results.success) {
        console.error('\n⚠️  More failures than successes. Exiting with error code.');
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { generateSitemapCache };
