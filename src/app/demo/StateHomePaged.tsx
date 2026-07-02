"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StateFilterBar, { FilterState } from "./StateFilterBar";
import StateListingGrid from "./StateListingGrid";
import StateBrowseSection from "./StateBrowseSection";
import StateContent from "./StateContent";
import "./main.css";

function buildApiUrl(base: string, filters: FilterState, lockCondition?: string): string {
  const params = new URLSearchParams();
  params.set("state", "victoria");
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

export default function StateHomePaged({ initialPage }: { initialPage: number }) {
  const router = useRouter();
  const [filters,  setFilters]  = useState<FilterState>({});
  const [page,     setPage]     = useState(initialPage);
  const [maxPages, setMaxPages] = useState(1);

  useEffect(() => {
    setPage(initialPage);
    setMaxPages(1);
  }, [initialPage]);

  const handleFilterChange = (f: FilterState) => { setFilters(f); setPage(1); setMaxPages(1); };
  const handleClearAll     = ()              => { setFilters({}); setPage(1); setMaxPages(1); };

  const hasActiveFilters = !!(
    filters.category || filters.condition || filters.make ||
    filters.from_price || filters.to_price || filters.minKg || filters.maxKg ||
    filters.region || filters.suburb || filters.from_sleep || filters.to_sleep ||
    filters.acustom_fromyears || filters.from_length || filters.keyword
  );

  const allUrl = buildApiUrl("/api/listings?per_page=24", filters);

  const handleTotalPages = (n: number) => setMaxPages(prev => Math.max(prev, n));

  const goToPage = (p: number) => {
    setPage(p);
    setMaxPages(1);
    router.push(p === 1 ? '/demo/' : `/demo/page${p}/`);
  };

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
        hideTitle
        hideViewAll
        page={page}
        onTotalPages={handleTotalPages}
      />

      {maxPages > 1 && (
        <div className="pagination-wrapper">
          <nav className="woocommerce-pagination custom-pagination">
            <ul className="pagination-icons">
              <li>
                <button className="prev-icon" onClick={() => goToPage(page - 1)} disabled={page === 1}>
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 1L1 6l5 5"/>
                  </svg>
                  Back
                </button>
              </li>
              <li className="page-count">page {page} of {maxPages}</li>
              <li>
                <button className="next-icon" onClick={() => goToPage(page + 1)} disabled={page === maxPages}>
                  Next
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 1l5 5-5 5"/>
                  </svg>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      <StateBrowseSection />
      <StateContent />
    </div>
  );
}
