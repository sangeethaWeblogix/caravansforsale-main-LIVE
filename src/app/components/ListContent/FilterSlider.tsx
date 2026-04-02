"use client";
import { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { fetchProductList } from "@/api/productList/api";
 import "swiper/css";
import "swiper/css/navigation";
import CategorySkeleton from "./CategorySkeleton";
import { buildSlugFromFilters } from "../slugBuilter";
import { useRouter } from "next/navigation";
import { fetchLocations } from "@/api/location/api";

type LocationSuggestion = {
  key: string;
  uri: string;
  address: string;
  short_address: string;
  postcode?: string | number;
};
interface CategoryCount {
  name: string;
  slug: string;
  count: number;
}
  export interface Category {
    name: string;
    slug: string;
  }

 

type ProductListResponse = {
  data: {
    all_categories: Category[];
    states: StateOption[];
    
  };
};
interface StateOption {
  value: string;
  name: string;
  regions?: {
    name: string;
    value: string;
  }[];
}



interface Filters {
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
  from_length?: string | number;
  to_length?: string | number;
  from_sleep?: string | number;
  to_sleep?: string | number;
  acustom_fromyears?: string | number;
  acustom_toyears?: string | number;
  search?: string;
  keyword?: string;
  [key: string]: any;
}

interface FilterSliderProps {
  setIsLoading?: (val: boolean) => void;
  setIsMainLoading?: (val: boolean) => void;
  setIsFeaturedLoading?: (val: boolean) => void;
  setIsPremiumLoading?: (val: boolean) => void;
  currentFilters: Filters;
  categoryCounts: CategoryCount[];
  isCategoryCountLoading?: boolean;
  stateOptions?: StateOption[];
  onCategorySelect: (slug: string | null) => void;
  onMakeSelect?: (make: string | null, model: string | null) => void;
  onLocationSelect: (state: string | null, region: string | null) => void;
  onOpenModal?: (section?: string) => void;
  onPriceSelect?: (from: number | null, to: number | null) => void;
  onAtmSelect?: (min: number | null, max: number | null) => void;
  productListData?: ProductListResponse;
  
}

// ── FilterModal-போல் buildCountParams helper ──
const buildMakeCountParams = (filters: Filters): URLSearchParams => {
  const params = new URLSearchParams();

  // make & model exclude பண்ணு (make count-க்கு)
  if (filters.category) params.set("category", filters.category);
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.state && typeof filters.state === "string")
    params.set("state", filters.state.toLowerCase());
  if (filters.region) params.set("region", filters.region);
  if (filters.suburb) params.set("suburb", filters.suburb);
  if (filters.pincode) params.set("pincode", filters.pincode);
  if (filters.from_price) params.set("from_price", String(filters.from_price));
  if (filters.to_price) params.set("to_price", String(filters.to_price));
  if (filters.minKg) params.set("from_atm", String(filters.minKg));
  if (filters.maxKg) params.set("to_atm", String(filters.maxKg));
  if (filters.acustom_fromyears)
    params.set("acustom_fromyears", String(filters.acustom_fromyears));
  if (filters.acustom_toyears)
    params.set("acustom_toyears", String(filters.acustom_toyears));
  if (filters.from_length)
    params.set("from_length", String(filters.from_length));
  if (filters.to_length) params.set("to_length", String(filters.to_length));
  if (filters.from_sleep) params.set("from_sleep", String(filters.from_sleep));
  if (filters.to_sleep) params.set("to_sleep", String(filters.to_sleep));
  if (filters.search) params.set("search", filters.search);
  if (filters.keyword) params.set("keyword", filters.keyword);

  params.set("group_by", "make");
  return params;
};

