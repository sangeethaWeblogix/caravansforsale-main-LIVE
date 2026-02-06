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

// Sitemap URLs to fetch (these contain the actual page URLs)
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
  '/state-make-sitemap.xml',
  '/region-make-sitemap.xml',
  '/category-state-sitemap.xml',
  '/category-region-sitemap.xml',
  '/region-length-sitemap.xml',
  '/state-used-sitemap.xml',
  '/region-used-sitemap.xml',
];

// Number of variants per URL
const VARIANTS_PER_URL = 5;
const BATCH_SIZE = 10;

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
    
    // Log first 500 chars for debugging
    console.log(`   📄 XML Preview: ${xmlText.substring(0, 500)}...`);
    
    const parsed = await parseXML(xmlText);
    
    // Extract URLs from sitemap
    const urls = [];
    if (parsed.urlset && parsed.urlset.url) {
      for (const urlEntry of parsed.urlset.url) {
        if (urlEntry.loc && urlEntry.loc[0]) {
          const fullUrl = urlEntry.loc[0];
          
          // Extract just the path (remove domain)
          const urlPath = fullUrl.replace(PRODUCTION_DOMAIN, '').replace(/\/$/, '') + '/';
          urls.push({
            fullUrl: fullUrl,
            path: urlPath
          });
        }
      }
    }
    
    console.log(`   ✅ Found ${urls.length} URLs in ${sitemapPath}`);
    
    // Log first 3 URLs for verification
    if (urls.length > 0) {
      console.log(`   📋 Sample URLs:`);
      urls.slice(0, 3).forEach(u => {
        console.log(`      - ${u.path}`);
      });
      if (urls.length > 3) {
        console.log(`      ... and ${urls.length - 3} more`);
      }
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
    // Fetch from Vercel with shuffle_seed
    const vercelUrl = `${VERCEL_BASE_URL}${path}?shuffle_seed=${variantNumber}`;
    
    console.log(`   🔗 Fetching: ${vercelUrl}`);
    
    const response = await fetch(vercelUrl, {
      headers: {
        'User-Agent': 'StaticGenerator/2.0',
        'Accept': 'text/html'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    let html = await response.text();
    
    if (!html.includes('</html>')) {
      throw new Error('Invalid HTML response');
    }
    
    // Check if page is index/follow
    const isIndexFollow = html.includes('"index":"index"') && html.includes('"follow":"follow"');
    
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
    <meta name="static-variant" content="${variantNumber}">`;
    
    html = html.replace('</head>', `${seoTags}\n</head>`);
    html = html.replace(/<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/gi, '');
    
    // Create KV key: path-based slug + variant
    const pathSlug = path
      .replace(/^\/listings\//, '')  // Remove /listings/ prefix
      .replace(/^\//, '')             // Remove leading slash
      .replace(/\/$/, '')             // Remove trailing slash
      .replace(/\//g, '-')            // Replace slashes with hyphens
      .substring(0, 150);             // Limit length
    
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
        size: Math.round(html.length / 1024) + 'KB'
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
  
  console.log(`\n🔄 Processing batch: URLs ${startIdx + 1}-${Math.min(startIdx + batchSize, urlsData.length)}`);
  
  for (const urlData of batch) {
    for (let variant = 1; variant <= VARIANTS_PER_URL; variant++) {
      const result = await generateVariantForUrl(urlData, variant);
      if (result) {
        results.push(result);
      }
      
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Slightly longer delay between different URLs
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

async function generateSitemapCache() {
  console.log('🚀 Starting sitemap URL cache generation...');
  console.log(`📍 Vercel URL: ${VERCEL_BASE_URL}`);
  console.log(`📍 Production: ${PRODUCTION_DOMAIN}`);
  console.log(`🔢 Variants per URL: ${VARIANTS_PER_URL}`);
  console.log(`📑 Sitemaps to process: ${SITEMAP_URLS.length}\n`);
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    pages: [],
    errors: [],
    sitemapStats: {}
  };
  
  const startTime = Date.now();
  const routesMapping = {};
  
  // Fetch all sitemap URLs
  let allUrlsData = [];
  for (const sitemapPath of SITEMAP_URLS) {
    const urlsFromSitemap = await fetchSitemapUrls(sitemapPath);
    
    // Track per-sitemap stats
    results.sitemapStats[sitemapPath] = {
      totalUrls: urlsFromSitemap.length,
      processed: 0,
      succeeded: 0,
      failed: 0
    };
    
    allUrlsData = allUrlsData.concat(urlsFromSitemap.map(u => ({
      ...u,
      sourceSitemap: sitemapPath
    })));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 SITEMAP SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  for (const [sitemap, stats] of Object.entries(results.sitemapStats)) {
    console.log(`${sitemap}: ${stats.totalUrls} URLs`);
  }
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 Total URLs to process: ${allUrlsData.length}`);
  console.log(`📦 Total variants to generate: ${allUrlsData.length * VARIANTS_PER_URL}`);
  console.log(`⏱️  Estimated time: ~${Math.round(allUrlsData.length * VARIANTS_PER_URL * 0.8 / 60)} minutes\n`);
  
  // Process in batches
  for (let i = 0; i < allUrlsData.length; i += BATCH_SIZE) {
    const batchResults = await processBatch(allUrlsData, i, BATCH_SIZE);
    
    for (const result of batchResults) {
      if (result) {
        results.success++;
        results.pages.push(result);
        
        // Update per-sitemap stats
        const urlData = allUrlsData.find(u => u.path === result.path);
        if (urlData && urlData.sourceSitemap) {
          results.sitemapStats[urlData.sourceSitemap].succeeded++;
        }
        
        // Build routes mapping (group variants by path)
        if (!routesMapping[result.path]) {
          routesMapping[result.path] = [];
        }
        routesMapping[result.path].push(result.kvKey);
      } else {
        results.failed++;
        
        // Track failed URLs
        const currentBatch = allUrlsData.slice(i, i + BATCH_SIZE);
        const failedUrl = currentBatch[Math.floor((results.failed - 1) / VARIANTS_PER_URL)];
        if (failedUrl && failedUrl.sourceSitemap) {
          results.sitemapStats[failedUrl.sourceSitemap].failed++;
        }
      }
    }
    
    const progress = Math.min(i + BATCH_SIZE, allUrlsData.length);
    const percentage = Math.round((progress / allUrlsData.length) * 100);
    console.log(`\n📈 Progress: ${progress}/${allUrlsData.length} URLs (${percentage}%)`);
    console.log(`   ✅ Succeeded: ${results.success} variants`);
    console.log(`   ❌ Failed: ${results.failed} variants`);
  }
  
  // Upload routes mapping
  console.log('\n📋 Creating sitemap routes mapping...');
  const mappingJson = JSON.stringify(routesMapping, null, 2);
  const mappingUploaded = await uploadToKV('sitemap-routes-mapping', mappingJson);
  
  if (mappingUploaded) {
    console.log('✅ Sitemap routes mapping uploaded');
    console.log(`   📊 Total paths mapped: ${Object.keys(routesMapping).length}`);
  } else {
    console.error('❌ Sitemap routes mapping upload failed');
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${results.success} variants`);
  console.log(`❌ Failed: ${results.failed} variants`);
  console.log(`⏭️  Skipped: ${results.skipped} (noindex pages)`);
  console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
  console.log(`📦 Average: ${Math.round(duration / allUrlsData.length * 10) / 10}s per URL`);
  
  console.log('\n📑 PER-SITEMAP BREAKDOWN:');
  for (const [sitemap, stats] of Object.entries(results.sitemapStats)) {
    const successRate = stats.totalUrls > 0 
      ? Math.round((stats.succeeded / (stats.totalUrls * VARIANTS_PER_URL)) * 100) 
      : 0;
    console.log(`\n${sitemap}:`);
    console.log(`   📄 Total URLs: ${stats.totalUrls}`);
    console.log(`   ✅ Succeeded: ${stats.succeeded}/${stats.totalUrls * VARIANTS_PER_URL} (${successRate}%)`);
    console.log(`   ❌ Failed: ${stats.failed}`);
  }
  
  console.log('\n✨ Done!\n');
  
  return results;
}

if (require.main === module) {
  generateSitemapCache()
    .then((results) => {
      if (results.failed > results.success) {
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
