"use client";

import { useMemo } from "react";
import { filterOptions } from "./filterOptions";
import type { Filters } from "./Listings";

// ── Section titles ─────────────────────────────
const SECTION_TITLES: Record<string, string> = {
  categories: "Browse by Category",
  states: "Browse by State",
  regions: "Browse by Region",
  prices: "Browse by Price",
  atm: "Browse by ATM Weight",
  sleep: "Browse by Sleeping Capacity",
  length: "Browse by Length",
};

// ── Build Static Links Logic ─────────────────────────────
function buildStaticLinks(filters: Filters) {
  const links: Record<string, { name: string; slug: string }[]> = {};

  const hasCategory = !!filters.category;
  const hasState = !!filters.state;
  const hasRegion = !!filters.region;
  const hasSuburb = !!filters.suburb;
  const hasPrice = !!(filters.from_price || filters.to_price);
  const hasAtm = !!(filters.minKg || filters.maxKg);
  const hasLength = !!(filters.from_length || filters.to_length);
  const hasSleep = !!(filters.from_sleep || filters.to_sleep);
  const hasMake = !!filters.make;

  const activeCount = [
    hasCategory,
    hasState,
    hasRegion,
    hasSuburb,
    hasPrice,
    hasAtm,
    hasLength,
    hasSleep,
    hasMake,
  ].filter(Boolean).length;

  // ─────────────────────────────
  // 🟢 NO FILTER
  // ─────────────────────────────
  if (activeCount === 0) {
    links.categories = filterOptions.categories;
    links.states = filterOptions.location.state;
    links.prices = filterOptions.price;
    return links;
  }

  // ─────────────────────────────
  // 🟢 ONLY ONE FILTER (keep hierarchy logic)
  // ─────────────────────────────
  if (activeCount === 1) {
    if (hasCategory) {
      links.categories = filterOptions.categories.filter(
        (c) => c.slug === filters.category,
      );
      links.states = filterOptions.location.state;
      return links;
    }

    if (hasState) {
      const state = filterOptions.location.state.find(
        (s) => s.name.toLowerCase() === filters.state?.toLowerCase(),
      );
      if (state?.region) links.regions = state.region;
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

    if (hasMake) {
      links.categories = filterOptions.categories;
      return links;
    }
  }

  // ─────────────────────────────
  // 🟢 TWO OR MORE FILTERS
  // Show ONLY selected main filters
  // ─────────────────────────────
  if (activeCount >= 2) {
    if (hasCategory) {
      links.categories = filterOptions.categories.filter(
        (c) => c.slug === filters.category,
      );
    }

    if (hasState) {
      links.states = filterOptions.location.state.filter(
        (s) => s.name.toLowerCase() === filters.state?.toLowerCase(),
      );
    }

    if (hasPrice) {
      const selected = String(filters.from_price || filters.to_price || "");
      links.prices = filterOptions.price.filter((p) =>
        p.slug.includes(selected),
      );
    }

    if (hasAtm) {
      const selected = String(filters.minKg || filters.maxKg || "");
      links.atm = filterOptions.atm.filter((a) => a.slug.includes(selected));
    }

    if (hasLength) {
      const selected = String(filters.from_length || filters.to_length || "");
      links.length = filterOptions.length.filter((l) =>
        l.slug.includes(selected),
      );
    }

    if (hasSleep) {
      const selected = String(filters.from_sleep || filters.to_sleep || "");
      links.sleep = filterOptions.sleep.filter((s) =>
        s.slug.includes(selected),
      );
    }

    return links;
  }

  return links;
}

// ── URL Builder (IMPORTANT FIX) ─────────────────────────────
function buildStaticLinkUrl(type: string, slug: string): string {
  const cleanSlug = slug.startsWith("/") ? slug.slice(1) : slug;

  // 🔥 Always return independent main page
  return `/listings/${cleanSlug}/`;
}

// ── Component ─────────────────────────────
interface StaticLinksProps {
  filters: Filters;
}

export default function StaticLinks({ filters }: StaticLinksProps) {
  const staticLinks = useMemo(() => buildStaticLinks(filters), [filters]);

  return (
    <div className="cfs-links-section" id="static-links">
      {Object.entries(staticLinks).map(([sectionKey, items]) => {
        if (!items?.length) return null;

        return (
          <div key={sectionKey} className="cfs-links-group">
            <h5 className="cfs-filter-label">
              {SECTION_TITLES[sectionKey] || sectionKey}
            </h5>

            <ul className="cfs-links-list">
              {items.map((item) => (
                <li key={item.slug} className="cfs-links-item">
                  <a
                    href={buildStaticLinkUrl(sectionKey, item.slug)}
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
