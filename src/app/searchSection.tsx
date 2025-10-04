// src/app/components/SearchSection.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import {
  fetchHomeSearchList, // GET /home_search (base list)
  fetchKeywordSuggestions, // GET /home_search/?keyword=<q> (typed list)
} from "@/api/homeSearch/api";
import Image from "next/image";

type Item = {
  title?: string;
  name?: string;
  heading?: string;
  make?: string;
  url?: string;
  model?: string;
  variant?: string;
  slug?: string | number;
  id?: string | number;
  label?: string;
} & Record<string, unknown>;

// Safe label extractor (avoid mixing ?? and || without parens)
const labelOf = (x: Item): string => {
  const basic =
    x?.title ??
    x?.name ??
    x?.heading ??
    [x?.make, x?.model, x?.variant].filter(Boolean).join(" ");
  return (basic && String(basic).trim()) || String(x?.slug ?? x?.id ?? "");
};

export default function SearchSection() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [navigating, setNavigating] = useState(false);

  const [isSuggestionBoxOpen, setIsSuggestionBoxOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const [baseSuggestions, setBaseSuggestions] = useState<Item[]>([]); // list for first-click
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // ------------- base list (first click) ---  const [loading, setLoading] = useState<string | null>(null);----------
  const loadBaseOnce = async () => {
    if (baseSuggestions.length) {
      setSuggestions(baseSuggestions);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await fetchHomeSearchList();

      const labels: Item[] = data.map((x: any) => ({
        id: x.id,
        label: (x.name || "").toString().trim(), // ✅ normalize "name"
        url: x.url || "",
      }));

      setBaseSuggestions(labels);
      setSuggestions(labels);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = async () => {
    setIsSuggestionBoxOpen(true);

    // ✅ Only load base list when input is empty
    if (!query.trim()) {
      await loadBaseOnce();
    }
  };

  const closeSuggestions = () => setIsSuggestionBoxOpen(false);

  // ------------- typed suggestions (≥ 3 chars) -------------
  useEffect(() => {
    const controller = new AbortController();

    if (query.length >= 3) {
      setLoading(true);
      setError("");
      const t = setTimeout(async () => {
        try {
          const list = await fetchKeywordSuggestions(query, controller.signal);
          console.log("list", list);
          // Normalize into Item[]
          const uniq: Item[] = Array.from(
            new Map(
              list.map((x: any, idx: number) => [
                (x.keyword || "").toString().trim(),
                {
                  id: x.id ?? idx, // fallback id
                  label: (x.keyword || "").toString().trim(), // ✅ always set label
                  url: (x.url || "").toString(),
                },
              ])
            ).values()
          );

          console.log("search suggestions", uniq); // 🐞 debug log
          setSuggestions(uniq);
        } catch (e: unknown) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setError(e instanceof Error ? e.message : "Failed");
        } finally {
          setLoading(false);
        }
      }, 300);

      return () => {
        controller.abort();
        clearTimeout(t);
      };
    } else {
      setSuggestions(baseSuggestions);
      setLoading(false);
      return () => controller.abort();
    }
  }, [query, baseSuggestions]);

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setQuery(e.target.value);
    if (!isSuggestionBoxOpen) setIsSuggestionBoxOpen(true);
  };

  //   const navigateWithKeyword = (kwRaw: string) => {
  //     const kw = kwRaw.trim();
  //     if (!kw) return;
  //     // Put value in input for UX
  //     if (searchInputRef.current) searchInputRef.current.value = kw;
  //     // Navigate: /listings/?keyword=<kw>
  //     router.push(`/listings/?keyword=${encodeURIComponent(kw)}`);
  //     // Optional: close dropdown
  //     setIsSuggestionBoxOpen(false);
  //   };
  // ------------- navigate helper (two routes) -------------
  const navigateWithKeyword = (s: Item) => {
    const human = s.label?.trim();
    if (!human) return;

    flushSync(() => setQuery(human));
    setIsSuggestionBoxOpen(false);

    if (s.url && s.url.trim().length > 0) {
      router.push(s.url, { scroll: true });
    } else {
      const encoded = encodeURIComponent(human).replace(/%20/g, "+");
      router.push(`/listings/?search=${encoded}`, { scroll: true });
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      // Enter uses typed query directly
      const kw = (e.currentTarget as HTMLInputElement).value.trim();
      if (kw) {
        navigateWithKeyword({ name: kw });
      }
    }
    if (e.key === "Escape") closeSuggestions();
  };

  const showingFromKeywordApi = query.length >= 3;

  return (
    <div>
      <div className="container">
        <div className="row align-items-center justify-content-center">
          <div className="col-lg-12">
            <div className="section-head text-center">
              <h1 className="divide-orange">
                Browse New & Used Caravans For Sale
              </h1>
              <p>
                CFS is dedicated to revolutionising your caravan buying
                experience.
              </p>

              {/* overlay to close */}
              <div
                className="overlay_search"
                style={{ display: isSuggestionBoxOpen ? "block" : "none" }}
                onClick={closeSuggestions}
              />

              {/* search box */}
              <div className="search-container">
                <div className="search-wrapper">
                  <i className="bi bi-search search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="search-box"
                    placeholder="Search by caravans..."
                    id="searchInput"
                    autoComplete="off"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={showSuggestions}
                    onClick={showSuggestions}
                    onKeyDown={handleKeyDown}
                    aria-haspopup="listbox"
                    aria-expanded={isSuggestionBoxOpen}
                  />
                  <div
                    className="close-btn"
                    style={{ display: isSuggestionBoxOpen ? "block" : "none" }}
                    onClick={closeSuggestions}
                    role="button"
                    aria-label="Close suggestions"
                  >
                    <i className="bi bi-x-lg" />
                  </div>
                </div>

                {/* dropdown */}
                <div
                  className="suggestions"
                  style={{ display: isSuggestionBoxOpen ? "block" : "none" }}
                  role="listbox"
                >
                  <h4>
                    {showingFromKeywordApi
                      ? "Suggested searches"
                      : "Popular searches"}
                  </h4>

                  {error && <p className="text-red-600">{error}</p>}
                  {!error && loading && <p>Loading…</p>}

                  {!error && !loading && (
                    <ul className="text-left" id="suggestionList">
                      {suggestions?.length ? (
                        suggestions.map((s, idx) => (
                          <li
                            key={`${s.label}-${idx}`}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              navigateWithKeyword(s);
                            }}
                            style={{ cursor: "pointer" }}
                            role="option"
                            aria-selected="false"
                          >
                            {s.label}
                          </li>
                        ))
                      ) : (
                        <li className="text-muted">No matches</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* quick links */}
              <div className="row justify-content-center mt-3">
                <div className="col-lg-3 col-4">
                  <Link
                    href="/listings/new-condition/"
                    className="btn btn-primary"
                    onClick={() => setNavigating(true)}
                  >
                    NEW{" "}
                  </Link>
                </div>
                <div className="col-lg-3 col-4">
                  <Link
                    href="/listings/used-condition/"
                    className="btn btn-primary"
                    onClick={() => setNavigating(true)}
                  >
                    Used
                  </Link>
                </div>
                <div className="col-lg-3 col-4">
                  <Link
                    href="/listings/"
                    className="btn btn-primary"
                    onClick={() => setNavigating(true)}
                  >
                    All
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {navigating && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
          }}
          aria-live="polite"
        >
          <div className="text-center">
            <Image
              className="loader_image"
              src="/images/loader.gif" // place inside public/images
              alt="Loading..."
              width={80}
              height={80}
              unoptimized
            />{" "}
            <div className="mt-2 fw-semibold">Loading…</div>
          </div>
        </div>
      )}
    </div>
  );
}
