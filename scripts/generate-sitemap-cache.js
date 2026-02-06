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

// ✅ TEST VERSION: Only categories sitemap
const SITEMAP_URLS = [
  '/categories-sitemap.xml',
];

// Number of variants per URL
const VARIANTS_PER_URL = 5;
const BATCH_SIZE = 3; // Small batch for testing

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
          const urlPath = fullUrl.replace(PRODUCTION_DOMAIN, '').replace(/\/$/, '') + '/';
          urls.push({
            fullUrl: fullUrl,
            path: urlPath
          });
        }
      }
    }
    
    console.log(`   ✅ Found ${urls.length} URLs in ${sitemapPath}`);
    
    if (urls.length > 0) {
      console.log(`   📋 URLs:`);
      urls.forEach(u => {
        console.log(`      - ${u.path}`);
      });
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
    // ✅ FIX: Ensure proper URL construction
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
    
    // ✅ FIXED: Check for BOTH JSON format AND HTML meta tag format
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
    
    // Inject SEO tags
    const canonicalUrl = fullUrl;
    const seoTags = `
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">
    <meta name="generated-at" content="${new Date().toISOString()}">
    <meta name="static-variant" content="${variantNumber}">`;
    
    html = html.replace('</head>', `${seoTags}\n</head>`);
    html = html.replace(/<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/gi, '');
    
    // Create KV key
    const pathSlug = path
      .replace(/^\/listings\//, '')
      .replace(/^\//, '')
      .replace(/\/$/, '')
      .replace(/\//g, '-')
      .substring(0, 150);
    
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
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

async function generateSitemapCache() {
  console.log('🚀 TEST RUN: Categories Sitemap Only');
  console.log(`📍 Vercel URL: ${VERCEL_BASE_URL}`);
  console.log(`📍 Production: ${PRODUCTION_DOMAIN}`);
  console.log(`🔢 Variants per URL: ${VARIANTS_PER_URL}\n`);
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    pages: [],
    sitemapStats: {}
  };
  
  const startTime = Date.now();
  const routesMapping = {};
  
  let allUrlsData = [];
  for (const sitemapPath of SITEMAP_URLS) {
    const urlsFromSitemap = await fetchSitemapUrls(sitemapPath);
    
    results.sitemapStats[sitemapPath] = {
      totalUrls: urlsFromSitemap.length,
      succeeded: 0,
      failed: 0
    };
    
    allUrlsData = allUrlsData.concat(urlsFromSitemap.map(u => ({
      ...u,
      sourceSitemap: sitemapPath
    })));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Total URLs to process: ${allUrlsData.length}`);
  console.log(`📦 Total variants to generate: ${allUrlsData.length * VARIANTS_PER_URL}`);
  console.log(`${'='.repeat(60)}\n`);
  
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
        
        if (!routesMapping[result.path]) {
          routesMapping[result.path] = [];
        }
        routesMapping[result.path].push(result.kvKey);
      } else {
        results.failed++;
      }
    }
    
    const progress = Math.min(i + BATCH_SIZE, allUrlsData.length);
    console.log(`\n📈 Progress: ${progress}/${allUrlsData.length} URLs`);
    console.log(`   ✅ Succeeded: ${results.success} variants`);
    console.log(`   ❌ Failed: ${results.failed} variants`);
  }
  
  console.log('\n📋 Creating sitemap routes mapping...');
  const mappingJson = JSON.stringify(routesMapping, null, 2);
  const mappingUploaded = await uploadToKV('sitemap-routes-mapping', mappingJson);
  
  if (mappingUploaded) {
    console.log('✅ Sitemap routes mapping uploaded');
    console.log(`   📊 Total paths mapped: ${Object.keys(routesMapping).length}`);
    console.log('\n📄 Mapping contents:');
    console.log(JSON.stringify(routesMapping, null, 2));
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
  console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
  
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
