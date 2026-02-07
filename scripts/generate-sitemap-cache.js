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
const TARGET_SITEMAP = process.env.TARGET_SITEMAP || 'all';

// ✅ ALL SITEMAP URLS WITH MAPPING
const SITEMAP_MAP = {
  'categories': '/categories-sitemap.xml',
  'states': '/states-sitemap.xml',
  'regions': '/regions-sitemap.xml',
  'makes': '/makes-sitemap.xml',
  'weights': '/weights-sitemap.xml',
  'prices': '/prices-sitemap.xml',
  'conditions': '/conditions-sitemap.xml',
  'length': '/length-sitemap.xml',
  'sleep': '/sleep-sitemap.xml',
  'category-state': '/category-state-sitemap.xml',
  'category-region': '/category-region-sitemap.xml',
  'region-length': '/region-length-sitemap.xml',
  'state-used': '/state-used-sitemap.xml',
  'region-used': '/region-used-sitemap.xml',
};

const ALL_SITEMAPS = Object.values(SITEMAP_MAP);

// Number of variants per URL
const VARIANTS_PER_URL = 5;
const BATCH_SIZE = 5;
const DELAY_BETWEEN_VARIANTS = 300;
const DELAY_BETWEEN_URLS = 800;

// ✅ Determine which sitemaps to process
function getSitemapsToProcess() {
  if (!TARGET_SITEMAP || TARGET_SITEMAP === 'all') {
    console.log('🔄 Processing ALL sitemaps (scheduled run or manual "all" selection)');
    return ALL_SITEMAPS;
  }
  
  const sitemapPath = SITEMAP_MAP[TARGET_SITEMAP];
  if (!sitemapPath) {
    console.error(`❌ Unknown sitemap target: ${TARGET_SITEMAP}`);
    console.error(`   Valid options: ${Object.keys(SITEMAP_MAP).join(', ')}, all`);
    process.exit(1);
  }
  
  console.log(`🎯 Processing SINGLE sitemap: ${TARGET_SITEMAP} (${sitemapPath})`);
  return [sitemapPath];
}

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
          
          let urlPath = fullUrl.replace(PRODUCTION_DOMAIN, '');
          
          if (!urlPath.startsWith('/')) {
            urlPath = '/' + urlPath;
          }
          
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
    const baseUrl = VERCEL_BASE_URL.replace(/\/$/, '');
    const urlPath = path.startsWith('/') ? path : `/${path}`;
    const vercelUrl = `${baseUrl}${urlPath}?shuffle_seed=${variantNumber}`;
    
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
    
    const hasJsonIndexFollow = html.includes('"index":"index"') && html.includes('"follow":"follow"');
    const hasMetaIndexFollow = html.includes('content="index, follow"') || html.includes("content='index, follow'");
    const hasNoIndex = html.includes('noindex') || html.includes('"index":"noindex"');
    
    const isIndexFollow = (hasJsonIndexFollow || hasMetaIndexFollow) && !hasNoIndex;
    
    console.log(`   🔍 Detection:`);
    console.log(`      - JSON format (index/follow): ${hasJsonIndexFollow}`);
    console.log(`      - Meta tag (index, follow): ${hasMetaIndexFollow}`);
    console.log(`      - Contains noindex: ${hasNoIndex}`);
    console.log(`      - Final decision: ${isIndexFollow ? 'INDEX/FOLLOW ✅' : 'NOINDEX ❌'}`);
    
    if (!isIndexFollow) {
      console.log(`   ⚠️  Skipping: Not index/follow`);
      return null;
    }
    
    const canonicalUrl = fullUrl;
    const seoTags = `
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">
    <meta name="generated-at" content="${new Date().toISOString()}">
    <meta name="static-variant" content="${variantNumber}">`;
    
    html = html.replace('</head>', `${seoTags}\n</head>`);
    html = html.replace(/<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/gi, '');
    
    let pathSlug = path;
    
    if (pathSlug.startsWith('/listings/')) {
      pathSlug = pathSlug.substring(10);
    }
    
    pathSlug = pathSlug.replace(/^\/+|\/+$/g, '');
    pathSlug = pathSlug.replace(/\//g, '-');
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
        sourceSitemap: urlData.sourceSitemap
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
      
      if (variant < VARIANTS_PER_URL) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_VARIANTS));
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_URLS));
  }
  
  return results;
}

