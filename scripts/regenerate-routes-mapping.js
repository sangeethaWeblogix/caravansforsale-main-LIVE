/* eslint-disable */
/**
 * Regenerate Routes Mapping
 * 
 * Lists all keys in KV and rebuilds the routes-mapping JSON.
 * Run this after all batched cache generation jobs complete.
 * 
 * This script reads all KV keys (e.g., "colorado-v1", "colorado-v2"),
 * groups them by path slug, and uploads a fresh routes-mapping.
 */

const fetch = require('node-fetch');

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

const EXCLUDED_KEYS = ['routes-mapping']; // Keys that aren't page variants

async function listAllKVKeys() {
  let allKeys = [];
  let cursor = null;
  let page = 1;
  
  console.log('📥 Listing all KV keys...');
  
  while (true) {
    let url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/keys?limit=1000`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`KV list failed: ${JSON.stringify(data.errors)}`);
    }
    
    const keys = data.result.map(k => k.name);
    allKeys = allKeys.concat(keys);
    
    console.log(`   Page ${page}: ${keys.length} keys (total: ${allKeys.length})`);
    
    cursor = data.result_info?.cursor;
    if (!cursor || keys.length === 0) {
      break;
    }
    page++;
  }
  
  return allKeys;
}

function buildMappingFromKeys(keys) {
  const mapping = {};
  
  // Filter out non-variant keys
  const variantKeys = keys.filter(key => {
    if (EXCLUDED_KEYS.includes(key)) return false;
    // Must match pattern: slug-v1, slug-v2, etc.
    return /-v\d+$/.test(key);
  });
  
  console.log(`\n📊 Found ${variantKeys.length} variant keys out of ${keys.length} total keys`);
  
  for (const key of variantKeys) {
    // Extract slug (everything before -vN)
    const match = key.match(/^(.+)-v(\d+)$/);
    if (!match) continue;
    
    const slug = match[1];
    
    // Reconstruct path from slug
    // Reverse of convertPathToSlug: slug → /listings/slug/
    // For compound slugs with hyphens, we can't perfectly reconstruct
    // but for the mapping we use the slug as the path key
    const path = `/listings/${slug.replace(/-/g, '/')}/`;
    
    if (!mapping[path]) {
      mapping[path] = [];
    }
    mapping[path].push(key);
  }
  
  // Sort variants within each path
  for (const path in mapping) {
    mapping[path].sort((a, b) => {
      const variantA = parseInt(a.match(/-v(\d+)$/)?.[1] || '0');
      const variantB = parseInt(b.match(/-v(\d+)$/)?.[1] || '0');
      return variantA - variantB;
    });
  }
  
  return mapping;
}

async function uploadMapping(mapping) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/routes-mapping`;
  const mappingJson = JSON.stringify(mapping, null, 2);
  const sizeKB = Math.round(mappingJson.length / 1024);
  
  console.log(`\n⬆️  Uploading routes-mapping (${sizeKB}KB, ${Object.keys(mapping).length} paths)...`);
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: mappingJson,
        timeout: 60000
      });
      
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        if (attempt < 3) {
          console.error(`   ⚠️  Attempt ${attempt}/3 failed (invalid response), retrying...`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw new Error('Invalid JSON response from KV API');
      }
      
      if (result.success) {
        console.log('   ✅ Routes mapping uploaded successfully!');
        return true;
      }
      
      throw new Error(result.errors?.map(e => e.message).join(', ') || 'Upload failed');
      
    } catch (error) {
      if (attempt < 3) {
        console.error(`   ⚠️  Attempt ${attempt}/3 failed: ${error.message}, retrying...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.error(`   ❌ Upload failed after 3 attempts: ${error.message}`);
      return false;
    }
  }
  return false;
}

async function main() {
  console.log('█'.repeat(60));
  console.log('📋 REGENERATE ROUTES MAPPING');
  console.log('█'.repeat(60));
  
  if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_API_TOKEN) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }
  
  try {
    // Step 1: List all keys
    const keys = await listAllKVKeys();
    
    if (keys.length === 0) {
      console.log('⚠️  No keys found in KV namespace');
      process.exit(0);
    }
    
    // Step 2: Build mapping
    const mapping = buildMappingFromKeys(keys);
    
    console.log(`\n📊 Mapping summary:`);
    console.log(`   Total paths: ${Object.keys(mapping).length}`);
    const totalVariants = Object.values(mapping).reduce((sum, v) => sum + v.length, 0);
    console.log(`   Total variants: ${totalVariants}`);
    
    // Step 3: Upload
    const success = await uploadMapping(mapping);
    
    console.log('\n' + '█'.repeat(60));
    if (success) {
      console.log('✨ ROUTES MAPPING REGENERATED SUCCESSFULLY!');
    } else {
      console.log('❌ ROUTES MAPPING REGENERATION FAILED');
      process.exit(1);
    }
    console.log('█'.repeat(60));
    
  } catch (error) {
    console.error(`\n💥 Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
