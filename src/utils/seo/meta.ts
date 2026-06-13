import { fetchListings } from "@/api/listings/api";
import { fetchModelCounts } from "@/api/productList/api";
import { parseSlugToFilters } from "@/app/components/urlBuilder";
import type { Metadata } from "next";
import extraIndexedData from "../../../cfs-paths/extra-indexed.json";

const EXTRA_INDEXED_PATHS = new Set<string>(extraIndexedData.paths);

// ─── Ordered allowed bands (low → high) ───

const PRICE_BANDS_ORDERED = [
  "under-20000",
  "between-20000-30000",
  "between-30000-40000",
  "between-40000-50000",
  "between-50000-70000",
  "between-70000-100000",
  "between-100000-150000",
  "between-150000-200000",
  "over-200000",
];

const ATM_BANDS_ORDERED = [
  "under-1500-kg-atm",
  "between-1500-kg-2500-kg-atm",
  "between-2500-kg-3500-kg-atm",
  "between-3500-kg-4500-kg-atm",
  "over-4500-kg-atm",
];

const SLEEP_BANDS_ORDERED = [
  "between-1-2-people-sleeping-capacity",
  "between-3-4-people-sleeping-capacity",
  "between-4-6-people-sleeping-capacity",
  "over-6-people-sleeping-capacity",
];

const LENGTH_BANDS_ORDERED = [
  "under-12-length-in-feet",
  "between-12-14-length-in-feet",
  "between-15-17-length-in-feet",
  "between-18-20-length-in-feet",
  "between-21-23-length-in-feet",
  "over-24-length-in-feet",
];

const ALLOWED_PRICE_BANDS  = new Set(PRICE_BANDS_ORDERED);
const ALLOWED_ATM_BANDS    = new Set(ATM_BANDS_ORDERED);
const ALLOWED_SLEEP_BANDS  = new Set(SLEEP_BANDS_ORDERED);
const ALLOWED_LENGTH_BANDS = new Set(LENGTH_BANDS_ORDERED);

// ─── Extract all numbers from a slug ───
function allNumbers(slug: string): number[] {
  return (slug.match(/\d+/g) || []).map(Number);
}

// ─── Upper bound of a slug (the value a user is "up to") ───
// "under-40000"               → 40000
// "between-20000-30000"       → 30000
// "over-200000"               → Infinity
// "under-1500-kg-atm"         → 1500
// "between-1500-kg-2500-kg"   → 2500
// "over-4500-kg-atm"          → Infinity
// "under-12-length-in-feet"   → 12
// "between-12-14-length-in-feet" → 14
// "over-24-length-in-feet"    → Infinity
function upperBound(slug: string): number {
  if (slug.startsWith("over-")) return Infinity;
  const nums = allNumbers(slug);
  return nums.length > 0 ? Math.max(...nums) : Infinity;
}

// ─── Lower bound of a slug ───
// "under-X"       → 0
// "between-X-Y"   → X (first / min number)
// "over-X"        → X
function lowerBound(slug: string): number {
  if (slug.startsWith("under-")) return 0;
  const nums = allNumbers(slug);
  return nums.length > 0 ? Math.min(...nums) : 0;
}

/**
 * Given a non-allowed band slug, find the best matching allowed band.
 *
 * Strategy by slug type:
 *
 * ── over-X (e.g. over-70000) ──
 *   X is the lower bound the user typed.
 *   Find the allowed band whose lowerBound == X first.
 *   If not found, find the band that contains X (lo < X <= hi).
 *   Falls back to highest band.
 *
 *   over-70000  → between-70000-100000  ✅  (lo=70000 exact match)
 *   over-300000 → over-200000           ✅  (highest band fallback)
 *
 * ── under-X / between-X-Y ──
 *   Use upperBound as the target.
 *   Find the allowed band whose range contains the target (lo < target <= hi).
 *
 *   under-40000        → between-30000-40000  ✅  (target=40000, 30000<40000<=40000)
 *   under-10000        → under-20000          ✅  (target=10000, 0<10000<=20000)
 *   between-25000-28000 → between-20000-30000 ✅  (target=28000, 20000<28000<=30000)
 */
