/* eslint-disable */
const fetch = require('node-fetch');

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

async function listAllKVKeys() {
  console.log('📥 Fetching all KV keys...');
  const allKeys = [];
  let cursor = null;
  let pageCount = 0;
  
  do {
    pageCount++;
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/keys?limit=1000${cursor ? `&cursor=${cursor}` : ''}`;
    
    console.log(`   Fetching page ${pageCount}...`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
      }
    });
    
    const result = await response.json();
    
    if (result.success && result.result) {
      allKeys.push(...result.result);
      cursor = result.result_info?.cursor;
      console.log(`   ✅ Got ${result.result.length} keys (total so far: ${allKeys.length})`);
    } else {
      console.error('   ❌ Failed to fetch keys:', result);
      break;
    }
  } while (cursor);
  
  console.log(`\n✅ Total keys fetched: ${allKeys.length}\n`);
  return allKeys;
}

async function uploadToKV(key, value) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${key}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: value
  });
  
  const result = await response.json();
  return result.success;
}

function reconstructPathFromKey(kvKey) {
  // Remove variant suffix: "victoria-v1" -> "victoria"
  const baseKey = kvKey.replace(/-v\d+$/, '');
  
  // Convert hyphens back to slashes for multi-part paths
  // But need to be smart about it:
  // "victoria" -> "/listings/victoria/"
  // "off-road-category" -> "/listings/off-road-category/"
  // "off-road-category-victoria" -> "/listings/off-road-category/victoria/"
  
  // Known categories (add more as needed)
  const categories = [
    'family-category',
    'hybrid-category', 
    'luxury-category',
    'off-road-category',
    'pop-top-category',
    'touring-category'
  ];
  
  // Check if key starts with a known category
  for (const category of categories) {
    if (baseKey.startsWith(category + '-')) {
      // This is category + something else
      const remainder = baseKey.substring(category.length + 1);
      return `/listings/${category}/${remainder.replace(/-/g, '/')}/`;
    } else if (baseKey === category) {
      // Just the category alone
      return `/listings/${category}/`;
    }
  }
  
  // Not a category combination, so it's a simple state/region/make/etc
  // Just replace hyphens with slashes (but this might not always be right)
  return `/listings/${baseKey.replace(/-/g, '/')}/`;
}

async function rebuildRoutesMapping() {
  console.log('🚀 Rebuilding Routes Mapping from KV Keys\n');
  console.log('='.repeat(70));
  
  // Get all keys
  const allKeys = await listAllKVKeys();
  
  console.log('📋 Analyzing keys...');
  
  // Filter variant keys only (ending with -v1, -v2, etc.)
  const variantKeys = allKeys
    .map(k => k.name)
    .filter(name => name.match(/-v\d+$/))
    .filter(name => name !== 'routes-mapping' && name !== 'sitemap-routes-mapping');
  
  console.log(`   ✅ Found ${variantKeys.length} variant keys`);
  console.log(`   ℹ️  Skipped ${allKeys.length - variantKeys.length} non-variant keys\n`);
  
  if (variantKeys.length === 0) {
    console.error('❌ No variant keys found! Nothing to rebuild.');
    return;
  }
  
  // Show some samples
  console.log('📝 Sample keys found:');
  variantKeys.slice(0, 10).forEach(key => {
    console.log(`   - ${key}`);
  });
  if (variantKeys.length > 10) {
    console.log(`   ... and ${variantKeys.length - 10} more\n`);
  }
  
  // Group by path
  console.log('🔨 Building routes mapping...');
  const routesMapping = {};
  
  for (const kvKey of variantKeys) {
    const path = reconstructPathFromKey(kvKey);
    
    if (!routesMapping[path]) {
      routesMapping[path] = [];
    }
    
    routesMapping[path].push(kvKey);
  }
  
  // Sort variants for each path
  for (const path in routesMapping) {
    routesMapping[path].sort((a, b) => {
      const variantA = parseInt(a.match(/-v(\d+)$/)[1]);
      const variantB = parseInt(b.match(/-v(\d+)$/)[1]);
      return variantA - variantB;
    });
  }
  
  console.log(`   ✅ Created mapping for ${Object.keys(routesMapping).length} unique paths\n`);
  
  // Display summary by type
  console.log('📊 Breakdown by path type:');
  const categories = Object.keys(routesMapping).filter(p => p.match(/\/listings\/[^/]+-category\/$/));
  const states = Object.keys(routesMapping).filter(p => !p.includes('-category') && p.split('/').length === 4);
  const combinations = Object.keys(routesMapping).filter(p => p.split('/').length > 4);
  
  console.log(`   Categories: ${categories.length} paths`);
  console.log(`   States/Regions/Makes: ${states.length} paths`);
  console.log(`   Combinations: ${combinations.length} paths\n`);
  
  // Show sample of each type
  console.log('📝 Sample paths created:');
  console.log('\n   Categories:');
  categories.slice(0, 3).forEach(path => {
    console.log(`   ${path} → ${routesMapping[path].length} variants`);
  });
  
  console.log('\n   States/Regions:');
  states.slice(0, 5).forEach(path => {
    console.log(`   ${path} → ${routesMapping[path].length} variants`);
  });
  
  console.log('\n   Combinations:');
  combinations.slice(0, 5).forEach(path => {
    console.log(`   ${path} → ${routesMapping[path].length} variants`);
  });
  
  // Upload to KV
  console.log('\n' + '='.repeat(70));
  console.log('⬆️  Uploading routes mapping to KV...');
  
  const mappingJson = JSON.stringify(routesMapping, null, 2);
  console.log(`   📦 Size: ${Math.round(mappingJson.length / 1024)}KB`);
  
  const uploaded = await uploadToKV('sitemap-routes-mapping', mappingJson);
  
  if (uploaded) {
    console.log('   ✅ Routes mapping uploaded successfully!');
    console.log(`   🔑 KV key: sitemap-routes-mapping`);
    console.log(`   📊 Total paths: ${Object.keys(routesMapping).length}`);
    console.log(`   📊 Total variants: ${variantKeys.length}`);
  } else {
    console.error('   ❌ Routes mapping upload failed!');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✨ Rebuild Complete!\n');
  
  return routesMapping;
}

if (require.main === module) {
  rebuildRoutesMapping()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { rebuildRoutesMapping };
