/* eslint-disable */
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

// Environment variables (from GitHub secrets)
const VERCEL_BASE_URL = process.env.VERCEL_BASE_URL || 'https://caravansforsale-main-live.vercel.app';
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://www.caravansforsale.com.au';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

// Number of variants to generate for /listings/
const LISTINGS_VARIANTS = 5;

// Define pages to generate
const STATIC_PAGES = [
  { 
    path: '/', 
    slug: 'homepage',
    variants: 1,  // Only 1 variant for homepage
    waitForCategories: false  // Homepage doesn't need categories
  },
  { 
    path: '/listings/', 
    slug: 'listings-home',
    variants: LISTINGS_VARIANTS,  // 5 variants for listings
    waitForCategories: true  // Wait for categories to load
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
  // Build URL with shuffle_seed for listings variants
  let url = `${VERCEL_BASE_URL}${page.path}`;
  if (page.variants > 1) {
    url += `?shuffle_seed=${variantNumber}`;
  }
  
  const kvKey = page.variants > 1 ? `${page.slug}-v${variantNumber}` : page.slug;
  
  console.log(`\n📥 Fetching: ${page.path}${page.variants > 1 ? ` (variant ${variantNumber})` : ''}`);
  console.log(`   URL: ${url}`);
  console.log(`   KV Key: ${kvKey}`);
  
  try {
    // Create new page in the browser
    const browserPage = await browser.newPage();
    
    // Set viewport
    await browserPage.setViewport({ width: 1920, height: 1080 });
    
    console.log(`   🌐 Loading page...`);
    
    // Navigate to the page
    await browserPage.goto(url, { 
      waitUntil: 'networkidle0',  // Wait until network is idle
      timeout: 45000  // 45 second timeout
    });
    
    // If this page needs categories, wait for them to load
    if (page.waitForCategories) {
      console.log(`   ⏳ Waiting for categories to load...`);
      
      try {
        // Wait for the category data to be populated in the page
        await browserPage.waitForFunction(() => {
          // Look for the script tag that contains the data
          const scripts = Array.from(document.querySelectorAll('script'));
          for (const script of scripts) {
            if (script.textContent.includes('"all_categories"')) {
              // Check if all_categories is not an empty array
              const match = script.textContent.match(/"all_categories":\s*\[([^\]]*)\]/);
              if (match && match[1].trim().length > 10) {
                return true;
              }
            }
          }
          return false;
        }, { 
          timeout: 15000  // 15 second timeout for categories
        });
        
        console.log(`   ✅ Categories loaded successfully!`);
      } catch (waitError) {
        console.log(`   ⚠️  Timeout waiting for categories, continuing anyway...`);
      }
    }
    
    // Get the fully rendered HTML
    let html = await browserPage.content();
    
    // Close the page
    await browserPage.close();
    
    if (!html.includes('</html>')) {
      throw new Error('Invalid HTML response (no closing </html> tag)');
    }
    
    // Verify categories are present if needed
    if (page.waitForCategories) {
      const hasCategories = html.includes('"all_categories"') && 
                           !html.includes('"all_categories":[]');
      
      if (!hasCategories) {
        console.log(`   ⚠️  Warning: Categories data may not be fully loaded`);
      } else {
        console.log(`   ✅ Verified: Categories data present in HTML`);
      }
    }
    
    // Add performance optimizations for images
    const imageOptimizations = `
    <link rel="dns-prefetch" href="https://caravansforsale.imagestack.net" />
    <link rel="preconnect" href="https://caravansforsale.imagestack.net" crossorigin />`;
    
    // Extract and preload first 6 images
    const imageMatches = [...html.matchAll(/src="([^"]+\/(CFS-[^/]+)\/[^"]+\.(jpg|jpeg|png|webp))"/gi)];
    const firstImages = imageMatches.slice(0, 6).map(match => {
      const imgPath = match[1];
      // If already using your image worker, keep it; otherwise optimize
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

async function generateStaticPages() {
  console.log('🚀 Starting static page generation with Puppeteer...');
  console.log(`📍 Vercel URL: ${VERCEL_BASE_URL}`);
  console.log(`📍 Production: ${PRODUCTION_DOMAIN}`);
  console.log(`🔢 Listings variants: ${LISTINGS_VARIANTS}\n`);
  
  const results = {
    success: 0,
    failed: 0,
    pages: [],
    errors: []
  };
  
  const startTime = Date.now();
  
  // Launch browser once for all pages
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
    // Generate all pages and their variants
    for (const page of STATIC_PAGES) {
      for (let variant = 1; variant <= page.variants; variant++) {
        const result = await generatePageVariant(page, variant, browser);
        
        if (result.status === 'success') {
          results.success++;
          results.pages.push(result);
        } else {
          results.failed++;
          results.errors.push(result);
        }
        
        // Short delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } finally {
    // Always close the browser
    console.log('\n🔒 Closing browser...');
    await browser.close();
  }
  
  // Create routes mapping
  console.log('\n📋 Creating routes mapping...');
  const mapping = {};
  
  for (const page of STATIC_PAGES) {
    if (page.variants === 1) {
      // Single variant: direct mapping
      mapping[page.path] = page.slug;
    } else {
      // Multiple variants: array of variant keys
      const variants = [];
      for (let i = 1; i <= page.variants; i++) {
        variants.push(`${page.slug}-v${i}`);
      }
      mapping[page.path] = variants;
    }
  }
  
  console.log('📝 Routes mapping:');
  console.log(JSON.stringify(mapping, null, 2));
  
  const mappingJson = JSON.stringify(mapping, null, 2);
  const mappingUploaded = await uploadToKV('routes-mapping', mappingJson);
  
  if (mappingUploaded) {
    console.log('✅ Routes mapping uploaded');
  } else {
    console.error('❌ Routes mapping upload failed');
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  const totalVariants = STATIC_PAGES.reduce((sum, page) => sum + page.variants, 0);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION COMPLETE');
  console.log('='.repeat(60));
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
