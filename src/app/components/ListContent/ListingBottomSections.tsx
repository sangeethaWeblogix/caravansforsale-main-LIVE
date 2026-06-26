"use client";
import React, { useEffect, useRef, useState } from "react";
import "../../home/main.css?=4";
import type { Filters } from "./Listings";
import { getBottomLinksParams } from "@/api/bottomLinks/api";
import type { BottomLinksData, BottomLinksItem } from "@/api/bottomLinks/api";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

const STATIC_STATES = [
  { name: "New South Wales",              slug: "new-south-wales-state" },
  { name: "Victoria",                     slug: "victoria-state" },
  { name: "Queensland",                   slug: "queensland-state" },
  { name: "Western Australia",            slug: "western-australia-state" },
  { name: "South Australia",              slug: "south-australia-state" },
  { name: "Tasmania",                     slug: "tasmania-state" },
  { name: "Northern Territory",           slug: "northern-territory-state" },
  { name: "Australian Capital Territory", slug: "australian-capital-territory-state" },
];

const STATIC_CATEGORIES = [
  { name: "Off Road", slug: "off-road-category" },
  { name: "Family",   slug: "family-category" },
  { name: "Luxury",   slug: "luxury-category" },
  { name: "Hybrid",   slug: "hybrid-category" },
  { name: "Pop Top",  slug: "pop-top-category" },
  { name: "Touring",  slug: "touring-category" },
];

const STATIC_REGIONS = [
  { name: "Caravans for Sale in Melbourne Region", slug: "victoria-state/melbourne-region" },
  { name: "Caravans for Sale in Sydney",           slug: "new-south-wales-state/sydney-region" },
  { name: "Caravans for Sale in Brisbane",         slug: "queensland-state/brisbane-region" },
  { name: "Caravans for Sale in Perth",            slug: "western-australia-state/perth-region" },
  { name: "Caravans for Sale in Adelaide",         slug: "south-australia-state/adelaide-region" },
  { name: "Caravans for Sale in Newcastle",        slug: "new-south-wales-state/newcastle-region" },
  { name: "Caravans for Sale in Geelong",          slug: "victoria-state/geelong-region" },
  { name: "Caravans for Sale in Hobart",           slug: "tasmania-state/hobart-region" },
  { name: "Caravans for Sale in Townsville",       slug: "queensland-state/townsville-region" },
  { name: "Caravans for Sale in Cairns",           slug: "queensland-state/cairns-region" },
  { name: "Caravans for Sale in Toowoomba",        slug: "queensland-state/toowoomba-region" },
  { name: "Caravans for Sale in Darwin",           slug: "northern-territory-state/darwin-region" },
  { name: "Caravans for Sale in Ballarat",         slug: "victoria-state/ballarat-region" },
  { name: "Caravans for Sale in Bendigo",          slug: "victoria-state/bendigo-region" },
  { name: "Caravans for Sale in Ipswich",          slug: "queensland-state/ipswich-region" },
  { name: "Caravans for Sale in Launceston",       slug: "tasmania-state/launceston-region" },
  { name: "Caravans for Sale in Shepparton",       slug: "victoria-state/shepparton-region" },
];

const FEATURED_MAKE_NAMES = [
  "Jayco", "Lotus", "Titanium", "Snowy River", "MDC",
  "JB", "Supreme", "Crusader", "Newgen", "Retreat",
];

function filterFeaturedItems(items: BottomLinksItem[], names: string[]): BottomLinksItem[] {
  const result: BottomLinksItem[] = [];
  for (const name of names) {
    const match = items.find((item) =>
      item.label.toLowerCase().includes(name.toLowerCase())
    );
    if (match) result.push(match);
  }
  return result;
}

type SectionType = "region" | "category" | "make" | "model" | "price" | "weight" | "length" | "sleep" | "used" | "new" | "other";

