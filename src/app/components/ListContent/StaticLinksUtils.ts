// ============================================================
// FILE: staticLinksUtils.ts  (StaticLinks.tsx-ஓட same folder)
// Server + Client இரண்டிலும் use பண்ணலாம் — "use client" இல்ல
// ============================================================

import { filterOptions } from "./filterOptions";
import { buildSlugFromFilters } from "../slugBuilter";

// ── Filters type (Listings.tsx-ல் இருந்து copy அல்லது import) ──
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
  // FIX
  all: " ",
};

// ── Build links from filterOptions ──────────────────────────
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
  const hasCondition = Boolean(filters.condition);
  const hasYear = Boolean(filters.acustom_fromyears || filters.acustom_toyears);
  const hasMake = Boolean(filters.make);
  const hasModel = Boolean(filters.model);
  const hasSearch = Boolean(filters.search || filters.keyword);

  const activeCount = [
    hasState,
    hasRegion,
    hasSuburb,
    hasCategory,
    hasPrice,
    hasAtm,
    hasLength,
    hasSleep,
    hasMake, // ← add
    hasSearch, // ← ADD THIS
  ].filter(Boolean).length;

  const effectiveCount =
    (hasCondition || hasYear) && activeCount >= 1
      ? activeCount + 1
      : activeCount;

  // ─────────────────────────────
  // 🟢 0 FILTER → DEFAULT
  // ─────────────────────────────
  if (effectiveCount === 0) {
    if (hasCondition || hasYear) {
      links.all = [{ name: "All Caravans", slug: "/listings/" }];
      return links;
    }
    links.home = [{ name: "Home", slug: "/" }];
    links.categories = filterOptions.categories;
    links.states = filterOptions.location.state;
    links.prices = filterOptions.price;

    return links;
  }

  // ─────────────────────────────
  // 🟢 1 FILTER
  // ─────────────────────────────
  if (effectiveCount === 1) {
    console.log("make", filters.make);
    console.log("make mod", filters.model);
    links.home = [{ name: "Home", slug: "/" }];
    let makeCategories: { name: string; slug: string }[] = [];
    let makeStates: { name: string; slug: string }[] = [];
    if (hasCategory) {
      links.categories = filterOptions.categories.filter(
        (c) => c.name.toLowerCase() === filters.category?.toLowerCase(),
      );
      links.states = filterOptions.location.state;
      links.prices = filterOptions.price;
      links.all = [{ name: "All Caravans", slug: "/listings/" }]; // ← add

      return links;
    }
    if (hasMake) {
      links.makes = [
        {
          name: filters.make!,
          slug: `/${filters.make!.toLowerCase()}/`,
        },
      ];
      links.states = filterOptions.location.state;
      links.categories = filterOptions.categories;
      links.all = [{ name: "All Caravans", slug: "/listings/" }]; // ← add

      return links;
    }

    if (hasState) {
      const state = filterOptions.location.state.find(
        (s) => s.name.toLowerCase() === filters.state?.toLowerCase(),
      );
      if (hasRegion) {
        const state = filterOptions.location.state.find(
          (s) => s.name.toLowerCase() === filters.state?.toLowerCase(),
        );
        if (state?.region) {
          links.regions = state.region.filter(
            (r) => r.name.toLowerCase() === filters.region?.toLowerCase(),
          );
        }
      }
      if (
        hasState &&
        hasRegion &&
        !hasCategory &&
        !hasPrice &&
        !hasAtm &&
        !hasLength &&
        !hasSleep &&
        !hasMake
      ) {
        links.categories = filterOptions.categories;
      }
      // selected state link
      // links.states = filterOptions.location.state.filter(
      //   (s) => s.name.toLowerCase() === filters.state?.toLowerCase(),
      // );

      // that state's regions
      if (state?.region) links.regions = state.region;

      // all categories
      links.categories = filterOptions.categories;

      // all prices
      // links.prices = filterOptions.price;
      links.all = [{ name: "All Caravans", slug: "/listings/" }]; // ← add

      return links;
    }

    if (hasPrice) {
      const from = Number(filters.from_price);
      const to = filters.to_price ? Number(filters.to_price) : null;
      const type = filters.type;

      if (to && !type) {
        // between — selected value-க்கு மேல உள்ளவை
        links.prices = filterOptions.price.filter((p) => {
          const nums =
            p.slug.replace(/\//g, "").match(/\d+/g)?.map(Number) ?? [];
          return nums[0] >= to;
        });
      } else if (type === "under") {
        // under — selected value-க்கு கீழ உள்ளவை
        links.prices = filterOptions.price.filter((p) => {
          const nums =
            p.slug.replace(/\//g, "").match(/\d+/g)?.map(Number) ?? [];
          return nums[0] < (to || from);
        });
      } else {
        // over — selected value-க்கு மேல உள்ளவை
        links.prices = filterOptions.price.filter((p) => {
          const slug = p.slug.replace(/\//g, "");
          const nums = slug.match(/\d+/g)?.map(Number) ?? [];
          if (slug.startsWith("between")) return nums[0] >= from;
          if (slug.startsWith("over")) return nums[0] > from;
          return false;
        });
      }

      links.all = [{ name: "All Caravans", slug: "/listings/" }];
      return links;
    }
    if (hasAtm) {
      const min = filters.minKg ? Number(filters.minKg) : null;
      const max = filters.maxKg ? Number(filters.maxKg) : null;

      links.atm = filterOptions.atm.filter((o) => {
        const nums = o.value.split("-").map(Number);
        const optMin = nums[0];

        if (min && !max) {
          return optMin >= min;
        } else if (!min && max) {
          return optMin < max;
        } else if (min && max) {
          return optMin >= max;
        }
        return true;
      });

      links.all = [{ name: "All Caravans", slug: "/listings/" }];
      return links;
    }

    if (hasLength) {
      const min = filters.from_length ? Number(filters.from_length) : null;
      const max = filters.to_length ? Number(filters.to_length) : null;

      links.length = filterOptions.length.filter((o) => {
        const nums = o.value.split("-").map(Number);
        const optMin = nums[0];

        if (min && !max) {
          return optMin >= min;
        } else if (!min && max) {
          return optMin < max;
        } else if (min && max) {
          return optMin >= max;
        }
        return true;
      });

      links.all = [{ name: "All Caravans", slug: "/listings/" }];
      return links;
    }

    if (hasSleep) {
      const from = filters.from_sleep ? Number(filters.from_sleep) : null;
      const to = filters.to_sleep ? Number(filters.to_sleep) : null;

      links.sleep = filterOptions.sleep.filter((o) => {
        const nums = o.value.split("-").map(Number);
        const optMin = nums[0];

        if (from && !to) {
          return optMin >= from;
        } else if (!from && to) {
          return optMin < to;
        } else if (from && to) {
          return optMin >= to;
        }
        return true;
      });

      links.all = [{ name: "All Caravans", slug: "/listings/" }];
      return links;
    }
    links.all = [{ name: "All Caravans", slug: "/listings/" }];
    return links;
  }

  // ─────────────────────────────
  // 🔴 2 OR MORE FILTERS
  // ─────────────────────────────
  if (effectiveCount >= 2) {
    links.home = [{ name: "Home", slug: "/" }];
    if (hasCategory) {
      links.categories = filterOptions.categories.filter((c) =>
        c.slug.includes(filters.category?.toLowerCase() ?? ""),
      );
    }
    if (hasMake) {
      // model இருந்தா model value use பண்ணு, இல்லன்னா make

      links.makes = [{ name: filters.make!, slug: filters.make! }];
    }
    if (hasState) {
      links.states = filterOptions.location.state.filter(
        (s) => s.name.toLowerCase() === filters.state?.toLowerCase(),
      );
    }

    if (hasRegion) {
      if (
        hasMake ||
        hasCategory ||
        hasPrice ||
        hasAtm ||
        hasLength ||
        hasSleep
      ) {
        const state = filterOptions.location.state.find(
          (s) => s.name.toLowerCase() === filters.state?.toLowerCase(),
        );
        if (state?.region) {
          links.regions = state.region.filter(
            (r) => r.name.toLowerCase() === filters.region?.toLowerCase(),
          );
        }
      }
    }
    if (activeCount === 2 && hasState && hasRegion) {
      links.categories = filterOptions.categories;
    }
    if (hasPrice) {
      const from = Number(filters.from_price);
      const to = filters.to_price ? Number(filters.to_price) : null;

      if (to) {
        // exact match — between-X-Y
        links.prices = filterOptions.price.filter((p) => {
          const slug = p.slug.replace(/\//g, "");
          return slug === `between-${from}-${to}`;
        });
      } else {
        // from_price மட்டும் (over/under) — nearest between range show பண்ணு
        const allRanges = filterOptions.price
          .map((p) => {
            const slug = p.slug.replace(/\//g, "");
            const match = slug.match(/between-(\d+)-(\d+)/);
            if (!match) return null;
            return { item: p, start: Number(match[1]), end: Number(match[2]) };
          })
          .filter(
            (
              r,
            ): r is {
              item: { name: string; slug: string };
              start: number;
              end: number;
            } => r !== null,
          );

        // from value-க்கு equal or nearest higher range show பண்ணு
        const nearest = allRanges
          .filter((r) => r.start >= from)
          .sort((a, b) => a.start - b.start)[0];
        links.prices = nearest ? [nearest.item] : [];
      }
    }
    if (hasAtm) {
      const min = filters.minKg ? Number(filters.minKg) : null;
      const max = filters.maxKg ? Number(filters.maxKg) : null;

      if (min && max) {
        // exact range match
        links.atm = filterOptions.atm.filter((o) => {
          if (!o.value.includes("-")) return false;
          const [optMin, optMax] = o.value.split("-").map(Number);
          return min >= optMin && max <= optMax;
        });
      } else if (min && !max) {
        // min மட்டும் — min value உள்ள range find பண்ணு
        // e.g. minKg=2500 → "2500-3500" range
        links.atm = filterOptions.atm.filter((o) => {
          if (!o.value.includes("-")) return false;
          const [optMin, optMax] = o.value.split("-").map(Number);
          return min >= optMin && min <= optMax; // ← FIX: <= instead of
        });
        // match இல்லன்னா nearest higher
        if (!links.atm?.length) {
          links.atm = filterOptions.atm
            .filter((o) => {
              const nums = o.value.split("-").map(Number);
              return nums[0] >= min;
            })
            .slice(0, 1);
        }
      } else if (!min && max) {
        links.atm = filterOptions.atm
          .filter((o) => {
            if (!o.value.includes("-")) return false;
            const [optMin] = o.value.split("-").map(Number);
            return optMin >= max;
          })
          .slice(0, 1);
      }
    }
    if (hasLength) {
      const min = filters.from_length ? Number(filters.from_length) : null;
      const max = filters.to_length ? Number(filters.to_length) : null;

      if (min && max) {
        links.length = filterOptions.length.filter((o) => {
          if (!o.value.includes("-")) return false;
          const [optMin, optMax] = o.value.split("-").map(Number);
          return min >= optMin && max <= optMax;
        });
      } else if (!min && max) {
        links.length = filterOptions.length
          .filter((o) => {
            if (!o.value.includes("-")) return false;
            const [optMin] = o.value.split("-").map(Number);
            return optMin >= max;
          })
          .slice(0, 1);
      } else if (min && !max) {
        links.length = filterOptions.length.filter((o) => {
          if (!o.value.includes("-")) return false;
          const [optMin, optMax] = o.value.split("-").map(Number);
          return min >= optMin && min < optMax;
        });
      }
    }

    if (hasSleep) {
      const from = filters.from_sleep ? Number(filters.from_sleep) : null;
      const to = filters.to_sleep ? Number(filters.to_sleep) : null;

      if (from && to) {
        links.sleep = filterOptions.sleep.filter((o) => {
          if (!o.value.includes("-")) return false;
          const [optMin, optMax] = o.value.split("-").map(Number);
          return from >= optMin && from <= optMax;
        });
      } else if (from && !to) {
        links.sleep = filterOptions.sleep
          .filter((o) => {
            if (!o.value.includes("-")) return false;
            const [optMin] = o.value.split("-").map(Number);
            return optMin > from;
          })
          .slice(0, 1);
      } else if (!from && to) {
        links.sleep = filterOptions.sleep
          .filter((o) => {
            if (!o.value.includes("-")) return false;
            const [optMin] = o.value.split("-").map(Number);
            return optMin >= to;
          })
          .slice(0, 1);
      }
    }

    links.all = [{ name: "All Caravans", slug: "/listings/" }];
    return links;
  }

  return links;
}

// ── URL builder ──────────────────────────────────────────────
export function buildStaticLinkUrl(
  type: string,
  slug: string,
  currentFilters: Filters,
): string {
  if (type === "home") return "/"; // ← ADD THIS

  if (type === "all") return "/listings/";

  const cleanSlug = slug.toLowerCase().replace(/^\//, "").replace(/\/$/, "");

  const activeCount = [
    currentFilters.state,
    currentFilters.region,
    currentFilters.suburb,
    currentFilters.category,
    currentFilters.from_price || currentFilters.to_price,
    currentFilters.minKg || currentFilters.maxKg,
    currentFilters.from_length || currentFilters.to_length,
    currentFilters.from_sleep || currentFilters.to_sleep,
    currentFilters.make, // ← add
  ].filter(Boolean).length;

  const hasCondition = Boolean(currentFilters.condition);
  const hasYear = Boolean(
    currentFilters.acustom_fromyears || currentFilters.acustom_toyears,
  );
  const effectiveCount =
    (hasCondition || hasYear) && activeCount >= 1
      ? activeCount + 1
      : activeCount;

  const buildFilters = (f: Filters): string => {
    const result = buildSlugFromFilters(f);
    return result.endsWith("/") ? result : `${result}/`;
  };

  // 🔥 2 OR MORE FILTERS → DIRECT LINK (no current filters carried over)
  if (effectiveCount >= 2) {
    const directFilters: Filters = {};

    if (type === "categories") {
      directFilters.category = cleanSlug.replace("-category", "");
      if (currentFilters.state) directFilters.state = currentFilters.state;
      if (currentFilters.region) directFilters.region = currentFilters.region;
    } else if (type === "states") {
      directFilters.state = cleanSlug.replace("-state", "");
    } else if (type === "regions") {
      directFilters.state = currentFilters.state;
      directFilters.region = cleanSlug.replace("-region", "");
    } else if (type === "prices") {
      const parts = cleanSlug.match(/(\d+)/g);
      if (parts) {
        if (cleanSlug.startsWith("between")) {
          directFilters.from_price = Number(parts[0]);
          directFilters.to_price = Number(parts[1]);
        } else if (cleanSlug.startsWith("under")) {
          directFilters.from_price = Number(parts[0]);
          directFilters.type = "under";
        } else if (cleanSlug.startsWith("over")) {
          directFilters.from_price = Number(parts[0]);
          directFilters.type = "over";
        }
      }
    } else if (type === "atm") {
      const parts = cleanSlug.match(/(\d+)/g);
      if (parts) {
        if (cleanSlug.startsWith("between")) {
          directFilters.minKg = Number(parts[0]);
          directFilters.maxKg = Number(parts[1]);
        } else if (cleanSlug.startsWith("under")) {
          directFilters.maxKg = Number(parts[0]);
        } else if (cleanSlug.startsWith("over")) {
          directFilters.minKg = Number(parts[0]);
        }
      }
    } else if (type === "length") {
      const nums = cleanSlug.match(/\d+/g)?.map(Number) ?? [];
      if (cleanSlug.startsWith("between") && nums.length >= 2) {
        directFilters.from_length = nums[0];
        directFilters.to_length = nums[1];
      } else if (cleanSlug.startsWith("under")) {
        directFilters.to_length = nums[0];
      } else if (cleanSlug.startsWith("over")) {
        directFilters.from_length = nums[0];
      }
    } else if (type === "sleep") {
      const nums = cleanSlug.match(/\d+/g)?.map(Number) ?? [];
      if (cleanSlug.startsWith("between") && nums.length >= 2) {
        directFilters.from_sleep = nums[0];
        directFilters.to_sleep = nums[1];
      } else if (cleanSlug.startsWith("under")) {
        directFilters.to_sleep = nums[0];
      } else if (cleanSlug.startsWith("over")) {
        directFilters.from_sleep = nums[0];
      }
    } else if (type === "conditions") {
      directFilters.condition = cleanSlug;
    } else if (type === "makes") {
      directFilters.make = cleanSlug; // model ignore பண்ணு
    }

    return buildFilters(directFilters);
  }

  // 🟢 0 or 1 filter → normal

  // 🟢 0 or 1 filter → normal — current filters keep பண்ணி new filter add பண்ணு
  const normalFilters: Filters = {};

  if (type === "categories") {
    normalFilters.category = cleanSlug.replace("-category", "");
    if (currentFilters.state) normalFilters.state = currentFilters.state;
    if (currentFilters.region) normalFilters.region = currentFilters.region;
    if (currentFilters.make) normalFilters.make = currentFilters.make; // ← add
  } else if (type === "states") {
    // ✅ current category keep பண்ணு
    if (currentFilters.category)
      normalFilters.category = currentFilters.category;
    if (currentFilters.make) normalFilters.make = currentFilters.make; // ← add
    normalFilters.state = cleanSlug.replace("-state", "");
  } else if (type === "regions") {
    if (currentFilters.category)
      normalFilters.category = currentFilters.category;
    if (currentFilters.state) normalFilters.state = currentFilters.state;
    normalFilters.region = cleanSlug.replace("-region", "");
  } else if (type === "prices") {
    // ✅ current category + state keep பண்ணு
    if (currentFilters.category)
      normalFilters.category = currentFilters.category;
    if (currentFilters.state) normalFilters.state = currentFilters.state;
    const parts = cleanSlug.match(/(\d+)/g);
    if (parts) {
      if (cleanSlug.startsWith("between")) {
        normalFilters.from_price = Number(parts[0]);
        normalFilters.to_price = Number(parts[1]);
      } else if (cleanSlug.startsWith("under")) {
        normalFilters.to_price = Number(parts[0]);
        normalFilters.type = "under";
      } else if (cleanSlug.startsWith("over")) {
        normalFilters.from_price = Number(parts[0]);
        normalFilters.type = "over";
      }
    }
  } else if (type === "atm") {
    if (currentFilters.category)
      normalFilters.category = currentFilters.category;
    if (currentFilters.state) normalFilters.state = currentFilters.state;
    const parts = cleanSlug.match(/(\d+)/g);
    if (parts) {
      if (cleanSlug.startsWith("between")) {
        normalFilters.minKg = Number(parts[0]);
        normalFilters.maxKg = Number(parts[1]);
      } else if (cleanSlug.startsWith("under")) {
        normalFilters.maxKg = Number(parts[0]);
      } else if (cleanSlug.startsWith("over")) {
        normalFilters.minKg = Number(parts[0]);
      }
    }
  } else if (type === "length") {
    if (currentFilters.category)
      normalFilters.category = currentFilters.category;
    if (currentFilters.state) normalFilters.state = currentFilters.state;
    const nums = cleanSlug.match(/\d+/g)?.map(Number) ?? [];
    if (cleanSlug.startsWith("between") && nums.length >= 2) {
      normalFilters.from_length = nums[0];
      normalFilters.to_length = nums[1];
    } else if (cleanSlug.startsWith("under")) {
      normalFilters.to_length = nums[0];
    } else if (cleanSlug.startsWith("over")) {
      normalFilters.from_length = nums[0];
    }
  } else if (type === "sleep") {
    if (currentFilters.category)
      normalFilters.category = currentFilters.category;
    if (currentFilters.state) normalFilters.state = currentFilters.state;
    const nums = cleanSlug.match(/\d+/g)?.map(Number) ?? [];
    if (cleanSlug.startsWith("between") && nums.length >= 2) {
      normalFilters.from_sleep = nums[0];
      normalFilters.to_sleep = nums[1];
    } else if (cleanSlug.startsWith("under")) {
      normalFilters.to_sleep = nums[0];
    } else if (cleanSlug.startsWith("over")) {
      normalFilters.from_sleep = nums[0];
    }
  } else if (type === "conditions") {
    normalFilters.condition = cleanSlug;
  } else if (type === "makes") {
    return `/${currentFilters.make!.toLowerCase()}/`;
  }

  return buildFilters(normalFilters);
}
