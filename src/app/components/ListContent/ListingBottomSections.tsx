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
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Sync when server provides new initialData (soft navigation to new URL)
  useEffect(() => {
    if (initialData !== undefined) {
      setData(initialData ?? null);
      if (initialData?.sections) {
        setActiveTab(Object.keys(initialData.sections)[0] ?? "");
        setVisibleCount(PAGE_SIZE);
      }
    }
  }, [initialData]);

  // IntersectionObserver: only needed as fallback when no server data
  useEffect(() => {
    if (initialData) return;
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [initialData]);

  // Client-side fetch: fallback only when no server data and section is in view
  useEffect(() => {
    if (initialData !== undefined || !inView || !API_BASE) return;
    const params = getBottomLinksParams(filters);

    setIsLoading(true);
    setData(null);

    fetch(`${API_BASE}/listing-internal-links?${params.toString()}`, {
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
    inView, initialData,
    filters.make, filters.model,
    filters.state, filters.region, filters.suburb,
    filters.category,
    filters.minKg, filters.maxKg,
    filters.from_length, filters.to_length,
    filters.from_sleep, filters.to_sleep,
    filters.from_price, filters.to_price,
  ]);

  const sections = data?.sections ? Object.entries(data.sections) : [];
  const activeSection = data?.sections?.[activeTab];
  const totalItems = activeSection?.items.length ?? 0;
  const hasMore = visibleCount < totalItems;

  function handleTabClick(key: string) {
    setActiveTab(key);
    setVisibleCount(PAGE_SIZE);
  }

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
                      <a href={item.permalink} className="custom-card" key={idx}>
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
