/* eslint-disable */
const fetch = require('node-fetch');
const { parseString } = require('xml2js');
const { promisify } = require('util');

const parseXML = promisify(parseString);

const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://www.caravansforsale.com.au';

// Test with just a few sitemaps first
const TEST_SITEMAPS = [
  '/categories-sitemap.xml',
  '/states-sitemap.xml',
  '/makes-sitemap.xml'
];

async function testSitemapExtraction() {
  console.log('🧪 Testing Sitemap URL Extraction\n');
  console.log(`📍 Production Domain: ${PRODUCTION_DOMAIN}\n`);
  console.log('='.repeat(70));
  
  for (const sitemapPath of TEST_SITEMAPS) {
    const url = `${PRODUCTION_DOMAIN}${sitemapPath}`;
    console.log(`\n\n📄 Sitemap: ${sitemapPath}`);
    console.log(`🔗 URL: ${url}`);
    console.log('-'.repeat(70));
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'StaticGenerator-Test/1.0',
          'Accept': 'application/xml,text/xml'
        },
        timeout: 10000
      });
      
      if (!response.ok) {
        console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
        continue;
      }
      
      const xmlText = await response.text();
      console.log(`\n📦 XML Response Length: ${xmlText.length} chars`);
      console.log(`\n📋 XML Preview (first 800 chars):`);
      console.log(xmlText.substring(0, 800));
      console.log('\n...\n');
      
      const parsed = await parseXML(xmlText);
      
      if (!parsed.urlset) {
        console.error('❌ No <urlset> found in XML');
        continue;
      }
      
      if (!parsed.urlset.url) {
        console.error('❌ No <url> entries found in <urlset>');
        continue;
      }
      
      const urls = [];
      for (const urlEntry of parsed.urlset.url) {
        if (urlEntry.loc && urlEntry.loc[0]) {
          const fullUrl = urlEntry.loc[0];
          const path = fullUrl.replace(PRODUCTION_DOMAIN, '').replace(/\/$/, '') + '/';
          urls.push({
            fullUrl,
            path
          });
        }
      }
      
      console.log(`\n✅ Successfully extracted ${urls.length} URLs\n`);
      console.log('📋 First 10 URLs:');
      console.log('-'.repeat(70));
      
      urls.slice(0, 10).forEach((u, idx) => {
        console.log(`${String(idx + 1).padStart(2, ' ')}. ${u.path}`);
      });
      
      if (urls.length > 10) {
        console.log(`\n... and ${urls.length - 10} more URLs`);
      }
      
      console.log('\n' + '='.repeat(70));
      
      // Show what KV keys would be generated
      console.log(`\n🔑 Sample KV Keys (for variant 1):`);
      console.log('-'.repeat(70));
      
      urls.slice(0, 5).forEach(u => {
        const pathSlug = u.path
          .replace(/^\/listings\//, '')
          .replace(/^\//, '')
          .replace(/\/$/, '')
          .replace(/\//g, '-')
          .substring(0, 150);
        const kvKey = `${pathSlug}-v1`;
        console.log(`Path: ${u.path}`);
        console.log(`KV Key: ${kvKey}\n`);
      });
      
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      if (error.stack) {
        console.error(`\nStack trace:\n${error.stack}`);
      }
    }
  }
  
  console.log('\n\n✨ Test Complete!\n');
}

if (require.main === module) {
  testSitemapExtraction()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testSitemapExtraction };
