 const fetch = require('node-fetch');
 
// Environment variables (from GitHub secrets)

const VERCEL_BASE_URL = process.env.VERCEL_BASE_URL || 'https://caravansforsale-main-live.vercel.app';

const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://www.caravansforsale.com.au';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;

const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;

const CF_API_TOKEN = process.env.CF_API_TOKEN;
 
// Define all follow pages - slugs must match middleware.ts STATIC_ROUTES_MAPPING

const FOLLOW_PAGES = [

  { path: '/', slug: 'homepage' },

  { path: '/listings/', slug: 'listings-home' },

  { path: '/listings/caravans-for-sale/', slug: 'category-caravans' },

  { path: '/listings/caravans-for-sale/victoria/', slug: 'caravans-victoria' },

  { path: '/listings/caravans-for-sale/new-south-wales/', slug: 'caravans-nsw' },

  { path: '/listings/caravans-for-sale/queensland/', slug: 'caravans-qld' },

  { path: '/listings/caravans-for-sale/south-australia/', slug: 'caravans-sa' },

  { path: '/listings/caravans-for-sale/western-australia/', slug: 'caravans-wa' },

  { path: '/listings/caravans-for-sale/tasmania/', slug: 'caravans-tas' },

  { path: '/listings/caravans-for-sale/jayco/', slug: 'make-jayco' },

  { path: '/listings/caravans-for-sale/coromal/', slug: 'make-coromal' },

  { path: '/listings/caravans-for-sale/used/', slug: 'condition-used' },

  { path: '/listings/caravans-for-sale/victoria/jayco/', slug: 'victoria-jayco' },

];
 
async function uploadToKV(key, value) {

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESP…

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
 
async function generateStaticPages() {

  console.log('🚀 Starting static page generation...');

  console.log(`📍 Vercel URL: ${VERCEL_BASE_URL}`);

  console.log(`📍 Production: ${PRODUCTION_DOMAIN}`);

  console.log(`📄 Total pages: ${FOLLOW_PAGES.length}\n`);

  const results = {

    success: 0,

    failed: 0,

    pages: [],

    errors: []

  };

  const startTime = Date.now();

  for (const page of FOLLOW_PAGES) {

    const url = `${VERCEL_BASE_URL}${page.path}`;

    console.log(`\n📥 Fetching: ${page.path}`);

    console.log(`   URL: ${url}`);

    try {

      // Fetch HTML from Next.js/Vercel

      const response = await fetch(url, {

        headers: {

          'User-Agent': 'StaticGenerator/1.0',

          'Accept': 'text/html'

        },

        timeout: 30000

      });

      if (!response.ok) {

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      }

      let html = await response.text();

      // Check if we got valid HTML

      if (!html.includes('</html>')) {

        throw new Error('Invalid HTML response (no closing </html> tag)');

      }

      // Modify HTML to add SEO tags

      const canonicalUrl = `${PRODUCTION_DOMAIN}${page.path}`;

      const seoTags = `
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonicalUrl}">
<meta name="generated-at" content="${new Date().toISOString()}">
<meta name="static-version" content="1.0">`;

      html = html.replace('</head>', `${seoTags}\n</head>`);

      // Remove any noindex tags

      html = html.replace(/<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/gi, '');

      // Upload to Cloudflare KV

      console.log(`   ⬆️  Uploading to KV as: ${page.slug}`);

      const uploaded = await uploadToKV(page.slug, html);

      if (uploaded) {

        console.log(`   ✅ Success!`);

        results.success++;

        results.pages.push({

          path: page.path,

          slug: page.slug,

          status: 'success',

          size: Math.round(html.length / 1024) + 'KB'

        });

      } else {

        throw new Error('KV upload returned false');

      }

      // Small delay to avoid overwhelming Vercel

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {

      console.error(`   ❌ Failed: ${error.message}`);

      results.failed++;

      results.errors.push({

        path: page.path,

        error: error.message

      });

    }

  }

  // Create and upload routes mapping

  console.log('\n📋 Creating routes mapping...');

  const mapping = {};

  FOLLOW_PAGES.forEach(page => {

    mapping[page.path] = page.slug;

  });

  const mappingJson = JSON.stringify(mapping, null, 2);

  const mappingUploaded = await uploadToKV('routes-mapping', mappingJson);

  if (mappingUploaded) {

    console.log('✅ Routes mapping uploaded');

  } else {

    console.error('❌ Routes mapping upload failed');

  }

  // Summary

  const duration = Math.round((Date.now() - startTime) / 1000);

  console.log('\n' + '='.repeat(60));

  console.log('📊 GENERATION COMPLETE');

  console.log('='.repeat(60));

  console.log(`✅ Success: ${results.success} pages`);

  console.log(`❌ Failed: ${results.failed} pages`);

  console.log(`⏱️  Duration: ${duration} seconds`);

  console.log(`📦 Average: ${Math.round(duration / FOLLOW_PAGES.length * 10) / 10}s per page`);

  if (results.errors.length > 0) {

    console.log('\n❌ ERRORS:');

    results.errors.forEach(err => {

      console.log(`   ${err.path}: ${err.error}`);

    });

  }

  console.log('\n✨ Done!\n');

  return results;

}
 
// Run the generator

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
 