function detectSectionType(label: string): SectionType {
  const l = label.toLowerCase();
  if (l === "location" || l.includes("locat")) return "region";
  if (l.includes("caravan type") || l === "category" || l.includes("categor")) return "category";
  if (l.includes("model")) return "model";
  if (l.includes("manufacturer") || l === "make") return "make";
  if (l.includes("price")) return "price";
  if (l.includes("weight")) return "weight";
  if (l.includes("length")) return "length";
  if (l.includes("sleep")) return "sleep";
  if (l.includes("used")) return "used";
  if (l.includes("new")) return "new";
  return "other";
}

function formatPrice(n: string | number): string {
  return `$${Number(n).toLocaleString("en-AU")}`;
}

function getPriceDisplay(from?: string | number, to?: string | number): string {
  if (from && to) return `Between ${formatPrice(from)} and ${formatPrice(to)}`;
  if (to) return `Under ${formatPrice(to)}`;
  if (from) return `Over ${formatPrice(from)}`;
  return "";
}

function getPriceSlug(from?: string | number, to?: string | number): string {
  if (from && to) return `between-${from}-and-${to}`;
  if (to) return `under-${to}`;
  if (from) return `over-${from}`;
  return "";
}

function getSleepDisplay(from?: string | number, to?: string | number): string {
  if (from && to) return `Sleeping ${from}-${to} People`;
  if (to) return `Sleeping Up To ${to} People`;
  if (from) return `Sleeping Over ${from} People`;
  return "";
}

function getWeightDisplay(min?: string | number, max?: string | number): string {
  if (min && max) return `${min}-${max} Kg ATM`;
  if (max) return `Under ${max} Kg ATM`;
  if (min) return `Over ${min} Kg ATM`;
  return "";
}

function getWeightSlug(min?: string | number, max?: string | number): string {
  if (min && max) return `between-${min}-and-${max}-kg-atm`;
  if (max) return `under-${max}-kg-atm`;
  if (min) return `over-${min}-kg-atm`;
  return "";
}

function getSectionHeading(type: string, catName: string, stateName = "", priceDisplay = ""): string {
  const p = catName ? `${catName} ` : "";
  const s = stateName ? ` in ${stateName}` : "";
  const pr = priceDisplay ? ` ${priceDisplay}` : "";
  const map: Record<string, string> = {
    state:    `Search ${p}Caravans for Sale${pr} by State`,
    category: `Search ${p}Caravans for Sale${pr} by Category${s}`,
    region:   `Browse ${p}Caravans for Sale${pr} by Popular Region${s}`,
    make:     `Popular ${p}Caravans For Sale${pr} by Manufacturer${s}`,
    model:    `Browse ${p}Caravans for Sale${pr} by Model${s}`,
    price:    `Search ${p}Caravans for Sale by Price${s}`,
    weight:   `Browse ${p}Caravans for sale${pr} by Weight${s}`,
    length:   `Shop ${p}Caravans for Sale${pr} by Length${s}`,
    sleep:    `Browse ${p}Caravans for Sale${pr} by Sleeping Capacity${s}`,
    used:     `Find Used ${p}Caravans For Sale${pr}${s}`,
    new:      `Browse New ${p}Caravans for Sale${pr}${s}`,
  };
  return map[type] ?? "";
}

// ── Shared card grid ──────────────────────────────────────────

function CardGrid({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="quick_links_tabs section-padding pt-4">
      <div className="container">
        <div className="section-head mt-2 mb-4">
          <h2>{heading}</h2>
        </div>
        <div className="custom-card-grid">{children}</div>
      </div>
    </div>
  );
}

// ── Section blocks ────────────────────────────────────────────

function StateSectionBlock({
  catName,
  catSlug,
  priceDisplay,
  priceSlug,
}: {
  catName: string;
  catSlug: string | null;
  priceDisplay: string;
  priceSlug: string;
}) {
  const pr = priceDisplay ? ` ${priceDisplay}` : "";
  return (
    <CardGrid heading={getSectionHeading("state", catName, "", priceDisplay)}>
      {STATIC_STATES.map((s) => {
        const parts = [catSlug, priceSlug, s.slug].filter(Boolean).join("/");
        const href = `/listings/${parts}/`;
        return (
          <a key={s.slug} href={href} className="custom-card">
            <h4 className="custom-card-title">
              {catName
                ? `${catName} Caravans for Sale${pr} in ${s.name}`
                : `${s.name} Caravans for Sale`}
            </h4>
          </a>
        );
      })}
    </CardGrid>
  );
}

