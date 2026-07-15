import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import StateHome, { InitialPool } from "../home";
import { parseDemoFilters, buildListingsSlug } from "../urlUtils";
import { metaFromSlug } from "@/utils/seo/meta";
import { fetchBrowseSectionData } from "../fetchBrowseSectionData";
import type { FilterState } from "../StateFilterBar";
import type { SeoV2, Listing } from "../listingShared";
import { buildFeaturedOrder } from "../listingShared";
import "../../globals.css";

export const revalidate = 86400;

type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const slugArr = slug ?? [];
  const meta = await metaFromSlug(slugArr, query);
  return slugArr.length === 0 ? meta : { title: meta.title };
}

// Reads url.csv (same logic as /api/indexed-url/route.ts) to check if a given
// path is in the curated indexed set. Cached per server instance.
let _indexedPaths: Set<string> | null = null;
function getIndexedPaths(): Set<string> {
  if (_indexedPaths) return _indexedPaths;
  try {
    const csvPath = path.join(process.cwd(), "src", "app", "url.csv");
    const raw = fs.readFileSync(csvPath, "utf-8");
    const set = new Set<string>();
    for (const line of raw.split("\n").slice(1)) {
      const url = line.split("\t")[1];
      if (url) {
        set.add(
          url
            .replace(/^https?:\/\/[^/]+/, "")
            .trim()
            .toLowerCase()
            .replace(/\/+$/, "")
        );
      }
    }
    _indexedPaths = set;
    return set;
  } catch {
    return new Set();
  }
}
function isPathIndexed(urlPath: string): boolean {
  return getIndexedPaths().has(urlPath.trim().toLowerCase().replace(/\/+$/, ""));
}

// Fetches the full pool (per_page=24) server-side with the requested seed so
// the SSR HTML and KV-cached variant contains real product listings from the
// first byte. Each variant (seed 1-7) shows different products when served.
async function fetchInitialPool(
  filters: FilterState,
  seed: number,
  canonicalPath: string
): Promise<InitialPool | null> {
  const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
  const API_KEY  = process.env.CFS_API_KEY;
  if (!API_BASE) return null;

  const indexed = isPathIndexed(canonicalPath);

  const params = new URLSearchParams();
  params.set("orderby",  "default");
  params.set("seed",     String(seed));
  params.set("per_page", "24");
  params.set("page",     "1");
  if (filters.state)             params.set("state",             String(filters.state));
  if (filters.category)          params.set("category",          String(filters.category));
  if (filters.make)              params.set("make",              String(filters.make));
  if (filters.model)             params.set("model",             String(filters.model));
  if (filters.region)            params.set("region",            String(filters.region));
  if (filters.suburb)            params.set("suburb",            String(filters.suburb));
  if (filters.pincode)           params.set("pincode",           String(filters.pincode));
  if (filters.from_price)        params.set("from_price",        String(filters.from_price));
  if (filters.to_price)          params.set("to_price",          String(filters.to_price));
  if (filters.minKg)             params.set("from_atm",          String(filters.minKg));
  if (filters.maxKg)             params.set("to_atm",            String(filters.maxKg));
  if (filters.from_sleep)        params.set("from_sleep",        String(filters.from_sleep));
  if (filters.to_sleep)          params.set("to_sleep",          String(filters.to_sleep));
  if (filters.acustom_fromyears) params.set("acustom_fromyears", String(filters.acustom_fromyears));
  if (filters.from_length)       params.set("from_length",       String(filters.from_length));
  if (filters.to_length)         params.set("to_length",         String(filters.to_length));
  if (filters.keyword) {
    const normalized = String(filters.keyword).replace(/\+/g, " ").trim().replace(/\s+/g, " ");
    if (normalized) params.set("search", normalized);
  }
  if (filters.condition) params.set("condition", String(filters.condition));

  const BASE_KEYS = new Set(["per_page", "orderby", "seed", "page"]);
  const hasRealFilter = [...params.keys()].some((k) => !BASE_KEYS.has(k));
  const url = API_BASE + "/pool_test?" + params.toString() + (hasRealFilter ? "&engine=typesense" : "");

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; CFS-SSR/1.0; +https://www.caravansforsale.com.au)",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[listings/page] fetchInitialPool non-OK:", res.status);
      return null;
    }
    const raw = await res.text();
    // Detect bot-challenge redirect (sgcaptcha / similar)
    if (raw.includes("sgcaptcha") || raw.includes("well-known") || !raw.includes("{")) {
      console.error("[listings/page] fetchInitialPool: bot-challenge detected, raw start:", raw.substring(0, 120));
      return null;
    }
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart > 0 ? raw.substring(jsonStart) : raw);

    const seo: SeoV2 | null               = json?.data?.seo_v2 ?? json?.seo_v2 ?? null;
    const products: Listing[]             = json?.data?.products ?? json?.products ?? [];
    const premiumsRaw: Listing[]          = json?.data?.premium_products ?? json?.premium_products ?? [];
    const exclusivesRaw: Listing[]        = json?.data?.exclusive_products ?? json?.exclusive_products ?? [];
    const empExclusivesRaw: Listing[]     = json?.data?.emp_exclusive_products ?? json?.emp_exclusive_products ?? [];
    const totalCount: number              = json?.data?.counts?.total_count ?? json?.counts?.total_count ?? products.length;
    const maxPages: number                = json?.pagination?.total_pages ?? 1;

    let featured: Listing[] = [];
    let newItems: Listing[]  = [];
    let usedItems: Listing[] = [];

    if (totalCount === 0 && empExclusivesRaw.length > 0) {
      featured = empExclusivesRaw.map((p) => ({ ...p, is_exclusive: true }));
    } else if (indexed) {
      const featuredSource = products.filter((p) => p.slot_bucket === "featured");
      featured = buildFeaturedOrder(featuredSource, premiumsRaw, exclusivesRaw);
      const featuredIds = new Set(featured.map((p) => p.id));
      newItems  = products.filter((p) => p.slot_bucket === "new"  && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));
      usedItems = products.filter((p) => p.slot_bucket === "used" && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));
    } else {
      featured = buildFeaturedOrder(products, premiumsRaw, exclusivesRaw);
    }

    return { seo, featured, new: newItems, used: usedItems, maxPages, isIndexed: indexed };
  } catch (e) {
    console.error("[listings/page] fetchInitialPool failed:", e);
    return null;
  }
}

export default async function LocationStateDemoPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const initialFilters = parseDemoFilters(slug ?? [], query);
  console.log("[listings/[[...slug]]/page.tsx] slug:", slug, "query:", query, "initialFilters:", initialFilters);

  const browseData = await fetchBrowseSectionData(initialFilters);

  // Seed from ?shuffle_seed=N (set by cache generator per variant), else 1.
  const rawSeed = query["shuffle_seed"];
  const seed = typeof rawSeed === "string" && /^\d+$/.test(rawSeed) ? parseInt(rawSeed, 10) : 1;

  const canonicalPath = buildListingsSlug(initialFilters);
  const initialPool = await fetchInitialPool(initialFilters, seed, canonicalPath);

  return <StateHome initialFilters={initialFilters} browseData={browseData} initialPool={initialPool} />;
}
