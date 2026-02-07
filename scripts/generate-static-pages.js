/* eslint-disable */
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const VERCEL_BASE_URL = process.env.VERCEL_BASE_URL || 'https://caravansforsale-main-live.vercel.app';
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://www.caravansforsale.com.au';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const TARGET_PAGE = process.env.TARGET_PAGE || 'all';

const LISTINGS_VARIANTS = 5;

const STATIC_PAGES = [
  { 
    path: '/', 
    slug: 'homepage',
    variants: 1,
    waitForCategories: false,
    id: 'homepage'
  },
  { 
    path: '/listings/', 
    slug: 'listings-home',
    variants: LISTINGS_VARIANTS,
    waitForCategories: true,
    id: 'listings'
  },
];

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

async function generatePageVariant(page, variantNumber, browser) {
  let url = `${VERCEL_BASE_URL}${page.path}`;
  if (page.variants > 1) {
    url += `?shuffle_seed=${variantNumber}`;
  }
  
  const kvKey = page.variants > 1 ? `${page.slug}-v${variantNumber}` : page.slug;
  
  console.log(`\n📥 Fetching: ${page.path}${page.variants > 1 ? ` (variant ${variantNumber})` : ''}`);
  console.log(`   URL: ${url}`);
  console.log(`   KV Key: ${kvKey}`);
  
  try {
    const browserPage = await browser.newPage();
    await browserPage.setViewport({ width: 1920, height: 1080 });
    
    console.log(`   🌐 Loading page...`);
    
    await browserPage.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 45000
    });
    
    if (page.waitForCategories) {
      console.log(`   ⏳ Waiting for categories to load...`);
      
      try {
        await browserPage.waitForFunction(() => {
          const scripts = Array.from(document.querySelectorAll('script'));
          for (const script of scripts) {
            if (script.textContent.includes('"all_categories"')) {
              const match = script.textContent.match(/"all_categories":\s*\[([^\]]*)\]/);
              if (match && match[1].trim().length > 10) {
                return true;
              }
            }
          }
          return false;
        }, { 
          timeout: 15000
        });
        
        console.log(`   ✅ Categories loaded successfully!`);
      } catch (waitError) {
        console.log(`   ⚠️  Timeout waiting for categories, continuing anyway...`);
      }
    }
    
    let html = await browserPage.content();
    await browserPage.close();
    
    if (!html.includes('</html>')) {
      throw new Error('Invalid HTML response (no closing </html> tag)');
    }
    
    if (page.waitForCategories) {
      const hasCategories = html.includes('"all_categories"') && 
                           !html.includes('"all_categories":[]');
      
      if (!hasCategories) {
        console.log(`   ⚠️  Warning: Categories data may not be fully loaded`);
      } else {
        console.log(`   ✅ Verified: Categories data present in HTML`);
      }
    }
    
    const imageOptimizations = `
    <link rel="dns-prefetch" href="https://caravansforsale.imagestack.net" />
    <link rel="preconnect" href="https://caravansforsale.imagestack.net" crossorigin />`;
    
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
    
    const canonicalUrl = `${PRODUCTION_DOMAIN}${page.path}`;
    const seoTags = `${imageOptimizations}
    ${preloadLinks}
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">
    <meta name="generated-at" content="${new Date().toISOString()}">
    <meta name="static-version" content="2.0">
    <meta name="static-variant" content="${variantNumber}">`;
    
    html = html.replace('</head>', `${seoTags}\n</head>`);
    html = html.replace(/<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/gi, '');
    
    console.log(`   ⬆️  Uploading to KV (${Math.round(html.length / 1024)}KB)...`);
    const uploaded = await uploadToKV(kvKey, html);
    
    if (uploaded) {
      console.log(`   ✅ Success!`);
      return {
        path: page.path,
        slug: kvKey,
        variant: variantNumber,
        status: 'success',
        size: Math.round(html.length / 1024) + 'KB'
      };
    } else {
      throw new Error('KV upload returned false');
    }
    
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return {
      path: page.path,
      slug: kvKey,
      variant: variantNumber,
      status: 'failed',
      error: error.message
    };
  }
}

async function loadExistingMapping() {
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/routes-mapping`;
    
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

async function generateStaticPages() {
  console.log('🚀 Starting static page generation with Puppeteer...');
  console.log(`📍 Vercel URL: ${VERCEL_BASE_URL}`);
  console.log(`📍 Production: ${PRODUCTION_DOMAIN}`);
  console.log(`🎯 Target: ${TARGET_PAGE || 'all'}`);
  console.log(`🔢 Listings variants: ${LISTINGS_VARIANTS}\n`);
  
  // ✅ Filter pages based on target
  let pagesToGenerate = STATIC_PAGES;
  if (TARGET_PAGE && TARGET_PAGE !== 'all') {
    pagesToGenerate = STATIC_PAGES.filter(p => p.id === TARGET_PAGE);
    
    if (pagesToGenerate.length === 0) {
      console.error(`❌ Unknown target page: ${TARGET_PAGE}`);
      console.error(`   Valid options: homepage, listings, all`);
      process.exit(1);
    }
    
    console.log(`🎯 Generating only: ${pagesToGenerate[0].path}\n`);
  }
  
  const results = {
    success: 0,
    failed: 0,
    pages: [],
    errors: []
  };
  
  const startTime = Date.now();
  
  console.log('🌐 Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  
  console.log('✅ Browser launched!\n');
  
  try {
    for (const page of pagesToGenerate) {
      for (let variant = 1; variant <= page.variants; variant++) {
        const result = await generatePageVariant(page, variant, browser);
        
        if (result.status === 'success') {
          results.success++;
          results.pages.push(result);
        } else {
          results.failed++;
          results.errors.push(result);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } finally {
    console.log('\n🔒 Closing browser...');
    await browser.close();
  }
  
  // ✅ Load existing mapping and merge
  console.log('\n📋 Updating routes mapping...');
  const existingMapping = await loadExistingMapping();
  const mapping = { ...existingMapping };
  
  for (const page of pagesToGenerate) {
    if (page.variants === 1) {
      mapping[page.path] = page.slug;
    } else {
      const variants = [];
      for (let i = 1; i <= page.variants; i++) {
        variants.push(`${page.slug}-v${i}`);
      }
      mapping[page.path] = variants;
    }
  }
  
  console.log('📝 Updated routes mapping:');
  console.log(JSON.stringify(mapping, null, 2));
  
  const mappingJson = JSON.stringify(mapping, null, 2);
  const mappingUploaded = await uploadToKV('routes-mapping', mappingJson);
  
  if (mappingUploaded) {
    console.log('✅ Routes mapping uploaded');
  } else {
    console.error('❌ Routes mapping upload failed');
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  const totalVariants = pagesToGenerate.reduce((sum, page) => sum + page.variants, 0);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`🎯 Target: ${TARGET_PAGE || 'all'}`);
  console.log(`✅ Success: ${results.success} variants`);
  console.log(`❌ Failed: ${results.failed} variants`);
  console.log(`📄 Total variants generated: ${totalVariants}`);
  console.log(`⏱️  Duration: ${duration} seconds`);
  console.log(`📦 Average: ${Math.round(duration / totalVariants * 10) / 10}s per variant`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(err => {
      console.log(`   ${err.path} (v${err.variant}): ${err.error}`);
    });
  }
  
  console.log('\n✨ Done!\n');
  
  return results;
}

if (require.main === module) {
  generateStaticPages()
    .then((results) => {
      if (results.failed > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { generateStaticPages };
