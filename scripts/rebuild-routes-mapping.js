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
  // Remove variant suffix
  const baseKey = kvKey.replace(/-v\d+$/, '');
  
  // Known categories
  const categories = [
    'family-category',
    'hybrid-category', 
    'luxury-category',
    'off-road-category',
    'pop-top-category',
    'touring-category'
  ];
  
  // Handle state patterns: "victoria-state" -> "/listings/victoria/"
  if (baseKey.endsWith('-state') && !baseKey.includes('-region')) {
    const stateName = baseKey.replace(/-state$/, '');
    return `/listings/${stateName.replace(/-/g, '/')}/`;
  }
  
  // Handle state-region patterns: "victoria-state-melbourne-region"
  const stateRegionMatch = baseKey.match(/^(.+)-state-(.+)-region$/);
  if (stateRegionMatch) {
    const stateName = stateRegionMatch[1];
    const regionName = stateRegionMatch[2];
    return `/listings/${stateName.replace(/-/g, '/')}/${regionName.replace(/-/g, '/')}/`;
  }
  
  // Handle categories (exact match)
  if (categories.includes(baseKey)) {
    return `/listings/${baseKey}/`;
  }
  
  // Handle category combinations (but not if it ends with "-category")
  for (const category of categories) {
    if (baseKey.startsWith(category + '-')) {
      const remainder = baseKey.substring(category.length + 1);
      
      // Check if remainder is a state
      if (remainder.endsWith('-state')) {
        const stateName = remainder.replace(/-state$/, '');
        return `/listings/${category}/${stateName.replace(/-/g, '/')}/`;
      }
      
      // Otherwise it's a region or other combo
      return `/listings/${category}/${remainder.replace(/-/g, '/')}/`;
    }
  }
  
  // Handle special patterns
  if (baseKey === 'home' || baseKey === 'listings-home') {
    return `/listings/`;
  }
  
  if (baseKey === 'used-condition') {
    return `/listings/used/`;
  }
  
  // Default: simple path conversion
  return `/listings/${baseKey.replace(/-/g, '/')}/`;
}

async function rebuildRoutesMapping() {
  console.log('🚀 Rebuilding Routes Mapping from KV Keys\n');
  console.log('='.repeat(70));
  
  // Get all keys
  const allKeys = await listAllKVKeys();
  
  console.log('📋 Analyzing keys...');
  
  // Filter variant keys (exclude bad "listings-*" keys)
  const variantKeys = allKeys
    .map(k => k.name)
    .filter(name => name.match(/-v\d+$/))
    .filter(name => name !== 'routes-mapping' && name !== 'sitemap-routes-mapping')
    .filter(name => !name.startsWith('listings-')); // ✅ Exclude incorrectly prefixed keys
  
  console.log(`   ✅ Found ${variantKeys.length} valid variant keys`);
  console.log(`   ℹ️  Skipped ${allKeys.length - variantKeys.length} non-variant/invalid keys\n`);
  
  if (variantKeys.length === 0) {
    console.error('❌ No variant keys found! Nothing to rebuild.');
    return;
  }
  
  // Show some samples
  console.log('📝 Sample keys found:');
  variantKeys.slice(0, 15).forEach(key => {
    const path = reconstructPathFromKey(key);
    console.log(`   ${key} → ${path}`);
  });
  if (variantKeys.length > 15) {
    console.log(`   ... and ${variantKeys.length - 15} more\n`);
  }
  
  // Group by path
  console.log('\n🔨 Building routes mapping...');
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
  const states = Object.keys(routesMapping).filter(p => p.match(/\/listings\/[^/]+\/state\/$/));
  const stateRegions = Object.keys(routesMapping).filter(p => p.match(/\/listings\/[^/]+\/state\/[^/]+\/region\/$/));
  const other = Object.keys(routesMapping).filter(p => 
    !categories.includes(p) && !states.includes(p) && !stateRegions.includes(p)
  );
  
  console.log(`   Categories: ${categories.length} paths`);
  console.log(`   States: ${states.length} paths`);
  console.log(`   State+Regions: ${stateRegions.length} paths`);
  console.log(`   Other (makes/prices/etc): ${other.length} paths\n`);
  
  // Upload to KV
  console.log('=' .repeat(70));
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
