  // src/app/components/SearchSection.tsx
  "use client";
  import "bootstrap/dist/css/bootstrap.min.css";
 //  import "bootstrap/dist/js/bootstrap.bundle.min.js";
  import React, { useEffect, useRef, useState } from "react";
  import Link from "next/link";
  import Image from "next/image";
  import { useRouter } from "next/navigation";
  import { flushSync } from "react-dom";
  import {
    fetchHomeSearchList, // GET /home_search (base list)
    fetchKeywordSuggestions, // GET /home_search/?keyword=<q> (typed list)
  } from "@/api/homeSearch/api";
import { BiChevronDown } from "react-icons/bi";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
  
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
 //  const labelOf = (x: Item): string => {
 //    const basic =
 //      x?.title ??
 //      x?.name ??
 //      x?.heading ??
 //      [x?.make, x?.model, x?.variant].filter(Boolean).join(" ");
 //    return (basic && String(basic).trim()) || String(x?.slug ?? x?.id ?? "");
 //  };
  
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
      const [category, setCategory] = useState("");
 const [location, setLocation] = useState("");
 const [conditionValue, setConditionValue] = useState("");
 const isSearchEnabled = category || location || conditionValue;
// const [openCategory, setOpenCategory] = useState(false);
// const [openLocation, setOpenLocation] = useState(false);
// const [openCondition, setOpenCondition] = useState(false);

 const handleSearch = () => {
  if (!category && !location && !conditionValue) {
    alert("Select at least one filter");
    return;
  }

  const parts: string[] = [];

  // 1️⃣ Condition always first
  if (conditionValue) {
    const conditionSlug =
      conditionValue.toLowerCase().replace(/\s+/g, "-") + "-condition";
    parts.push(conditionSlug);
  }

  // 2️⃣ Category always second
  if (category) {
    const catSlug =
      category.toLowerCase().replace(/\s+/g, "-") + "-category";
    parts.push(catSlug);
  }

  // 3️⃣ State always last
  if (location) {
    const stateSlug =
      location.toLowerCase().replace(/\s+/g, "-") + "-state";
    parts.push(stateSlug);
  }

  const finalUrl = `/listings/${parts.join("/")}`;
  router.push(finalUrl);
};


 
 
    // ------------- base list (first click) -------------
   const loadBaseOnce = async () => {
        if (baseSuggestions.length) {
          setSuggestions(baseSuggestions);
          return;
        }
        try {
          setLoading(true);
          setError("");
          const data = await fetchHomeSearchList();
    
          const labels: Item[] = data.map((x) => ({
            id: x.id,
            label: (x.name ?? "").toString().trim(),
            url: (x.url ?? "").toString(),
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
  if (!query.trim()) {
        await loadBaseOnce();
      }   };
  
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
            // Normalize into Item[]
            const uniq: Item[] = Array.from(
              new Map(
                list.map((x, idx: number) => [
                  (x.keyword || "").toString().trim(),
                  {
                    id: x.id ?? idx, // fallback id
                    label: (x.keyword || "").toString().trim(), // ✅ always set label
                    url: (x.url || "").toString(),
                  },
                ])
              ).values()
            );
  
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
  
 
    useEffect(() => {
   // dynamically import bootstrap JS only in the browser
   if (typeof window === "undefined") return;
   import("bootstrap/dist/js/bootstrap.bundle.min.js").catch((err) =>
     console.error("Failed to load bootstrap JS", err)
   );
 }, []);
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
   
       flushSync(() => {
         setQuery(human);
         setNavigating(true); // ✅ show loader immediately
       });
       setIsSuggestionBoxOpen(false);
   
       // Small delay ensures loader renders before navigation
       setTimeout(() => {
         if (s.url && s.url.trim().length > 0) {
           router.push(s.url, { scroll: true });
         } else {
           const slug = human
             .toLowerCase()
             .trim()
             .replace(/[^a-z0-9]+/g, "-")
             .replace(/^-+|-+$/g, "");
           router.push(`/listings/${slug}-search`, { scroll: true });
         }
       }, 50);
     };
 
  
    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
         if (e.key === "Enter") {
           const kw = (e.currentTarget as HTMLInputElement).value.trim();
           if (kw) {
             setNavigating(true);
             navigateWithKeyword({ label: kw });
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
              <div className="section-head search_home text-center">
                <h1 className="divide-orange">
                  Browse New & Used Caravans For Sale
                </h1>
                <p>
                CFS is dedicated to revolutionising your caravan buying experience with new & used off-road, luxury and touring caravans from major brands and smaller Australian manufacturers and dealers, helping you secure the best price and value.
                </p>
  
                {/* Bootstrap Pills Navigation */}
                <ul className="nav nav-pills" id="pills-tab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link active"
                      id="pills-find-tab"
                      data-bs-toggle="pill"
                      data-bs-target="#pills-find"
                      type="button"
                      role="tab"
                      aria-controls="pills-find"
                      aria-selected="true"
                    >
                      <span>Find Your Perfect Caravan</span>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="pills-smart-tab"
                      data-bs-toggle="pill"
                      data-bs-target="#pills-smart"
                      type="button"
                      role="tab"
                      aria-controls="pills-smart"
                      aria-selected="false"
                    >
                      <span>Smart Search</span>
                    </button>
                  </li>
                </ul>
  
                {/* Bootstrap Tab Content */}
                <div className="tab-content" id="pills-tabContent">
                  {/* --- Tab 1 --- */}
                  <div
                    className="tab-pane fade show active"
                    id="pills-find"
                    role="tabpanel"
                    aria-labelledby="pills-find-tab"
                  >
                    <div className="content-info text-center pb-0">
                      <div className="quick_serch_form">
                           <form onSubmit={(e) => e.preventDefault()}>
      <ul>

        {/* Category */}
        <li>
          <Box sx={{ minWidth: 120 }}>
            <FormControl fullWidth>
              <InputLabel>Select Category</InputLabel>
              <Select
                value={category}
                label="Select Category"
                onChange={(e) => setCategory(e.target.value)}
                IconComponent={BiChevronDown} // Use your custom arrow
              >
                <MenuItem value="Off Road">Off Road</MenuItem>
                <MenuItem value="Hybrid">Hybrid</MenuItem>
                <MenuItem value="Pop Top">Pop Top</MenuItem>
                <MenuItem value="Luxury">Luxury</MenuItem>
                <MenuItem value="Family">Family</MenuItem>
                <MenuItem value="Touring">Touring</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </li>

        {/* Location */}
        <li>
          <Box sx={{ minWidth: 120 }}>
            <FormControl fullWidth>
              <InputLabel>Select Location</InputLabel>
              <Select
                value={location}
                label="Select Location"
                onChange={(e) => setLocation(e.target.value)}
              >
                <MenuItem value="New South Wales">New South Wales</MenuItem>
                <MenuItem value="Queensland">Queensland</MenuItem>
                <MenuItem value="Western Australia">Western Australia</MenuItem>
                <MenuItem value="Victoria">Victoria</MenuItem>
                <MenuItem value="South Australia">South Australia</MenuItem>
                <MenuItem value="Australian Capital Territory">
                  Australian Capital Territory
                </MenuItem>
                <MenuItem value="Tasmania">Tasmania</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </li>

        {/* Condition */}
        <li>
          <Box sx={{ minWidth: 120 }}>
            <FormControl fullWidth>
              <InputLabel>Select Condition</InputLabel>
              <Select
                value={conditionValue}
                label="Select Condition"
                onChange={(e) => setConditionValue(e.target.value)}
              >
                <MenuItem value="New">New</MenuItem>
                <MenuItem value="Used">Used</MenuItem>
                <MenuItem value="All">All</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </li>

        {/* Search Button */}
        <li>
          <button
            type="button"
            className={`search_button ${!isSearchEnabled ? "disabled_btn" : ""}`}
            disabled={!isSearchEnabled}
            onClick={() => {
              if (!isSearchEnabled) {
                alert("Please select at least one filter before searching");
                return;
              }
              handleSearch();
            }}
          >
            Search
          </button>
        </li>

      </ul>
    </form>
                      </div>
                    </div>
                  </div>
  
                  {/* --- Tab 2 --- */}
                  <div
                    className="tab-pane fade"
                    id="pills-smart"
                    role="tabpanel"
                    aria-labelledby="pills-smart-tab"
                  >
                    <div className="content-info text-center pb-0">
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
  
  
                    </div>
                  </div>
                </div>
                <ul className="category_icon list-unstyled d-flex flex-wrap justify-content-center gap-4">
                  <li>
                    <Link href="https://www.caravansforsale.com.au/listings/off-road-category/">
                      <div className="item-image">
                        <Image
                          src="/images/off-road.webp"
                          alt="off-road"
                          width={80}
                          height={80}
                          unoptimized
                        />
                      </div>
                      <span>Off Road</span>
                    </Link>
                  </li>
  
                  <li>
                    <Link href="https://www.caravansforsale.com.au/listings/hybrid-category/">
                      <div className="item-image">
                        <Image
                          src="/images/hybrid.webp"
                          alt="hybrid"
                          width={80}
                          height={80}
                          unoptimized
                        />
                      </div>
                      <span>Hybrid</span>
                    </Link>
                  </li>
  
                  <li>
                    <Link href="https://www.caravansforsale.com.au/listings/pop-top-category/">
                      <div className="item-image">
                        <Image
                          src="/images/pop-top.webp"
                          alt="pop-top"
                          width={80}
                          height={80}
                          unoptimized
                        />
                      </div>
                      <span>Pop Top</span>
                    </Link>
                  </li>
  
                  <li>
                    <Link href="https://www.caravansforsale.com.au/listings/luxury-category/">
                      <div className="item-image">
                        <Image
                          src="/images/luxury.webp"
                          alt="luxury"
                          width={80}
                          height={80}
                          unoptimized
                        />
                      </div>
                      <span>Luxury</span>
                    </Link>
                  </li>
  
                  <li>
                    <Link href="https://www.caravansforsale.com.au/listings/family-category/">
                      <div className="item-image">
                        <Image
                          src="/images/family.webp"
                          alt="family"
                          width={80}
                          height={80}
                          unoptimized
                        />
                      </div>
                      <span>Family</span>
                    </Link>
                  </li>
  
                  <li>
                    <Link href="https://www.caravansforsale.com.au/listings/touring-category/">
                      <div className="item-image">
                        <Image
                          src="/images/touring.webp"
                          alt="touring"
                          width={80}
                          height={80}
                          unoptimized
                        />
                      </div>
                      <span>Touring</span>
                    </Link>
                  </li>
  
                </ul>
              </div>
            </div>
          </div>
          <div className="row align-items-center justify-content-center">

            <div className="col-lg-10">
            <Link href="/caravan-enquiry-form/">
              <div className="advertisement">
                <Image
                  className="hidden-xs"
                  src="/images/static_index_dk_banner.jpg"
                  alt="Everest Caravans - best caravan manufacturer in any off road category"
                  width={1200}
                  height={400}
                  unoptimized
                />
                <Image
                  className="hidden-lg hidden-md hidden-sm br-m-8"
                  src="/images/static_index_mb_banner_3.jpg"
                  alt="Everest Caravans - best caravan manufacturer in any off road category"
                  width={600}
                  height={400}
                  unoptimized
                />
              </div>
            </Link>
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
  