const FilterSlider = ({
  currentFilters,
  categoryCounts,
  isCategoryCountLoading,
  stateOptions: propStateOptions = [],
  onCategorySelect,
  onLocationSelect,
  onOpenModal,
  onPriceSelect,
  onAtmSelect,
  onMakeSelect,
  setIsLoading,
  setIsMainLoading,
  setIsFeaturedLoading,
  setIsPremiumLoading,
  productListData,
}: FilterSliderProps) => {
const [states, setStates] = useState<StateOption[]>(
  productListData?.data?.states || []
);  const router = useRouter();
  const RADIUS_OPTIONS = [50, 100, 250, 500, 1000] as const;
  const [tempSuburbRadius, setTempSuburbRadius] = useState<number>(
    RADIUS_OPTIONS[0],
  );
  const [tempSuburbSuggestion, setTempSuburbSuggestion] =
    useState<LocationSuggestion | null>(null);
  const [tempSuburbInput, setTempSuburbInput] = useState("");
  const [suburbLocationSuggestions, setSuburbLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [showSuburbSuggestions, setShowSuburbSuggestions] = useState(false);
  const [tempRegionRaw, setTempRegionRaw] = useState<string | null>(null);

 

  const priceOptions = [
    10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000,
    125000, 150000, 175000, 200000, 225000, 250000, 275000, 300000,
  ];
  const atmOptions = [
    600, 800, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000,
    4500,
  ];

  // ── Make & Model states ──
  const [makes, setMakes] = useState<
    { name: string; slug: string; models?: { name: string; slug: string }[] }[]
  >([]);
  const [makeCounts, setMakeCounts] = useState<
    { name: string; slug: string; count: number }[]
  >([]);
  const [tempMake, setTempMake] = useState<string | null>(null);
  const [tempModel, setTempModel] = useState<string | null>(null);
  const [makeSearch, setMakeSearch] = useState("");
  const [makeLoading, setMakeLoading] = useState(false);
  const [lastModelName, setLastModelName] = useState<string | null>(null);

  // ── 1. modelCounts state add பண்ணு (makeCounts state-க்கு கீழே) ──
  const [modelCounts, setModelCounts] = useState<
    { name: string; slug: string; count: number }[]
  >([]);

  const [modelCountLoading, setModelCountLoading] = useState(false);

  const didFetchMakeRef = useRef(false);

  const toTitleCase = (str: string): string =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  // FilterSlider-ல் இதை add பண்ணு
  const triggerGlobalLoaders = () => {
    if (setIsLoading) setIsLoading(true);
    if (setIsMainLoading) setIsMainLoading(true);
    if (setIsFeaturedLoading) setIsFeaturedLoading(true);
    if (setIsPremiumLoading) setIsPremiumLoading(true);
  };

 

  useEffect(() => {
    if (!tempMake) {
      setModelCounts([]);
      return;
    }

    const controller = new AbortController();
    setModelCountLoading(true);

    const params = buildMakeCountParams(currentFilters);
    // make set பண்ணு, model exclude பண்ணு
    params.set("make", tempMake);
    params.set("group_by", "model");
    params.delete("group_by"); // முதல்ல delete
    params.set("group_by", "model"); // model group_by set

     fetch(
  `/api/params-count?${params.toString()}`,
  { signal: controller.signal },
)
      .then((r) => r.json())
      .then((json) => {
        if (!controller.signal.aborted) {
          const data = json.data || [];
          setModelCounts(data);
          setModelCountLoading(false);
          // ✅ Cache the matched model name for tag display
          const matched = data.find(
            (m: any) => m.slug === currentFilters.model,
          );
          if (matched) setLastModelName(matched.name);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          console.error(e);
          setModelCountLoading(false);
        }
      });

    return () => controller.abort();
  }, [tempMake]); // tempMake மாறும்போது மட்டும்

  const availableModels = makes.find((m) => m.slug === tempMake)?.models ?? [];

  const filteredMakes = makeSearch
    ? makeCounts.filter((m) =>
        m.name.toLowerCase().includes(makeSearch.toLowerCase()),
      )
    : makeCounts;

  // ── FIXED: FilterModal-போல் full filter params use பண்ணி make count fetch ──
  useEffect(() => {
    const controller = new AbortController();

    const params = buildMakeCountParams(currentFilters);

    fetch(
      `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${params.toString()}`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((json) => {
        if (!controller.signal.aborted) {
          setMakeCounts(json.data || []);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });

    return () => controller.abort();
  }, [
    // ── FilterModal-போல் ALL relevant filters watch பண்ணு ──
    currentFilters.category,
    currentFilters.condition,
    currentFilters.state,
    currentFilters.region,
    currentFilters.suburb,
    currentFilters.pincode,
    currentFilters.from_price,
    currentFilters.to_price,
    currentFilters.minKg,
    currentFilters.maxKg,
    currentFilters.acustom_fromyears,
    currentFilters.acustom_toyears,
    currentFilters.from_length,
    currentFilters.to_length,
    currentFilters.from_sleep,
    currentFilters.to_sleep,
    currentFilters.search,
    currentFilters.keyword,
  ]);

  // ── Make & Model handlers ──

  // ── handleMakeOpen — validate பண்ணாம directly set பண்ணு ──
  const handleMakeOpen = () => {
    const currentMake = currentFilters.make ?? null;
    const currentModel = currentFilters.model ?? null;

    setTempMake(currentMake);
    setTempModel(currentModel);
    setMakeSearch("");
    setOpenModal("make");
  };
  const handleMakeSearch = () => {
    delete localOverrideRef.current.make;
    delete localOverrideRef.current.model;
    triggerGlobalLoaders();
    // onMakeSelect?.(tempMake, tempModel);
    const newFilters = {
      ...currentFilters,
      make: tempMake ?? undefined,
      model: tempModel ?? undefined,
      page: 1,
    };
    const slugPath = buildSlugFromFilters(newFilters);
    const safeSlug = slugPath.endsWith("/") ? slugPath : `${slugPath}/`;
    router.push(safeSlug);

    setOpenModal(null);
  };
  const handleMakeClear = () => {
    setTempMake(null);
    setTempModel(null);

    updateFiltersAndURL({
      make: undefined,
      model: undefined,
    });

    setOpenModal(null);
  };
  // ── Price & ATM temp states ──
  const [tempPriceFrom, setTempPriceFrom] = useState<number | null>(null);
  const [tempPriceTo, setTempPriceTo] = useState<number | null>(null);
  const [tempAtmFrom, setTempAtmFrom] = useState<number | null>(null);
  const [tempAtmTo, setTempAtmTo] = useState<number | null>(null);
  const [tempCondition, setTempCondition] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<
    | "type"
    | "location"
    | "price"
    | "atm"
    | "make"
    | "suburb"
    | "condition"
    | null
  >(null);

  // condition handlers

  // ── Condition handlers ──
  const handleConditionOpen = () => {
    setTempCondition(currentFilters.condition ?? null);
    setOpenModal("condition");
  };

  const handleConditionSearch = () => {
    triggerGlobalLoaders();
    const newFilters = {
      ...currentFilters,
      condition: tempCondition ?? undefined,
      page: 1,
    };
    const slugPath = buildSlugFromFilters(newFilters);
    const safeSlug = slugPath.endsWith("/") ? slugPath : `${slugPath}/`;
    router.push(safeSlug);
    setOpenModal(null);
  };

  const handleConditionClear = () => {
    setTempCondition(null);
    updateFiltersAndURL({ condition: undefined });
    setOpenModal(null);
  };
  // ── Price handlers ──
  const handlePriceOpen = () => {
    const f = getEffectiveFilters();

    setTempPriceFrom(
      currentFilters.from_price ? Number(currentFilters.from_price) : null,
    );
    setTempPriceTo(
      currentFilters.to_price ? Number(currentFilters.to_price) : null,
    );
    setOpenModal("price");
  };
  const handlePriceSearch = () => {
    delete localOverrideRef.current.from_price;
    delete localOverrideRef.current.to_price;
    triggerGlobalLoaders();
    // onPriceSelect?.(tempPriceFrom, tempPriceTo);
    const newFilters = {
      ...currentFilters,
      from_price: tempPriceFrom ?? undefined,
      to_price: tempPriceTo ?? undefined,
      page: 1,
    };
    const slugPath = buildSlugFromFilters(newFilters);
    const safeSlug = slugPath.endsWith("/") ? slugPath : `${slugPath}/`;
    router.push(safeSlug);

    setOpenModal(null);
  };
  const handlePriceClear = () => {
    setTempPriceFrom(null);
    setTempPriceTo(null);

    updateFiltersAndURL({
      from_price: undefined,
      to_price: undefined,
    });

    setOpenModal(null);
  };

  // ── ATM handlers ──
  const handleAtmOpen = () => {
    const f = getEffectiveFilters();
    setTempAtmFrom(f.minKg ? Number(f.minKg) : null);
    setTempAtmTo(f.maxKg ? Number(f.maxKg) : null);
    setOpenModal("atm");
  };
  const handleAtmSearch = () => {
    delete localOverrideRef.current.minKg;
    delete localOverrideRef.current.maxKg;
    triggerGlobalLoaders();
    // onAtmSelect?.(tempAtmFrom, tempAtmTo);
    const newFilters = {
      ...currentFilters,
      minKg: tempAtmFrom ?? undefined,
      maxKg: tempAtmTo ?? undefined,
      page: 1,
    };
    const slugPath = buildSlugFromFilters(newFilters);
    const safeSlug = slugPath.endsWith("/") ? slugPath : `${slugPath}/`;
    router.push(safeSlug);

    setOpenModal(null);
  };
  const handleAtmClear = () => {
    setTempAtmFrom(null);
    setTempAtmTo(null);

    updateFiltersAndURL({
      minKg: undefined,
      maxKg: undefined,
    });

    setOpenModal(null);
  };

  const [tempCategory, setTempCategory] = useState<string | null>(null);
  const [tempState, setTempState] = useState<string | null>(null);
  const [tempRegion, setTempRegion] = useState<string | null>(null);
  const updateFiltersAndURL = (updates: Partial<Filters>) => {
    triggerGlobalLoaders();

    const newFilters = {
      ...currentFilters,
      ...updates,
      page: 1,
    };

    // remove empty filters
    Object.keys(newFilters).forEach((k) => {
      if (newFilters[k] === undefined || newFilters[k] === null) {
        delete newFilters[k];
      }
    });

    const slugPath = buildSlugFromFilters(newFilters);
    const safeSlug = slugPath.endsWith("/") ? slugPath : `${slugPath}/`;

    router.push(safeSlug);
  };
  const handleTypeOpen = () => {
    const f = getEffectiveFilters();
    setTempCategory(f.category ?? null);
    setOpenModal("type");
  };
  const handleTypeSearch = () => {
    updateFiltersAndURL({
      category: tempCategory ?? undefined,
    });

    setOpenModal(null);
  };
  const handleTypeClear = () => {
    setTempCategory(null);

    updateFiltersAndURL({
      category: undefined,
    });

    setOpenModal(null);
  };
  const handleLocationSuburbOpen = () => {
    setTempSuburbInput(
      currentFilters.suburb
        ? [
            toTitleCase(currentFilters.suburb),
            AUS_ABBR[currentFilters.state?.toUpperCase() ?? ""] ??
              currentFilters.state?.toUpperCase() ??
              "",
            currentFilters.pincode,
          ]
            .filter(Boolean)
            .join(" ")
        : "",
    );
    setTempSuburbSuggestion(null);
    setSuburbLocationSuggestions([]);
    setShowSuburbSuggestions(false);
    setTempSuburbRadius(
      typeof currentFilters.radius_kms === "number"
        ? currentFilters.radius_kms
        : RADIUS_OPTIONS[0],
    );
    setOpenModal("suburb");
  };

  const formatLocationInput = (s: string) =>
    s
      .replace(/_/g, " ")
      .replace(/\s*-\s*/g, "  ")
      .replace(/\s{3,}/g, "  ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatted = (s: string) => s.replace(/ - /g, "  ").replace(/\s+/g, " ");

  const getValidRegionName = (
    stateName: string | null | undefined,
    regionName: string | null | undefined,
    allStates: StateOption[],
  ): string | undefined => {
    if (!stateName || !regionName) return undefined;
    const st = allStates.find(
      (s) =>
        s.name.toLowerCase() === stateName.toLowerCase() ||
        s.value.toLowerCase() === stateName.toLowerCase(),
    );
    if (!st?.regions?.length) return undefined;
    const reg = st.regions.find(
      (r) =>
        r.name.toLowerCase() === regionName.toLowerCase() ||
        r.value.toLowerCase() === regionName.toLowerCase(),
    );
    return reg?.name;
  };
  const handleLocationOpen = () => {
    const f = getEffectiveFilters();

    const matchedState = states.find(
      (s) =>
        s.name?.toLowerCase() === (f.state ?? "").toLowerCase() ||
        s.value?.toLowerCase() === (f.state ?? "").toLowerCase(),
    );

    setTempState(matchedState?.name ?? f.state ?? null);

    // ✅ region dropdown-ல் இருக்கா check பண்ணு
    const matchedRegion = matchedState?.regions?.find(
      (r) =>
        r.name?.toLowerCase() === (f.region ?? "").toLowerCase() ||
        r.value?.toLowerCase() === (f.region ?? "").toLowerCase(),
    );

    if (matchedRegion) {
      setTempRegion(matchedRegion.name);
      setTempRegionRaw(null);
    } else if (f.region) {
      // ✅ dropdown-ல் இல்ல — raw-ஆ store பண்ணு
      setTempRegion(null);
      setTempRegionRaw(f.region);
    } else {
      setTempRegion(null);
      setTempRegionRaw(null);
    }

    setOpenModal("location");
  };
  const handleLocationSearch = () => {
    triggerGlobalLoaders();
    const newFilters = {
      ...currentFilters,
      state: tempState?.toLowerCase() ?? undefined,
      region:
        tempRegion?.toLowerCase() ?? tempRegionRaw?.toLowerCase() ?? undefined,
      suburb: undefined,
      pincode: undefined,
      page: 1,
    };
    const slugPath = buildSlugFromFilters(newFilters);
    const safeSlug = slugPath.endsWith("/") ? slugPath : `${slugPath}/`;
    router.push(safeSlug);
    setOpenModal(null);
  };
  const handleLocationClear = () => {
    if (currentFilters.suburb) {
      setTempRegionRaw(null);
      // ✅ Suburb மட்டும் clear — state, region தொடரும்
      updateFiltersAndURL({
        ...currentFilters,
        suburb: undefined,
        pincode: undefined,
        radius_kms: undefined,
      });
    } else {
      // ✅ State/region clear
      setTempState(null);
      setTempRegion(null);
      setTempRegionRaw(null);
      updateFiltersAndURL({
        state: undefined,
        region: undefined,
        suburb: undefined,
        pincode: undefined,
        radius_kms: undefined,
      });
    }
    setOpenModal(null);
  };

  const filteredRegions =
    states.find((s) => s.name.toLowerCase() === tempState?.toLowerCase())
      ?.regions ?? [];

  const hasTypeChange = tempCategory !== (currentFilters.category ?? null);
  const hasLocationChange =
    (tempState?.toLowerCase() ?? null) !==
      (currentFilters.state?.toLowerCase() ?? null) ||
    (tempRegion?.toLowerCase() ?? null) !==
      (currentFilters.region?.toLowerCase() ?? null);
  const closeBtn = (
    <button className="filter-close" onClick={() => setOpenModal(null)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 64 64"
      >
        <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
      </svg>
    </button>
  );
  const localOverrideRef = useRef<Partial<Filters>>({});

  // ── Helper: currentFilters + local override merge பண்ணு ──
  const getEffectiveFilters = () => {
    const merged = { ...currentFilters };
    // localOverrideRef-ல் உள்ள keys loop பண்ணி explicitly override பண்ணு
    for (const key of Object.keys(localOverrideRef.current)) {
      const val = localOverrideRef.current[key];
      if (val === null || val === undefined) {
        delete merged[key]; // ✅ null/undefined ஆனா key-ஐயே remove பண்ணு
      } else {
        merged[key] = val;
      }
    }
    return merged;
  };

  // ── In FilterSlider component, add this ref near the top (after useState declarations) ──

  const cachedCategoryCountsRef = useRef<CategoryCount[]>([]);

  // Update cache whenever we get real data
  useEffect(() => {
    if (categoryCounts.length > 0) {
      cachedCategoryCountsRef.current = categoryCounts;
    }
  }, [categoryCounts]);

  // utils/formatSuburb.ts (or wherever suburb label is formatted)

  const AUS_ABBR: Record<string, string> = {
    VICTORIA: "VIC",
    "NEW SOUTH WALES": "NSW",
    QUEENSLAND: "QLD",
    "SOUTH AUSTRALIA": "SA",
    "WESTERN AUSTRALIA": "WA",
    TASMANIA: "TAS",
    "NORTHERN TERRITORY": "NT",
    "AUSTRALIAN CAPITAL TERRITORY": "ACT",
  };

  return (
    <>
      <div className="filter-row">
        <div className="slider-wrapper">
          <Swiper
            modules={[Navigation]}
            spaceBetween={10}
            slidesPerView="auto"
            navigation
            className="filter-swiper"
          >
            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.category ? "active" : ""}`}
                onClick={handleTypeOpen}
              >
                {currentFilters.category ? (
                  <>
                    <small className="selected_label">Type: </small>
                    {toTitleCase(
                      categoryCounts.find(
                        (c) => c.slug === currentFilters.category,
                      )?.name ?? currentFilters.category,
                    )}
                    <span className="active_filter">
                      <i className="bi bi-circle-fill"></i>
                    </span>
                  </>
                ) : (
                  "Caravan Type"
                )}
              </button>
            </SwiperSlide>

            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.state || currentFilters.suburb ? "active" : ""}`}
                onClick={handleLocationOpen}
              >
                {currentFilters.state ? (
                  <>
                    <small className="selected_label">Location: </small>
                    {currentFilters.region && (
                      <>{toTitleCase(currentFilters.region)},</>
                    )}
                    {toTitleCase(currentFilters.state)}
                    <span className="active_filter">
                      <i className="bi bi-circle-fill"></i>
                    </span>
                  </>
                ) : (
                  "Location"
                )}
              </button>
            </SwiperSlide>
            {currentFilters.suburb ? (
              <SwiperSlide style={{ width: "auto" }}>
                <button
                  className={`tag ${currentFilters.state || currentFilters.suburb ? "active" : ""}`}
                  onClick={handleLocationSuburbOpen}
                >
                  {currentFilters.suburb ? (
                    // ✅ Suburb is set — show suburb + state abbr + pincode + radius
                    <>
                      <small className="selected_label">Suburb: </small>
                      {toTitleCase(currentFilters.suburb)}
                      {currentFilters.state && (
                        <>
                          ,{" "}
                          {AUS_ABBR[currentFilters.state.toUpperCase()] ??
                            currentFilters.state.toUpperCase()}
                        </>
                      )}
                      {currentFilters.pincode && <> {currentFilters.pincode}</>}
                      <span className="active_filter">
                        <i className="bi bi-circle-fill"></i>
                      </span>
                    </>
                  ) : currentFilters.state ? (
                    // ✅ Only state/region — existing logic
                    <>
                      <small className="selected_label">Suburb: </small>
                      {currentFilters.region && (
                        <>{toTitleCase(currentFilters.region)}, </>
                      )}
                      {toTitleCase(currentFilters.state)}
                      <span className="active_filter">
                        <i className="bi bi-circle-fill"></i>
                      </span>
                    </>
                  ) : (
                    "Suburb"
                  )}
                </button>
              </SwiperSlide>
            ) : (
              " "
            )}

            {/* Location SwiperSlide முடிந்த உடனே — suburb slide-க்கு முன்னாடி */}
            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.condition ? "active" : ""}`}
                onClick={handleConditionOpen}
              >
                {currentFilters.condition ? (
                  <>
                    <small className="selected_label">Condition: </small>
                    {currentFilters.condition === "new" ? "New" : "Used"}
                    <span className="active_filter">
                      <i className="bi bi-circle-fill"></i>
                    </span>
                  </>
                ) : (
                  "Condition"
                )}
              </button>
            </SwiperSlide>
            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.make ? "active" : ""}`}
                onClick={handleMakeOpen}
              >
                {currentFilters.make ? (
                  <>
                    <small className="selected_label">Make: </small>
                    {toTitleCase(
                      makeCounts.find((m) => m.slug === currentFilters.make)
                        ?.name ??
                        makes.find((m) => m.slug === currentFilters.make)
                          ?.name ??
                        currentFilters.make,
                    )}
                    {currentFilters.model && (
                      <>
                        , <small className="selected_label">Model: </small>
                        {lastModelName ??
                          modelCounts.find(
                            (m) => m.slug === currentFilters.model,
                          )?.name ??
                          toTitleCase(currentFilters.model.replace(/-/g, " "))}
                      </>
                    )}
                    <span className="active_filter">
                      <i className="bi bi-circle-fill"></i>
                    </span>
                  </>
                ) : (
                  "Make"
                )}
              </button>
            </SwiperSlide>

            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.from_price || currentFilters.to_price ? "active" : ""}`}
                onClick={handlePriceOpen}
              >
                {currentFilters.from_price || currentFilters.to_price ? (
                  <>
                    <small className="selected_label">Price: </small>
                    {currentFilters.from_price && currentFilters.to_price
                      ? `${Number(currentFilters.from_price).toLocaleString()} – ${Number(currentFilters.to_price).toLocaleString()}`
                      : currentFilters.from_price
                        ? `From ${Number(currentFilters.from_price).toLocaleString()}`
                        : `Upto ${Number(currentFilters.to_price).toLocaleString()}`}
                    <span className="active_filter">
                      <i className="bi bi-circle-fill"></i>
                    </span>
                  </>
                ) : (
                  "Price"
                )}
              </button>
            </SwiperSlide>

            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.minKg || currentFilters.maxKg ? "active" : ""}`}
                onClick={handleAtmOpen}
              >
                {currentFilters.minKg || currentFilters.maxKg ? (
                  <>
                    <small className="selected_label">ATM: </small>
                    {currentFilters.minKg && currentFilters.maxKg
                      ? `${Number(currentFilters.minKg).toLocaleString()} kg – ${Number(currentFilters.maxKg).toLocaleString()} kg`
                      : currentFilters.minKg
                        ? `From ${Number(currentFilters.minKg).toLocaleString()} kg`
                        : `Upto ${Number(currentFilters.maxKg).toLocaleString()} kg`}
                    <span className="active_filter">
                      <i className="bi bi-circle-fill"></i>
                    </span>
                  </>
                ) : (
                  "ATM"
                )}
              </button>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
      {openModal === "suburb" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              {!tempSuburbSuggestion && currentFilters.suburb && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ margin: 0 }}>
                    <strong>
                      Suburb: {toTitleCase(currentFilters.suburb)}
                      {currentFilters.state && (
                        <>
                          ,{" "}
                          {AUS_ABBR[currentFilters.state.toUpperCase()] ??
                            currentFilters.state.toUpperCase()}
                        </>
                      )}
                      {currentFilters.pincode && <> {currentFilters.pincode}</>}
                    </strong>
                  </p>
                </div>
              )}
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="filter-item search-filter">
                <div className="search-box">
                  <div className="secrch_icon" style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <i
                        className="bi bi-search search-icon"
                        style={{
                          position: "absolute",
                          left: 10,
                          zIndex: 1,
                          pointerEvents: "none",
                        }}
                      ></i>
                      <input
                        type="text"
                        className="filter-dropdown cfs-select-input"
                        autoComplete="off"
                        placeholder="Search suburb, postcode, state, region"
                        value={formatted(tempSuburbInput)}
                        onFocus={() => setShowSuburbSuggestions(true)}
                        onChange={(e) => {
                          setShowSuburbSuggestions(true);
                          const rawValue = e.target.value;
                          setTempSuburbInput(rawValue);

                          const formattedValue = /^\d+$/.test(rawValue)
                            ? rawValue
                            : formatLocationInput(rawValue);

                          if (formattedValue.length < 1) {
                            setSuburbLocationSuggestions([]);
                            return;
                          }

                          const suburb = formattedValue.split(" ")[0];
                          fetchLocations(suburb)
                            .then((data) => {
                              const filtered = data.filter((item) => {
                                const searchValue =
                                  formattedValue.toLowerCase();
                                return (
                                  item.short_address
                                    .toLowerCase()
                                    .includes(searchValue) ||
                                  item.address
                                    .toLowerCase()
                                    .includes(searchValue) ||
                                  (item.postcode &&
                                    item.postcode
                                      .toString()
                                      .includes(searchValue))
                                );
                              });
                              setSuburbLocationSuggestions(filtered);
                            })
                            .catch(console.error);
                        }}
                        onBlur={() =>
                          setTimeout(() => setShowSuburbSuggestions(false), 150)
                        }
                      />
                    </div>

                    {showSuburbSuggestions &&
                      suburbLocationSuggestions.length > 0 && (
                        <ul className="location-suggestions">
                          {suburbLocationSuggestions.map((item, i) => {
                            const isSelected =
                              tempSuburbSuggestion?.short_address ===
                              item.short_address;
                            return (
                              <li
                                key={i}
                                className={`suggestion-item ${isSelected ? "selected" : ""}`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setTempSuburbSuggestion(item);
                                  setTempSuburbInput(item.short_address);
                                  setSuburbLocationSuggestions([]);
                                  setShowSuburbSuggestions(false);
                                }}
                              >
                                {item.address}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                    {tempSuburbSuggestion &&
                      tempSuburbInput ===
                        tempSuburbSuggestion.short_address && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>
                            {tempSuburbSuggestion.address}{" "}
                            {tempSuburbSuggestion.uri.split("/").length >=
                              3 && <span>+{tempSuburbRadius}km</span>}
                          </div>
                          {tempSuburbSuggestion.uri.split("/").length >= 3 && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <input
                                type="range"
                                min={0}
                                max={RADIUS_OPTIONS.length - 1}
                                step={1}
                                value={Math.max(
                                  0,
                                  RADIUS_OPTIONS.indexOf(
                                    tempSuburbRadius as (typeof RADIUS_OPTIONS)[number],
                                  ),
                                )}
                                onChange={(e) => {
                                  const idx = parseInt(e.target.value, 10);
                                  setTempSuburbRadius(RADIUS_OPTIONS[idx]);
                                }}
                                style={{ flex: 1 }}
                                aria-label="Search radius in kilometers"
                              />
                              <div style={{ minWidth: 60, textAlign: "right" }}>
                                +{tempSuburbRadius}km
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={() => {
                  // ✅ currentFilters.region, states list-ல் இருக்கா check பண்ணு
                  const currentState = currentFilters.state;
                  const currentRegion = currentFilters.region;

                  const matchedState = states.find(
                    (s) =>
                      s.name?.toLowerCase() === currentState?.toLowerCase(),
                  );
                  const isRegionInList = matchedState?.regions?.some(
                    (r) =>
                      r.name?.toLowerCase() === currentRegion?.toLowerCase(),
                  );

                  // ✅ list-ல் இல்லாத region (raw) மட்டும் clear
                  const shouldClearRegion = currentRegion && !isRegionInList;

                  setTempRegionRaw(null);
                  setTempSuburbInput("");
                  setTempSuburbSuggestion(null);

                  updateFiltersAndURL({
                    suburb: undefined,
                    pincode: undefined,
                    radius_kms: undefined,
                    ...(shouldClearRegion ? { region: undefined } : {}),
                  });

                  setOpenModal(null);
                }}
                style={{
                  opacity:
                    currentFilters.suburb || tempSuburbSuggestion ? 1 : 0.4,
                  cursor:
                    currentFilters.suburb || tempSuburbSuggestion
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempSuburbSuggestion ? "active" : ""}`}
                onClick={() => {
                  if (!tempSuburbSuggestion) {
                    setOpenModal(null);
                    return;
                  }

                  triggerGlobalLoaders();

                  const uriParts = tempSuburbSuggestion.uri.split("/");
                  const stateSlug = uriParts[0] || "";
                  const regionSlug = uriParts[1] || "";
                  const suburbSlug = uriParts[2] || "";
                  let pincode = uriParts[3] || "";

                  const state = stateSlug
                    .replace(/-state$/, "")
                    .replace(/-/g, " ")
                    .trim();
                  const region = regionSlug
                    .replace(/-region$/, "")
                    .replace(/-/g, " ")
                    .trim();
                  const suburb = suburbSlug
                    .replace(/-suburb$/, "")
                    .replace(/-/g, " ")
                    .trim();

                  if (!/^\d{4}$/.test(pincode)) {
                    const m = tempSuburbSuggestion.address.match(/\b\d{4}\b/);
                    if (m) pincode = m[0];
                  }

                  const validRegion = getValidRegionName(state, region, states);

                  const newFilters = {
                    ...currentFilters,
                    suburb: suburb.toLowerCase(),
                    pincode: pincode || undefined,
                    state: state,
                    region: validRegion || region,
                    radius_kms: tempSuburbRadius,
                    page: 1,
                  };

                  const slugPath = buildSlugFromFilters(newFilters);
                  const safeSlug = slugPath.endsWith("/")
                    ? slugPath
                    : `${slugPath}/`;
                  router.push(safeSlug);
                  setOpenModal(null);
                }}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Caravan Type Modal */}
      {openModal === "type" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Caravan Type</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="filter-item pt-0">
                <ul
                  className="category-list"
                  style={{ listStyle: "none", padding: 0, margin: 0 }}
                >
                  {isCategoryCountLoading &&
                  cachedCategoryCountsRef.current.length === 0 ? (
                    <CategorySkeleton />
                  ) : (
                    // Use cached data as fallback while re-fetching
                    (categoryCounts.length > 0
                      ? categoryCounts
                      : cachedCategoryCountsRef.current
                    ).map((cat) => (
                      <li key={cat.slug} className="category-item">
                        <label className="category-checkbox-row checkbox">
                          <div className="d-flex align-items-center">
                            <input
                              className="checkbox__trigger visuallyhidden"
                              type="checkbox"
                              checked={tempCategory === cat.slug}
                              onChange={() =>
                                setTempCategory(
                                  tempCategory === cat.slug ? null : cat.slug,
                                )
                              }
                            />
                            <span className="checkbox__symbol">
                              <svg
                                aria-hidden="true"
                                className="icon-checkbox"
                                width="28px"
                                height="28px"
                                viewBox="0 0 28 28"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M4 14l8 7L24 7"></path>
                              </svg>
                            </span>
                            <span className="category-name">{cat.name}</span>
                          </div>
                          <span className="category-count">({cat.count})</span>
                        </label>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleTypeClear}
                style={{
                  opacity: tempCategory ? 1 : 0.4,
                  cursor: tempCategory ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${hasTypeChange ? "active" : ""}`}
                onClick={handleTypeSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {openModal === "location" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Location</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>State</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempState || ""}
                      onChange={(e) => {
                        const newState = e.target.value || null;
                        if (newState === tempState) return;
                        setTempState(newState);
                        setTempRegion(null);
                      }}
                    >
                      <option value="">Any</option>
                      {states.map((s, i) => (
                        <option key={i} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {tempState && filteredRegions.length > 0 && (
                  <div className="col-lg-6">
                    <div className="location-item">
                      <label>Region</label>
                      <select
                        className="cfs-select-input form-select"
                        value={tempRegion || tempRegionRaw || ""}
                        onChange={(e) => {
                          setTempRegion(e.target.value || null);
                          setTempRegionRaw(null); // user manually changed
                        }}
                      >
                        <option value="">Any</option>

                        {/* ✅ dropdown-ல் இல்லாத region dynamic-ஆ show பண்ணு */}
                        {tempRegionRaw &&
                          !filteredRegions.some(
                            (r) =>
                              r.name.toLowerCase() ===
                              tempRegionRaw.toLowerCase(),
                          ) && (
                            <option value={tempRegionRaw}>
                              {tempRegionRaw}
                            </option>
                          )}

                        {filteredRegions.map((r, i) => (
                          <option key={i} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleLocationClear}
                style={{
                  opacity: tempState ? 1 : 0.4,
                  cursor: tempState ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${hasLocationChange ? "active" : ""}`}
                onClick={handleLocationSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Make & Model Modal */}
      {openModal === "make" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Make & Model</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Make</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempMake ?? ""}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        setTempMake(val);
                        setTempModel(null);
                        if (!val) setModelCounts([]);
                      }}
                    >
                      <option value="">Any</option>
                      {makeLoading ? (
                        <option disabled>Loading...</option>
                      ) : (
                        <>
                          {/* ✅ tempMake இருக்கு ஆனால் makeCounts-ல் இல்லன்னா
                          (0 products — count இல்ல) manually show பண்ணு */}
                          {tempMake &&
                            !filteredMakes.some((m) => m.slug === tempMake) && (
                              <option value={tempMake}>
                                {makes.find((m) => m.slug === tempMake)?.name ??
                                  tempMake}{" "}
                                (0)
                              </option>
                            )}
                          {filteredMakes.map((m) => (
                            <option key={m.slug} value={m.slug}>
                              {m.name} ({m.count})
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>
                {tempMake && (
                  <div className="col-lg-6">
                    <div className="location-item">
                      <label>Model</label>
                      <select
                        className="cfs-select-input form-select"
                        value={tempModel ?? ""}
                        onChange={(e) => setTempModel(e.target.value || null)}
                      >
                        <option value="">Any</option>
                        {modelCountLoading ? (
                          <option disabled>Loading...</option>
                        ) : (
                          <>
                            {/* ✅ tempModel இருக்கு ஆனால் modelCounts-ல் இல்லன்னா
                            (0 products) manually show பண்ணு */}
                            {tempModel &&
                              !modelCounts.some(
                                (m) => m.slug === tempModel,
                              ) && (
                                <option value={tempModel}>
                                  {tempModel} (0)
                                </option>
                              )}
                            {modelCounts.map((mod) => (
                              <option key={mod.slug} value={mod.slug}>
                                {mod.name || mod.slug} ({mod.count})
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleMakeClear}
                style={{
                  opacity: tempMake ? 1 : 0.4,
                  cursor: tempMake ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempMake ? "active" : ""}`}
                onClick={handleMakeSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Modal */}
      {openModal === "price" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Price</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempPriceFrom ?? ""}
                      onChange={(e) =>
                        setTempPriceFrom(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Any</option>
                      {priceOptions.map((v) => (
                        <option key={v} value={v}>
                          ${v.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempPriceTo ?? ""}
                      onChange={(e) =>
                        setTempPriceTo(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Any</option>
                      {priceOptions
                        .filter((v) => !tempPriceFrom || v > tempPriceFrom)
                        .map((v) => (
                          <option key={v} value={v}>
                            ${v.toLocaleString()}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handlePriceClear}
                style={{
                  opacity: tempPriceFrom || tempPriceTo ? 1 : 0.4,
                  cursor:
                    tempPriceFrom || tempPriceTo ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempPriceFrom || tempPriceTo ? "active" : ""}`}
                onClick={handlePriceSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATM Modal */}
      {openModal === "atm" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>ATM</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempAtmFrom ?? ""}
                      onChange={(e) =>
                        setTempAtmFrom(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Any</option>
                      {atmOptions.map((v) => (
                        <option key={v} value={v}>
                          {v} kg
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempAtmTo ?? ""}
                      onChange={(e) =>
                        setTempAtmTo(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Any</option>
                      {atmOptions
                        .filter((v) => !tempAtmFrom || v > tempAtmFrom)
                        .map((v) => (
                          <option key={v} value={v}>
                            {v} kg
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleAtmClear}
                style={{
                  opacity: tempAtmFrom || tempAtmTo ? 1 : 0.4,
                  cursor: tempAtmFrom || tempAtmTo ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempAtmFrom || tempAtmTo ? "active" : ""}`}
                onClick={handleAtmSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* {condition label} */}
      {/* Condition Modal */}
      {openModal === "condition" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Condition</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="filter-item condition-field">
                <ul className="category-list">
                  <li className="category-item">
                    <label className="category-checkbox-row checkbox">
                      <div className="d-flex align-items-center">
                        <input
                          className="checkbox__trigger visuallyhidden"
                          type="checkbox"
                          checked={tempCondition?.toLowerCase() === "new"}
                          onChange={() =>
                            setTempCondition(
                              tempCondition === "new" ? null : "new",
                            )
                          }
                        />
                        <span className="checkbox__symbol">
                          <svg
                            aria-hidden="true"
                            className="icon-checkbox"
                            width="28px"
                            height="28px"
                            viewBox="0 0 28 28"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M4 14l8 7L24 7"></path>
                          </svg>
                        </span>
                        <span className="category-name">New</span>
                      </div>
                    </label>
                  </li>

                  <li className="category-item">
                    <label className="category-checkbox-row checkbox">
                      <div className="d-flex align-items-center">
                        <input
                          className="checkbox__trigger visuallyhidden"
                          type="checkbox"
                          checked={tempCondition?.toLowerCase() === "used"}
                          onChange={() =>
                            setTempCondition(
                              tempCondition === "used" ? null : "used",
                            )
                          }
                        />
                        <span className="checkbox__symbol">
                          <svg
                            aria-hidden="true"
                            className="icon-checkbox"
                            width="28px"
                            height="28px"
                            viewBox="0 0 28 28"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M4 14l8 7L24 7"></path>
                          </svg>
                        </span>
                        <span className="category-name">Used</span>
                      </div>
                    </label>
                  </li>
                </ul>
              </div>
            </div>

            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleConditionClear}
                style={{
                  opacity: tempCondition ? 1 : 0.4,
                  cursor: tempCondition ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempCondition ? "active" : ""}`}
                onClick={handleConditionSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterSlider;