function nearestAllowedBand(slug: string, orderedBands: string[]): string {
  // ── over-X: match by lower bound ──
  if (slug.startsWith("over-")) {
    const x = lowerBound(slug); // the number after "over-"

    // 1. Exact lower-bound match
    const exact = orderedBands.find(b => lowerBound(b) === x);
    if (exact) return exact;

    // 2. Band that contains X  (lo < x <= hi)
    for (let i = 0; i < orderedBands.length; i++) {
      const lo = lowerBound(orderedBands[i]);
      const hi = upperBound(orderedBands[i]);
      if (x > lo && x <= hi) return orderedBands[i];
    }

    // 3. Fallback: highest band
    return orderedBands[orderedBands.length - 1];
  }

  // ── under-X / between-X-Y: match by upper bound ──
  const target = upperBound(slug);

  // Pass 1: exact range match — lo < target <= hi
  for (let i = 0; i < orderedBands.length; i++) {
    const lo = lowerBound(orderedBands[i]);
    const hi = upperBound(orderedBands[i]);
    if (target > lo && target <= hi) return orderedBands[i];
  }

  // Pass 2: target sits just above a band's hi (e.g. under-18 → hi=17 for between-15-17)
  // Find the band with the largest hi that is still < target
  let bestIdx = -1;
  let bestHi = -1;
  for (let i = 0; i < orderedBands.length; i++) {
    const hi = upperBound(orderedBands[i]);
    if (hi !== Infinity && hi < target && hi > bestHi) {
      bestHi = hi;
      bestIdx = i;
    }
  }
  if (bestIdx !== -1) return orderedBands[bestIdx];

  // Fallback: lowest band
  return orderedBands[0];
}

// ─── Detect band type for a slug segment ───
function isPriceLike(s: string): boolean {
  return /^(under|over)-\d+$/.test(s) || /^between-\d+-\d+$/.test(s);
}
function isAtmLike(s: string): boolean {
  return s.includes("-kg-atm");
}
function isSleepLike(s: string): boolean {
  return s.includes("-people-sleeping-capacity");
}
function isLengthLike(s: string): boolean {
  return s.includes("-length-in-feet");
}

// ─── Band resolution result ───
type BandResult =
  | { hasBand: false }
  | { hasBand: true; slug: string; allowed: boolean; canonical: string };

function resolveBand(
  slugSegments: string[],
  BASE_URL: string
): BandResult {
  const priceSlug  = slugSegments.find(isPriceLike);
  const atmSlug    = slugSegments.find(isAtmLike);
  const sleepSlug  = slugSegments.find(isSleepLike);
  const lengthSlug = slugSegments.find(isLengthLike);

  const bandSlug   = priceSlug ?? atmSlug ?? sleepSlug ?? lengthSlug;
  if (!bandSlug) return { hasBand: false };

  // Determine allowed set + ordered list for this band type
  let allowed = false;
  let resolved = bandSlug; // the canonical band slug to use

  if (priceSlug) {
    allowed = ALLOWED_PRICE_BANDS.has(priceSlug);
    if (!allowed) resolved = nearestAllowedBand(priceSlug, PRICE_BANDS_ORDERED);
  } else if (atmSlug) {
    allowed = ALLOWED_ATM_BANDS.has(atmSlug);
    if (!allowed) resolved = nearestAllowedBand(atmSlug, ATM_BANDS_ORDERED);
  } else if (sleepSlug) {
    allowed = ALLOWED_SLEEP_BANDS.has(sleepSlug);
    if (!allowed) resolved = nearestAllowedBand(sleepSlug, SLEEP_BANDS_ORDERED);
  } else if (lengthSlug) {
    allowed = ALLOWED_LENGTH_BANDS.has(lengthSlug);
    if (!allowed) resolved = nearestAllowedBand(lengthSlug, LENGTH_BANDS_ORDERED);
  }

  // Build canonical URL using the resolved (allowed) band slug
  const canonicalBand = `${BASE_URL}/listings/${resolved}/`;

  return { hasBand: true, slug: bandSlug, allowed, canonical: canonicalBand };
}

// ─── Main robots function ───
function getRobotsFromFilters(
  parsed: ReturnType<typeof parseSlugToFilters>,
  slugSegments: string[] = [],
  BASE_URL: string
): { index: boolean; overrideCanonical?: string } {
  const noindex = { index: false };
  const index   = { index: true };

  // ── Always noindex regardless of other filters ──
  if (parsed.suburb)            return noindex;
  if (parsed.condition)         return noindex;
  if (parsed.acustom_fromyears) return noindex;
  if (parsed.search ?? parsed.keyword) {
    const hasOtherFilters = !!(
      parsed.state    ||
      parsed.make     ||
      parsed.category ||
      parsed.model    ||
      resolveBand(slugSegments, BASE_URL).hasBand
    );
    return hasOtherFilters ? noindex : index;
  }

  // ── Static whitelist: 406 extra indexed paths ──
  const slugPath = slugSegments.join("/") + (slugSegments.length > 0 ? "/" : "");
  if (EXTRA_INDEXED_PATHS.has(slugPath)) return index;

  // ── Band pages (weight / price / sleep / length) ──
  const band = resolveBand(slugSegments, BASE_URL);
  if (band.hasBand) {
    const hasOtherFilters = !!(parsed.make || parsed.model || parsed.state || parsed.region || parsed.category);
    if (hasOtherFilters) return noindex; // band + anything else → noindex
    return index;                        // any single band page → index ✅
  }

  // ── Non-band pages: explicit whitelist ──
  const hasMake   = !!parsed.make;
  const hasModel  = !!parsed.model;
  const hasState  = !!parsed.state;
  const hasRegion = !!parsed.region;
  const hasCat    = !!parsed.category;
  const dims      = [hasMake, hasModel, hasState, hasRegion, hasCat].filter(Boolean).length;

  // Single filter → index
  if (dims === 1) return index; // state | region | category | make (model alone not a real URL)

  // Make + Model (specific model page) → index
  if (dims === 2 && hasMake && hasModel) return index;

  // Category + State → index
  if (dims === 2 && hasCat && hasState && !hasRegion) return index;

  // State + Region → index
  if (dims === 2 && hasState && hasRegion && !hasCat) return index;

  // Category + State + Region → index
  if (dims === 3 && hasCat && hasState && hasRegion) return index;

  // Everything else → noindex
  return noindex;
}

