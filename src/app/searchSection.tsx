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
import '../app/home/main.css'
import { fetchSleepBands } from "@/api/homeApi/sleep/api";
import { fetchRegion } from "@/api/homeApi/region/api";
import { fetchManufactures } from "@/api/homeApi/manufacture/api";
import { fetchPriceBasedCaravans } from "@/api/homeApi/price/api";
import { fetchAtmBasedCaravans } from "@/api/homeApi/weight/api";
import { fetchLengthBasedCaravans } from "@/api/homeApi/length/api";
import { fetchUsedCaravansList } from "@/api/homeApi/usedCaravanList/api";
import { fetchStateBasedCaravans } from "@/api/homeApi/state/api";
interface TabsItem {
  label: string;
  capacity: number;
  slug: string;
  permalink: string;
  caravan_count: string;
  starting_price: number;
  display_text: string;
  state: string;
  short_label: string;
  short_count: string;
   region: string;
}

type TabCard = {
  title: string;
  sub: string;
  url: string;
};

 
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
  const [activeIndex, setActiveIndex] = useState(0);


    const [sleepBands, setSleepBands] = useState<TabsItem[]>([]);
    const [regionBands, setRegionBands] = useState<TabsItem[]>([]);
    const [manufactureBands, setManufactureBands] = useState<TabsItem[]>([]);
    const [lengthBands, setLengthBands] = useState<TabsItem[]>([]);
    const [atmBands, setAtmBands] = useState<TabsItem[]>([]);
    const [usedCategoryList, setUsedCategoryList] = useState<TabsItem[]>([]);
    const [priceBands, setPriceBands] = useState<TabsItem[]>([]);
    const [usedState, setUsedState] = useState<TabsItem[]>([]);
    const [usedRegion, setUsedRegion] = useState<TabsItem[]>([]);
     const [stateBands, setStateBands] = useState<TabsItem[]>([]);

   useEffect(() => {
      async function loadAll() {
        // const [sleep, region, weight, length] = await Promise.all([
        const [sleep, region, manufactures, weight, length, price, usedData, state] =
          await Promise.all([
            fetchSleepBands(),
            fetchRegion(),
            fetchManufactures(),
            fetchAtmBasedCaravans(),
            fetchLengthBasedCaravans(),
            fetchPriceBasedCaravans(),
            fetchUsedCaravansList(),
            fetchStateBasedCaravans(),
            ,
          ]);
  
        setSleepBands(sleep);
        setRegionBands(region);
        setManufactureBands(manufactures);
        setAtmBands(weight);
        setLengthBands(length);
        setPriceBands(price);
        setUsedCategoryList(usedData.by_category);
        setUsedState(usedData.by_state);
        setUsedRegion(usedData.by_region);
        setStateBands(state);
  
      }
  
      loadAll();
    }, []);

  const tabsData: {
  key: string;
  label: string;
  cards: TabCard[];
}[] = [
    {
      key: "price",
      label: "Price",
        cards: priceBands.map((item) => ({
      title: item.short_label,
      sub: item.short_count,
      url: `/listings/${item.permalink}`,
    })),
    },
    {
      key: "Region",
      label: "Region",
       cards: regionBands.map((item) => ({
      title: item.region,
  sub: `${item.caravan_count ?? 0} caravan listings`,      url: `/listings/${item.permalink}`,
    })),
    },
    {
      key: "Weight",
      label: "Weight",
     cards: atmBands.map((item) => ({
      title: item.short_label,
      sub: item.short_count,
      url: `/listings/${item.permalink}`,
    })),
    },
    {
      key: "Sleep",
      label: "Sleep",
       cards: sleepBands.map((item) => ({
      title: item.short_label,
      sub: item.short_count,
      url: `/listings/${item.permalink}`,
    })),
    },
    {
      key: "Length",
      label: "Length",
       cards: lengthBands.map((item) => ({
      title: item.short_label,
      sub: item.short_count,
      url: `/listings/${item.permalink}`,
    })),
    },
    {
      key: "Used",
      label: "Used",
      cards: usedCategoryList.map((item) => ({
      title: item.short_label,
      sub: item.short_count,
      url: `/listings/${item.permalink}`,
    })),
    },
    {
      key: "Manufacturer",
      label: "Manufacturer",
     cards: manufactureBands.map((item) => ({
      title: item.short_label,
      sub: item.short_count,
      url: `/listings/${item.permalink}`,
    })),
    },
  ];

  const [activeTab, setActiveTab] = useState(tabsData[0].key);
  const currentTab = tabsData.find((t) => t.key === activeTab);


  const flips = [
    {
      type: 'Off Road',
      budget: '$90,000',
      msg: 'Queen, ensuite, ample power, ample water and grey water, 19 foot, rear door, 600 kg plus payload, tare <2800, atm 3500',
    },
    {
      type: 'Off Road',
      budget: '$85,000',
      msg: 'Couples van, approx 19ft tandem axel, tare approx 2200kg. Atm up to 3300kg. Full time touring, off grid essentials.',
    },
    {
      type: 'Hybrid',
      budget: '$50,000',
      msg: 'Island Bed, Compressor fridge, ensuite, Hot Water heater, Solar, 2 x freshwater tanks, 1 x grey, awning.',
    },
    {
      type: 'Family',
      budget: '$75,000',
      msg: 'Tare weight 2200 or less, bunks, semi off road, off grid. Max solar, 3000w inverter, lithium batteries.',
    },
    {
      type: 'Luxury',
      budget: '$100,000',
      msg: 'Slide out van under 3500kg. Suitable for Ford Ranger Next Gen. 2–3 beds preferred.',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % flips.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);




  const handleSearch = () => {
    if (!category && !location && !conditionValue) {
      alert("Select at least one filter");
      return;
    }
    setNavigating(true);
    if (conditionValue === "All") {
      router.push("/listings");
      return;
    }
    const parts: string[] = [];

    // 1️⃣ Condition always first
    if (conditionValue && conditionValue !== "All") {
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



  const navigateBySelect = (value: string, suffix: string) => {
    if (!value) return;

    setNavigating(true);

    const slug = value.toLowerCase().replace(/\s+/g, "-") + suffix;

    setTimeout(() => {
      router.push(`/listings/${slug}`, { scroll: true });
    }, 50);
  };

  console.log("navigating ", navigateBySelect)

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
      {/* <div className="container">
        <div className="row align-items-center justify-content-center">
          <div className="col-lg-12">
            <div className="section-head top_head text-center">
              <h1 className="divide-orange">
                Browse New & Used Caravans For Sale
              </h1>
              <p>
                CFS is dedicated to revolutionising your caravan buying experience with new & used off-road, luxury and touring caravans from major brands and smaller Australian manufacturers and dealers, helping you secure the best price and value.
              </p>
              <ul className="key_points list-unstyled">
                <li><i className="bi bi-check2-square"></i> Verified Dealers</li>
                <li><i className="bi bi-check2-square"></i> Private Sellers</li>
                <li><i className="bi bi-check2-square"></i> New Listings Daily</li>
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
      </div> */}
      <div className="ad_banner">
        <a href="https://www.caravansforsale.com.au/listings/">
        
          <div className="item-image">
            <Image
              src="/images/banner_top_dk.jpg"
              className="hidden-xs"
              alt="off-road"
              width={2000}
              height={700}
              style={{ width: "100%", height: "auto" }}
              unoptimized
            />
            <Image
              src="/images/banner_top_mb.jpg"
              className="hidden-lg hidden-md hidden-sm"
              alt="off-road"
              width={2000}
              height={700}
              style={{ width: "100%", height: "auto" }}
              unoptimized
            />
          </div>

        </a>
      </div>
      <div className="search_requirement_area">
        <div className="container">
          <div className="row align-items-center justify-content-start">
            {/* <div className="col-lg-6">
              <div className="home-post_head">
                <h2>Match Me a <span>Caravan</span></h2>
                <p>Tell us what you want - we'll match you with the right dealers.</p>
                <div className="flip-wrapper">
                  {flips.map((item, index) => (
                    <div
                      key={index}
                      className={`flip ${index === activeIndex ? 'active' : ''}`}
                    >
                      <div className="type_data">
                        <span>Type: {item.type}</span>
                        <span>Budget: {item.budget}</span>
                      </div>

                      <div className="requirement_msg">{item.msg}</div>
                    </div>
                  ))}
                </div>

              </div>

              <div className="final_post_btn">
                <Link href="/caravan-enquiry-form/" className="btn">
                  Post Your Requirements
                </Link>
              </div>
            </div> */}
            <div className="col-lg-12">
              <div className="section-head search_home text-center">


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
                      <span>Search Category</span>
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
                      <ul className="category_icon list-unstyled d-flex flex-wrap justify-content-start">
                        <li>
                          <a href="/listings/off-road-category/">
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
                          </a>
                        </li>

                        <li>
                          <a href="https://www.caravansforsale.com.au/listings/hybrid-category/">
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
                          </a>
                        </li>

                        <li>
                          <a href="https://www.caravansforsale.com.au/listings/pop-top-category/">
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
                          </a>
                        </li>

                        <li>
                          <a href="https://www.caravansforsale.com.au/listings/luxury-category/">
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
                          </a>
                        </li>

                        <li>
                          <a href="https://www.caravansforsale.com.au/listings/family-category/">
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
                          </a>
                        </li>

                        <li>
                          <a href="https://www.caravansforsale.com.au/listings/touring-category/">
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
                          </a>
                        </li>

                      </ul>
                    </div>
                  </div>

                  {/* --- Tab 2 --- */}
                  <div
                    className="tab-pane fade"
                    id="pills-smart"
                    role="tabpanel"
                    aria-labelledby="pills-smart-tab"
                  >
                    <div className="content-info pb-0">
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
                            placeholder="Try 'caravans with bunks'"
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
                          style={{
                            display: isSuggestionBoxOpen ? "block" : "none",
                            maxHeight: "300px",        // ← scroll height limit
                            overflowY: "auto",         // ← enables scrolling
                          }}
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

              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="quick_links_tabs">
            <div className="container">
                          <div className="custom-tabs-wrap">
      {/* Tabs */}
      <div className="custom-tabs-top">
        <div className="custom-tabs-nav">
          {tabsData.map((tab) => (
            <button
              key={tab.key}
              className={`custom-tab-btn ${
                activeTab === tab.key ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
              {tab.label === "More" && <span className="tab-arrow">⌄</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="custom-tabs-content">
        <div className="custom-card-grid">
          {currentTab?.cards?.map((item, index) => (
            <a href={item.url} className="custom-card" key={index}>
              <h4 className="custom-card-title">{item.title}</h4>
              <p className="custom-card-sub">{item.sub}</p>
            </a>
          ))}
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
