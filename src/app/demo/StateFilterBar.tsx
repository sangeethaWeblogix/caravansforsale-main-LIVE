"use client";
import "../components/filter.css";
import { useState, useEffect, useRef } from "react";
import CategorySkeleton from "../components/ListContent/CategorySkeleton";
import { fetchLocations } from "@/api/location/api";

type LocationSuggestion = {
  key: string;
  uri: string;
  address: string;
  short_address: string;
  postcode?: string | number;
};

interface StateOption {
  value: string;
  name: string;
  regions?: { name: string; value: string }[];
}

export interface FilterState {
  category?: string;
  make?: string;
  model?: string;
  state?: string;
  region?: string;
  suburb?: string;
  pincode?: string;
  from_price?: string | number;
  to_price?: string | number;
  minKg?: string | number;
  maxKg?: string | number;
  condition?: string;
  from_sleep?: string | number;
  to_sleep?: string | number;
  acustom_fromyears?: string | number;
  acustom_toyears?: string | number;
  from_length?: string | number;
  to_length?: string | number;
  keyword?: string;
  [key: string]: any;
}

interface Props {
  currentFilters: FilterState;
  onFilterChange: (f: FilterState) => void;
  onClearAll: () => void;
}

const PRICE_OPTIONS  = [10000,20000,30000,40000,50000,60000,70000,80000,90000,100000,125000,150000,175000,200000,225000,250000,275000,300000];
const ATM_OPTIONS    = [600,800,1000,1250,1500,1750,2000,2250,2500,2750,3000,3500,4000,4500];
const SLEEP_OPTIONS  = [1,2,3,4,5,6,7];
const YEAR_OPTIONS   = [2026,2025,2024,2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009,2008,2007,2006,2005,2004,2000,1975];
const LENGTH_OPTIONS = [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28];

