// ============================================================
// FILE: StaticLinks.tsx  (Listings.tsx-ஓட same folder-ல் வை)
// ============================================================
"use client";

import { useMemo } from "react";
import { filterOptions } from "./filterOptions";
import { buildSlugFromFilters } from "../slugBuilter";
import type { Filters } from "./Listings"; // Filters interface export பண்ணிருந்தா இங்க import பண்ணு

// ── Section titles ──────────────────────────────────────────
const SECTION_TITLES: Record<string, string> = {
  categories: "Browse by Category",
  states: "Browse by State",
  regions: "Browse by Region",
  prices: "Browse by Price",
  atm: "Browse by ATM Weight",
  sleep: "Browse by Sleeping Capacity",
  length: "Browse by Length",
  conditions: "Browse by Condition",
  All: "", // title வேண்டாம்னா empty
};

// ── Build links from filterOptions ──────────────────────────
function buildStaticLinks(filters: Filters) {
  const links: Record<string, { name: string; slug: string }[]> = {};

  const hasState = Boolean(filters.state);
  const hasRegion = Boolean(filters.region);
  const hasSuburb = Boolean(filters.suburb);
  const hasCategory = Boolean(filters.category);
  const hasPrice = Boolean(filters.from_price || filters.to_price);
  // const hasAtm = Boolean(
  //   Object.values(filters).some(
  //     (val) => typeof val === "string" && val.includes("kg-atm"),
  //   ),
  // );
  const hasAtm = Boolean(filters.minKg || filters.maxKg);
  const hasLength = Boolean(filters.from_length || filters.to_length);
  const hasSleep = Boolean(filters.from_sleep || filters.to_sleep);
  const hasCondition = Boolean(filters.condition);
  const hasYear = Boolean(filters.acustom_fromyears || filters.acustom_toyears);
  const activeCount = [
    hasState,
    hasRegion,
    hasSuburb,
    hasCategory,
    hasPrice,
    hasAtm,
    hasLength,
    hasSleep,
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
      links.all = [{ name: "All", slug: "/listings/" }];
      return links;
    }

    links.categories = filterOptions.categories;
    links.states = filterOptions.location.state;
    links.prices = filterOptions.price;
    links.all = [
      {
        name: "All",
        slug: "/listings/",
      },
    ];

    return links;
  }

  // ─────────────────────────────
  // 🟢 1 FILTER → KEEP OLD LOGIC
  // ─────────────────────────────
  if (effectiveCount === 1) {
    if (hasCategory) {
      links.categories = filterOptions.categories.filter(
        (c) => c.slug === filters.category,
      );
      links.states = filterOptions.location.state;
      links.prices = filterOptions.price;
      return links;
    }

    if (hasState) {
      const state = filterOptions.location.state.find(
        (s) => s.name.toLowerCase() === filters.state?.toLowerCase(),
      );

      if (state?.region) {
        links.regions = state.region;
      }

      links.categories = filterOptions.categories;
      return links;
    }

    if (hasPrice) {
      links.prices = filterOptions.price;
      return links;
    }

    if (hasAtm) {
      links.atm = filterOptions.atm;
      return links;
    }

    if (hasLength) {
      links.length = filterOptions.length;
      return links;
    }

    if (hasSleep) {
      links.sleep = filterOptions.sleep;
      return links;
    }

    links.all = [
      {
        name: "All",
        slug: "/listings/",
      },
    ];

    // if (hasCondition) {
    //   links.conditions = filterOptions.conditions;
    //   return links;
    // }
  }

  // ─────────────────────────────
  // 🔴 2 OR MORE FILTERS
  // 👉 SHOW ONLY SELECTED VALUES
  // ─────────────────────────────
  if (effectiveCount >= 2) {
    if (hasCategory) {
      links.categories = filterOptions.categories.filter(
        (c) => c.name.toLowerCase() === filters.category?.toLowerCase(),
      );
    }

    if (hasState) {
      links.states = filterOptions.location.state.filter(
        (s) => s.name.toLowerCase() === filters.state?.toLowerCase(),
      );
    }

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

    if (hasPrice) {
      const from = Number(filters.from_price);
      const to = filters.to_price ? Number(filters.to_price) : null;

      // between case → exact match
      if (to) {
        links.prices = filterOptions.price.filter((p) => {
          const slug = p.slug.replace(/\//g, "");
          return slug === `between-${from}-${to}`;
        });
        return;
      }

      // under / over case → find nearest range
      const ranges = filterOptions.price
        .map((p) => {
          const slug = p.slug.replace(/\//g, "");

          if (!slug.startsWith("between")) return null;

          const match = slug.match(/between-(\d+)-(\d+)/);
          if (!match) return null;

          return {
            item: p,
            start: Number(match[1]),
            end: Number(match[2]),
          };
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

      // UNDER case → find range where end >= from (closest lower)
      if (
        filters.to_price === undefined &&
        filters.from_price &&
        filters.type === "under"
      ) {
        const nearest = ranges
          .filter((r) => r.end >= from)
          .sort((a, b) => a.end - b.end)[0];

        links.prices = nearest ? [nearest.item] : [];
        // return;
      }

      // OVER case → find range where start >= from
      const nearest = ranges
        .filter((r) => r.start >= from)
        .sort((a, b) => a.start - b.start)[0];

      links.prices = nearest ? [nearest.item] : [];
    }

    if (hasAtm) {
      const min = filters.minKg ? Number(filters.minKg) : null;
      const max = filters.maxKg ? Number(filters.maxKg) : null;

      // BETWEEN → exact match
      if (min && max) {
        links.atm = filterOptions.atm.filter((option) => {
          if (!option.value.includes("-")) return false;
          const [optMin, optMax] = option.value.split("-").map(Number);
          return min >= optMin && max <= optMax;
        });
      }

      // UNDER → show next bucket ABOVE the max
      else if (!min && max) {
        links.atm = filterOptions.atm
          .filter((option) => {
            if (!option.value.includes("-")) return false;
            const [optMin] = option.value.split("-").map(Number);
            return optMin >= max; // next bucket starts at or above current max
          })
          .slice(0, 1); // closest one மட்டும்
      }

      // OVER → show bucket that contains the min
      else if (min && !max) {
        links.atm = filterOptions.atm.filter((option) => {
          if (!option.value.includes("-")) return false;
          const [optMin, optMax] = option.value.split("-").map(Number);
          return min >= optMin && min < optMax;
        });
      }
    }
    if (hasLength) {
      const min = filters.from_length ? Number(filters.from_length) : null;
      const max = filters.to_length ? Number(filters.to_length) : null;

      if (min && max) {
        // BETWEEN → exact match
        links.length = filterOptions.length.filter((o) => {
          if (!o.value.includes("-")) return false;
          const [optMin, optMax] = o.value.split("-").map(Number);
          return min >= optMin && max <= optMax;
        });
      } else if (!min && max) {
        // UNDER → next bucket above
        links.length = filterOptions.length
          .filter((o) => {
            if (!o.value.includes("-")) return false;
            const [optMin] = o.value.split("-").map(Number);
            return optMin >= max;
          })
          .slice(0, 1);
      } else if (min && !max) {
        // OVER → bucket that contains min
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
        // BETWEEN → find bucket where from falls inside
        links.sleep = filterOptions.sleep.filter((o) => {
          if (!o.value.includes("-")) return false;
          const [optMin, optMax] = o.value.split("-").map(Number);
          return from >= optMin && from <= optMax;
        });
      } else if (from && !to) {
        // OVER → next bucket above from
        links.sleep = filterOptions.sleep
          .filter((o) => {
            if (!o.value.includes("-")) return false;
            const [optMin] = o.value.split("-").map(Number);
            return optMin > from; // next bucket starts above from
          })
          .slice(0, 1);
      } else if (!from && to) {
        // UNDER → next bucket
        links.sleep = filterOptions.sleep
          .filter((o) => {
            if (!o.value.includes("-")) return false;
            const [optMin] = o.value.split("-").map(Number);
            return optMin >= to;
          })
          .slice(0, 1);
      }
    }

    // if (hasCondition) {
    //   links.conditions = filterOptions.conditions.filter(
    //     (c) => c.slug === filters.condition,
    //   );
    // }
    links.all = [
      {
        name: "All",
        slug: "/listings/",
      },
    ];

    return links;
  }

  return links;
}
// ── URL builder ──────────────────────────────────────────────
function buildStaticLinkUrl(
  type: string,
  slug: string,
  currentFilters: Filters,
): string {
  const cleanSlug = slug.toLowerCase().replace(/^\//, "").replace(/\/$/, "");

  const activeCount = Object.values(currentFilters).filter(Boolean).length;

  // 🔥 2 OR MORE FILTERS → DIRECT LINK
  if (activeCount >= 2) {
    const directFilters: Filters = {};

    if (type === "categories") {
      directFilters.category = cleanSlug.replace("-category", "");
    }

    if (type === "states") {
      directFilters.state = cleanSlug.replace("-state", "");
    }
    if (type === "all") {
      return "/listings/";
    }
    if (type === "regions") {
      // region must keep state
      directFilters.state = currentFilters.state;
      directFilters.region = cleanSlug.replace("-region", "");
    }
    if (type === "prices") {
      const parts = cleanSlug.match(/(\d+)/g);

      if (parts) {
        if (cleanSlug.startsWith("between")) {
          directFilters.from_price = Number(parts[0]);
          directFilters.to_price = Number(parts[1]);
        } else if (cleanSlug.startsWith("under")) {
          directFilters.from_price = Number(parts[0]);
          directFilters.type = "under";
          directFilters.to_price = undefined;
        } else if (cleanSlug.startsWith("over")) {
          directFilters.from_price = Number(parts[0]);
          directFilters.type = "over";
          directFilters.to_price = undefined;
        }
      }
    }
    if (type === "atm") {
      const parts = cleanSlug.match(/(\d+)/g);

      if (parts) {
        if (cleanSlug.startsWith("between")) {
          directFilters.minKg = Number(parts[0]);
          directFilters.maxKg = Number(parts[1]);
        } else if (cleanSlug.startsWith("under")) {
          directFilters.maxKg = Number(parts[0]);
          directFilters.type = "under";
        } else if (cleanSlug.startsWith("over")) {
          directFilters.minKg = Number(parts[0]);
          directFilters.type = "over";
        }
      }
    }

    if (type === "length") {
      const nums = cleanSlug.match(/\d+/g)?.map(Number) ?? [];
      if (cleanSlug.startsWith("between") && nums.length >= 2) {
        directFilters.from_length = nums[0];
        directFilters.to_length = nums[1];
      } else if (cleanSlug.startsWith("under") && nums.length >= 1) {
        directFilters.to_length = nums[0];
      } else if (cleanSlug.startsWith("over") && nums.length >= 1) {
        directFilters.from_length = nums[0];
      }
    }

    if (type === "sleep") {
      const nums = cleanSlug.match(/\d+/g)?.map(Number) ?? [];
      if (cleanSlug.startsWith("between") && nums.length >= 2) {
        directFilters.from_sleep = nums[0];
        directFilters.to_sleep = nums[1];
      } else if (cleanSlug.startsWith("under") && nums.length >= 1) {
        directFilters.to_sleep = nums[0];
      } else if (cleanSlug.startsWith("over") && nums.length >= 1) {
        directFilters.from_sleep = nums[0];
      }
    }
    if (type === "conditions") {
      directFilters.condition = cleanSlug;
    }

    return buildSlugFromFilters(directFilters);
  }

  // 🟢 0 or 1 filter → normal behaviour
  const normalFilters: Filters = {};

  if (type === "categories") {
    normalFilters.category = cleanSlug.replace("-category", "");
  }

  if (type === "states") {
    normalFilters.state = cleanSlug.replace("-state", "");
  }

  if (type === "regions") {
    normalFilters.region = cleanSlug.replace("-region", "");
  }

  if (type === "atm") {
    const parts = cleanSlug.match(/(\d+)/g);

    if (parts) {
      if (cleanSlug.startsWith("between")) {
        normalFilters.minKg = Number(parts[0]);
        normalFilters.maxKg = Number(parts[1]);
      } else if (cleanSlug.startsWith("under")) {
        normalFilters.maxKg = Number(parts[0]);
        normalFilters.type = "under";
      } else if (cleanSlug.startsWith("over")) {
        normalFilters.minKg = Number(parts[0]);
        normalFilters.type = "over";
      }
    }
  }

  // 🟢 0 or 1 filter section-ல்
  if (type === "length") {
    const nums = cleanSlug.match(/\d+/g)?.map(Number) ?? [];
    if (cleanSlug.startsWith("between") && nums.length >= 2) {
      normalFilters.from_length = nums[0];
      normalFilters.to_length = nums[1];
    } else if (cleanSlug.startsWith("under") && nums.length >= 1) {
      normalFilters.to_length = nums[0];
    } else if (cleanSlug.startsWith("over") && nums.length >= 1) {
      normalFilters.from_length = nums[0];
    }
  }

  if (type === "sleep") {
    const nums = cleanSlug.match(/\d+/g)?.map(Number) ?? [];
    if (cleanSlug.startsWith("between") && nums.length >= 2) {
      normalFilters.from_sleep = nums[0];
      normalFilters.to_sleep = nums[1];
    } else if (cleanSlug.startsWith("under") && nums.length >= 1) {
      normalFilters.to_sleep = nums[0];
    } else if (cleanSlug.startsWith("over") && nums.length >= 1) {
      normalFilters.from_sleep = nums[0];
    }
  }
  if (type === "conditions") {
    normalFilters.condition = cleanSlug;
  }

  return buildSlugFromFilters(normalFilters);
}
// ── Props ────────────────────────────────────────────────────
interface StaticLinksProps {
  filters: Filters;
}

// ── Component ────────────────────────────────────────────────
export default function StaticLinks({ filters }: StaticLinksProps) {
  const staticLinks = useMemo(
    () => buildStaticLinks(filters) || {},
    [
      filters.state,
      filters.region,
      filters.suburb,
      filters.category,
      filters.from_price,
      filters.to_price,
      filters.minKg,
      filters.maxKg,
      filters.from_length,
      filters.to_length,
      filters.from_sleep,
      filters.to_sleep,
      filters.condition,
    ],
  );

  return (
    <div className="cfs-links-section" id="static-links">
      {Object.entries(staticLinks).map(([sectionKey, items]) => {
        if (!items || items.length === 0) return null;

        return (
          <div key={sectionKey} className="cfs-links-group">
            <h5 className="cfs-filter-label">
              {SECTION_TITLES[sectionKey] || sectionKey}
            </h5>

            <ul className="cfs-links-list">
              {items.map((item) => (
                <li key={item.slug} className="cfs-links-item">
                  <a
                    href={buildStaticLinkUrl(sectionKey, item.slug, filters)}
                    className="cfs-links-link"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
