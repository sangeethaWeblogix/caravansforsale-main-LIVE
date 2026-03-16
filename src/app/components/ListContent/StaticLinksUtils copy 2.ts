  // ============================================================
 // FILE: staticLinksUtils.ts
 // ============================================================
 
 import { filterOptions } from "./filterOptions";
 import { buildSlugFromFilters } from "../slugBuilter";
 
 export interface Filters {
   category?: string;
   image_format?: string[];
   make?: string;
   location?: string | null;
   from_price?: string | number;
   to_price?: string | number;
   condition?: string;
   sleeps?: string;
   states?: string;
   minKg?: string | number;
   maxKg?: string | number;
   acustom_fromyears?: number | string;
   acustom_toyears?: number | string;
   from_length?: string | number;
   to_length?: string | number;
   model?: string;
   state?: string;
   region?: string;
   suburb?: string;
   pincode?: string;
   orderby?: string;
   search?: string;
   keyword?: string;
   radius_kms?: number | string;
   from_sleep?: string | number;
   to_sleep?: string | number;
   type?: string;
 }
 
 export const SECTION_TITLES: Record<string, string> = {
   home: "",
     all: " ",
 
   categories: "Browse by Category",
   states: "Browse by State",
   regions: "Browse by Region",
     suburbs: "Browse by Suburb",
 makes: "Browse by Make",
   models: "Browse by Model",
   prices: "Browse by Price",
   atm: "Browse by ATM",
   sleep: "Browse by Sleeping Capacity",
   length: "Browse by Length",
   conditions: "Browse by Condition",
   
   years: "Browse by Year",
 };
 
 // ── Name Formatters ──────────────────────────────────────────
 
 function formatCategoryName(name: string): string {
   if (name.toLowerCase().includes("caravan")) return name;
   return `${name} Caravans for Sale`;
 }
 
 function formatPriceName(name: string): string {
   const lower = name.toLowerCase();
   if (lower.startsWith("under")) {
     const amount = name.replace(/under\s*/i, "").trim();
     return `Caravans Under ${amount} in Australia`;
   }
   if (lower.startsWith("over")) {
     const amount = name.replace(/over\s*/i, "").trim();
     return `Caravans Over ${amount} in Australia`;
   }
   if (lower.startsWith("between")) {
     const range = name
       .replace(/between\s*/i, "")
       .replace(" - ", " to ")
       .trim();
     return `Caravans between ${range} in Australia`;
   }
   return name;
 }
 
 function formatAtmName(name: string): string {
   const lower = name.toLowerCase();
   if (lower.startsWith("under")) {
     const val = name.replace(/under\s*/i, "").trim();
     return `Caravans under ${val} ATM in Australia`;
   }
   if (lower.startsWith("over")) {
     const val = name.replace(/over\s*/i, "").trim();
     return `Caravans over ${val} ATM in Australia`;
   }
   if (name.includes("-")) {
     const range = name.replace(" - ", " to ").trim();
     return `Caravans between ${range} ATM in Australia`;
   }
   return name;
 }
 
  function formatLengthName(name: string): string {
   const lower = name.toLowerCase();
 
   // "Under 12ft" → "Caravans under 12ft in Australia"
   if (lower.startsWith("under")) {
     const val = name.replace(/under\s*/i, "").trim();
     return `Caravans under ${val} in Australia`;
   }
 
   // "Over 24ft" → "Caravans over 24ft in Australia"
   if (lower.startsWith("over")) {
     const val = name.replace(/over\s*/i, "").trim();
     return `Caravans over ${val} in Australia`;
   }
 
   // "15ft to 17ft" → "Caravans between 15ft to 17ft in Australia"
   if (lower.includes("ft")) {
     return `Caravans between ${name} in Australia`;
   }
 
   return name;
 }
 
 function formatSleepName(name: string): string {
   const lower = name.toLowerCase();
   if (lower.startsWith("under")) {
     const val = name.replace(/under\s*/i, "").trim();
     return `Caravans under ${val} berth in Australia`;
   }
   if (lower.startsWith("over")) {
     const val = name.replace(/over\s*/i, "").trim();
     return `Caravans over ${val} berth in Australia`;
   }
   if (name.includes("-")) {
     const range = name.replace(" - ", " to ").trim();
     return `Caravans between ${range} berth in Australia`;
   }
   return name;
 }
 
 // ── Helpers ──────────────────────────────────────────────────
 
 const buildFilters = (f: Filters): string => {
   const result = buildSlugFromFilters(f);
   return result.endsWith("/") ? result : `${result}/`;
 };
 
 /** Nearest price link from filterOptions based on current price filter */
  function getNearestPriceLink(
   filters: Filters,
 ): { name: string; slug: string } | null {
   const from = filters.from_price ? Number(filters.from_price) : null;
   const to = filters.to_price ? Number(filters.to_price) : null;
 
   if (!from && !to) return null;
 
   // Extract numeric bounds from each price option slug
   // slug format: /under-20000/ → [0, 20000]
   //              /between-20000-30000/ → [20000, 30000]
   //              /over-200000/ → [200000, Infinity]
   const parsedOptions = filterOptions.price.map((p) => {
     const slug = p.slug.replace(/\//g, "");
     const nums = slug.match(/\d+/g)?.map(Number) ?? [];
     let lower = 0;
     let upper = Infinity;
 
     if (slug.startsWith("under") && nums.length >= 1) {
       lower = 0;
       upper = nums[0];
     } else if (slug.startsWith("over") && nums.length >= 1) {
       lower = nums[0];
       upper = Infinity;
     } else if (slug.startsWith("between") && nums.length >= 2) {
       lower = nums[0];
       upper = nums[1];
     }
 
     return { ...p, lower, upper };
   });
 
   // Case 1: only "from" (e.g. over 50000)
   // → find bucket whose UPPER bound is closest to / just >= from
   // → e.g. from=50000 → between 40000-50000 (upper=50000 matches exactly)
   if (from && !to) {
     // exact upper match first
     const exact = parsedOptions.find((p) => p.upper === from);
     if (exact) return { name: exact.name, slug: exact.slug };
 
     // find bucket where lower <= from <= upper
     const contains = parsedOptions.find(
       (p) => p.lower <= from && from <= p.upper,
     );
     if (contains) return { name: contains.name, slug: contains.slug };
 
     // fallback: bucket with largest upper < from
     const below = parsedOptions
       .filter((p) => p.upper < from && p.upper !== Infinity)
       .sort((a, b) => b.upper - a.upper)[0];
     if (below) return { name: below.name, slug: below.slug };
   }
 
   // Case 2: only "to" (e.g. under 60000)
   // → find bucket whose range CONTAINS "to"
   // → e.g. to=60000 → between 50000-70000 (50000 <= 60000 <= 70000)
   if (!from && to) {
     // exact lower match
     const exact = parsedOptions.find((p) => p.lower === to);
     if (exact) return { name: exact.name, slug: exact.slug };
 
     // bucket that contains "to"
     const contains = parsedOptions.find(
       (p) => p.lower <= to && to <= p.upper,
     );
     if (contains) return { name: contains.name, slug: contains.slug };
 
     // fallback: bucket with smallest lower > to
     const above = parsedOptions
       .filter((p) => p.lower > to)
       .sort((a, b) => a.lower - b.lower)[0];
     if (above) return { name: above.name, slug: above.slug };
   }
 
   // Case 3: both from + to (e.g. between 50000-80000)
   // → find bucket whose range best covers the upper bound (to)
   // → e.g. to=80000 → between 70000-100000 (70000 <= 80000 <= 100000)
   if (from && to) {
     // bucket that contains "to"
     const contains = parsedOptions.find(
       (p) => p.lower <= to && to <= p.upper,
     );
     if (contains) return { name: contains.name, slug: contains.slug };
 
     // fallback: bucket with largest upper <= to
     const below = parsedOptions
       .filter((p) => p.upper <= to && p.upper !== Infinity)
       .sort((a, b) => b.upper - a.upper)[0];
     if (below) return { name: below.name, slug: below.slug };
 
     // fallback: bucket with smallest lower >= from
     const above = parsedOptions
       .filter((p) => p.lower >= from)
       .sort((a, b) => a.lower - b.lower)[0];
     if (above) return { name: above.name, slug: above.slug };
   }
 
   return parsedOptions[0] ?? null;
 }
 
  // ── Replace entire findRangeBucket with new per-type functions ──
 
 function findNearestBucket(
   options: { name: string; slug: string; value: string }[],
   from: number | null,
   to: number | null,
 ): { name: string; slug: string } | null {
   if (!from && !to) return null;
 
   // Parse each option into lower/upper bounds using value field
   // value: "1500"       → under/over bucket
   // value: "1500-2500"  → between bucket
   // Determine under/over by checking slug
   const parsedOptions = options.map((o) => {
     const slugLc = o.slug.replace(/\//g, "").toLowerCase();
     const nums = o.value.split("-").map(Number);
     let lower = 0;
     let upper = Infinity;
 
     if (slugLc.startsWith("under") && nums.length === 1) {
       lower = 0;
       upper = nums[0];
     } else if (slugLc.startsWith("over") && nums.length === 1) {
       lower = nums[0];
       upper = Infinity;
     } else if (nums.length === 2) {
       lower = nums[0];
       upper = nums[1];
     }
 
     return { ...o, lower, upper };
   });
 
   // Case 1: only "from" (e.g. over 1500kg, from_length=15)
   // → find bucket whose UPPER bound matches exactly OR contains "from"
   if (from && !to) {
     // exact upper match
     const exact = parsedOptions.find((p) => p.upper === from);
     if (exact) return { name: exact.name, slug: exact.slug };
 
     // bucket that contains "from"
     const contains = parsedOptions.find(
       (p) => p.lower <= from && from <= p.upper,
     );
     if (contains) return { name: contains.name, slug: contains.slug };
 
     // fallback: bucket with largest upper < from
     const below = parsedOptions
       .filter((p) => p.upper < from && p.upper !== Infinity)
       .sort((a, b) => b.upper - a.upper)[0];
     if (below) return { name: below.name, slug: below.slug };
   }
 
   // Case 2: only "to" (e.g. under 2500kg, to_length=20)
   // → find bucket whose range CONTAINS "to"
   if (!from && to) {
     // exact lower match
     const exact = parsedOptions.find((p) => p.lower === to);
     if (exact) return { name: exact.name, slug: exact.slug };
 
     // bucket that contains "to"
     const contains = parsedOptions.find(
       (p) => p.lower <= to && to <= p.upper,
     );
     if (contains) return { name: contains.name, slug: contains.slug };
 
     // fallback: smallest lower > to
     const above = parsedOptions
       .filter((p) => p.lower > to)
       .sort((a, b) => a.lower - b.lower)[0];
     if (above) return { name: above.name, slug: above.slug };
   }
 
   // Case 3: both from + to (e.g. between 1500-3000kg)
   // → find bucket whose range best covers the upper bound (to)
   if (from && to) {
     // bucket that contains "to"
     const contains = parsedOptions.find(
       (p) => p.lower <= to && to <= p.upper,
     );
     if (contains) return { name: contains.name, slug: contains.slug };
 
     // fallback: largest upper <= to
     const below = parsedOptions
       .filter((p) => p.upper <= to && p.upper !== Infinity)
       .sort((a, b) => b.upper - a.upper)[0];
     if (below) return { name: below.name, slug: below.slug };
 
     // fallback: smallest lower >= from
     const above = parsedOptions
       .filter((p) => p.lower >= from)
       .sort((a, b) => a.lower - b.lower)[0];
     if (above) return { name: above.name, slug: above.slug };
   }
 
   return parsedOptions[0] ?? null;
 }
 
 /** ATM link */
 function getNearestAtmLink(
   filters: Filters,
 ): { name: string; slug: string } | null {
   const from = filters.minKg ? Number(filters.minKg) : null;
   const to = filters.maxKg ? Number(filters.maxKg) : null;
   return findNearestBucket(filterOptions.atm, from, to);
 }
 
 /** Length link */
  // ── Length only — separate bucket logic ──────────────────────
 function findLengthBucket(
   options: { name: string; slug: string; value: string }[],
   from: number | null,
   to: number | null,
 ): { name: string; slug: string } | null {
   if (!from && !to) return null;
 
   const parsedOptions = options.map((o) => {
     const slugLc = o.slug.replace(/\//g, "").toLowerCase();
     const nums = o.value.split("-").map(Number);
     let lower = 0;
     let upper = Infinity;
 
     if (slugLc.startsWith("under") && nums.length === 1) {
       lower = 0;
       upper = nums[0];
     } else if (slugLc.startsWith("over") && nums.length === 1) {
       lower = nums[0];
       upper = Infinity;
     } else if (nums.length === 2) {
       lower = nums[0];
       upper = nums[1];
     }
 
     return { ...o, lower, upper };
   });
 
   // Case 1: only "from" (under X = products above X)
   // → find bucket that contains "from" or just above
   if (from && !to) {
     const contains = parsedOptions.find(
       (p) => p.lower <= from && from <= p.upper,
     );
     if (contains) return { name: contains.name, slug: contains.slug };
 
     const above = parsedOptions
       .filter((p) => p.lower >= from)
       .sort((a, b) => a.lower - b.lower)[0];
     if (above) return { name: above.name, slug: above.slug };
   }
 
   // Case 2: only "to" (over X = products below X)
   // → find bucket whose upper is strictly <= to
   if (!from && to) {
     const below = parsedOptions
       .filter((p) => p.upper <= to && p.upper !== Infinity)
       .sort((a, b) => b.upper - a.upper)[0];
     if (below) return { name: below.name, slug: below.slug };
 
     return parsedOptions[0] ?? null;
   }
 
   // Case 3: both from + to
   // → find bucket that contains "to"
   if (from && to) {
     const contains = parsedOptions.find(
       (p) => p.lower <= to && to <= p.upper,
     );
     if (contains) return { name: contains.name, slug: contains.slug };
 
     const below = parsedOptions
       .filter((p) => p.upper <= to && p.upper !== Infinity)
       .sort((a, b) => b.upper - a.upper)[0];
     if (below) return { name: below.name, slug: below.slug };
   }
 
   return parsedOptions[0] ?? null;
 }
 
 /** Length link — uses separate logic, ATM untouched */
 function getNearestLengthLink(
   filters: Filters,
 ): { name: string; slug: string } | null {
   const from = filters.from_length ? Number(filters.from_length) : null;
   const to = filters.to_length ? Number(filters.to_length) : null;
   return findLengthBucket(filterOptions.length, from, to); // ← findLengthBucket, not findNearestBucket
 }
 
 /** Sleep link */
 function getNearestSleepLink(
   filters: Filters,
 ): { name: string; slug: string } | null {
   const from = filters.from_sleep ? Number(filters.from_sleep) : null;
   const to = filters.to_sleep ? Number(filters.to_sleep) : null;
   return findNearestBucket(filterOptions.sleep, from, to);
 }
 
 // ── Main buildStaticLinks ────────────────────────────────────
 export function buildStaticLinks(
   filters: Filters,
 ): Record<string, { name: string; slug: string }[]> {
   const links: Record<string, { name: string; slug: string }[]> = {};
 
   const hasState = Boolean(filters.state);
   const hasRegion = Boolean(filters.region);
   const hasSuburb = Boolean(filters.suburb);
   const hasCategory = Boolean(filters.category);
   const hasPrice = Boolean(filters.from_price || filters.to_price);
   const hasAtm = Boolean(filters.minKg || filters.maxKg);
   const hasLength = Boolean(filters.from_length || filters.to_length);
   const hasSleep = Boolean(filters.from_sleep || filters.to_sleep);
   const hasMake = Boolean(filters.make);
   const hasModel = Boolean(filters.model);
   const hasCondition = Boolean(filters.condition);
   const hasYear = Boolean(filters.acustom_fromyears || filters.acustom_toyears);
 
   const activeFilters = [
     hasState || hasRegion || hasSuburb,
     hasCategory,
     hasPrice,
     hasAtm,
     hasLength,
     hasSleep,
     hasMake,
   ].filter(Boolean).length;
 
   const conditionOrYearOnly = (hasCondition || hasYear) && activeFilters === 0;
 
   const effectiveCount = conditionOrYearOnly
     ? 1
     : hasCondition || hasYear
       ? activeFilters + 1
       : activeFilters;
 
   links.home = [{ name: "Caravans for Sale", slug: "/" }];
 
   if (effectiveCount === 0) {
     links.home = [{ name: "Caravans for Sale", slug: "/" }];
     return links;
   }
 
   if (effectiveCount === 1) {
         links.all = [{ name: "Browse by All Caravans", slug: "/listings/" }];
 
     if (hasMake && hasModel) {
       links.makes = [
         { name: filters.make!, slug: `/${filters.make!.toLowerCase()}/` },
       ];
     }
     return links;
   }
   links.all = [{ name: "Browse by All Caravans", slug: "/listings/" }];
 
   // ── Category ─────────────────────────────────────────────
   if (hasCategory) {
     const cat = filterOptions.categories.find((c) =>
       c.slug.includes(filters.category?.toLowerCase() ?? ""),
     );
     if (cat) {
       links.categories = [{ ...cat, name: formatCategoryName(cat.name) }];
     }
   }
 
   // ── Make / Model ─────────────────────────────────────────
   if (hasMake) {
     links.makes = [
       { name: filters.make!, slug: `/${filters.make!.toLowerCase()}/` },
     ];
   }
   if (hasMake && hasModel) {
     links.models = [
       {
         name: filters.model!,
         slug: `/${filters.make!.toLowerCase()}/${filters.model!.toLowerCase()}/`,
       },
     ];
   }
 
   // ── Location ─────────────────────────────────────────────
   if (hasSuburb && hasRegion && hasState) {
     const stateEntryS = filterOptions.location.state.find(
       (s) => s.name.toLowerCase() === filters.state?.toLowerCase(),
     );
     if (stateEntryS) {
       links.states = [{
         name: `Caravans for Sale in ${stateEntryS.name}`,
         slug: stateEntryS.slug,
       }];
     }
     const regionEntryS = stateEntryS?.region?.find(
       (r) => r.name.toLowerCase() === filters.region?.toLowerCase(),
     );
     if (regionEntryS) {
       const statePart = filters.state!.toLowerCase().replace(/ /g, "-");
       const regionPart = filters.region!.toLowerCase().replace(/ /g, "-");
       links.regions = [{
         name: `Caravans for Sale in ${regionEntryS.name} Region`,
         slug: `/${statePart}-state/${regionPart}-region/`,
       }];
     }
     links.suburbs = [{
       name: `Caravans for Sale in ${filters.suburb!}`,
       slug: `/${filters.state!.toLowerCase()}-state/${filters.region!.toLowerCase()}-region/${filters.suburb!.toLowerCase()}-${filters.pincode}-suburb/`,
     }];
   } else if (hasRegion && hasState) {
     const stateEntry = filterOptions.location.state.find(
       (s) => s.name.toLowerCase() === filters.state?.toLowerCase(),
     );
     if (stateEntry) {
       links.states = [{
         name: `Caravans for Sale in ${stateEntry.name}`,
         slug: stateEntry.slug,
       }];
     }
     const regionEntry = stateEntry?.region?.find(
       (r) => r.name.toLowerCase() === filters.region?.toLowerCase(),
     );
     if (regionEntry) {
       const statePart = filters.state!.toLowerCase().replace(/ /g, "-");
       const regionPart = filters.region!.toLowerCase().replace(/ /g, "-");
       links.regions = [{
         name: `Caravans for Sale in ${regionEntry.name} Region`,
         slug: `/${statePart}-state/${regionPart}-region/`,
       }];
     }
   } else if (hasState) {
     const stateEntry = filterOptions.location.state.find(
       (s) => s.name.toLowerCase() === filters.state?.toLowerCase(),
     );
     if (stateEntry) {
       links.states = [{
         name: `Caravans for Sale in ${stateEntry.name}`,
         slug: stateEntry.slug,
       }];
     }
   }
 
   // ── Price ─────────────────────────────────────────────────
   if (hasPrice) {
     const priceLink = getNearestPriceLink(filters);
     if (priceLink) {
       links.prices = [{ ...priceLink, name: formatPriceName(priceLink.name) }];
     }
   }
 
   // ── ATM ───────────────────────────────────────────────────
   if (hasAtm) {
     const atmLink = getNearestAtmLink(filters);
     if (atmLink) {
       links.atm = [{ ...atmLink, name: formatAtmName(atmLink.name) }];
     }
   }
 
   // ── Length ────────────────────────────────────────────────
   if (hasLength) {
     const lengthLink = getNearestLengthLink(filters);
     if (lengthLink) {
       links.length = [{ ...lengthLink, name: formatLengthName(lengthLink.name) }];
     }
   }
 
   // ── Sleep ─────────────────────────────────────────────────
   if (hasSleep) {
     const sleepLink = getNearestSleepLink(filters);
     if (sleepLink) {
       links.sleep = [{ ...sleepLink, name: formatSleepName(sleepLink.name) }];
     }
   }
 
   // ── Condition ─────────────────────────────────────────────
   if (hasCondition && activeFilters >= 1) {
     const conditionSlug = `/${filters.condition!.toLowerCase()}-condition/`;
     links.conditions = [{ name: filters.condition!, slug: conditionSlug }];
   }
 
   // ── Year ──────────────────────────────────────────────────
   if (hasYear && activeFilters >= 1) {
     const year = filters.acustom_fromyears ?? filters.acustom_toyears;
     links.years = [{ name: `${year}`, slug: `/${year}-caravans-range/` }];
   }
 
    return links;
 }
 
 // ── URL builder ──────────────────────────────────────────────
 export function buildStaticLinkUrl(
   type: string,
   slug: string,
   currentFilters: Filters,
 ): string {
   if (type === "home") return "/";
   if (type === "all") return "/listings/";
   if (type === "categories") return slug;
   if (type === "makes") return slug;
   if (type === "models") return slug;
   if (type === "states") return slug;
   if (type === "regions") return slug;
   if (type === "suburbs") return slug;
   if (type === "prices") return slug;
   if (type === "atm") return slug;
   if (type === "length") return slug;
   if (type === "sleep") return slug;
   if (type === "conditions") return slug;
   if (type === "years") return slug;
   return slug;
 }