function CategorySectionBlock({
  catName, stateSlug, stateName, makeSlug, priceDisplay, filterSlug, categoryCounts,
}: {
  catName: string;
  stateSlug: string | null;
  stateName: string;
  makeSlug: string | null;
  priceDisplay: string;
  filterSlug: string;
  categoryCounts: { name: string; slug: string; count: number }[];
}) {
  // When count data is available, only show categories with count > 0
  const visibleCategories = categoryCounts.length > 0
    ? STATIC_CATEGORIES.filter((cat) =>
        categoryCounts.some(
          (c) => (c.slug === cat.slug || c.slug.replace(/-category$/, "") === cat.slug.replace(/-category$/, "")) && c.count > 0
        )
      )
    : STATIC_CATEGORIES;
  if (!visibleCategories.length) return null;
  const pr  = priceDisplay ? ` ${priceDisplay}` : "";
  const loc = stateName ? ` in ${stateName}` : "";
  return (
    <CardGrid heading={getSectionHeading("category", catName, stateName, priceDisplay)}>
      {visibleCategories.map((cat) => {
        const parts = [makeSlug, cat.slug, stateSlug, filterSlug].filter(Boolean).join("/");
        const label = `${catName ? catName + " " : ""}${cat.name} Caravans for Sale${pr}${loc}`;
        return (
          <a key={cat.slug} href={`/listings/${parts}/`} className="custom-card">
            <h4 className="custom-card-title">{label}</h4>
          </a>
        );
      })}
    </CardGrid>
  );
}

function RegionSectionBlock({
  catName,
  regions,
  catSlug,
  stateName,
  priceDisplay,
  priceSlug,
}: {
  catName: string;
  regions: typeof STATIC_REGIONS;
  catSlug: string | null;
  stateName: string;
  priceDisplay: string;
  priceSlug: string;
}) {
  if (!regions.length) return null;
  return (
    <CardGrid heading={getSectionHeading("region", catName, stateName, priceDisplay)}>
      {regions.map((r) => {
        const base = catSlug ? `/listings/${catSlug}/${r.slug}/` : `/listings/${r.slug}/`;
        const href = priceSlug ? `${base}${priceSlug}/` : base;
        const pr = priceDisplay ? ` ${priceDisplay}` : "";
        const label = catName
          ? r.name.replace("Caravans for Sale", `${catName} Caravans for Sale${pr}`)
          : r.name;
        return (
          <a key={r.slug} href={href} className="custom-card">
            <h4 className="custom-card-title">{label}</h4>
          </a>
        );
      })}
    </CardGrid>
  );
}

// Inject slug segments into a URL only if they aren't already present
function injectSlugIntoUrl(rawUrl: string, filterSlug: string): string {
  if (!filterSlug) return rawUrl;
  let href = rawUrl;
  for (const part of filterSlug.split("/").filter(Boolean)) {
    if (!href.includes(part)) {
      href = href.replace(/\/$/, "") + "/" + part + "/";
    }
  }
  return href;
}

// Append qualifier to a label only if it isn't already present
function appendQualifierToLabel(label: string, qualifier: string): string {
  if (!qualifier || label.toLowerCase().includes(qualifier.toLowerCase())) return label;
  return `${label} ${qualifier}`;
}

