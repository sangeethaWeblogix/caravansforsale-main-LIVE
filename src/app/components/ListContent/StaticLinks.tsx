// ============================================================
// FILE: StaticLinks.tsx
// ============================================================
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildStaticLinks,
  buildStaticLinkUrl,
  SECTION_TITLES,
} from "./StaticLinksUtils";
import type { Filters } from "./Listings";
import { buildSlugFromFilters } from "../slugBuilter";

interface StaticLinksProps {
  filters: Filters;
}

export default function StaticLinks({ filters }: StaticLinksProps) {
  const [makeCategories, setMakeCategories] = useState<
    { name: string; slug: string }[]
  >([]);
  const [makeStates, setMakeStates] = useState<
    { name: string; slug: string }[]
  >([]);
  useEffect(() => {
    const hasMake = Boolean(filters.make);
    const hasOther = Boolean(
      filters.category ||
      filters.state ||
      filters.from_price ||
      filters.to_price ||
      filters.minKg ||
      filters.maxKg ||
      filters.from_length ||
      filters.to_length ||
      filters.from_sleep ||
      filters.to_sleep,
    );

    if (!hasMake || hasOther) {
      setMakeCategories([]);
      setMakeStates([]);
      return;
    }

    const fetchMakeData = async () => {
      try {
        const [catRes, stateRes] = await Promise.all([
          fetch(
            `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?make=${filters.make}&group_by=category`,
          ),
          fetch(
            `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?make=${filters.make}&group_by=state`,
          ),
        ]);
        const catJson = await catRes.json();
        const stateJson = await stateRes.json();

        setMakeCategories(
          (catJson.data || []).map((i: any) => ({
            name: i.name,
            slug: `/${i.slug}-category/`,
          })),
        );
        setMakeStates(
          (stateJson.data || []).map((i: any) => ({
            name: i.name,
            slug: `/${i.slug}-state/`,
          })),
        );
      } catch (e) {
        console.error("Make data fetch error:", e);
      }
    };

    fetchMakeData();
  }, [filters.make]);
  const hasMakeOnly =
    Boolean(filters.make) &&
    !Boolean(
      filters.category ||
      filters.state ||
      filters.region ||
      filters.from_price ||
      filters.to_price ||
      filters.minKg ||
      filters.maxKg ||
      filters.from_length ||
      filters.to_length ||
      filters.from_sleep ||
      filters.to_sleep ||
      filters.condition ||
      filters.acustom_fromyears ||
      filters.acustom_toyears,
    );

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
      filters.acustom_fromyears,
      filters.acustom_toyears,
      filters.make,
      filters.model,
    ],
  );

  const displayLinks: Record<string, { name: string; slug: string }[]> =
    hasMakeOnly
      ? {
          makes: [
            {
              name: filters.make!,
              slug: `/${filters.make!.toLowerCase()}/`,
            },
          ], // ← add this
          ...(makeCategories.length > 0 ? { categories: makeCategories } : {}),
          ...(makeStates.length > 0 ? { states: makeStates } : {}),
        }
      : staticLinks;

  const buildMakeComboUrl = (
    type: string,
    item: { name: string; slug: string },
  ): string => {
    if (type === "makes") return item.slug;
    const comboFilters: Filters = { make: filters.make };
    if (type === "categories") {
      comboFilters.category = item.slug
        .replace(/\//g, "")
        .replace("-category", "");
    } else if (type === "states") {
      comboFilters.state = item.name;
    }
    const result = buildSlugFromFilters(comboFilters);
    return result.endsWith("/") ? result : `${result}/`;
  };

  return (
    <div className="cfs-links-section" id="static-links">
      {Object.entries(displayLinks).map(([sectionKey, items]) => {
        if (!items || items.length === 0) return null;

        return (
          <div key={sectionKey} className="cfs-links-group">
            <h5 className="cfs-filter-label">
              {SECTION_TITLES[sectionKey] || ""}
            </h5>
            <ul className="cfs-links-list">
              {items.map((item) => (
                <li key={item.slug} className="cfs-links-item">
                  <a
                    href={
                      hasMakeOnly
                        ? sectionKey === "makes"
                          ? `/${filters.make!.toLowerCase()}/` // ← direct make link
                          : buildMakeComboUrl(sectionKey, item)
                        : buildStaticLinkUrl(sectionKey, item.slug, filters)
                    }
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
