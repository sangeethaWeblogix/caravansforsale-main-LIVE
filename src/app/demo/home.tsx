"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import StateHero from "./StateHero";
import StateFilterBar, { FilterState } from "./StateFilterBar";
import StateListingGrid, { SeoV2, Listing, buildFeaturedOrder } from "./StateListingGrid";
import StateBrowseSection from "./StateBrowseSection";
import StateContent from "./StateContent";
import { buildDemoSlug, buildApiUrl, buildListingsSlug } from "./urlUtils";
import "./main.css";

// clickid pagination — same scheme as /listings/: no ?page=N in the URL,
// instead a random ?clickid= id maps (via localStorage, with a `pN` suffix
// fallback baked into the id) to the page it represents. This lets a
// hard refresh on a paginated URL restore the right page.
const PAGE_KEY = (id: string) => `page_${id}`;
const readPage = (id: string): number | null => {
  try {
    const v = localStorage.getItem(PAGE_KEY(id));
    if (v) return parseInt(v, 10);
  } catch {}
  const match = id.match(/p(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

const SEED_MAX = 15;

interface Props {
  initialFilters: FilterState;
}

export default function StateHome({ initialFilters }: Props) {
  const [filters,  setFilters]  = useState<FilterState>(initialFilters);
  const [page,     setPage]     = useState(1);
  const [maxPages, setMaxPages] = useState(1);
  const [clickid,  setClickid]  = useState<string | null>(null);
  const [ready,    setReady]    = useState(false);
  const [seo,      setSeo]      = useState<SeoV2 | null>(null);
  const [newSeo,   setNewSeo]   = useState<SeoV2 | null>(null);
  const [usedSeo,  setUsedSeo]  = useState<SeoV2 | null>(null);
  const [seed,     setSeed]     = useState(1);
  const [pool,     setPool]     = useState<{ featured: Listing[]; new: Listing[]; used: Listing[] }>({ featured: [], new: [], used: [] });
  const [poolLoading, setPoolLoading] = useState(true);
  // false whenever the backend can't tell New apart from Used in this pool
  // (e.g. a condition filter is already locked in) — in that case there's
  // nothing to split, so page 1 shows one combined grid instead of a
  // fabricated Featured/New/Used split.
  const [slotBucketPresent, setSlotBucketPresent] = useState(true);
  // Whether the current canonical /listings/ URL is in url.csv's curated
  // indexed set — gates the full hero banner (image + description) and the
  // Featured/New/Used split, both of which are only worth it on the pages
  // that are actually meant to be indexed/crawled.
  const [isIndexed, setIsIndexed] = useState(true);
  console.log("seoo89", seo)

  // Push the API's seo_v2 into the browser tab title + meta description.
  useEffect(() => {
    if (!seo) return;
    if (seo.meta_title) document.title = seo.meta_title;
    if (seo.meta_description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", seo.meta_description);
    }
  }, [seo]);

  // Restore page from ?clickid= on mount (hard refresh / shared link) before
  // the grids below fetch anything, so they fetch the right page just once.
  useEffect(() => {
    const cid = new URLSearchParams(window.location.search).get("clickid");
    if (cid) {
      const saved = readPage(cid);
      if (saved && saved > 0) {
        setClickid(cid);
        setPage(saved);
      }
    }

    // seed stays fixed for this browser session (persisted via sessionStorage)
    // instead of changing every time the page changes — a fresh session (new
    // tab/browser) gets a fresh random seed.
    try {
      const stored = sessionStorage.getItem("demo_seed");
      if (stored) {
        setSeed(parseInt(stored, 10));
      } else {
        const fresh = Math.floor(Math.random() * SEED_MAX) + 1;
        sessionStorage.setItem("demo_seed", String(fresh));
        setSeed(fresh);
      }
    } catch {
      setSeed(Math.floor(Math.random() * SEED_MAX) + 1);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const cid = new URLSearchParams(window.location.search).get("clickid");
      if (cid) {
        const saved = readPage(cid);
        setClickid(cid);
        setPage(saved && saved > 0 ? saved : 1);
      } else {
        setClickid(null);
        setPage(1);
      }
      setMaxPages(1);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  console.log("[StateHome] page:", page, "seed:", seed);

  const handleTotalPages = (n: number) => setMaxPages(prev => Math.max(prev, n));

  useEffect(() => {
    if (page !== 1) return;
    const canonicalPath = buildListingsSlug(filters);
    fetch(`/api/indexed-url/?path=${encodeURIComponent(canonicalPath)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setIsIndexed(json?.indexed ?? false))
      .catch(() => setIsIndexed(false));
  }, [filters, page]);

  // Page 1 uses ONE shared pool call (same shape as before, just no condition
  // lock + a bigger per_page) split by slot_bucket into Featured/New/Used —
  // instead of 3 separate condition-locked API calls.
  const poolApiUrl = buildApiUrl("/api/pool-listings/?per_page=24", filters, seed);

  useEffect(() => {
    if (page !== 1) return;
    setPoolLoading(true);
    const requestUrl = `${poolApiUrl}&page=${page}`;
    const absoluteUrl = new URL(requestUrl, window.location.origin).toString();
    console.log("[StateHome] shared pool API:", absoluteUrl);

    fetch(requestUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        console.log("[StateHome] shared pool API response:", json);

        const products: Listing[]      = json?.data?.products ?? json?.products ?? [];
        const premiumsRaw: Listing[]   = json?.data?.premium_products ?? json?.premium_products ?? [];
        const exclusivesRaw: Listing[] = json?.data?.exclusive_products ?? json?.exclusive_products ?? [];
        const empExclusivesRaw: Listing[] = json?.data?.emp_exclusive_products ?? json?.emp_exclusive_products ?? [];
        const totalCount: number = json?.data?.counts?.total_count ?? json?.counts?.total_count ?? products.length;
        const bucketPresent: boolean =
          json?.data?.pagination?.slot_bucket_present ?? json?.pagination?.slot_bucket_present ?? false;
        console.log("[StateHome] slot_bucket_present:", bucketPresent);
        setSlotBucketPresent(bucketPresent);

        if (totalCount === 0 && empExclusivesRaw.length > 0) {
          // No products at all — fall back to the emp_exclusive_products pool
          // so the page isn't empty, all shown with the Spotlight Van design.
          const empItems = empExclusivesRaw.map((p) => ({ ...p, is_exclusive: true }));
          setPool({ featured: empItems, new: [], used: [] });
        } else if (bucketPresent) {
          // The API tags products with slot_bucket — use it to pick exactly
          // which products feed Featured/New/Used. Premium and exclusive vans
          // always come from their own top-level arrays and only render on
          // the Featured tab (position 3 = exclusive, 4-5 = premium).
          const featuredSource = products.filter((p) => p.slot_bucket === "featured");
          const featuredItems  = buildFeaturedOrder(featuredSource, premiumsRaw, exclusivesRaw).slice(0, 8);
          const featuredIds    = new Set(featuredItems.map((p) => p.id));

          const newItems  = products.filter((p) => p.slot_bucket === "new"  && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id)).slice(0, 8);
          const usedItems = products.filter((p) => p.slot_bucket === "used" && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id)).slice(0, 8);

          setPool({ featured: featuredItems, new: newItems, used: usedItems });
        } else {
          // No bucket signal (e.g. a condition filter is already locked in,
          // so every item is the same condition already) — nothing to split
          // into New/Used, show one combined list instead.
          const combined = buildFeaturedOrder(products, premiumsRaw, exclusivesRaw);
          setPool({ featured: combined, new: [], used: [] });
        }

        handleTotalPages(json?.pagination?.total_pages ?? 1);
        const seoData = json?.data?.seo_v2 ?? json?.seo_v2;
        if (seoData) setSeo(seoData);
      })
      .catch(() => setPool({ featured: [], new: [], used: [] }))
      .finally(() => setPoolLoading(false));
  }, [poolApiUrl, page]);

  // Only split into Featured/New/Used when the backend actually supports the
  // split (slot_bucket_present) AND this URL is one url.csv curates as
  // indexed — non-indexed pages (condition-only, deep filter combos, etc.)
  // always get a single combined grid regardless of what the backend returns.
  const showSplitSections = isIndexed && slotBucketPresent;

  // New/Used grid headings need their own condition-locked seo_v2 (the shared
  // pool call above is unlocked, so its seo_v2 only covers the page overall).
  // Featured reuses that page-level seo since there's no dedicated "featured"
  // seo concept on the backend. Skipped entirely once split sections aren't
  // being shown (nothing to show these titles on).
  useEffect(() => {
    if (page !== 1 || !showSplitSections) {
      setNewSeo(null);
      setUsedSeo(null);
      return;
    }
    const newUrl  = `${buildApiUrl("/api/pool-listings/?per_page=1", filters, seed, "New")}&page=1`;
    const usedUrl = `${buildApiUrl("/api/pool-listings/?per_page=1", filters, seed, "Used")}&page=1`;

    fetch(newUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setNewSeo(json?.data?.seo_v2 ?? json?.seo_v2 ?? null))
      .catch(() => setNewSeo(null));

    fetch(usedUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setUsedSeo(json?.data?.seo_v2 ?? json?.seo_v2 ?? null))
      .catch(() => setUsedSeo(null));
  }, [filters, seed, page, showSplitSections]);

  const pushFiltersToUrl = (f: FilterState) => {
    window.history.pushState({}, "", buildDemoSlug(f));
  };

  const handleFilterChange = (f: FilterState) => {
    setFilters(f); setPage(1); setMaxPages(1); setClickid(null);
    pushFiltersToUrl(f);
  };
  const handleClearAll = () => {
    setFilters({}); setPage(1); setMaxPages(1); setClickid(null);
    pushFiltersToUrl({});
  };

  const hasActiveFilters = !!(
    filters.category || filters.condition || filters.make ||
    filters.from_price || filters.to_price || filters.minKg || filters.maxKg ||
    filters.region || filters.suburb || filters.from_sleep || filters.to_sleep ||
    filters.acustom_fromyears || filters.from_length || filters.keyword
  );

  const handleNextPage = () => {
    if (page >= maxPages) return;
    const nextPage = page + 1;
    const id = uuidv4();
    try { localStorage.setItem(PAGE_KEY(id), String(nextPage)); } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("clickid", id);
    window.history.pushState({}, "", url.toString());
    setClickid(id);
    setPage(nextPage);
    setMaxPages(1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handlePrevPage = () => {
    if (page <= 1) return;
    const prevPage = page - 1;
    const url = new URL(window.location.href);
    if (prevPage <= 1) {
      url.searchParams.delete("clickid");
      setClickid(null);
    } else {
      const id = uuidv4();
      try { localStorage.setItem(PAGE_KEY(id), String(prevPage)); } catch {}
      url.searchParams.set("clickid", id);
      setClickid(id);
    }
    window.history.pushState({}, "", url.toString());
    setPage(prevPage);
    setMaxPages(1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const pagination = (
    <div className="pagination-wrapper">
      <nav className="woocommerce-pagination custom-pagination">
        <ul className="pagination-icons">
          <li>
            <button className="prev-icon" onClick={handlePrevPage} disabled={page === 1}>
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 1L1 6l5 5"/>
              </svg>
              Back
            </button>
          </li>
          <li className="page-count">Page {page} of {maxPages}</li>
          <li>
            <button className="next-icon" onClick={handleNextPage} disabled={page === maxPages}>
              Next
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 1l5 5-5 5"/>
              </svg>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );

  if (!ready) return null;

  if (page === 1) {
    console.log("seooo", seo?.h1)
    return (
      <div className="lsd-page">
        {/* Non-indexed pages skip the hero entirely (no banner, no
            breadcrumb, no whitespace) — the grid title below becomes the
            page's <h1> instead. */}
        {isIndexed && <StateHero title={seo?.h1} description={seo?.meta_description} />}


        <StateFilterBar
          currentFilters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
        />

        {showSplitSections ? (
          <>
            <StateListingGrid
              title={seo?.meta_title ? `Featured ${seo.meta_title}` : "Featured Caravans for Sale"}
              viewAllHref={`${buildListingsSlug(filters)}?featured=1`}
              items={pool.featured}
              loading={poolLoading}
              showSpotlight={!hasActiveFilters}
              hideViewAll
            />

            <StateListingGrid
              title={newSeo?.meta_title || "New Caravans for Sale"}
              viewAllHref={buildListingsSlug(filters, "New")}
              items={pool.new}
              loading={poolLoading}
            />

            <StateListingGrid
              title={usedSeo?.meta_title || "Used Caravans for Sale"}
              viewAllHref={buildListingsSlug(filters, "Used")}
              items={pool.used}
              loading={poolLoading}
            />
          </>
        ) : (
          // Backend collapsed the New/Used split (e.g. a condition filter is
          // already active) — one combined grid instead of a fabricated split.
          // Non-indexed pages skip the hero, so this title carries the page's
          // actual <h1> (with count) instead of the hero's h1.
          <StateListingGrid
            title={!isIndexed ? (seo?.h1 || "Caravans for Sale") : (seo?.meta_title || "Caravans for Sale")}
            titleAs={!isIndexed ? "h1" : "h2"}
            viewAllHref={buildListingsSlug(filters)}
            items={pool.featured}
            loading={poolLoading}
            showSpotlight={!hasActiveFilters}
          />
        )}

        {maxPages > 1 && pagination}

        <StateBrowseSection state={filters.state} region={filters.region} category={filters.category} />
        <StateContent footerDescription={seo?.footer_description} faq={seo?.faq} />
      </div>
    );
  }

  // page > 1 — combined single grid across all listings
  const allUrl = buildApiUrl("/api/pool-listings/?per_page=24", filters, seed);

  return (
    <div className="lsd-page">
      <div className="lsd-paged-header">
        <div className="container">
          {/* <nav className="lsd-paged-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <svg width="10" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            <Link href="/listings/">Caravans for Sale</Link>
            <svg width="10" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            <span>Victoria</span>
          </nav> */}
          <h1 className="lsd-paged-title">{seo?.h1 || "Caravans for Sale in Victoria"}</h1>
        </div>
      </div>

      <StateFilterBar
        currentFilters={filters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
      />

      <StateListingGrid
        title="Caravans for Sale in Victoria"
        viewAllHref="/listings/?state=victoria"
        apiUrl={allUrl}
        showSpotlight={!hasActiveFilters}
        hideViewAll
        hideTitle
        page={page}
        onTotalPages={handleTotalPages}
        onSeo={setSeo}
        maxItems={24}
      />

      {maxPages > 1 && pagination}

      <StateBrowseSection state={filters.state} region={filters.region} category={filters.category} />
      <StateContent footerDescription={seo?.footer_description} faq={seo?.faq} />
    </div>
  );
}