function MakeSectionBlock({
  items, catName, stateName, priceDisplay, filterSlug = "", makeCounts = [],
}: {
  items: BottomLinksItem[];
  catName: string;
  stateName: string;
  priceDisplay: string;
  filterSlug?: string;
  makeCounts?: { name: string; slug: string; count: number }[];
}) {
  // Start with FEATURED makes only, then filter by count > 0 from params_count
  let visibleItems = filterFeaturedItems(items, FEATURED_MAKE_NAMES);
  if (makeCounts.length > 0) {
    visibleItems = visibleItems.filter((item) => {
      const featuredName = FEATURED_MAKE_NAMES.find((n) =>
        item.label.toLowerCase().includes(n.toLowerCase())
      );
      if (!featuredName) return false;
      return makeCounts.some(
        (mc) => mc.count > 0 && mc.name.toLowerCase().includes(featuredName.toLowerCase())
      );
    });
  }
  if (!visibleItems.length) return null;
  return (
    <CardGrid heading={getSectionHeading("make", catName, stateName, priceDisplay)}>
      {visibleItems.map((item, i) => {
        const rawHref = item.permalink.replace(/^https?:\/\/[^/]+/, "");
        return (
          <a key={i} href={injectSlugIntoUrl(rawHref, filterSlug)} className="custom-card">
            <h4 className="custom-card-title">{appendQualifierToLabel(item.label, priceDisplay)}</h4>
          </a>
        );
      })}
    </CardGrid>
  );
}

function ApiSectionBlock({
  type, items, catName, stateName, priceDisplay, filterSlug = "",
}: {
  type: SectionType;
  items: BottomLinksItem[];
  catName: string;
  stateName: string;
  priceDisplay: string;
  filterSlug?: string;
}) {
  const heading = getSectionHeading(type, catName, stateName, priceDisplay);
  // Hide items with 0 products under the current filter combo
  const visibleItems = items.filter((i) => i.count > 0);
  if (!heading || !visibleItems.length) return null;
  return (
    <CardGrid heading={heading}>
      {visibleItems.map((item, i) => {
        const rawHref = item.permalink.replace(/^https?:\/\/[^/]+/, "");
        return (
          <a key={i} href={injectSlugIntoUrl(rawHref, filterSlug)} className="custom-card">
            <h4 className="custom-card-title">{appendQualifierToLabel(item.label, priceDisplay)}</h4>
          </a>
        );
      })}
    </CardGrid>
  );
}

function UsedNewSectionBlock({
  type,
  catSlug,
  catName,
  stateName,
  stateSlug,
  priceDisplay,
  priceSlug,
}: {
  type: "used" | "new";
  catSlug: string | null;
  catName: string;
  stateName: string;
  stateSlug: string | null;
  priceDisplay: string;
  priceSlug: string;
}) {
  const mid = [stateSlug, priceSlug].filter(Boolean).join("/");
  const conditionPart = `${type}-condition`;
  const href = catSlug
    ? mid
      ? `/listings/${catSlug}/${mid}/${conditionPart}/`
      : `/listings/${catSlug}/${conditionPart}/`
    : mid
      ? `/listings/${mid}/${conditionPart}/`
      : `/listings/${conditionPart}/`;
  const loc = stateName ? ` in ${stateName}` : "";
  const pr = priceDisplay ? ` ${priceDisplay}` : "";
  const label =
    type === "used"
      ? `Used ${catName ? catName + " " : ""}Caravans for Sale${pr}${loc}`
      : `New ${catName ? catName + " " : ""}Caravans for Sale${pr}${loc}`;
  return (
    <CardGrid heading={getSectionHeading(type, catName, stateName, priceDisplay)}>
      <a href={href} className="custom-card">
        <h4 className="custom-card-title">{label}</h4>
      </a>
    </CardGrid>
  );
}

// ── Main component ────────────────────────────────────────────