export async function metaFromSlug(
  filters: string[] = [],
  searchParams: Record<string, string | string[] | undefined> = {}
): Promise<Metadata> {
  const BASE_URL = "https://www.caravansforsale.com.au";

  const parsed = parseSlugToFilters(filters, searchParams);
  
  const slugPath = filters.length > 0 ? filters.join("/") : "";
  const canonicalUrl = `${BASE_URL}/listings/${slugPath ? slugPath + "/" : ""}`;
  const robotsResult = getRobotsFromFilters(parsed, filters, BASE_URL);
  const canonical = robotsResult.overrideCanonical ?? canonicalUrl;

  // ── fetchListings — error வந்தாலும் robots return பண்ணு ──
  let res: any = null;
  try {
    const page = parsed.page ? Number(parsed.page) : 1;
    let resolvedParsed = parsed;
    if (parsed.model && parsed.make) {
      const modelCounts = await fetchModelCounts(parsed.make);
      const matched = modelCounts.find(
        (m) =>
          m.slug === parsed.model ||
          m.slug.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") === parsed.model
      );
      if (matched) resolvedParsed = { ...parsed, model: matched.slug };
    }
    const finalFilters = { ...resolvedParsed, page };
    res = await fetchListings(finalFilters);
  } catch (e) {
    console.error("❌ fetchListings error in metaFromSlug:", e);
    // API fail ஆனாலும் robots tag கண்டிப்பா return ஆகும்
    return {
      title: { absolute: "Caravans for Sale in Australia - Find Exclusive Deals" },
      robots: { index: robotsResult.index },
      verification: { google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo" },
      alternates: { canonical, languages: {}, media: {} },
      openGraph: {
        images: [
          {
            url: "https://www.caravansforsale.com.au/images/cfs-logo.png",
            width: 800,
            height: 600,
            alt: "Caravans for Sale Australia",
          },
        ],
      },
    };
  }

  // ── suburb canonical fix ──
  let finalCanonical = canonical;
  if (parsed.suburb) {
    const locationSegments = filters.filter(
      (seg) =>
        seg.endsWith("-state") ||
        seg.endsWith("-region") ||
        seg.endsWith("-suburb")
    );
    finalCanonical = `${BASE_URL}/listings/${locationSegments.join("/")}/`;
  }


  // const page = parsed.page ? Number(parsed.page) : 1;
  // const finalFilters = { ...parsed, page };

  // const res = await fetchListings(finalFilters);

  // // ─── Build canonical from slug + searchParams ───
  // let canonicalUrl = "";

  // if (parsed.suburb) {
  //   const locationSegments = filters.filter(
  //     (seg) =>
  //       seg.endsWith("-state") ||
  //       seg.endsWith("-region") ||
  //       seg.endsWith("-suburb")
  //   );
  //   canonicalUrl = `${BASE_URL}/listings/${locationSegments.join("/")}/`;
  // } else {
  //   const slugPath = filters.length > 0 ? filters.join("/") : "";
  //   canonicalUrl = `${BASE_URL}/listings/${slugPath ? slugPath + "/" : ""}`;
  // }

  // Append searchParams (except page=1)
   const spEntries = Object.entries(searchParams).filter(([k, v]) => {
    if (k === "page" && String(v) === "1") return false;
     if (k === "shuffle_seed") return false; // ← ADD THIS
    return true;
  });
  if (spEntries.length > 0) {
    const qs = spEntries
      .map(([k, v]) => `${k}=${Array.isArray(v) ? v[0] : v}`)
      .join("&");
    finalCanonical += `?${qs}`;
  }

 

  const rawTitle =
    res?.seo_v2?.meta_title?.trim() ||
    "Caravans for Sale in Australia - Find Exclusive Deals";
  const title = rawTitle.trim();
  // const description = res?.seo_v2?.meta_description?.trim();
  const description =  "Browse caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.";

  const hasProducts = (res?.pagination?.total_products ?? 1) > 0;

  return {
    title: { absolute: title },
    description,
    robots: { index: robotsResult.index && hasProducts },
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo",
    },
    alternates: { canonical: finalCanonical, languages: {}, media: {} },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [
        {
          url: "https://www.caravansforsale.com.au/images/cfs-logo.png",
          width: 800,
          height: 600,
          alt: "Caravans for Sale Australia",
        },
      ],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}