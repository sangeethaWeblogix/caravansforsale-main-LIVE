"use client";
import React, { useEffect, useRef, useState } from "react";
import TabCardSkeleton from "../TabCardSkeleton";
import "../../home/main.css?=4";
import type { Filters } from "./Listings";
import { getBottomLinksParams } from "@/api/bottomLinks/api";
import type { BottomLinksData } from "@/api/bottomLinks/api";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

const PAGE_SIZE = 30;

export default function ListingBottomSections({
  filters,
  initialData,
}: {
  filters: Filters;
  initialData?: BottomLinksData | null;
}) {
  const [data, setData] = useState<BottomLinksData | null>(initialData ?? null);
  const [activeTab, setActiveTab] = useState<string>(
    initialData?.sections ? Object.keys(initialData.sections)[0] : ""
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  // If server provided initialData, start as in-view so filter changes fetch immediately
  const [inView, setInView] = useState(initialData !== undefined);
  const sectionRef = useRef<HTMLDivElement>(null);
  // tracks the last params string we fetched — undefined = never fetched
  const lastFetchedParamsRef = useRef<string | undefined>(undefined);

  // IntersectionObserver: always set up on mount
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Client-side fetch: re-runs whenever filters change.
  // updateURLWithFilters uses window.history.pushState (not router.push),
  // so the server component never re-renders after initial load.
  // This effect is the only mechanism that keeps bottom links in sync with filters.
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

    // Sentinel distinguishes "no filter" (paramsStr="") from "unsupported combo" (paramsStr="" + hasFilters)
    // Both produce empty paramsStr but need different behaviour — without this, dedup blocks the hide
    const cacheKey = (paramsStr === "" && hasFilters) ? "__hidden__" : paramsStr;

    // First time section comes into view: if server provided initialData, trust it
    // and skip the redundant initial fetch
    if (lastFetchedParamsRef.current === undefined) {
      lastFetchedParamsRef.current = cacheKey;
      if (initialData !== undefined) return;
    }

    // Same state as last fetch — no change needed
    if (lastFetchedParamsRef.current === cacheKey) return;
    lastFetchedParamsRef.current = cacheKey;

    // Unsupported filter combo — hide section
    if (paramsStr === "" && hasFilters) { setData(null); return; }

    setIsLoading(true);
    setData(null);

    fetch(`${API_BASE}/listing-internal-links?${paramsStr}`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: BottomLinksData | null) => {
        setData(d);
        if (d?.sections) {
          setActiveTab(Object.keys(d.sections)[0] ?? "");
          setVisibleCount(PAGE_SIZE);
        }
      })
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

  const sections = data?.sections ? Object.entries(data.sections) : [];
  const activeSection = data?.sections?.[activeTab];
  const totalItems = activeSection?.items.length ?? 0;
  const hasMore = visibleCount < totalItems;

  function handleTabClick(key: string) {
    setActiveTab(key);
    setVisibleCount(PAGE_SIZE);
  }

  if (!isLoading && sections.length === 0) return null;

  return (
    <div ref={sectionRef} className="quick_links_tabs section-padding pt-4">
      <div className="container">
        <div className="section-head mt-2 mb-4">
          <h2>{data?.heading || "Popular Caravan Searches"}</h2>
        </div>
        <div className="custom-tabs-wrap">
          <div className="custom-tabs-top">
            <div className="custom-tabs-nav">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 80,
                        height: 34,
                        borderRadius: 6,
                        background: "#e9ecef",
                        display: "inline-block",
                        marginRight: 8,
                      }}
                    />
                  ))
                : sections.map(([key, section]) => (
                    <button
                      key={key}
                      className={`custom-tab-btn ${activeTab === key ? "active" : ""}`}
                      onClick={() => handleTabClick(key)}
                      type="button"
                    >
                      {section.label}
                    </button>
                  ))}
            </div>
          </div>
          <div className="custom-tabs-content">
            {isLoading ? (
              <div className="custom-card-grid" style={{ display: "grid" }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TabCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              sections.map(([key, section]) => (
                <div
                  key={key}
                  style={{ display: activeTab === key ? "block" : "none" }}
                >
                  <div className="custom-card-grid">
                    {section.items.slice(0, visibleCount).map((item, idx) => (
                      <a href={item.permalink.replace(/^https?:\/\/[^/]+/, "")} className="custom-card" key={idx}>
                        <h4 className="custom-card-title">
                          <span className="count">{item.count}</span>{" "}
                          {item.label}
                        </h4>
                      </a>
                    ))}
                  </div>
                  {activeTab === key && hasMore && (
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        className="btn btn-outline-secondary px-4"
                        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      >
                        View More ({totalItems - visibleCount} remaining)
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