export default function StateFilterBar({ currentFilters, onFilterChange, onClearAll }: Props) {
  /* ── Data ── */
  const [categories, setCategories] = useState<{name: string; slug: string}[]>([]);
  const [states,     setStates]     = useState<StateOption[]>([]);
  const [makes,      setMakes]      = useState<{name: string; slug: string; models?: {name: string; slug: string}[]}[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  useEffect(() => {
    fetch("/api/product-list/")
      .then(r => r.ok ? r.json() : null)
      .then((res: any) => {
        if (res?.data) {
          setCategories(res.data.all_categories || []);
          setStates(res.data.states || []);
        }
        setCatLoading(false);
      }).catch(() => setCatLoading(false));
    fetch("/api/make-details/")
      .then(r => r.ok ? r.json() : null)
      .then((json: any) => setMakes(json?.data?.make_options || []))
      .catch(() => {});
  }, []);

  /* ── Suburb search ── */
  const RADIUS_OPTIONS = [25, 50, 100, 250, 500, 1000] as const;
  const [tempSuburbRadius,         setTempSuburbRadius]         = useState<number>(RADIUS_OPTIONS[0]);
  const [tempSuburbSuggestion,     setTempSuburbSuggestion]     = useState<LocationSuggestion | null>(null);
  const [tempSuburbInput,          setTempSuburbInput]          = useState("");
  const [suburbLocationSuggestions,setSuburbLocationSuggestions]= useState<LocationSuggestion[]>([]);
  const [showSuburbSuggestions,    setShowSuburbSuggestions]    = useState(false);
  const [suburbLocLoading,         setSuburbLocLoading]         = useState(false);
  const suburbReqIdRef    = useRef(0);
  const suburbDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Make / Model ── */
  const [tempMake,      setTempMake]      = useState<string | null>(null);
  const [tempModel,     setTempModel]     = useState<string | null>(null);
  const [makeSearch,    setMakeSearch]    = useState("");
  const [modelSearch,   setModelSearch]   = useState("");
  const [makeSubView,   setMakeSubView]   = useState<"makes" | "models">("makes");
  const [modelCounts]                     = useState<{name: string; slug: string; count: number}[]>([]);

  /* ── Temp filter values ── */
  const [tempCategory,     setTempCategory]     = useState<string | null>(null);
  const [tempState,        setTempState]        = useState<string | null>(null);
  const [tempRegion,       setTempRegion]       = useState<string | null>(null);
  const [tempRegionRaw,    setTempRegionRaw]    = useState<string | null>(null);
  const [tempCondition,    setTempCondition]    = useState<string | null>(null);
  const [tempPriceFrom,    setTempPriceFrom]    = useState<number | null>(null);
  const [tempPriceTo,      setTempPriceTo]      = useState<number | null>(null);
  const [tempAtmFrom,      setTempAtmFrom]      = useState<number | null>(null);
  const [tempAtmTo,        setTempAtmTo]        = useState<number | null>(null);
  const [tempSleepFrom,    setTempSleepFrom]    = useState<number | null>(null);
  const [tempSleepTo,      setTempSleepTo]      = useState<number | null>(null);
  const [tempYearFrom,     setTempYearFrom]     = useState<number | null>(null);
  const [tempYearTo,       setTempYearTo]       = useState<number | null>(null);
  const [tempLengthFrom,   setTempLengthFrom]   = useState<number | null>(null);
  const [tempLengthTo,     setTempLengthTo]     = useState<number | null>(null);
  const [tempKeyword,      setTempKeyword]      = useState<string>("");
  const [removingChip,     setRemovingChip]     = useState<string | null>(null);
  const [clearingAll,      setClearingAll]      = useState(false);

  const [locationSubView, setLocationSubView] = useState<"states" | "regions">("states");

  const [openModal, setOpenModal] = useState<
    "type"|"location"|"price"|"atm"|"make"|"condition"|"sleep"|"allFilters"|null
  >(null);

  useEffect(() => {
    document.body.style.overflow = openModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [openModal]);

  useEffect(() => { setRemovingChip(null); }, [currentFilters]);

  /* ── Helpers ── */
  const toTitleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

  const AUS_ABBR: Record<string, string> = {
    VICTORIA:"VIC","NEW SOUTH WALES":"NSW",QUEENSLAND:"QLD","SOUTH AUSTRALIA":"SA",
    "WESTERN AUSTRALIA":"WA",TASMANIA:"TAS","NORTHERN TERRITORY":"NT","AUSTRALIAN CAPITAL TERRITORY":"ACT",
  };

  const formatLocationInput = (s: string) =>
    s.replace(/_/g," ").replace(/\s*-\s*/g,"  ").replace(/\s{3,}/g,"  ").trim()
     .replace(/\b\w/g, c => c.toUpperCase());

  const formatted = (s: string) => s.replace(/ - /g,"  ").replace(/\s+/g," ");

  const getValidRegionName = (stateName: string|null|undefined, regionName: string|null|undefined, allStates: StateOption[]) => {
    if (!stateName || !regionName) return undefined;
    const st = allStates.find(s => s.name.toLowerCase() === stateName.toLowerCase() || s.value.toLowerCase() === stateName.toLowerCase());
    if (!st?.regions?.length) return undefined;
    return st.regions.find(r => r.name.toLowerCase() === regionName.toLowerCase() || r.value.toLowerCase() === regionName.toLowerCase())?.name;
  };

  const filteredRegions = states.find(s => s.name.toLowerCase() === tempState?.toLowerCase())?.regions ?? [];

  const makeSource  = makes.map(m => ({ name: m.name, slug: m.slug, count: 0 }));
  const filteredMakes = makeSearch
    ? (() => {
        const q = makeSearch.toLowerCase();
        return makeSource
          .filter(m => m.name.toLowerCase().includes(q))
          .sort((a, b) => {
            const an = a.name.toLowerCase(), bn = b.name.toLowerCase();
            const rank = (n: string) => n.startsWith(q) ? 0 : n.includes(` ${q}`) ? 1 : 2;
            return rank(an) - rank(bn);
          });
      })()
    : makeSource;
  const availableModels = makes.find(m => m.slug === tempMake)?.models ?? [];
  const modelSource = modelCounts.length > 0 ? modelCounts : availableModels.map(m => ({ name: m.name, slug: m.slug, count: 0 }));
  const filteredModels = modelSearch
    ? (() => {
        const q = modelSearch.toLowerCase();
        return modelSource
          .filter(m => m.name.toLowerCase().includes(q))
          .sort((a, b) => {
            const an = a.name.toLowerCase(), bn = b.name.toLowerCase();
            const rank = (n: string) => n.startsWith(q) ? 0 : n.includes(` ${q}`) ? 1 : 2;
            return rank(an) - rank(bn);
          });
      })()
    : modelSource;

  /* ── Core update fn ── */
  const updateFiltersAndURL = (updates: Partial<FilterState>) => {
    const merged: FilterState = { ...currentFilters, ...updates };
    Object.keys(merged).forEach(k => { if (merged[k] === undefined || merged[k] === null) delete merged[k]; });
    onFilterChange(merged);
  };

  const removeChip = (key: string, updates: Partial<FilterState>) => {
    setRemovingChip(key);
    updateFiltersAndURL(updates);
  };

  const handleClearAll = () => {
    setClearingAll(true);
    onClearAll();
    setTimeout(() => setClearingAll(false), 300);
  };

  /* ── Type ── */
  const handleTypeOpen = () => { setTempCategory(currentFilters.category ?? null); setOpenModal("type"); };
  const handleTypeSearch = () => { updateFiltersAndURL({ category: tempCategory ?? undefined }); setOpenModal(null); };
  const handleTypeClear  = () => { setTempCategory(null); updateFiltersAndURL({ category: undefined }); setOpenModal(null); };

  /* ── Condition ── */
  const handleConditionOpen   = () => { setTempCondition(currentFilters.condition?.toLowerCase() ?? null); setOpenModal("condition"); };
  const handleConditionSearch = () => { updateFiltersAndURL({ condition: tempCondition ?? undefined }); setOpenModal(null); };
  const handleConditionClear  = () => { setTempCondition(null); updateFiltersAndURL({ condition: undefined }); setOpenModal(null); };

  /* ── Price ── */
  const handlePriceOpen   = () => { setTempPriceFrom(currentFilters.from_price ? Number(currentFilters.from_price) : null); setTempPriceTo(currentFilters.to_price ? Number(currentFilters.to_price) : null); setOpenModal("price"); };
  const handlePriceSearch = () => { updateFiltersAndURL({ from_price: tempPriceFrom ?? undefined, to_price: tempPriceTo ?? undefined }); setOpenModal(null); };
  const handlePriceClear  = () => { setTempPriceFrom(null); setTempPriceTo(null); updateFiltersAndURL({ from_price: undefined, to_price: undefined }); setOpenModal(null); };

  /* ── ATM ── */
  const handleAtmOpen   = () => { setTempAtmFrom(currentFilters.minKg ? Number(currentFilters.minKg) : null); setTempAtmTo(currentFilters.maxKg ? Number(currentFilters.maxKg) : null); setOpenModal("atm"); };
  const handleAtmSearch = () => { updateFiltersAndURL({ minKg: tempAtmFrom ?? undefined, maxKg: tempAtmTo ?? undefined }); setOpenModal(null); };
  const handleAtmClear  = () => { setTempAtmFrom(null); setTempAtmTo(null); updateFiltersAndURL({ minKg: undefined, maxKg: undefined }); setOpenModal(null); };

  /* ── Sleep ── */
  const handleSleepOpen   = () => { setTempSleepFrom(currentFilters.from_sleep ? Number(currentFilters.from_sleep) : null); setTempSleepTo(currentFilters.to_sleep ? Number(currentFilters.to_sleep) : null); setOpenModal("sleep"); };
  const handleSleepSearch = () => { updateFiltersAndURL({ from_sleep: tempSleepFrom ?? undefined, to_sleep: tempSleepTo ?? undefined }); setOpenModal(null); };
  const handleSleepClear  = () => { setTempSleepFrom(null); setTempSleepTo(null); updateFiltersAndURL({ from_sleep: undefined, to_sleep: undefined }); setOpenModal(null); };

  /* ── Make ── */
  const handleMakeOpen = () => { setTempMake(currentFilters.make ?? null); setTempModel(currentFilters.model ?? null); setMakeSearch(""); setModelSearch(""); setMakeSubView("makes"); setOpenModal("make"); };
  const handleMakeSearch = () => { updateFiltersAndURL({ make: tempMake ?? undefined, model: tempModel ?? undefined }); setOpenModal(null); };
  const handleMakeClear  = () => { setTempMake(null); setTempModel(null); updateFiltersAndURL({ make: undefined, model: undefined }); setOpenModal(null); };
  const handleModelViewOpen = (makeSlug?: string) => {
    const target = makeSlug ?? tempMake;
    if (!target) return;
    if (makeSlug && makeSlug !== tempMake) { setTempMake(makeSlug); setTempModel(null); }
    setModelSearch("");
    setMakeSubView("models");
  };

  /* ── Location ── */
  const handleLocationOpen = () => {
    const f = currentFilters;
    const matchedState = states.find(s => s.name?.toLowerCase() === (f.state ?? "").toLowerCase() || s.value?.toLowerCase() === (f.state ?? "").toLowerCase());
    setTempState(matchedState?.name ?? f.state ?? null);
    const matchedRegion = matchedState?.regions?.find(r => r.name?.toLowerCase() === (f.region ?? "").toLowerCase() || r.value?.toLowerCase() === (f.region ?? "").toLowerCase());
    if (matchedRegion) { setTempRegion(matchedRegion.name); setTempRegionRaw(null); }
    else if (f.region) { setTempRegion(null); setTempRegionRaw(f.region); }
    else { setTempRegion(null); setTempRegionRaw(null); }
    if (f.suburb && f.state) {
      const abbr = AUS_ABBR[f.state.toUpperCase()] ?? f.state.toUpperCase();
      const shortAddr = [toTitleCase(f.suburb), abbr, f.pincode].filter(Boolean).join(" ");
      const fullAddr  = [toTitleCase(f.suburb), f.state.replace(/\b\w/g, c => c.toUpperCase()), f.pincode].filter(Boolean).join(" ");
      const stateSlug  = f.state.toLowerCase().replace(/\s+/g,"-") + "-state";
      const regionSlug = f.region ? f.region.toLowerCase().replace(/\s+/g,"-") + "-region" : "unknown-region";
      const suburbSlug = f.suburb.toLowerCase().replace(/\s+/g,"-") + "-suburb";
      const uri = [stateSlug, regionSlug, suburbSlug, f.pincode].filter(Boolean).join("/");
      setTempSuburbSuggestion({ key:"hydrated", uri, address:fullAddr, short_address:shortAddr });
      setTempSuburbInput("");
    } else { setTempSuburbInput(""); setTempSuburbSuggestion(null); }
    setSuburbLocationSuggestions([]);
    setShowSuburbSuggestions(false);
    setTempSuburbRadius(f.radius_kms ? Number(f.radius_kms) : RADIUS_OPTIONS[0]);
    setLocationSubView("states");
    setOpenModal("location");
  };
  const handleLocationSearch = () => { updateFiltersAndURL({ state: tempState?.toLowerCase() ?? undefined, region: tempRegion?.toLowerCase() ?? tempRegionRaw?.toLowerCase() ?? undefined, suburb: undefined, pincode: undefined }); setOpenModal(null); };
  const handleLocationClear  = () => { setTempState(null); setTempRegion(null); setTempRegionRaw(null); setTempSuburbInput(""); setTempSuburbSuggestion(null); updateFiltersAndURL({ state:undefined, region:undefined, suburb:undefined, pincode:undefined, radius_kms:undefined }); setOpenModal(null); };
  const handleRegionViewOpen = (stateName?: string) => {
    const target = stateName ?? tempState;
    if (!target) return;
    if (stateName) { setTempState(stateName); if (stateName.toLowerCase() !== (tempState ?? "").toLowerCase()) setTempRegion(null); }
    setLocationSubView("regions");
  };

  /* ── All Filters (combined modal) ── */
  const handleAllFiltersOpen = () => {
    setTempCategory(currentFilters.category ?? null);
    setTempCondition(currentFilters.condition?.toLowerCase() ?? null);
    setTempPriceFrom(currentFilters.from_price ? Number(currentFilters.from_price) : null);
    setTempPriceTo(currentFilters.to_price ? Number(currentFilters.to_price) : null);
    setTempAtmFrom(currentFilters.minKg ? Number(currentFilters.minKg) : null);
    setTempAtmTo(currentFilters.maxKg ? Number(currentFilters.maxKg) : null);
    setTempSleepFrom(currentFilters.from_sleep ? Number(currentFilters.from_sleep) : null);
    setTempSleepTo(currentFilters.to_sleep ? Number(currentFilters.to_sleep) : null);
    setTempMake(currentFilters.make ?? null);
    setTempModel(currentFilters.model ?? null);
    setMakeSearch("");
    setTempYearFrom(currentFilters.acustom_fromyears ? Number(currentFilters.acustom_fromyears) : null);
    setTempYearTo(currentFilters.acustom_toyears ? Number(currentFilters.acustom_toyears) : null);
    setTempLengthFrom(currentFilters.from_length ? Number(currentFilters.from_length) : null);
    setTempLengthTo(currentFilters.to_length ? Number(currentFilters.to_length) : null);
    setTempKeyword(currentFilters.keyword ?? "");
    if (currentFilters.suburb && currentFilters.state) {
      const abbr = AUS_ABBR[currentFilters.state.toUpperCase()] ?? currentFilters.state.toUpperCase();
      const shortAddr = [toTitleCase(currentFilters.suburb), abbr, currentFilters.pincode].filter(Boolean).join(" ");
      const fullAddr  = [toTitleCase(currentFilters.suburb), currentFilters.state.replace(/\b\w/g, c => c.toUpperCase()), currentFilters.pincode].filter(Boolean).join(" ");
      const stateSlug  = currentFilters.state.toLowerCase().replace(/\s+/g,"-") + "-state";
      const regionSlug = currentFilters.region ? currentFilters.region.toLowerCase().replace(/\s+/g,"-") + "-region" : "unknown-region";
      const suburbSlug = currentFilters.suburb.toLowerCase().replace(/\s+/g,"-") + "-suburb";
      const uri = [stateSlug, regionSlug, suburbSlug, currentFilters.pincode].filter(Boolean).join("/");
      setTempSuburbSuggestion({ key:"hydrated", uri, address:fullAddr, short_address:shortAddr });
      setTempSuburbInput("");
    } else {
      setTempSuburbInput(""); setTempSuburbSuggestion(null);
    }
    setSuburbLocationSuggestions([]); setShowSuburbSuggestions(false);
    const matchedState = states.find(s => s.name?.toLowerCase() === (currentFilters.state ?? "").toLowerCase() || s.value?.toLowerCase() === (currentFilters.state ?? "").toLowerCase());
    setTempState(matchedState?.name ?? currentFilters.state ?? null);
    const matchedRegion = matchedState?.regions?.find(r => r.name?.toLowerCase() === (currentFilters.region ?? "").toLowerCase() || r.value?.toLowerCase() === (currentFilters.region ?? "").toLowerCase());
    setTempRegion(matchedRegion?.name ?? currentFilters.region ?? null);
    setOpenModal("allFilters");
  };
  const handleAllFiltersSearch = () => {
    let suburbName: string | undefined;
    let pincodeValue: string | undefined;
    let stateOverride: string | undefined;
    let regionOverride: string | undefined;
    if (tempSuburbSuggestion) {
      const parts = tempSuburbSuggestion.uri.split("/").filter(Boolean);
      const suburbPart = parts.find((p: string) => p.endsWith("-suburb"));
      suburbName  = suburbPart?.replace(/-suburb$/, "").replace(/-/g, " ");
      pincodeValue = parts.find((p: string) => /^\d{4}$/.test(p));
      stateOverride  = parts[0]?.replace(/-state$/, "").replace(/-/g, " ");
      regionOverride = parts[1]?.replace(/-region$/, "").replace(/-/g, " ");
    }
    const updates: Partial<FilterState> = {
      category:          tempCategory ?? undefined,
      condition:         tempCondition ?? undefined,
      from_price:        tempPriceFrom ?? undefined,
      to_price:          tempPriceTo ?? undefined,
      minKg:             tempAtmFrom ?? undefined,
      maxKg:             tempAtmTo ?? undefined,
      from_sleep:        tempSleepFrom ?? undefined,
      to_sleep:          tempSleepTo ?? undefined,
      make:              tempMake ?? undefined,
      model:             tempModel ?? undefined,
      state:             (stateOverride ?? tempState)?.toLowerCase() ?? undefined,
      region:            (regionOverride ?? tempRegion)?.toLowerCase() ?? undefined,
      suburb:            suburbName ?? undefined,
      pincode:           pincodeValue ?? undefined,
      acustom_fromyears: tempYearFrom ?? undefined,
      acustom_toyears:   tempYearTo ?? undefined,
      from_length:       tempLengthFrom ?? undefined,
      to_length:         tempLengthTo ?? undefined,
      keyword:           tempKeyword || undefined,
    };
    updateFiltersAndURL(updates);
    setOpenModal(null);
  };
  const handleAllFiltersClear = () => { onClearAll(); setOpenModal(null); };

  /* ── Active filter count (for Filters badge) ── */
  const activeFilterCount = [
    currentFilters.category,
    currentFilters.state || currentFilters.region || currentFilters.suburb,
    currentFilters.condition,
    currentFilters.make,
    currentFilters.from_price || currentFilters.to_price,
    currentFilters.minKg || currentFilters.maxKg,
    currentFilters.from_sleep || currentFilters.to_sleep,
  ].filter(Boolean).length;

  const hasLocationChange =
    (tempState?.toLowerCase() ?? null) !== (currentFilters.state?.toLowerCase() ?? null) ||
    (tempRegion?.toLowerCase() ?? null) !== (currentFilters.region?.toLowerCase() ?? null);

  /* ── Close button ── */
  const closeBtn = (
    <button className="filter-close" onClick={() => setOpenModal(null)}>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 64 64">
        <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
      </svg>
    </button>
  );

  return (
    <>
      {/* ── Filter bar ── */}
      <div className="lsd-filter-section">
        <div className="container">
          <div className="search-bar">
            {/* Filters button — matches /listings/ design */}
            <button className="filter-btn" onClick={handleAllFiltersOpen}>
              {activeFilterCount > 0 ? (
                <span>{activeFilterCount}</span>
              ) : (
                <span><i className="bi bi-filter" /></span>
              )}{" "}
              Filters
            </button>

            {/* Pills */}
            <div className="filter-row" style={{ flex: 1, marginBottom: 0 }}>
              <div className="slider-wrapper">
                <div className="filter-swiper">
                  <button className={`tag${currentFilters.category ? " active" : ""}`} onClick={handleTypeOpen}>
                    Caravan Type
                    {currentFilters.category && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>

                  <button className={`tag${(currentFilters.state || currentFilters.region || currentFilters.suburb) ? " active" : ""}`} onClick={handleLocationOpen}>
                    Location
                    {(currentFilters.state || currentFilters.region || currentFilters.suburb) && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>

                  <button className={`tag${currentFilters.condition ? " active" : ""}`} onClick={handleConditionOpen}>
                    Condition
                    {currentFilters.condition && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>

                  <button className={`tag${currentFilters.make ? " active" : ""}`} onClick={handleMakeOpen}>
                    Make
                    {currentFilters.make && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>

                  <button className={`tag${(currentFilters.from_price || currentFilters.to_price) ? " active" : ""}`} onClick={handlePriceOpen}>
                    Price
                    {(currentFilters.from_price || currentFilters.to_price) && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>

                  <button className={`tag${(currentFilters.minKg || currentFilters.maxKg) ? " active" : ""}`} onClick={handleAtmOpen}>
                    ATM
                    {(currentFilters.minKg || currentFilters.maxKg) && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>

                  <button className={`tag${(currentFilters.from_sleep || currentFilters.to_sleep) ? " active" : ""}`} onClick={handleSleepOpen}>
                    Sleeps
                    {(currentFilters.from_sleep || currentFilters.to_sleep) && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active chips row ── */}
      {(currentFilters.category || currentFilters.state || currentFilters.region || currentFilters.suburb ||
        currentFilters.make || currentFilters.model || currentFilters.from_price || currentFilters.to_price ||
        currentFilters.minKg || currentFilters.maxKg || currentFilters.condition ||
        currentFilters.from_sleep || currentFilters.to_sleep) && (
        <div className="container">
          <div className="active-chips-row">
            {currentFilters.make && (
              <span className={`active-chip${removingChip === "make" ? " chip-removing" : ""}`}>
                <span className="chip-label" onClick={handleMakeOpen}>{toTitleCase(makes.find(m => m.slug === currentFilters.make)?.name ?? currentFilters.make)}</span>
                <span className="chip-close" onClick={() => removeChip("make", { make: undefined, model: undefined })}>×</span>
              </span>
            )}
            {currentFilters.model && (
              <span className={`active-chip${removingChip === "model" ? " chip-removing" : ""}`}>
                <span className="chip-label" onClick={handleMakeOpen}>{toTitleCase(currentFilters.model.replace(/-/g," "))}</span>
                <span className="chip-close" onClick={() => removeChip("model", { model: undefined })}>×</span>
              </span>
            )}
            {currentFilters.condition && (
              <span className={`active-chip${removingChip === "condition" ? " chip-removing" : ""}`}>
                <span className="chip-label" onClick={handleConditionOpen}>{currentFilters.condition.toLowerCase() === "new" ? "New" : "Used"}</span>
                <span className="chip-close" onClick={() => removeChip("condition", { condition: undefined })}>×</span>
              </span>
            )}
            {currentFilters.category && (
              <span className={`active-chip${removingChip === "category" ? " chip-removing" : ""}`}>
                <span className="chip-label" onClick={handleTypeOpen}>{toTitleCase(categories.find(c => c.slug === currentFilters.category)?.name ?? currentFilters.category!.replace(/-/g," "))}</span>
                <span className="chip-close" onClick={() => removeChip("category", { category: undefined })}>×</span>
              </span>
            )}
            {currentFilters.state && (
              <span className={`active-chip${removingChip === "state" ? " chip-removing" : ""}`}>
                <span className="chip-label" onClick={handleLocationOpen}>{toTitleCase(currentFilters.state)}</span>
                <span className="chip-close" onClick={() => removeChip("state", { state:undefined, region:undefined, suburb:undefined, pincode:undefined, radius_kms:undefined })}>×</span>
              </span>
            )}
            {currentFilters.region && (
              <span className={`active-chip${removingChip === "region" ? " chip-removing" : ""}`}>
                <span className="chip-label" onClick={handleLocationOpen}>{toTitleCase(currentFilters.region)}</span>
                <span className="chip-close" onClick={() => removeChip("region", { region:undefined, suburb:undefined, pincode:undefined, radius_kms:undefined })}>×</span>
              </span>
            )}
            {currentFilters.suburb && (
              <span className={`active-chip${removingChip === "suburb" ? " chip-removing" : ""}`}>
                <span className="chip-label" onClick={handleLocationOpen}>{toTitleCase(currentFilters.suburb)}</span>
                <span className="chip-close" onClick={() => removeChip("suburb", { suburb:undefined, pincode:undefined, radius_kms:undefined })}>×</span>
              </span>
            )}
            {(currentFilters.from_price || currentFilters.to_price) && (
              <span className={`active-chip${removingChip === "price" ? " chip-removing" : ""}`}>
                <span className="chip-label" onClick={handlePriceOpen}>
                  {currentFilters.from_price && currentFilters.to_price
                    ? `$${Number(currentFilters.from_price).toLocaleString()} – $${Number(currentFilters.to_price).toLocaleString()}`
                    : currentFilters.from_price
                      ? `From $${Number(currentFilters.from_price).toLocaleString()}`
                      : `Upto $${Number(currentFilters.to_price).toLocaleString()}`}
                </span>
                <span className="chip-close" onClick={() => removeChip("price", { from_price:undefined, to_price:undefined })}>×</span>
              </span>
            )}
            {(currentFilters.minKg || currentFilters.maxKg) && (
              <span className={`active-chip${removingChip === "atm" ? " chip-removing" : ""}`}>
                <span className="chip-label" onClick={handleAtmOpen}>
                  {currentFilters.minKg && currentFilters.maxKg
                    ? `${Number(currentFilters.minKg).toLocaleString()} – ${Number(currentFilters.maxKg).toLocaleString()} kg`
                    : currentFilters.minKg
                      ? `From ${Number(currentFilters.minKg).toLocaleString()} kg`
                      : `Upto ${Number(currentFilters.maxKg).toLocaleString()} kg`}
                </span>
                <span className="chip-close" onClick={() => removeChip("atm", { minKg:undefined, maxKg:undefined })}>×</span>
              </span>
            )}
            {(currentFilters.from_sleep || currentFilters.to_sleep) && (
              <span className={`active-chip${removingChip === "sleep" ? " chip-removing" : ""}`}>
                <span className="chip-label" onClick={handleSleepOpen}>
                  {currentFilters.from_sleep && currentFilters.to_sleep
                    ? `${currentFilters.from_sleep} – ${currentFilters.to_sleep} Berths`
                    : currentFilters.from_sleep
                      ? `From ${currentFilters.from_sleep} Berths`
                      : `Upto ${currentFilters.to_sleep} Berths`}
                </span>
                <span className="chip-close" onClick={() => removeChip("sleep", { from_sleep:undefined, to_sleep:undefined })}>×</span>
              </span>
            )}
            <button className="chip-clear-all" disabled={clearingAll} onClick={handleClearAll}>
              {clearingAll ? "Clearing…" : "Clear all"}
            </button>
          </div>
        </div>
      )}

      {/* ── All Filters Combined Modal ── */}
      {openModal === "allFilters" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header"><h3>Filters</h3>{closeBtn}</div>
            <div className="filter-body">

              {/* Caravan Type */}
              <div className="filter-item pt-0">
                <h4>Caravan Type</h4>
                <ul className="loc-state-list">
                  {catLoading && categories.length === 0 ? (
                    <CategorySkeleton />
                  ) : (
                    categories.map(cat => (
                      <li key={cat.slug} className="loc-state-item"
                        onClick={() => setTempCategory(tempCategory === cat.slug ? null : cat.slug)}>
                        <span className={`loc-checkbox${tempCategory === cat.slug ? " checked" : ""}`}>
                          {tempCategory === cat.slug && <i className="bi bi-check" style={{ color:"#fff", fontSize:14, lineHeight:1 }} />}
                        </span>
                        <span className="loc-state-name">{cat.name}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Location */}
              <div className="filter-item">
                <h4>Location</h4>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>State</label>
                    <select className="cfs-select-input form-select" value={tempState ?? ""}
                      onChange={e => { setTempState(e.target.value || null); setTempRegion(null); }}>
                      <option value="">Any</option>
                      {states.map(s => (
                        <option key={s.value} value={s.name}>
                          {AUS_ABBR[s.name.toUpperCase()] ?? s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>Region</label>
                    <select className="cfs-select-input form-select"
                      disabled={!tempState || filteredRegions.length === 0}
                      value={tempRegion ?? ""}
                      onChange={e => setTempRegion(e.target.value || null)}>
                      <option value="">Any</option>
                      {filteredRegions.map(r => (
                        <option key={r.value} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Suburb / Postcode */}
              <div className="filter-item">
                <h4>Suburb/Postcode</h4>
                <div style={{ position:"relative" }}>
                  <div className="loc-search-wrap">
                    <i className="bi bi-search loc-search-icon" />
                    <input
                      className="loc-search-input"
                      placeholder="Search suburb, postcode, state, region"
                      value={tempSuburbSuggestion && !tempSuburbInput ? tempSuburbSuggestion.short_address : formatted(tempSuburbInput)}
                      onFocus={() => { if (!tempSuburbSuggestion) setShowSuburbSuggestions(true); }}
                      onChange={e => {
                        setShowSuburbSuggestions(true);
                        setTempSuburbSuggestion(null);
                        const raw = e.target.value;
                        setTempSuburbInput(raw);
                        const fmt = /^\d+$/.test(raw) ? raw : formatLocationInput(raw);
                        if (fmt.length < 1) { setSuburbLocationSuggestions([]); return; }
                        if (suburbDebounceRef.current) clearTimeout(suburbDebounceRef.current);
                        suburbDebounceRef.current = setTimeout(() => {
                          const rid = ++suburbReqIdRef.current;
                          setSuburbLocLoading(true);
                          fetchLocations(fmt.split(" ")[0]).then((data: any) => {
                            if (rid !== suburbReqIdRef.current) return;
                            const sv = fmt.toLowerCase();
                            setSuburbLocationSuggestions(data.filter((x: any) =>
                              x.short_address?.toLowerCase().includes(sv) ||
                              x.address?.toLowerCase().includes(sv) ||
                              (x.postcode && x.postcode.toString().includes(sv))
                            ));
                            setSuburbLocLoading(false);
                          }).catch(() => setSuburbLocLoading(false));
                        }, 300);
                      }}
                      onBlur={() => setTimeout(() => setShowSuburbSuggestions(false), 150)}
                    />
                    {tempSuburbSuggestion && (
                      <button type="button"
                        style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#888", fontSize:20, lineHeight:1 }}
                        onMouseDown={e => { e.preventDefault(); setTempSuburbSuggestion(null); setTempSuburbInput(""); }}>×</button>
                    )}
                  </div>
                  {showSuburbSuggestions && suburbLocLoading && tempSuburbInput && (
                    <ul className="location-suggestions">
                      {[1,2,3].map(i => <li key={i} className="suggestion-skeleton"><div className="skeleton-line" /></li>)}
                    </ul>
                  )}
                  {showSuburbSuggestions && !suburbLocLoading && tempSuburbInput && suburbLocationSuggestions.length === 0 && (
                    <p style={{ fontSize:13, color:"#888", margin:0, paddingLeft:4 }}>No results found</p>
                  )}
                  {showSuburbSuggestions && !suburbLocLoading && suburbLocationSuggestions.length > 0 && (
                    <ul className="location-suggestions">
                      {suburbLocationSuggestions.map((item: any, idx: number) => (
                        <li key={idx}
                          className={`suggestion-item${tempSuburbSuggestion?.short_address === item.short_address ? " selected" : ""}`}
                          onMouseDown={e => {
                            e.preventDefault();
                            setTempSuburbSuggestion(item);
                            setTempSuburbInput("");
                            setSuburbLocationSuggestions([]);
                            setShowSuburbSuggestions(false);
                          }}
                        >{item.address}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Condition */}
              <div className="filter-item">
                <h4>Condition</h4>
                <ul className="loc-state-list" style={{ display:"flex", gap:20 }}>
                  {(["new","used"] as const).map(c => (
                    <li key={c} className="loc-state-item" style={{ borderBottom:"none", padding:"4px 0" }}
                      onClick={() => setTempCondition(tempCondition === c ? null : c)}>
                      <span className={`loc-checkbox${tempCondition === c ? " checked" : ""}`}>
                        {tempCondition === c && <i className="bi bi-check" style={{ color:"#fff", fontSize:14, lineHeight:1 }} />}
                      </span>
                      <span className="loc-state-name">{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Make & Model */}
              <div className="filter-item">
                <h4>Make &amp; Model</h4>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>Make</label>
                    <select className="cfs-select-input form-select" value={tempMake ?? ""}
                      onChange={e => { setTempMake(e.target.value || null); setTempModel(null); }}>
                      <option value="">Any</option>
                      {makes.map(m => <option key={m.slug} value={m.slug}>{m.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>Model</label>
                    <select className="cfs-select-input form-select"
                      disabled={!tempMake || (makes.find(m => m.slug === tempMake)?.models?.length ?? 0) === 0}
                      value={tempModel ?? ""}
                      onChange={e => setTempModel(e.target.value || null)}>
                      <option value="">Any</option>
                      {(makes.find(m => m.slug === tempMake)?.models ?? []).map(mod => (
                        <option key={mod.slug} value={mod.slug}>{mod.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="filter-item">
                <h4>Price</h4>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>Min Price</label>
                    <select className="cfs-select-input form-select" value={tempPriceFrom ?? ""}
                      onChange={e => setTempPriceFrom(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {PRICE_OPTIONS.filter(p => !tempPriceTo || p < tempPriceTo).map(p => (
                        <option key={p} value={p}>${p.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>Max Price</label>
                    <select className="cfs-select-input form-select" value={tempPriceTo ?? ""}
                      onChange={e => setTempPriceTo(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {PRICE_OPTIONS.filter(p => !tempPriceFrom || p > tempPriceFrom).map(p => (
                        <option key={p} value={p}>${p.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ATM */}
              <div className="filter-item">
                <h4>ATM (kg)</h4>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>Min ATM</label>
                    <select className="cfs-select-input form-select" value={tempAtmFrom ?? ""}
                      onChange={e => setTempAtmFrom(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {ATM_OPTIONS.filter(a => !tempAtmTo || a < tempAtmTo).map(a => (
                        <option key={a} value={a}>{a.toLocaleString()} kg</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>Max ATM</label>
                    <select className="cfs-select-input form-select" value={tempAtmTo ?? ""}
                      onChange={e => setTempAtmTo(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {ATM_OPTIONS.filter(a => !tempAtmFrom || a > tempAtmFrom).map(a => (
                        <option key={a} value={a}>{a.toLocaleString()} kg</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sleeps */}
              <div className="filter-item">
                <h4>Sleeping Capacity</h4>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>Min Berths</label>
                    <select className="cfs-select-input form-select" value={tempSleepFrom ?? ""}
                      onChange={e => setTempSleepFrom(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {SLEEP_OPTIONS.filter(s => !tempSleepTo || s < tempSleepTo).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>Max Berths</label>
                    <select className="cfs-select-input form-select" value={tempSleepTo ?? ""}
                      onChange={e => setTempSleepTo(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {SLEEP_OPTIONS.filter(s => !tempSleepFrom || s > tempSleepFrom).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Year */}
              <div className="filter-item">
                <h4>Year</h4>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>From</label>
                    <select className="cfs-select-input form-select" value={tempYearFrom ?? ""}
                      onChange={e => setTempYearFrom(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {YEAR_OPTIONS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>To</label>
                    <select className="cfs-select-input form-select" value={tempYearTo ?? ""}
                      onChange={e => setTempYearTo(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {YEAR_OPTIONS.filter(y => !tempYearFrom || y >= tempYearFrom).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Length */}
              <div className="filter-item">
                <h4>Length</h4>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>Min</label>
                    <select className="cfs-select-input form-select" value={tempLengthFrom ?? ""}
                      onChange={e => setTempLengthFrom(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {LENGTH_OPTIONS.filter(l => !tempLengthTo || l < tempLengthTo).map(l => (
                        <option key={l} value={l}>{l} ft</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex:1, minWidth:130 }}>
                    <label style={{ fontSize:13, color:"#555", display:"block", marginBottom:6 }}>Max</label>
                    <select className="cfs-select-input form-select" value={tempLengthTo ?? ""}
                      onChange={e => setTempLengthTo(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {LENGTH_OPTIONS.filter(l => !tempLengthFrom || l > tempLengthFrom).map(l => (
                        <option key={l} value={l}>{l} ft</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Keyword */}
              <div className="filter-item">
                <h4>Search by Keyword</h4>
                <div className="loc-search-wrap">
                  <i className="bi bi-search loc-search-icon" />
                  <input
                    className="loc-search-input"
                    placeholder="e.g. ensuite, solar, slide-out..."
                    value={tempKeyword}
                    onChange={e => setTempKeyword(e.target.value)}
                  />
                </div>
              </div>

            </div>
            <div className="filter-footer">
              <button className="clear" onClick={handleAllFiltersClear}>Clear filters</button>
              <button className="search active" onClick={handleAllFiltersSearch}>Search</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Caravan Type Modal ── */}
      {openModal === "type" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header"><h3>Caravan Type</h3>{closeBtn}</div>
            <div className="filter-body">
              <div className="filter-item pt-0">
                <ul className="loc-state-list">
                  {catLoading && categories.length === 0 ? (
                    <CategorySkeleton />
                  ) : (
                    categories.map(cat => (
                      <li key={cat.slug} className="loc-state-item" onClick={() => setTempCategory(tempCategory === cat.slug ? null : cat.slug)}>
                        <span className={`loc-checkbox${tempCategory === cat.slug ? " checked" : ""}`}>
                          {tempCategory === cat.slug && <i className="bi bi-check" style={{ color:"#fff", fontSize:14, lineHeight:1 }} />}
                        </span>
                        <span className="loc-state-name">{cat.name}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            <div className="filter-footer">
              <button className="clear" onClick={handleTypeClear} style={{ opacity: tempCategory ? 1 : 0.4, cursor: tempCategory ? "pointer" : "not-allowed" }}>Clear filters</button>
              <button className={`search${tempCategory ? " active" : ""}`} onClick={handleTypeSearch}>Search</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Location Modal ── */}
      {openModal === "location" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header" style={{ position:"relative" }}>
              {locationSubView === "regions" ? (
                <>
                  <button className="loc-back-btn" onClick={() => setLocationSubView("states")}>
                    <i className="bi bi-chevron-left" /> Location
                  </button>
                  <h3 style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", margin:0 }}>Region</h3>
                </>
              ) : (
                <h3>Location</h3>
              )}
              {closeBtn}
            </div>
            <div className="filter-body">
              {locationSubView === "states" ? (
                <>
                  {/* Suburb search */}
                  <div className="loc-search-wrap">
                    <div style={{ position:"relative" }}>
                      <i className="bi bi-search loc-search-icon" />
                      <input
                        type="text" className="loc-search-input" autoComplete="off"
                        placeholder="Search suburb, postcode, state, region"
                        value={formatted(tempSuburbInput)}
                        onFocus={() => setShowSuburbSuggestions(true)}
                        onChange={e => {
                          setShowSuburbSuggestions(true);
                          setTempSuburbSuggestion(null);
                          const raw = e.target.value;
                          setTempSuburbInput(raw);
                          const fmt = /^\d+$/.test(raw) ? raw : formatLocationInput(raw);
                          if (fmt.length < 1) { setSuburbLocationSuggestions([]); return; }
                          if (suburbDebounceRef.current) clearTimeout(suburbDebounceRef.current);
                          suburbDebounceRef.current = setTimeout(() => {
                            const rid = ++suburbReqIdRef.current;
                            setSuburbLocLoading(true);
                            fetchLocations(fmt.split(" ")[0]).then((data: any) => {
                              if (rid !== suburbReqIdRef.current) return;
                              const sv = fmt.toLowerCase();
                              setSuburbLocationSuggestions(data.filter((x: any) =>
                                x.short_address?.toLowerCase().includes(sv) ||
                                x.address?.toLowerCase().includes(sv) ||
                                (x.postcode && x.postcode.toString().includes(sv))
                              ));
                              setSuburbLocLoading(false);
                            }).catch(() => setSuburbLocLoading(false));
                          }, 300);
                        }}
                        onBlur={() => setTimeout(() => setShowSuburbSuggestions(false), 150)}
                      />
                    </div>
                    {showSuburbSuggestions && suburbLocLoading && tempSuburbInput && (
                      <ul className="location-suggestions">
                        {[1,2,3].map(i => <li key={i} className="suggestion-skeleton"><div className="skeleton-line" /></li>)}
                      </ul>
                    )}
                    {showSuburbSuggestions && !suburbLocLoading && tempSuburbInput && suburbLocationSuggestions.length === 0 && (
                      <p className="suggestions-no-results" style={{ paddingLeft:12 }}>No results found</p>
                    )}
                    {showSuburbSuggestions && !suburbLocLoading && suburbLocationSuggestions.length > 0 && (
                      <ul className="location-suggestions">
                        {suburbLocationSuggestions.map((item: any, idx: number) => (
                          <li key={idx}
                            className={`suggestion-item${tempSuburbSuggestion?.short_address === item.short_address ? " selected" : ""}`}
                            onMouseDown={e => {
                              e.preventDefault();
                              setTempSuburbSuggestion(item);
                              setTempSuburbInput("");
                              setSuburbLocationSuggestions([]);
                              setShowSuburbSuggestions(false);
                            }}
                          >{item.address}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Selected suburb chip + radius */}
                  {tempSuburbSuggestion && !tempSuburbInput && (
                    <div style={{ marginBottom:12 }}>
                      <div className="filter-chip">
                        <span>{tempSuburbSuggestion.address}</span>
                        <button type="button" className="filter-chip-close" onMouseDown={e => { e.preventDefault(); setTempSuburbSuggestion(null); setTempSuburbInput(""); }} aria-label="Remove location">×</button>
                      </div>
                      {tempSuburbSuggestion.uri.split("/").filter(Boolean).length >= 3 && (
                        <div style={{ marginTop:14 }}>
                          <div className="cfs-radius-label">Search surrounding area</div>
                          <div className="cfs-radius-wrap">
                            {(() => {
                              const idx = Math.max(0, RADIUS_OPTIONS.indexOf(tempSuburbRadius as (typeof RADIUS_OPTIONS)[number]));
                              const pct = (idx / (RADIUS_OPTIONS.length - 1)) * 100;
                              return (
                                <>
                                  <div className="cfs-radius-tooltip" style={{ left:`calc(${pct}% + ${18 - 0.36*pct}px)` }}>{tempSuburbRadius}km</div>
                                  <div className="cfs-radius-track-wrap">
                                    <input type="range" className="cfs-radius-slider" min={0} max={RADIUS_OPTIONS.length-1} step={1} value={idx}
                                      style={{ background:`linear-gradient(to right,#f37920 0%,#f37920 ${pct}%,#ddd ${pct}%,#ddd 100%)` }}
                                      onChange={e => setTempSuburbRadius(RADIUS_OPTIONS[parseInt(e.target.value,10)])} aria-label="Search radius" />
                                    {RADIUS_OPTIONS.map((km,i) => {
                                      const tp = (i/(RADIUS_OPTIONS.length-1))*100;
                                      return <span key={i} className={`cfs-radius-tick${i<idx?" active":i===idx?" current":""}`} style={{ left:`calc(${tp}% + ${9-0.18*tp}px)` }} title={`${km}km`} />;
                                    })}
                                  </div>
                                  <div className="cfs-radius-range"><span>{RADIUS_OPTIONS[0]}km</span><span>{RADIUS_OPTIONS[RADIUS_OPTIONS.length-1].toLocaleString()}km</span></div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* State list */}
                  <ul className="loc-state-list" style={{ display: tempSuburbSuggestion ? "none" : undefined }}>
                    {states.map(s => {
                      const abbr = AUS_ABBR[s.name.toUpperCase()] ?? s.name.substring(0,3).toUpperCase();
                      const isSelected = tempState?.toLowerCase() === s.name.toLowerCase();
                      return (
                        <li key={s.name} className={`loc-state-item${isSelected ? " selected" : ""}`} onClick={() => { setTempState(isSelected ? null : s.name); setTempRegion(null); }}>
                          <span className={`loc-checkbox${isSelected ? " checked" : ""}`}>
                            {isSelected && <i className="bi bi-check" style={{ color:"#fff", fontSize:14, lineHeight:1 }} />}
                          </span>
                          <span className="loc-state-name">{abbr}</span>
                          {isSelected ? (
                            <button className="loc-region-pill" onClick={e => { e.stopPropagation(); handleRegionViewOpen(s.name); }}>
                              Region <i className="bi bi-chevron-right" />
                            </button>
                          ) : (
                            <button className="loc-arrow-btn" onClick={e => { e.stopPropagation(); handleRegionViewOpen(s.name); }} aria-label={`View regions in ${abbr}`}>
                              <i className="bi bi-chevron-right" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <>
                  <div className="loc-region-heading">Region of {tempState}</div>
                  <ul className="loc-state-list">
                    {filteredRegions.map(r => {
                      const isSelected = tempRegion?.toLowerCase() === r.name.toLowerCase();
                      return (
                        <li key={r.name} className={`loc-state-item${isSelected ? " selected" : ""}`} onClick={() => setTempRegion(isSelected ? null : r.name)}>
                          <span className={`loc-checkbox${isSelected ? " checked" : ""}`}>
                            {isSelected && <i className="bi bi-check" style={{ color:"#fff", fontSize:14, lineHeight:1 }} />}
                          </span>
                          <span className="loc-state-name">{r.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
            <div className="filter-footer">
              <button className="clear" onClick={handleLocationClear} style={{ opacity:(tempState||currentFilters.suburb)?1:0.4, cursor:(tempState||currentFilters.suburb)?"pointer":"not-allowed" }}>Clear</button>
              <button className={`search${(hasLocationChange||tempSuburbSuggestion)?" active":""}`}
                onClick={() => {
                  if (tempSuburbSuggestion) {
                    const parts = tempSuburbSuggestion.uri.split("/").filter(Boolean);
                    const stateSlug  = parts[0]||"";
                    const regionSlug = parts[1]||"";
                    const suburbSlug = parts[2]||"";
                    let   pincode    = parts[3]||"";
                    const state  = stateSlug.replace(/-state$/,"").replace(/-/g," ").trim();
                    const region = regionSlug.replace(/-region$/,"").replace(/-/g," ").trim();
                    const spMatch = suburbSlug.match(/^([a-z0-9-]+)-(\d{4})-suburb$/i);
                    let suburb: string;
                    if (spMatch) { suburb = spMatch[1].replace(/-/g," ").trim(); if (!pincode) pincode = spMatch[2]; }
                    else { suburb = suburbSlug.replace(/-suburb$/,"").replace(/-/g," ").trim(); }
                    if (!/^\d{4}$/.test(pincode)) { const m = tempSuburbSuggestion.address.match(/\b\d{4}\b/); if (m) pincode = m[0]; }
                    const validRegion = getValidRegionName(state, region, states);
                    updateFiltersAndURL({ suburb:suburb.toLowerCase(), pincode:pincode||undefined, state, region:validRegion||region, radius_kms:tempSuburbRadius });
                  } else {
                    handleLocationSearch();
                  }
                  setOpenModal(null);
                }}
              >Search</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Make & Model Modal ── */}
      {openModal === "make" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header" style={{ position:"relative" }}>
              {makeSubView === "models" ? (
                <>
                  <button className="loc-back-btn" onClick={() => setMakeSubView("makes")}><i className="bi bi-chevron-left" /> Make</button>
                  <h3 style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", margin:0 }}>Model</h3>
                </>
              ) : <h3>Make &amp; Model</h3>}
              {closeBtn}
            </div>
            <div className="filter-search-bar">
              {makeSubView === "models" && (
                <div className="loc-region-heading" style={{ marginBottom:8, borderBottom:"none", paddingBottom:0 }}>
                  {makes.find(m => m.slug === tempMake)?.name ?? tempMake}
                </div>
              )}
              <div className="loc-search-wrap" style={{ marginBottom:0 }}>
                <i className="bi bi-search loc-search-icon" />
                <input className="loc-search-input" type="text"
                  placeholder={makeSubView === "makes" ? "Search make" : "Search model"}
                  value={makeSubView === "makes" ? makeSearch : modelSearch}
                  onChange={e => makeSubView === "makes" ? setMakeSearch(e.target.value) : setModelSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="filter-body">
              {makeSubView === "makes" ? (
                <ul className="loc-state-list">
                  {filteredMakes.map(m => {
                    const isSelected = tempMake === m.slug;
                    return (
                      <li key={m.slug} className={`loc-state-item${isSelected ? " selected" : ""}`}
                        onClick={() => { if (isSelected) { setTempMake(null); setTempModel(null); } else { setTempMake(m.slug); setTempModel(null); } }}>
                        <span className={`loc-checkbox${isSelected ? " checked" : ""}`}>
                          {isSelected && <i className="bi bi-check" style={{ color:"#fff", fontSize:14, lineHeight:1 }} />}
                        </span>
                        <span className="loc-state-name">{m.name}</span>
                        {isSelected ? (
                          <button className="loc-region-pill" onClick={e => { e.stopPropagation(); handleModelViewOpen(m.slug); }}>Model <i className="bi bi-chevron-right" /></button>
                        ) : (
                          <button className="loc-arrow-btn" onClick={e => { e.stopPropagation(); setTempMake(m.slug); setTempModel(null); handleModelViewOpen(m.slug); }} aria-label={`View models for ${m.name}`}><i className="bi bi-chevron-right" /></button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <ul className="loc-state-list">
                  {filteredModels.length === 0 ? (
                    <li className="loc-state-item" style={{ color:"#888" }}>No models found</li>
                  ) : (
                    filteredModels.map(mod => {
                      const isSelected = tempModel === mod.slug;
                      return (
                        <li key={mod.slug} className={`loc-state-item${isSelected ? " selected" : ""}`} onClick={() => setTempModel(isSelected ? null : mod.slug)}>
                          <span className={`loc-checkbox${isSelected ? " checked" : ""}`}>
                            {isSelected && <i className="bi bi-check" style={{ color:"#fff", fontSize:14, lineHeight:1 }} />}
                          </span>
                          <span className="loc-state-name">{mod.name || mod.slug}</span>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </div>
            <div className="filter-footer">
              <button className="clear" onClick={handleMakeClear} style={{ opacity:tempMake?1:0.4, cursor:tempMake?"pointer":"not-allowed" }}>Clear filters</button>
              <button className={`search${tempMake?" active":""}`} onClick={handleMakeSearch}>Search</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Price Modal ── */}
      {openModal === "price" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header"><h3>Price</h3>{closeBtn}</div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select className="cfs-select-input form-select" value={tempPriceFrom ?? ""} onChange={e => setTempPriceFrom(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {PRICE_OPTIONS.map(v => <option key={v} value={v}>${v.toLocaleString()}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select className="cfs-select-input form-select" value={tempPriceTo ?? ""} onChange={e => setTempPriceTo(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {PRICE_OPTIONS.filter(v => !tempPriceFrom || v > tempPriceFrom).map(v => <option key={v} value={v}>${v.toLocaleString()}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button className="clear" onClick={handlePriceClear} style={{ opacity:(tempPriceFrom||tempPriceTo)?1:0.4, cursor:(tempPriceFrom||tempPriceTo)?"pointer":"not-allowed" }}>Clear filters</button>
              <button className={`search${(tempPriceFrom||tempPriceTo)?" active":""}`} onClick={handlePriceSearch}>Search</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ATM Modal ── */}
      {openModal === "atm" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header"><h3>ATM</h3>{closeBtn}</div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select className="cfs-select-input form-select" value={tempAtmFrom ?? ""} onChange={e => setTempAtmFrom(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {ATM_OPTIONS.map(v => <option key={v} value={v}>{v} kg</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select className="cfs-select-input form-select" value={tempAtmTo ?? ""} onChange={e => setTempAtmTo(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {ATM_OPTIONS.filter(v => !tempAtmFrom || v > tempAtmFrom).map(v => <option key={v} value={v}>{v} kg</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button className="clear" onClick={handleAtmClear} style={{ opacity:(tempAtmFrom||tempAtmTo)?1:0.4, cursor:(tempAtmFrom||tempAtmTo)?"pointer":"not-allowed" }}>Clear filters</button>
              <button className={`search${(tempAtmFrom||tempAtmTo)?" active":""}`} onClick={handleAtmSearch}>Search</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Condition Modal ── */}
      {openModal === "condition" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header"><h3>Condition</h3>{closeBtn}</div>
            <div className="filter-body">
              <div className="filter-item condition-field">
                <ul className="loc-state-list">
                  {(["New","Used"] as const).map(cond => {
                    const isSelected = tempCondition?.toLowerCase() === cond.toLowerCase();
                    return (
                      <li key={cond} className="loc-state-item" onClick={() => setTempCondition(isSelected ? null : cond.toLowerCase())}>
                        <span className={`loc-checkbox${isSelected ? " checked" : ""}`}>
                          {isSelected && <i className="bi bi-check" style={{ color:"#fff", fontSize:14, lineHeight:1 }} />}
                        </span>
                        <span className="loc-state-name">{cond}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <div className="filter-footer">
              <button className="clear" onClick={handleConditionClear} style={{ opacity:tempCondition?1:0.4, cursor:tempCondition?"pointer":"not-allowed" }}>Clear filters</button>
              <button className={`search${tempCondition?" active":""}`} onClick={handleConditionSearch}>Search</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sleep Modal ── */}
      {openModal === "sleep" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header"><h3>Sleeping Capacity</h3>{closeBtn}</div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select className="cfs-select-input form-select" value={tempSleepFrom ?? ""} onChange={e => setTempSleepFrom(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {SLEEP_OPTIONS.map(v => <option key={v} value={v}>{v} {v===1?"person":"people"}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select className="cfs-select-input form-select" value={tempSleepTo ?? ""} onChange={e => setTempSleepTo(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any</option>
                      {SLEEP_OPTIONS.filter(v => !tempSleepFrom || v >= tempSleepFrom).map(v => <option key={v} value={v}>{v} {v===1?"person":"people"}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button className="clear" onClick={handleSleepClear} style={{ opacity:(tempSleepFrom||tempSleepTo)?1:0.4, cursor:(tempSleepFrom||tempSleepTo)?"pointer":"not-allowed" }}>Clear filters</button>
              <button className={`search${(tempSleepFrom||tempSleepTo)?" active":""}`} onClick={handleSleepSearch}>Search</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