async function loadExistingMapping() {
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/sitemap-routes-mapping`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`
      }
    });
    
    if (response.ok) {
      const existing = await response.json();
      console.log(`✅ Loaded existing mapping with ${Object.keys(existing).length} paths`);
      return existing;
    }
  } catch (error) {
    console.log(`ℹ️  No existing mapping found (will create new)`);
  }
  
  return {};
}

async function generateSitemapCache() {
  console.log('🚀 Starting Sitemap Cache Generation');
  console.log(`📍 Vercel URL: ${VERCEL_BASE_URL}`);
  console.log(`📍 Production: ${PRODUCTION_DOMAIN}`);
  console.log(`🔢 Variants per URL: ${VARIANTS_PER_URL}`);
  console.log(`🎯 Target: ${TARGET_SITEMAP || 'all'}\n`);
  
  // ✅ Get which sitemaps to process
  const SITEMAP_URLS = getSitemapsToProcess();
  
  console.log(`📑 Sitemaps to process: ${SITEMAP_URLS.length}`);
  SITEMAP_URLS.forEach(s => console.log(`   - ${s}`));
  console.log('');
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    pages: [],
    sitemapStats: {}
  };
  
  const startTime = Date.now();
  
  // ✅ Load existing mapping (important for partial updates)
  const existingMapping = await loadExistingMapping();
  const routesMapping = { ...existingMapping };
  
  // Step 1: Fetch all URLs from selected sitemaps
  console.log('='.repeat(70));
  console.log('📥 STEP 1: Fetching sitemaps');
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
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 SUMMARY: Sitemaps Fetched`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📄 Total URLs to process: ${allUrlsData.length}`);
  console.log(`📦 Total variants to generate: ${allUrlsData.length * VARIANTS_PER_URL}`);
  console.log(`⏱️  Estimated time: ${Math.round(allUrlsData.length * VARIANTS_PER_URL * 2 / 60)} minutes`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Step 2: Generate variants
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
        
        // ✅ Update mapping for this path
        if (!routesMapping[result.path]) {
          routesMapping[result.path] = [];
        }
        // Remove old variant if exists
        routesMapping[result.path] = routesMapping[result.path].filter(
          k => !k.endsWith(`-v${result.variant}`)
        );
        // Add new variant
        routesMapping[result.path].push(result.kvKey);
      } else {
        results.failed++;
        
        const urlData = allUrlsData[Math.floor((i + results.pages.length + results.failed - 1) / VARIANTS_PER_URL)];
        if (urlData && urlData.sourceSitemap) {
          results.sitemapStats[urlData.sourceSitemap].failed++;
        }
      }
    }
    
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
  
  // Step 3: Upload updated routes mapping
  console.log('\n\n' + '='.repeat(70));
  console.log('📋 STEP 3: Updating routes mapping');
  console.log('='.repeat(70));
  
  console.log(`\n📊 Total paths in mapping: ${Object.keys(routesMapping).length}`);
  console.log(`📊 Paths updated this run: ${new Set(results.pages.map(p => p.path)).size}`);
  
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
  console.log(`🎯 Target: ${TARGET_SITEMAP || 'all'}`);
  console.log(`✅ Total variants succeeded: ${results.success}`);
  console.log(`❌ Total variants failed: ${results.failed}`);
  console.log(`📄 Unique paths updated: ${new Set(results.pages.map(p => p.path)).size}`);
  console.log(`📋 Total paths in KV: ${Object.keys(routesMapping).length}`);
  console.log(`⏱️  Total duration: ${minutes}m ${seconds}s`);
  
  if (allUrlsData.length > 0) {
    console.log(`📦 Average speed: ${Math.round(duration / allUrlsData.length * 10) / 10}s per URL`);
  }
  
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