export default function ListingBottomSections({
  filters,
  initialData,
  categoryName = "",
  categoryCounts: categoryCountsProp = [],
  makeCounts: makeCountsProp = [],
}: {
  filters: Filters;
  initialData?: BottomLinksData | null;
  categoryName?: string;
  categoryCounts?: { name: string; slug: string; count: number }[];
  makeCounts?: { name: string; slug: string; count: number }[];
}) {
  const [data, setData] = useState<BottomLinksData | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [inView, setInView] = useState(initialData !== undefined);
  const sectionRef = useRef<HTMLDivElement>(null);
  const lastFetchedParamsRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !API_BASE) return;

    const params = getBottomLinksParams(filters);
    const paramsStr = params.toString();

    const hasFilters = !!(
      filters.make || filters.model || filters.category || filters.condition ||
      filters.state || filters.region || filters.suburb ||
      filters.minKg || filters.maxKg ||
      filters.from_length || filters.to_length ||
      filters.from_sleep || filters.to_sleep ||
      filters.from_price || filters.to_price ||
      filters.search || filters.keyword ||
      filters.acustom_fromyears || filters.acustom_toyears
    );

    const cacheKey = paramsStr === "" && hasFilters ? "__hidden__" : paramsStr;

    if (lastFetchedParamsRef.current === undefined) {
      lastFetchedParamsRef.current = cacheKey;
      if (initialData !== undefined) return;
    }
    if (lastFetchedParamsRef.current === cacheKey) return;
    lastFetchedParamsRef.current = cacheKey;

    if (paramsStr === "" && hasFilters) { setData(null); return; }

    setIsLoading(true);
    setData(null);

    fetch(`${API_BASE}/listing-internal-links?${paramsStr}`, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: BottomLinksData | null) => { setData(d); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [
    inView,
    filters.make, filters.model,
    filters.state, filters.region, filters.suburb,
    filters.category, filters.condition,
    filters.minKg, filters.maxKg,
    filters.from_length, filters.to_length,
    filters.from_sleep, filters.to_sleep,
    filters.from_price, filters.to_price,
    filters.search, filters.keyword,
    filters.acustom_fromyears, filters.acustom_toyears,
  ]);


  // ── Filter context ────────────────────────────────────────────
  // filters.category = "off-road" (url builder strips -category suffix)
  // filters.state = "victoria" or "new south wales" (spaces, lowercase)
  const catSlug = filters.category ? `${filters.category}-category` : null;
  const stateSlug = filters.state
    ? `${filters.state.replace(/\s+/g, "-")}-state`
    : null;
  const hasCategory = !!catSlug;
  const hasState = !!stateSlug;
  const hasMake   = !!filters.make;
  const makeSlug  = filters.make || null;

  // Resolve human-readable names (reliable, no API dependency)
  const effectiveCatName =
    categoryName ||
    STATIC_CATEGORIES.find((c) => c.slug === catSlug)?.name ||
    "";
  // Capitalise make slug ("snowy-river" → "Snowy River")
  const makeName = filters.make
    ? filters.make.split(/[-\s]+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "";
  // Combined display name for headings and labels (make + category when both active)
  const displayName = [makeName, effectiveCatName].filter(Boolean).join(" ");
  // "new south wales" → "New South Wales"
  const stateName = filters.state
    ? filters.state.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "";
  const hasPrice  = !!(filters.from_price || filters.to_price);
  const hasSleep  = !!(filters.from_sleep || filters.to_sleep);
  const hasWeight = !!(filters.minKg || filters.maxKg);
  const hasLength = !!(filters.from_length || filters.to_length);
  // Combined display for headings (price + weight + sleep when active)
  const priceDisplay = [
    getPriceDisplay(filters.from_price, filters.to_price),
    getWeightDisplay(filters.minKg, filters.maxKg),
    getSleepDisplay(filters.from_sleep, filters.to_sleep),
  ].filter(Boolean).join(" ");
  const priceSlug  = getPriceSlug(filters.from_price, filters.to_price);
  const weightSlug = getWeightSlug(filters.minKg, filters.maxKg);
  const regionSlug = filters.region
    ? `${filters.region.replace(/\s+/g, "-").toLowerCase()}-region`
    : null;
  const hasRegion = !!regionSlug;
  // filterSlug WITHOUT region (state section links should not carry region)
  const filterSlug = [priceSlug, weightSlug].filter(Boolean).join("/");
  // fullFilterSlug WITH region (all other section links)
  const fullFilterSlug = [regionSlug, priceSlug, weightSlug].filter(Boolean).join("/");
  const hasAnyFilter = !!(
    filters.category || filters.state || filters.make || filters.condition ||
    filters.region || filters.suburb || filters.minKg || filters.maxKg ||
    filters.from_length || filters.to_length ||
    filters.from_sleep || filters.to_sleep ||
    filters.from_price || filters.to_price
  );

  // ── Parse API sections by type ────────────────────────────────
  const apiSections: Partial<Record<SectionType, BottomLinksItem[]>> = {};
  if (data?.sections) {
    for (const s of Object.values(data.sections)) {
      const t = detectSectionType(s.label);
      apiSections[t] = s.items;
    }
  }

  // Region: show all static regions on listing page; filter by API match on filter pages.
  // Fall back to all static regions if API returns no location data for this filter combo.
  const apiRegionItems = apiSections.region ?? [];
  const visibleRegions =
    !hasAnyFilter || apiRegionItems.length === 0
      ? STATIC_REGIONS
      : STATIC_REGIONS.filter((r) =>
          apiRegionItems.some((item) => item.permalink.includes(r.slug))
        );

  return (
    <div ref={sectionRef} className="listing-bottom">
      {/* 1. State — always show unless state filter is active */}
      {!hasState && <StateSectionBlock catName={displayName} catSlug={catSlug} priceDisplay={priceDisplay} priceSlug={filterSlug} />}

      {/* Loading skeleton while API fetches */}
      {isLoading && (
        <div className="quick_links_tabs section-padding pt-4">
          <div className="container">
            <div className="mb-4" style={{ height: 32, width: 260, background: "#e9ecef", borderRadius: 4 }} />
            <div className="custom-card-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 60, background: "#e9ecef", borderRadius: 8 }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API-dependent sections — render once data is ready */}
      {!isLoading && (
        <>
          {/* 2. Category — filtered by API counts; hidden when category filter is active */}
          {!hasCategory && <CategorySectionBlock catName={displayName} stateSlug={stateSlug} stateName={stateName} makeSlug={makeSlug} priceDisplay={priceDisplay} filterSlug={fullFilterSlug} categoryCounts={categoryCountsProp} />}

          {/* 3. Region — hidden when region filter is active */}
          {!hasRegion && <RegionSectionBlock catName={displayName} regions={visibleRegions} catSlug={catSlug} stateName={stateName} priceDisplay={priceDisplay} priceSlug={filterSlug} />}

          {/* 4. Make (when no make filter) or Model (when make filter is active) */}
          {!hasMake && <MakeSectionBlock items={apiSections.make ?? []} catName={displayName} stateName={stateName} priceDisplay={priceDisplay} filterSlug={fullFilterSlug} makeCounts={makeCountsProp} />}
          {hasMake && <ApiSectionBlock type="model" items={apiSections.model ?? []} catName={displayName} stateName={stateName} priceDisplay={priceDisplay} filterSlug={fullFilterSlug} />}

          {/* 5-8. Price / Weight / Length / Sleep — from API; hidden only when that specific filter is already active */}
          {!hasPrice  && <ApiSectionBlock type="price"  items={apiSections.price  ?? []} catName={displayName} stateName={stateName} priceDisplay={priceDisplay} filterSlug={fullFilterSlug} />}
          {!hasWeight && <ApiSectionBlock type="weight" items={apiSections.weight ?? []} catName={displayName} stateName={stateName} priceDisplay={priceDisplay} filterSlug={fullFilterSlug} />}
          {!hasLength && <ApiSectionBlock type="length" items={apiSections.length ?? []} catName={displayName} stateName={stateName} priceDisplay={priceDisplay} filterSlug={fullFilterSlug} />}
          {!hasSleep  && <ApiSectionBlock type="sleep"  items={apiSections.sleep  ?? []} catName={displayName} stateName={stateName} priceDisplay={priceDisplay} filterSlug={fullFilterSlug} />}
        </>
      )}

      {/* 9-10. Used / New — always show */}
      {!isLoading && (
        <>
          <UsedNewSectionBlock type="used" catSlug={catSlug} catName={displayName} stateName={stateName} stateSlug={stateSlug} priceDisplay={priceDisplay} priceSlug={fullFilterSlug} />
          <UsedNewSectionBlock type="new"  catSlug={catSlug} catName={displayName} stateName={stateName} stateSlug={stateSlug} priceDisplay={priceDisplay} priceSlug={fullFilterSlug} />
        </>
      )}
    </div>
  );
}
