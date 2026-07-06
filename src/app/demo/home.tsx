"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import StateHero from "./StateHero";
import StateFilterBar, { FilterState } from "./StateFilterBar";
import StateListingGrid from "./StateListingGrid";
import StateBrowseSection from "./StateBrowseSection";
import StateContent from "./StateContent";
import { buildDemoSlug } from "./urlUtils";
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

const ORDERBY = "default";
const SEED_MAX = 15;

function buildApiUrl(base: string, filters: FilterState, seed: number, lockCondition?: string): string {
  const params = new URLSearchParams();
  params.set("state", "victoria");
  params.set("orderby", ORDERBY);
  params.set("seed", String(seed));
  if (filters.category)           params.set("category",          filters.category);
  if (filters.make)               params.set("make",               filters.make);
  if (filters.model)              params.set("model",              filters.model);
  if (filters.region)             params.set("region",             filters.region);
  if (filters.suburb)             params.set("suburb",             filters.suburb);
  if (filters.pincode)            params.set("pincode",            filters.pincode);
  if (filters.from_price)         params.set("from_price",         String(filters.from_price));
  if (filters.to_price)           params.set("to_price",           String(filters.to_price));
  if (filters.minKg)              params.set("from_atm",           String(filters.minKg));
  if (filters.maxKg)              params.set("to_atm",             String(filters.maxKg));
  if (filters.from_sleep)         params.set("from_sleep",         String(filters.from_sleep));
  if (filters.to_sleep)           params.set("to_sleep",           String(filters.to_sleep));
  if (filters.acustom_fromyears)  params.set("acustom_fromyears",  String(filters.acustom_fromyears));
  if (filters.acustom_toyears)    params.set("acustom_toyears",    String(filters.acustom_toyears));
  if (filters.from_length)        params.set("from_length",        String(filters.from_length));
  if (filters.to_length)          params.set("to_length",          String(filters.to_length));
  if (filters.keyword)            params.set("keyword",            filters.keyword);
  if (!lockCondition && filters.condition) params.set("condition", filters.condition);
  if (lockCondition) params.set("condition", lockCondition);
  return `${base}&${params.toString()}`;
}

interface Props {
  initialFilters: FilterState;
}

export default function StateHome({ initialFilters }: Props) {
  const [filters,  setFilters]  = useState<FilterState>(initialFilters);
  const [page,     setPage]     = useState(1);
  const [maxPages, setMaxPages] = useState(1);
  const [clickid,  setClickid]  = useState<string | null>(null);
  const [ready,    setReady]    = useState(false);

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

  // pool_test's `seed` param cycles 1-15, keyed off the current page number
  const seed = ((page - 1) % SEED_MAX) + 1;
  console.log("[StateHome] page:", page, "seed:", seed);

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

  const handleTotalPages = (n: number) => setMaxPages(prev => Math.max(prev, n));

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
    const featuredUrl = buildApiUrl("/api/pool-listings/?per_page=8&featured=1", filters, seed);
    const newUrl      = buildApiUrl("/api/pool-listings/?per_page=8", filters, seed, "new");
    const usedUrl     = buildApiUrl("/api/pool-listings/?per_page=8", filters, seed, "used");

    return (
      <div className="lsd-page">
        <StateHero />

        <StateFilterBar
          currentFilters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
        />

        <StateListingGrid
          title="Featured Caravans for Sale in Victoria"
          viewAllHref="/listings/?state=victoria&featured=1"
          apiUrl={featuredUrl}
          showSpotlight={!hasActiveFilters}
          hideViewAll
          page={page}
          onTotalPages={handleTotalPages}
          maxItems={8}
        />

        <StateListingGrid
          title="New Caravans for Sale in Victoria"
          viewAllHref="/listings/new-caravans/?state=victoria"
          apiUrl={newUrl}
          page={page}
          onTotalPages={handleTotalPages}
          maxItems={8}
        />

        <StateListingGrid
          title="Used Caravans for Sale in Victoria"
          viewAllHref="/listings/used-caravans/?state=victoria"
          apiUrl={usedUrl}
          page={page}
          onTotalPages={handleTotalPages}
          maxItems={8}
        />

        {maxPages > 1 && pagination}

        <StateBrowseSection />
        <StateContent />
      </div>
    );
  }

  // page > 1 — combined single grid across all listings
  const allUrl = buildApiUrl("/api/pool-listings/?per_page=24", filters, seed);

  return (
    <div className="lsd-page">
      <div className="lsd-paged-header">
        <div className="container">
          <nav className="lsd-paged-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <svg width="10" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            <Link href="/listings/">Caravans for Sale</Link>
            <svg width="10" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            <span>Victoria</span>
          </nav>
          <h1 className="lsd-paged-title">Caravans for Sale in Victoria</h1>
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
        maxItems={24}
      />

      {maxPages > 1 && pagination}

      <StateBrowseSection />
      <StateContent />
    </div>
  );
}
