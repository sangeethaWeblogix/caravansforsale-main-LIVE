/* eslint-disable */
/**
 * Priority Pages Generation Script
 * Generates HTML cache for homepage and listings home using Puppeteer
 * REQUIRES PUPPETEER
 */

const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const VERCEL_BASE_URL = process.env.VERCEL_BASE_URL || 'https://caravansforsale-main-live.vercel.app';
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://www.caravansforsale.com.au';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const TARGET_PAGE = process.env.TARGET_PAGE || 'all';

const LISTINGS_VARIANTS = 4;

const STATIC_PAGES = [
  { 
    path: '/', 
    slug: 'homepage',
    variants: LISTINGS_VARIANTS,
    id: 'homepage'
  },
  { 
    path: '/listings/', 
    slug: 'listings-home',
    variants: LISTINGS_VARIANTS,
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
  
  console.log(`\n📄 Generating: ${page.path} (variant ${variantNumber})`);
  console.log(`   Slug: ${kvKey}`);
  console.log(`   URL: ***?shuffle_seed=${variantNumber}`);
  
  try {
    const browserPage = await browser.newPage();
    await browserPage.setViewport({ width: 1920, height: 1080 });
    
    console.log(`   🌐 Using Puppeteer...`);
    
    const fetchStart = Date.now();
    await browserPage.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 45000
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let html = await browserPage.content();
    await browserPage.close();
    
    const fetchDuration = Math.round((Date.now() - fetchStart) / 1000);
    console.log(`   ⏱️  Fetched in ${fetchDuration}s`);
    
    if (!html.includes('</html>')) {
      throw new Error('Invalid HTML response (no closing </html> tag)');
    }
    
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
    
    html = html.replace('</head>', `${performanceTags}\n</head>`);
    // Remove noindex if present
    html = html.replace(/<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/gi, '');
    
    const sizeKB = Math.round(html.length / 1024);
    console.log(`   ⬆️  Uploading (${sizeKB}KB)...`);
    
    const uploadStart = Date.now();
    const uploaded = await uploadToKV(kvKey, html);
    const uploadDuration = Math.round((Date.now() - uploadStart) / 1000);
    
    if (uploaded) {
      console.log(`   ✅ Success! Uploaded in ${uploadDuration}s`);
      return {
        path: page.path,
        slug: kvKey,
        variant: variantNumber,
        status: 'success',
        size: sizeKB + 'KB'
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

async function generateStaticPages() {
  console.log('\n' + '█'.repeat(70));
  console.log('🎯 PRIORITY PAGES GENERATION (With Puppeteer)');
  console.log('█'.repeat(70));
  console.log(`📍 Vercel URL: ${VERCEL_BASE_URL}`);
  console.log(`📍 Production: ${PRODUCTION_DOMAIN}`);
  console.log(`🎯 Target: ${TARGET_PAGE || 'all'}`);
  console.log(`🔢 Variants: ${LISTINGS_VARIANTS}`);
  console.log('█'.repeat(70));
  
  // Filter pages based on target
  let pagesToGenerate = STATIC_PAGES;
  if (TARGET_PAGE && TARGET_PAGE !== 'all') {
    pagesToGenerate = STATIC_PAGES.filter(p => p.id === TARGET_PAGE);
    
    if (pagesToGenerate.length === 0) {
      console.error(`\n❌ Unknown target page: ${TARGET_PAGE}`);
      console.error(`   Valid options: homepage, listings, all`);
      process.exit(1);
    }
    
    console.log(`\n🎯 Generating only: ${pagesToGenerate[0].path}\n`);
  } else {
    console.log(`\n📋 Generating all ${pagesToGenerate.length} pages\n`);
  }
  
  const results = {
    success: 0,
    failed: 0,
    pages: [],
    errors: []
  };
  
  const startTime = Date.now();
  
  console.log('='.repeat(70));
  console.log('🌐 Launching headless browser...');
  console.log('='.repeat(70));
  
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
    let totalGenerated = 0;
    const totalVariants = pagesToGenerate.reduce((sum, page) => sum + page.variants, 0);
    
    for (const page of pagesToGenerate) {
      console.log('\n' + '-'.repeat(70));
      console.log(`📍 Processing: ${page.path}`);
      console.log('-'.repeat(70));
      
      for (let variant = 1; variant <= page.variants; variant++) {
        totalGenerated++;
        const progress = Math.round((totalGenerated / totalVariants) * 100);
        
        console.log(`\n[${totalGenerated}/${totalVariants}] Progress: ${progress}%`);
        
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
    console.log('\n' + '='.repeat(70));
    console.log('🔒 Closing browser...');
    await browser.close();
    console.log('✅ Browser closed');
    console.log('='.repeat(70));
  }
  
  // Update routes mapping (merge with existing)
  console.log('\n' + '='.repeat(70));
  console.log('📋 Updating routes mapping (Merging with existing)...');
  console.log('='.repeat(70));
  
  // Load existing mapping first
  let mapping = {};
  try {
    const existingMappingUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/routes-mapping`;
    const existingResponse = await fetch(existingMappingUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`
      }
    });
    
    if (existingResponse.ok) {
      const existingText = await existingResponse.text();
      mapping = JSON.parse(existingText);
      console.log(`\n✅ Loaded existing mapping with ${Object.keys(mapping).length} paths`);
    } else {
      console.log(`\nℹ️  No existing mapping found, starting fresh`);
    }
  } catch (error) {
    console.log(`\n⚠️  Could not load existing mapping: ${error.message}`);
    console.log(`   Starting with empty mapping`);
  }
  
  // Update/add priority pages to mapping
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
  
  console.log('\n📝 Updated routes mapping (showing priority pages only):');
  const priorityMapping = {};
  for (const page of pagesToGenerate) {
    priorityMapping[page.path] = mapping[page.path];
  }
  console.log(JSON.stringify(priorityMapping, null, 2));
  
  console.log(`\n📊 Total paths in mapping: ${Object.keys(mapping).length}`);
  
  const mappingJson = JSON.stringify(mapping, null, 2);
  const sizeKB = Math.round(mappingJson.length / 1024);
  console.log(`📦 Mapping size: ${sizeKB}KB`);
  
  console.log('\n⬆️  Uploading merged routes mapping...');
  const mappingUploaded = await uploadToKV('routes-mapping', mappingJson);
  
  if (mappingUploaded) {
    console.log('✅ Routes mapping uploaded successfully!');
  } else {
    console.error('❌ Routes mapping upload failed');
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const totalVariants = pagesToGenerate.reduce((sum, page) => sum + page.variants, 0);
  
  console.log('\n' + '█'.repeat(70));
  console.log('📊 GENERATION COMPLETE');
  console.log('█'.repeat(70));
  console.log(`🎯 Target: ${TARGET_PAGE || 'all'}`);
  console.log(`✅ Success: ${results.success} variants`);
  console.log(`❌ Failed: ${results.failed} variants`);
  console.log(`📄 Total variants generated: ${totalVariants}`);
  console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
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
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { generateStaticPages };
