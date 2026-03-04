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

  const hasMakeOnly =
    Boolean(filters.make) &&
    !Boolean(
      filters.category ||
      filters.state ||
      filters.from_price ||
      filters.to_price ||
      filters.minKg ||
      filters.maxKg,
    );

  return (
    <div className="cfs-links-section" id="static-links">
      {Object.entries(staticLinks).map(([sectionKey, items]) => {
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
