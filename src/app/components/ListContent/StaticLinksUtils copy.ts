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
  categories: "Browse by Category",
  states: "Browse by State",
  regions: "Browse by Region",
  prices: "Browse by Price",
  atm: "Browse by ATM Weight",
  sleep: "Browse by Sleeping Capacity",
  length: "Browse by Length",
  conditions: "Browse by Condition",
  makes: "Browse by Make",
  models: "Browse by Model",
  suburbs: "Browse by Suburb",
  all: " ",
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
  if (lower.startsWith("under")) {
    const val = name.replace(/under\s*/i, "").trim();
    return `Caravans under ${val} in Australia`;
  }
  if (lower.startsWith("over")) {
    const val = name.replace(/over\s*/i, "").trim();
    return `Caravans over ${val} in Australia`;
  }
  if (name.includes("-")) {
    const range = name.replace(" - ", " to ").trim();
    return `Caravans between ${range} in Australia`;
  }
  return name;
}

function formatSleepName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.startsWith("under")) {
    const val = name.replace(/under\s*/i, "").trim();
    return `Caravans under ${val} in Australia`;
  }
  if (lower.startsWith("over")) {
    const val = name.replace(/over\s*/i, "").trim();
    return `Caravans over ${val} in Australia`;
  }
  if (name.includes("-")) {
    const range = name.replace(" - ", " to ").trim();
    return `Caravans between ${range} in Australia`;
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
  const type = filters.type;

  if (!from && !to) return null;

  const match = filterOptions.price.find((p) => {
    const slug = p.slug.replace(/\//g, "");
    const nums = slug.match(/\d+/g)?.map(Number) ?? [];
    if (type === "under" && slug.startsWith("under")) return nums[0] === from;
    if (type === "over" && slug.startsWith("over")) return nums[0] === from;
    if (to && slug.startsWith("between") && nums.length >= 2) {
      return nums[0] === from && nums[1] === to;
    }
    if (to && slug.startsWith("over")) return nums[0] === to;
    return false;
  });

  if (!match) {
    const value = to || from || 0;
    const closest = filterOptions.price.reduce((prev, curr) => {
      const pNums =
        prev.slug.replace(/\//g, "").match(/\d+/g)?.map(Number) ?? [];
      const cNums =
        curr.slug.replace(/\//g, "").match(/\d+/g)?.map(Number) ?? [];
      const pVal = pNums[0] ?? 0;
      const cVal = cNums[0] ?? 0;
      return Math.abs(cVal - value) < Math.abs(pVal - value) ? curr : prev;
    });
    return closest;
  }

  return match;
}

function findRangeBucket(
  options: { name: string; slug: string; value: string }[],
  minVal: number | null,
  maxVal: number | null,
): { name: string; slug: string } | null {
  if (!minVal && !maxVal) return null;

  const slugLc = (o: { slug: string }) =>
    o.slug.replace(/\//g, "").toLowerCase();

  if (minVal && !maxVal) {
    for (const o of options) {
      const nums = o.value.split("-").map(Number);
      if (nums.length === 1 && slugLc(o).startsWith("over")) {
        if (minVal >= nums[0]) return o;
      }
    }
    for (const o of options) {
      const nums = o.value.split("-").map(Number);
      if (nums.length === 1 && slugLc(o).startsWith("under")) {
        if (minVal < nums[0]) return o;
      }
    }
    const betweens = options.filter((o) => o.value.includes("-"));
    let best = betweens[0] || options[0];
    for (const o of betweens) {
      const nums = o.value.split("-").map(Number);
      if (nums[0] <= minVal) best = o;
    }
    return best;
  }

  if (!minVal && maxVal) {
    for (const o of options) {
      const nums = o.value.split("-").map(Number);
      if (nums.length === 1 && slugLc(o).startsWith("over")) {
        if (maxVal > nums[0]) return o;
      }
    }
    for (const o of options) {
      const nums = o.value.split("-").map(Number);
      if (
        nums.length === 1 &&
        slugLc(o).startsWith("under") &&
        maxVal <= nums[0]
      ) {
        return o;
      }
    }
    for (const o of options) {
      const nums = o.value.split("-").map(Number);
      if (nums.length === 2) {
        const [lower, upper] = nums;
        if (lower <= maxVal && maxVal <= upper) return o;
      }
    }
    let bestBetween: { name: string; slug: string } | null = null;
    let bestUpper = -Infinity;
    for (const o of options) {
      const nums = o.value.split("-").map(Number);
      if (nums.length === 2) {
        const [, upper] = nums;
        if (upper < maxVal && upper > bestUpper) {
          bestBetween = o;
          bestUpper = upper;
        }
      }
    }
    if (bestBetween) return bestBetween;
    return options[0];
  }

  const val = maxVal!;

  for (const o of options) {
    const nums = o.value.split("-").map(Number);
    if (nums.length === 1 && slugLc(o).startsWith("over")) {
      if (val > nums[0]) return o;
    }
  }

  let best: { name: string; slug: string } | null = null;
  let bestUpper = -Infinity;

  for (const o of options) {
    const nums = o.value.split("-").map(Number);
    if (nums.length === 2) {
      const [, upper] = nums;
      if (upper <= val && upper > bestUpper) {
        best = o;
        bestUpper = upper;
      }
    }
  }

  if (!best) {
    best = options.find((o) => o.value.includes("-")) || options[0];
  }

  return best;
}

function getNearestAtmLink(
  filters: Filters,
): { name: string; slug: string } | null {
  const min = filters.minKg ? Number(filters.minKg) : null;
  const max = filters.maxKg ? Number(filters.maxKg) : null;
  return findRangeBucket(filterOptions.atm, min, max);
}

function getNearestLengthLink(
  filters: Filters,
): { name: string; slug: string } | null {
  const min = filters.from_length ? Number(filters.from_length) : null;
  const max = filters.to_length ? Number(filters.to_length) : null;
  return findRangeBucket(filterOptions.length, min, max);
}

function getNearestSleepLink(
  filters: Filters,
): { name: string; slug: string } | null {
  const from = filters.from_sleep ? Number(filters.from_sleep) : null;
  const to = filters.to_sleep ? Number(filters.to_sleep) : null;
  return findRangeBucket(filterOptions.sleep, from, to);
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
    if (hasMake && hasModel) {
      links.makes = [
        { name: filters.make!, slug: `/${filters.make!.toLowerCase()}/` },
      ];
    }
    links.all = [{ name: "Browse by All Caravans", slug: "/listings/" }];
    return links;
  }

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

  links.all = [{ name: "Browse by All Caravans", slug: "/listings/" }];
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