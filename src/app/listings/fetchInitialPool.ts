/**
 * Server-side fetch of initial pool data for SSR/ISR.
 *
 * Priority:
 *  1. Cloudflare KV REST API (pre-warmed by WP admin warmer) — fast, no WP needed
 *  2. /api/pool-listings/ — live fetch through Cloudflare → WP (orange-cloud bypasses SiteGround anti-bot)
 *
 * The parsed result is passed as `initialPool` to StateHome so the SSR HTML
 * contains real product listings from the first byte.
 */

import { Listing, SeoV2, buildFeaturedOrder } from "./listingShared";
import type { InitialPool } from "./home";

const CF_ACCOUNT_ID   = process.env.CF_ACCOUNT_ID;
const CF_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN    = process.env.CF_API_TOKEN;
const APP_URL         = process.env.NEXT_PUBLIC_APP_URL || "https://www.caravansforsale.com.au";

/** Build the canonical KV key for pool data — must match worker.js buildPoolCacheKey(). */
function buildPoolKvKey(filters: { state?: string; region?: string; category?: string; condition?: string }): string {
  const params: Record<string, string> = {};
  if (filters.state)     params.state     = filters.state;
  if (filters.region)    params.region    = filters.region;
  if (filters.category)  params.category  = filters.category;
  if (filters.condition) params.condition = filters.condition;

  const sorted = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  return `json:pool:${sorted || "_root"}`;
}

/** Parse a raw pool_test JSON response into the InitialPool shape. */
function parsePoolJson(json: any, isIndexed: boolean): InitialPool | null {
  const seo: SeoV2 | null = json?.data?.seo_v2 ?? json?.seo_v2 ?? null;
  const products: Listing[]         = json?.data?.products         ?? json?.products         ?? [];
  const premiumsRaw: Listing[]      = json?.data?.premium_products  ?? json?.premium_products  ?? [];
  const exclusivesRaw: Listing[]    = json?.data?.exclusive_products ?? json?.exclusive_products ?? [];
  const empExclusivesRaw: Listing[] = json?.data?.emp_exclusive_products ?? json?.emp_exclusive_products ?? [];
  const totalCount: number          = json?.data?.counts?.total_count ?? json?.counts?.total_count ?? products.length;

  if (!products.length && !premiumsRaw.length) return null;

  const totalProducts = json?.data?.pagination?.total_products ?? json?.pagination?.total_products ?? totalCount;
  const perPage = 24;
  const maxPages = Math.max(1, Math.ceil(totalProducts / perPage));

  let featured: Listing[] = [];
  let newItems: Listing[]  = [];
  let usedItems: Listing[] = [];

  if (isIndexed) {
    const featuredSource = products.filter((p) => p.slot_bucket === "featured");
    featured = buildFeaturedOrder(featuredSource, premiumsRaw, exclusivesRaw);
    const featuredIds = new Set(featured.map((p) => p.id));
    newItems  = products.filter((p) => p.slot_bucket === "new"  && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));
    usedItems = products.filter((p) => p.slot_bucket === "used" && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));
  } else {
    // Non-indexed: combined grid, no slot splitting
    const totalC = totalCount === 0 && empExclusivesRaw.length > 0;
    featured = totalC
      ? empExclusivesRaw
      : buildFeaturedOrder(products, premiumsRaw, exclusivesRaw);
    newItems  = [];
    usedItems = [];
  }

  return { seo, featured, new: newItems, used: usedItems, maxPages, isIndexed };
}

/** Try reading pool data from Cloudflare KV REST API. */
async function fetchFromKV(kvKey: string): Promise<any | null> {
  if (!CF_ACCOUNT_ID || !CF_NAMESPACE_ID || !CF_API_TOKEN) return null;
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}` +
    `/storage/kv/namespaces/${CF_NAMESPACE_ID}/values/${encodeURIComponent(kvKey)}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
      next: { revalidate: 300 }, // edge-cache the KV read for 5 min
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Live fetch from /api/pool-listings/ — goes via Cloudflare orange-cloud → WP. */
async function fetchFromApi(filters: { state?: string; region?: string; category?: string; condition?: string }): Promise<any | null> {
  const params = new URLSearchParams({ orderby: "default", per_page: "24", page: "1", seed: "1" });
  if (filters.state)     params.set("state",     filters.state);
  if (filters.region)    params.set("region",    filters.region);
  if (filters.category)  params.set("category",  filters.category);
  if (filters.condition) params.set("condition", filters.condition);
  try {
    const res = await fetch(`${APP_URL}/api/pool-listings/?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch the initial pool for SSR/ISR rendering.
 * Returns null on failure — caller should render without initial pool.
 */
export async function fetchInitialPool(
  filters: { state?: string; region?: string; category?: string; condition?: string },
  isIndexed = true
): Promise<InitialPool | null> {
  const kvKey = buildPoolKvKey(filters);

  // 1. Try KV first (fast, no WP call)
  const kvJson = await fetchFromKV(kvKey);
  if (kvJson) {
    const parsed = parsePoolJson(kvJson, isIndexed);
    if (parsed) {
      console.log(`[fetchInitialPool] KV HIT: ${kvKey} (${parsed.featured.length + parsed.new.length + parsed.used.length} products)`);
      return parsed;
    }
  }

  // 2. Fall back to live API (goes through Cloudflare orange-cloud → WP)
  console.log(`[fetchInitialPool] KV MISS: ${kvKey} — falling back to API`);
  const apiJson = await fetchFromApi(filters);
  if (apiJson) {
    const parsed = parsePoolJson(apiJson, isIndexed);
    if (parsed) {
      console.log(`[fetchInitialPool] API OK (${parsed.featured.length + parsed.new.length + parsed.used.length} products)`);
      return parsed;
    }
  }

  console.log(`[fetchInitialPool] both KV and API failed for ${kvKey}`);
  return null;
}
