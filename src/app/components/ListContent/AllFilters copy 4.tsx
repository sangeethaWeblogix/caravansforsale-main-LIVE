 import { fetchLocations } from "@/api/location/api";
  import React, {
    useState,
    Dispatch,
    SetStateAction,
    useEffect,
    useRef,
    useTransition,
    useMemo,
  } from "react";
  import { BiChevronDown } from "react-icons/bi";
  import { usePathname, useRouter } from "next/navigation";
  // import { useSearchParams } from "next/navigation";
  import { fetchProductList } from "@/api/productList/api";
   import { buildSlugFromFilters } from "../slugBuilter";
  import { buildUpdatedFilters } from "../buildUpdatedFilters";
  import {
    fetchKeywordSuggestions,
    fetchHomeSearchList,
  } from "@/api/homeSearch/api";
  import { flushSync } from "react-dom";
  import { fetchMakeDetails } from "@/api/make-new/api";
  
  type LocationSuggestion = {
    key: string;
    uri: string;
    address: string;
    short_address: string;
  };
  
  interface Category {
    name: string;
    slug: string;
  }
  
  type CategoryCount = {
    name: string;
    slug: string;
    count: number;
  };
  
  interface StateOption {
    value: string;
    name: string;
    regions?: {
      name: string;
      value: string;
      suburbs?: {
        name: string;
        value: string;
      }[];
    }[];
  }
  
  interface MakeModel {
    name: string;
    slug: string;
  }
  
  interface Make {
    id?: number;
    name: string;
    slug: string;
    models?: MakeModel[];
  }
  type MakeCount = {
    name: string;
    slug: string;
    count: number;
  };
  
  type ModelCount = {
    name: string;
    slug: string;
    count: number;
  };
  
  export interface Filters {
    page?: number | string; // <- allow both
    category?: string;
    make?: string;
    location?: string | null;
    from_price?: string | number;
    to_price?: string | number;
    condition?: string;
    sleeps?: string;
    states?: string;
    minKg?: string | number;
    maxKg?: string | number;
    acustom_fromyears?: number | string;
    acustom_toyears?: number | string;
    from_length?: string | number;
    to_length?: string | number;
    from_sleep?: string | number;
    to_sleep?: string | number;
    model?: string;
    state?: string;
    region?: string;
    suburb?: string;
    pincode?: string;
    radius_kms?: number | string; // <- allow both
    search?: string; // <- for search
    keyword?: string; // <- for keyword search
  }
  
  interface CaravanFilterProps {
    categories: Category[];
    makes: Make[];
    models: Model[];
    setIsLoading?: (val: boolean) => void;
    setIsMainLoading?: (val: boolean) => void;
    setIsFeaturedLoading?: (val: boolean) => void;
    setIsPremiumLoading?: (val: boolean) => void;
    states: StateOption[];
    currentFilters: Filters;
    onFilterChange: (filters: Filters) => void;
  }
  
  interface Option {
    name: string;
    slug: string;
  }
  interface Model {
    name: string;
    slug: string;
  }
  
  type Suburb = {
    name: string;
    value: string;
  };
  
  type HomeSearchItem = {
    label?: string;
    name?: string;
    title?: string;
    keyword?: string;
    value?: string;
    slug?: string;
    url?: string;
  };
  
  type KeywordItem = { label: string; url?: string };
 
  const CaravanFilter: React.FC<CaravanFilterProps> = ({
    onFilterChange,
    currentFilters = {} as Filters,
    setIsFeaturedLoading,
    setIsPremiumLoading,
    setIsMainLoading,
    setIsLoading,
  }) => {
    const router = useRouter();
    const pathname = usePathname();
    // const searchParams = useSearchParams();
    const RADIUS_OPTIONS = [50, 100, 250, 500, 1000] as const;
    const [radiusKms, setRadiusKms] = useState<number>(RADIUS_OPTIONS[0]);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categories, setCategories] = useState<Option[]>([]);
    const [visibleCount, setVisibleCount] = useState(10);
    const [modelCounts, setModelCounts] = useState<ModelCount[]>([]);
  
    const [makes, setMakes] = useState<Make[]>([]);
    const [model, setModel] = useState<Model[]>([]);
    const [states, setStates] = useState<StateOption[]>([]);
    const [makeOpen, setMakeOpen] = useState(false);
    const [modelOpen, setModelOpen] = useState(false);
    // const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);
    const [filteredSuburbs, setFilteredSuburbs] = useState<Suburb[]>([]);
    const [filters, setFilters] = useState<Filters>({});
    const [conditionOpen, setConditionOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);
    const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
    const [tempSleepFrom, setTempSleepFrom] = useState<number | null>(null);
    const [tempSleepTo, setTempSleepTo] = useState<number | null>(null);
    const [isLengthModalOpen, setIsLengthModalOpen] = useState(false);
    const [tempLengthFrom, setTempLengthFrom] = useState<number | null>(null);
    const [tempLengthTo, setTempLengthTo] = useState<number | null>(null);
  
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  
    const [locationInput, setLocationInput] = useState("");
    const [makeCounts, setMakeCounts] = useState<MakeCount[]>([]);
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const [tempPriceFrom, setTempPriceFrom] = useState<number | null>(null);
    const [tempPriceTo, setTempPriceTo] = useState<number | null>(null);
  
    const [selectedMake, setSelectedMake] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [selectedpincode, setSelectedpincode] = useState<string | null>(null);
  
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedCategoryName, setSelectedCategoryName] = useState<
      string | null
    >(null);
    const [selectedMakeName, setSelectedMakeName] = useState<string | null>(null);
    const [selectedModelName, setSelectedModelName] = useState<string | null>(
      null,
    );
    const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
    // ATM modal states
    const [isATMModalOpen, setIsATMModalOpen] = useState(false);
  
    const [tempAtmFrom, setTempAtmFrom] = useState<number | null>(null);
    const [tempAtmTo, setTempAtmTo] = useState<number | null>(null);
  
    // top (other states kula)
    const [modalKeyword, setModalKeyword] = useState("");
    const [showAllModels, setShowAllModels] = useState(false);
    const hasCategoryBeenSetRef = useRef(false);
    const categoryApiCalledRef = useRef(false);
  
    const prevSuburbsKeyRef = useRef<string>("");
    const radiusDebounceRef = useRef<number | null>(null);
    const regionSetAfterSuburbRef = useRef(false);
  
    const makeInitializedRef = useRef(false); // ✅ add at top of component
  
    const lastPushedURLRef = useRef<string>("");
    const mountedRef = useRef(false);
  
    const lastSentFiltersRef = useRef<Filters | null>(null);
  
    const keepModelOpenRef = useRef(false);
    const isUserTypingRef = useRef(false);
  
    const hydratedKeyRef = useRef("");
    const [searchText, setSearchText] = useState("");
    const suburbClickedRef = useRef(false);
    const [selectedConditionName, setSelectedConditionName] = useState<
      string | null
    >(null);
    const [stateRegionOpen, setStateRegionOpen] = useState(true);
    const [stateLocationOpen, setStateLocationOpen] = useState(false);
    const [stateSuburbOpen, setStateSuburbOpen] = useState(true);
  
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedStateName, setSelectedStateName] = useState<string | null>(
      null,
    );
    const [selectedRegionName, setSelectedRegionName] = useState<string | null>(
      null,
    );
    const [selectedSuburbName, setSelectedSuburbName] = useState<string | null>(
      null,
    );
    // const [navigating, setNavigating] = useState(false);
  
    const [selectedSuggestion, setSelectedSuggestion] =
      useState<LocationSuggestion | null>(null);
    const [keywordInput, setKeywordInput] = useState("");
    const [keywordSuggestions, setKeywordSuggestions] = useState<KeywordItem[]>(
      [],
    );
    const [isModalMakeOpen, setIsModalMakeOpen] = useState(false);
    const [isYearModalOpen, setIsYearModalOpen] = useState(false);
    const [tempYear, setTempYear] = useState<number | null>(null);
  
    const [isMakeModalOpen, setIsMakeModalOpen] = useState(false);
    const [searchMake, setSearchMake] = useState("");
    const [selectedMakeTemp, setSelectedMakeTemp] = useState<string | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
    const [categorySearch, setCategorySearch] = useState("");
    const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [baseKeywords, setBaseKeywords] = useState<KeywordItem[]>([]);
    const [keywordLoading, setKeywordLoading] = useState(false);
    const [baseLoading, setBaseLoading] = useState(false);
    const pickedSourceRef = useRef<"base" | "typed" | null>(null);
    const [atmFrom, setAtmFrom] = useState<number | null>(null);
    const [atmTo, setAtmTo] = useState<number | null>(null);
    const [lengthFrom, setLengthFrom] = useState<number | null>(null);
    const [lengthTo, setLengthTo] = useState<number | null>(null);
  
    const conditionDatas = ["New", "Used"];
    const [minPrice, setMinPrice] = useState<number | null>(null);
    const [maxPrice, setMaxPrice] = useState<number | null>(null);
  
    const filtersInitialized = useRef(false);
    const [yearFrom, setYearFrom] = useState<number | null>(null);
    const [yearTo, setYearTo] = useState<number | null>(null);
    const [sleepFrom, setSleepFrom] = useState<number | null>(null);
    const [sleepTo, setSleepTo] = useState<number | null>(null);
    const [popularMakes, setPopularMakes] = useState<MakeCount[]>([]);

    // ✅ NEW: Temp states for desktop "defer until Search" pattern
    const [tempCondition, setTempCondition] = useState<string | null>(null);
    const [tempState, setTempState] = useState<string | null>(null);
    const [tempStateName, setTempStateName] = useState<string | null>(null);
    const [tempRegionName, setTempRegionName] = useState<string | null>(null);
    const [tempRegionValue, setTempRegionValue] = useState<string | undefined>(undefined);
    const [tempSuburbName, setTempSuburbName] = useState<string | null>(null);
    const [tempPincode, setTempPincode] = useState<string | null>(null);
    const [tempSuggestion, setTempSuggestion] = useState<LocationSuggestion | null>(null);
    const [tempRadiusKms, setTempRadiusKms] = useState<number>(RADIUS_OPTIONS[0]);
    const [tempYearFrom, setTempYearFrom] = useState<number | null>(null);
    const [tempYearTo, setTempYearTo] = useState<number | null>(null);
  
    const atm = [
      600, 800, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000,
      4500,
    ];
    console.log(onFilterChange);
    const price = [
      10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000,
      125000, 150000, 175000, 200000, 225000, 250000, 275000, 300000,
    ];
  
    const years = [
      2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015,
      2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004,
    ];
  
    const length = [
      12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
    ];
    const sleep = [1, 2, 3, 4, 5, 6, 7];
    const [selectedRegion, setSelectedRegion] = useState<string>();
    const [showSuggestions, setShowSuggestions] = useState(false);
    // put near other utils
    const AUS_ABBR: Record<string, string> = {
      Victoria: "VIC",
      "New South Wales": "NSW",
      Queensland: "QLD",
      "South Australia": "SA",
      "Western Australia": "WA",
      Tasmania: "TAS",
      "Northern Territory": "NT",
      "Australian Capital Territory": "ACT",
    };

    // ✅ Hydrate temp states from currentFilters on mount / when currentFilters change
    useEffect(() => {
      setTempCategory(currentFilters.category || null);
      setSelectedMakeTemp(currentFilters.make || null);
      setTempModel(currentFilters.model || null);
      setTempCondition(currentFilters.condition || null);
      setTempAtmFrom(currentFilters.minKg != null ? Number(currentFilters.minKg) : null);
      setTempAtmTo(currentFilters.maxKg != null ? Number(currentFilters.maxKg) : null);
      setTempPriceFrom(currentFilters.from_price != null ? Number(currentFilters.from_price) : null);
      setTempPriceTo(currentFilters.to_price != null ? Number(currentFilters.to_price) : null);
      setTempSleepFrom(currentFilters.from_sleep != null ? Number(currentFilters.from_sleep) : null);
      setTempSleepTo(currentFilters.to_sleep != null ? Number(currentFilters.to_sleep) : null);
      setTempLengthFrom(currentFilters.from_length != null ? Number(currentFilters.from_length) : null);
      setTempLengthTo(currentFilters.to_length != null ? Number(currentFilters.to_length) : null);
      setTempYearFrom(currentFilters.acustom_fromyears != null ? Number(currentFilters.acustom_fromyears) : null);
      setTempYearTo(currentFilters.acustom_toyears != null ? Number(currentFilters.acustom_toyears) : null);
      setTempStateName(currentFilters.state || null);
      setTempRegionName(currentFilters.region || null);
      setTempSuburbName(currentFilters.suburb || null);
      setTempPincode(currentFilters.pincode || null);
      setTempRadiusKms(typeof currentFilters.radius_kms === "number" ? currentFilters.radius_kms : RADIUS_OPTIONS[0]);
    }, [currentFilters]);
  
    useEffect(() => {
      if (!selectedMakeTemp || makes.length === 0) {
        setModel([]);
        return;
      }
  
      const make = makes.find((m) => m.slug === selectedMakeTemp);
      setModel(make?.models || []);
    }, [selectedMakeTemp, makes]);
  
    const buildParamsFromFilters = (filters: Filters) => {
      const params = new URLSearchParams();
  
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          key !== "page" // page count-ku thevai illa
        ) {
          params.set(key, String(value));
        }
      });
  
      return params;
    };
  
    const fetchCounts = async (
      groupBy: "category" | "make" | "model",
      filters: Filters,
    ) => {
      const params = buildParamsFromFilters(filters);
      params.set("group_by", groupBy);
  
      const url = `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${params.toString()}`;
  
      const res = await fetch(url);
      const json = await res.json();
      return json.data || [];
    };

 const mergeFilters = (base: Filters, local: Filters): Filters => {
   const merged: Filters = { ...base };
   for (const key of Object.keys(local) as (keyof Filters)[]) {
     const val = local[key];
     if (val !== undefined && val !== null && val !== "") {
       (merged as any)[key] = val;
     }
   }
   return merged;
 };
 
 const buildCountParamsMulti = (
   filters: Filters,
   excludeFields: string[] = []
 ) => {
   const params = new URLSearchParams();
 
   const filterMap: Record<string, string | number | undefined | null> = {
     category: filters.category,
     make: filters.make,
     model: filters.model,
     condition: filters.condition,
     state: filters.state?.toLowerCase(),
     region: filters.region,
     suburb: filters.suburb,
     pincode: filters.pincode,
     from_price: filters.from_price,
     to_price: filters.to_price,
     from_atm: filters.minKg,
     to_atm: filters.maxKg,
     acustom_fromyears: filters.acustom_fromyears,
     acustom_toyears: filters.acustom_toyears,
     from_length: filters.from_length,
     to_length: filters.to_length,
     from_sleep: filters.from_sleep,
     to_sleep: filters.to_sleep,
     search: filters.search,
     keyword: filters.keyword,
   };
 
   Object.entries(filterMap).forEach(([key, value]) => {
     if (excludeFields.includes(key)) return;
     if (value !== undefined && value !== null && value !== "") {
       params.set(key, String(value));
     }
   });
 
   return params;
 };
 
 useEffect(() => {
   const activeFilters: Filters = mergeFilters(currentFilters, filters);
 
   const controller = new AbortController();
   const { signal } = controller;
 
   // ─── CATEGORY COUNTS ───
   const catParams = buildCountParamsMulti(activeFilters, ["category"]);
   catParams.set("group_by", "category");
 
   fetch(
     `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${catParams.toString()}`,
     { signal }
   )
     .then((res) => res.json())
     .then((json) => {
       if (!signal.aborted) setCategoryCounts(json.data || []);
     })
     .catch((e) => { if (e.name !== "AbortError") console.error(e); });
 
   // ─── MAKE COUNTS ───
   const makeParams = buildCountParamsMulti(activeFilters, ["make", "model"]);
   makeParams.set("group_by", "make");
 
   const makeURL = `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${makeParams.toString()}`;
 
   fetch(makeURL, { signal })
     .then((res) => res.json())
     .then((json) => {
       if (!signal.aborted) {
         setMakeCounts(json.data || []);
         setPopularMakes(json.popular_makes || []);
       }
     })
     .catch((e) => { if (e.name !== "AbortError") console.error(e); });
 
   // ─── MODEL COUNTS ───
   const activeMake = activeFilters.make;
   if (activeMake) {
     const modelParams = buildCountParamsMulti(activeFilters, ["model"]);
     modelParams.set("group_by", "model");
     modelParams.set("make", activeMake);
 
     fetch(
       `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${modelParams.toString()}`,
       { signal }
     )
       .then((res) => res.json())
       .then((json) => {
         if (!signal.aborted) setModelCounts(json.data || []);
       })
       .catch((e) => { if (e.name !== "AbortError") console.error(e); });
   } else {
     setModelCounts([]);
   }
 
   return () => controller.abort();
 }, [
   currentFilters?.category,
   currentFilters?.make,
   currentFilters?.model,
   currentFilters?.condition,
   currentFilters?.state,
   currentFilters?.region,
   currentFilters?.suburb,
   currentFilters?.from_price,
   currentFilters?.to_price,
   currentFilters?.minKg,
   currentFilters?.maxKg,
   currentFilters?.acustom_fromyears,
   currentFilters?.acustom_toyears,
   currentFilters?.from_length,
   currentFilters?.to_length,
   currentFilters?.from_sleep,
   currentFilters?.to_sleep,
   currentFilters?.search,
   currentFilters?.keyword,
   filters.category,
   filters.make,
   filters.model,
   filters.state,
   filters.region,
   filters.suburb,
   filters.condition,
   filters.from_price,
   filters.to_price,
   filters.minKg,
   filters.maxKg,
   filters.acustom_fromyears,
   filters.acustom_toyears,
   filters.from_length,
   filters.to_length,
   filters.from_sleep,
   filters.to_sleep,
   filters.search,
   filters.keyword,
 ]);

    // ✅ Make select - ONLY updates temp, no API commit
    const handleMakeSelect = (make: { slug: string; name: string }) => {
      if (selectedMakeTemp === make.slug) {
        setSelectedMakeTemp(null);
        setTempModel(null); // clear model when make is deselected
        return;
      }
      setSelectedMakeTemp(make.slug);
      setTempModel(null); // reset model when make changes
      // triggerOptimizeApi only (background preload, no data change)
      triggerOptimizeApi("make", make.slug);
    };
  
    const handleMakeTempSelect = (make: {
      slug: string;
      name: string;
    }) => {
      setSelectedMakeTemp(make.slug);
      setSearchMake(make.name);
      triggerOptimizeApi("make", make.slug);
    };
  
    const buildCountParams = (filters: Filters, excludeField?: string) => {
      const params = new URLSearchParams();
  
      const filterMap: Record<string, string | number | undefined | null> = {
        category: filters.category,
        make: filters.make,
        model: filters.model,
        condition: filters.condition,
         state: filters.state?.toLowerCase(),
        region: filters.region,
        suburb: filters.suburb,
        pincode: filters.pincode,
        from_price: filters.from_price,
        to_price: filters.to_price,
        minKg: filters.minKg,
        maxKg: filters.maxKg,
        acustom_fromyears: filters.acustom_fromyears,
        acustom_toyears: filters.acustom_toyears,
        from_length: filters.from_length,
        to_length: filters.to_length,
        from_sleep: filters.from_sleep,
        to_sleep: filters.to_sleep,
        search: filters.search,
        keyword: filters.keyword,
      };
  
      Object.entries(filterMap).forEach(([key, value]) => {
        if (key === excludeField) return;
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        }
      });
  
      return params;
    };
  
    const isSearching = searchText.trim().length > 0;
  
    const filteredMakes = useMemo(() => {
      if (!searchMake) return makeCounts;
      return makeCounts.filter((m) =>
        m.name.toLowerCase().includes(searchMake.toLowerCase()),
      );
    }, [makeCounts, searchMake]);
  
    const commit = (next: Filters) => {
      const mergedFilters = {
        ...currentFilters,
        ...filters,
        ...next,
      };
  
      setFilters(mergedFilters);
      filtersInitialized.current = true;
      lastSentFiltersRef.current = mergedFilters;
  
      startTransition(() => {
        updateAllFiltersAndURL(mergedFilters);
      });
    };
  
    const triggerGlobalLoaders = () => {
      flushSync(() => {
        if (setIsLoading) setIsLoading(true);
        if (setIsMainLoading) setIsMainLoading(true);
        if (setIsFeaturedLoading) setIsFeaturedLoading(true);
        if (setIsPremiumLoading) setIsPremiumLoading(true);
      });
    };
  
    const [tempCategory, setTempCategory] = useState<string | null>(null);
    const [tempModel, setTempModel] = useState<string | null>(null);

    useEffect(() => {
      if (currentFilters.from_sleep) {
        setSleepFrom(Number(currentFilters.from_sleep));
      } else {
        setSleepFrom(null);
      }
      if (currentFilters.to_sleep) {
        setSleepTo(Number(currentFilters.to_sleep));
      } else {
        setSleepTo(null);
      }
    }, [currentFilters.from_sleep, currentFilters.to_sleep]);

    const keywordText = useMemo(() => {
      const v = (currentFilters.keyword ??
        currentFilters.search ??
        filters.keyword ??
        filters.search ??
        "") as string;
      return v.toString();
    }, [
      currentFilters.keyword,
      currentFilters.search,
      filters.keyword,
      filters.search,
    ]);
  
    useEffect(() => {
      if (keywordInput !== keywordText) setKeywordInput(keywordText);
    }, [keywordText]);

    const toQueryPlus = (s: string) =>
      s
        .trim()
        .toLowerCase()
        .replace(/[+\-]+/g, " ")
        .replace(/\s+/g, "+");
  
    const toHumanFromQuery = (s?: string) =>
      (s ?? "").toString().replace(/\+/g, " ").replace(/-/g, " ");

    const keepCategory = (): Partial<Filters> => ({
      category:
        filters.category ??
        selectedCategory ??
        currentFilters.category ??
        undefined,
    });
  
    const buildShortAddress = (
      suburb?: string | null,
      state?: string | null,
      pincode?: string | null,
    ) => {
      const abbr = state && AUS_ABBR[state] ? AUS_ABBR[state] : state || "";
      return [suburb, abbr, pincode].filter(Boolean).join(" ");
    };
  
    useEffect(() => {
      if (!showSuggestions || !isUserTypingRef.current) return;
      const q = locationInput.trim();
      if (q.length < 2) {
        setLocationSuggestions([]);
        return;
      }
      const t = setTimeout(() => {
        const suburb = q.split(" ")[0];
        fetchLocations(suburb)
          .then((data) => setLocationSuggestions(data))
          .catch(console.error);
      }, 300);
      return () => clearTimeout(t);
    }, [locationInput, showSuggestions]);
  
    const hydrateLocation = (next: Filters): Filters => {
      const out: Filters = { ...next };
      for (const key of ["state", "region", "suburb", "pincode"] as const) {
        if (typeof out[key] === "string" && !out[key]?.trim()) delete out[key];
      }
      if (
        !out.region &&
        selectedRegionName &&
        !regionManuallyClearedRef.current
      ) {
        out.region = selectedRegionName;
      }
      if (suburbManuallyClearedRef.current) {
        delete out.suburb;
        delete out.pincode;
        return out;
      }
      return out;
    };

    const didFetchRef = useRef(false);
    useEffect(() => {
      if (didFetchRef.current) return;
      didFetchRef.current = true;
      const loadFilters = async () => {
        const res = await fetchProductList();
        if (res?.data) {
          setCategories(res.data.all_categories || []);
          setStates(res.data.states || []);
        }
      };
      loadFilters();
    }, []);
  
    useEffect(() => {
      const load = async () => {
        const list = await fetchMakeDetails();
        setMakes(list);
      };
      load();
    }, []);
  
    type UnknownRec = Record<string, unknown>;
  
    const isOptionArray = (v: unknown): v is Option[] =>
      Array.isArray(v) &&
      v.every(
        (o) =>
          typeof o === "object" &&
          o !== null &&
          typeof (o as UnknownRec).name === "string" &&
          typeof (o as UnknownRec).slug === "string",
      );
  
    const isStateOptionArray = (v: unknown): v is StateOption[] =>
      Array.isArray(v) &&
      v.every(
        (s) =>
          typeof s === "object" &&
          s !== null &&
          typeof (s as UnknownRec).name === "string" &&
          typeof (s as UnknownRec).value === "string",
      );
  
    useEffect(() => {
      const loadFilters = async () => {
        const res = await fetchProductList();
        const d = (res?.data ?? undefined) as UnknownRec | undefined;
        const cats = isOptionArray(d?.["all_categories"])
          ? (d!["all_categories"] as Option[])
          : [];
        const sts = isStateOptionArray(d?.["states"])
          ? (d!["states"] as StateOption[])
          : [];
        setCategories(cats);
        setStates(sts);
      };
      loadFilters();
    }, []);
  
    useEffect(() => {
      if (typeof currentFilters.radius_kms === "number") {
        setRadiusKms(currentFilters.radius_kms);
      }
    }, [currentFilters.radius_kms]);
  
    const displayedMakes = useMemo(() => {
      if (!searchText.trim()) return makeCounts;
      return makeCounts.filter((m) =>
        m.name.toLowerCase().includes(searchText.toLowerCase()),
      );
    }, [makeCounts, searchText, isSearching]);

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

    useEffect(() => {
      if (!filtersInitialized.current) {
        setAtmFrom(
          currentFilters.minKg !== undefined ? Number(currentFilters.minKg) : null,
        );
        setAtmTo(
          currentFilters.maxKg !== undefined ? Number(currentFilters.maxKg) : null,
        );
      }
    }, [currentFilters.minKg, currentFilters.maxKg]);
  
    useEffect(() => {
      setAtmFrom(currentFilters.minKg !== undefined ? Number(currentFilters.minKg) : null);
      setAtmTo(currentFilters.maxKg !== undefined ? Number(currentFilters.maxKg) : null);
      setMinPrice(currentFilters.from_price !== undefined ? Number(currentFilters.from_price) : null);
      setMaxPrice(currentFilters.to_price !== undefined ? Number(currentFilters.to_price) : null);
      setLengthFrom(currentFilters.from_length !== undefined ? Number(currentFilters.from_length) : null);
      setLengthTo(currentFilters.to_length !== undefined ? Number(currentFilters.to_length) : null);
      setSelectedConditionName(currentFilters.condition ?? null);
    }, [
      currentFilters.minKg, currentFilters.maxKg,
      currentFilters.from_price, currentFilters.to_price,
      currentFilters.from_length, currentFilters.to_length,
      currentFilters.sleeps, currentFilters.condition,
    ]);
  
    const [locationSuggestions, setLocationSuggestions] = useState<
      LocationSuggestion[]
    >([]);
    const [modalInput, setModalInput] = useState("");
    const toggle = (setter: Dispatch<SetStateAction<boolean>>) => {
      setter((prev) => !prev);
    };
  
    const [isPending, startTransition] = useTransition();

    const resetMakeFilters = () => {
      setSelectedMake(null);
      setSelectedMakeName(null);
      setSelectedModel(null);
      setSelectedModelName(null);
      setModel([]);
      setModelOpen(false);
      const updatedFilters: Filters = {
        ...currentFilters,
        make: undefined,
        model: undefined,
      };
      filtersInitialized.current = true;
      setFilters(updatedFilters);
      startTransition(() => {
        updateAllFiltersAndURL(updatedFilters);
      });
    };

    useEffect(() => {
      if (currentFilters.keyword || currentFilters.search) return;
      if (!pathname) return;
      const m = pathname.match(/(?:^|\/)(keyword|search)=([^/?#]+)/i);
      if (!m) return;
      const kind = m[1].toLowerCase();
      const raw = decodeURIComponent(m[2]);
      const next: Filters =
        kind === "keyword"
          ? { ...keepCategory(), ...filters, ...currentFilters, search: toQueryPlus(raw.replace(/-/g, " ")), keyword: undefined }
          : { ...keepCategory(), ...filters, ...currentFilters, search: toQueryPlus(raw), keyword: undefined };
      setKeywordInput(raw);
      setFilters(next);
      lastSentFiltersRef.current = next;
    }, [pathname]);
  
    useEffect(() => {
      const v = (filters.keyword ?? filters.search ?? currentFilters.keyword ?? currentFilters.search ?? "").toString();
      if (keywordInput !== v) setKeywordInput(v);
    }, [filters.keyword, filters.search, currentFilters.keyword, currentFilters.search]);
  
    const resetStateFilters = () => {
      setSelectedState(null);
      setSelectedStateName(null);
      setSelectedRegion("");
      setSelectedRegionName(null);
      setSelectedSuburbName(null);
      setSelectedpincode(null);
      setFilteredSuburbs([]);
      setLocationInput("");
      const updatedFilters: Filters = {
        ...currentFilters,
        state: undefined, region: undefined, suburb: undefined, pincode: undefined, location: null,
      };
      setFilters(updatedFilters);
      filtersInitialized.current = true;
      startTransition(() => { updateAllFiltersAndURL(updatedFilters); });
    };

    const regionManuallyClearedRef = useRef(false);
    const resetRegionFilters = () => {
      regionManuallyClearedRef.current = true;
      setSelectedRegion("");
      setSelectedRegionName(null);
      setSelectedSuburbName(null);
      setSelectedpincode(null);
      setFilteredSuburbs([]);
      const updatedFilters: Filters = { ...currentFilters };
      delete updatedFilters.region;
      delete updatedFilters.suburb;
      delete updatedFilters.pincode;
      setFilters(updatedFilters);
      filtersInitialized.current = true;
      startTransition(() => { updateAllFiltersAndURL(updatedFilters); });
    };
  
    const formatted = (s: string) =>
      s.replace(/ - /g, "  ").replace(/\s+/g, " ");
  
    const formatLocationInput = (s: string) =>
      s.replace(/_/g, " ").replace(/\s*-\s*/g, "  ").replace(/\s{3,}/g, "  ").trim().replace(/\b\w/g, (char) => char.toUpperCase());

    const suburbManuallyClearedRef = useRef(false);
  
    const resetSuburbFilters = () => {
      suburbManuallyClearedRef.current = true;
      setSelectedSuburbName(null);
      setSelectedpincode(null);
      setLocationInput("");
      const updatedFilters: Filters = { ...currentFilters };
      delete updatedFilters.suburb;
      delete updatedFilters.pincode;
      setFilters(updatedFilters);
      filtersInitialized.current = true;
      startTransition(() => { updateAllFiltersAndURL(updatedFilters); });
    };

    const isKnownMake = (slug?: string | null) =>
      !!slug && makes.some((m) => m.slug === slug);
  
    const sanitizeMake = (value?: string | null) =>
      isKnownMake(value) ? value! : undefined;
  
    const clean = (f: Filters): Filters => ({
      ...f,
      make: sanitizeMake(f.make),
    });

    const statesKey = useMemo(() => {
      if (!Array.isArray(states)) return "";
      return states.map((s) => `${s.value}:${s.regions?.length ?? 0}`).join(",");
    }, [states]);
  
    const suburbsKey = (subs?: Suburb[]) =>
      (subs ?? []).map((s) => `${s.name}|${s.value}`).join("||");
  
    useEffect(() => {
      if (!selectedStateName || !selectedRegionName || !states.length) return;
      const matchedState = states.find(
        (s) => s.name.toLowerCase() === selectedStateName.toLowerCase() || s.value.toLowerCase() === selectedStateName.toLowerCase(),
      );
      if (!matchedState) return;
      const matchedRegion = matchedState.regions?.find(
        (r) => r.name.toLowerCase() === selectedRegionName.toLowerCase() || r.value.toLowerCase() === selectedRegionName.toLowerCase(),
      );
      const nextSubs = matchedRegion?.suburbs ?? [];
      const nextKey = suburbsKey(nextSubs);
      if (prevSuburbsKeyRef.current !== nextKey) {
        prevSuburbsKeyRef.current = nextKey;
        setFilteredSuburbs(nextSubs);
      }
    }, [selectedStateName, selectedRegionName, statesKey]);
  
    useEffect(() => {
      if (currentFilters.state) setSelectedStateName(currentFilters.state);
      if (currentFilters.region) setSelectedRegionName(currentFilters.region);
      if (currentFilters.suburb) setSelectedSuburbName(currentFilters.suburb);
      if (currentFilters.pincode) setSelectedpincode(currentFilters.pincode);
    }, [currentFilters.state, currentFilters.region, currentFilters.suburb, currentFilters.pincode]);

    useEffect(() => {
      if (currentFilters.category && !selectedCategory && categories.length > 0 && !filtersInitialized.current) {
        const cat = categories.find((c) => c.slug === currentFilters.category);
        if (cat) {
          setSelectedCategory(cat.slug);
          setSelectedCategoryName(cat.name);
        }
      }
    }, [currentFilters.category, selectedCategory, categories]);
  
    useEffect(() => {
      if (currentFilters?.acustom_fromyears) {
        setYearFrom(Number(currentFilters.acustom_fromyears));
        setYearTo(Number(currentFilters.acustom_toyears));
      } else {
        setYearFrom(null);
        setYearTo(null);
      }
    }, [currentFilters?.acustom_fromyears, currentFilters?.acustom_toyears]);

    useEffect(() => {
      if (
        !makeInitializedRef.current && selectedMake && filtersInitialized.current &&
        (!filters.make || filters.make !== selectedMake)
      ) {
        const updatedFilters = { ...currentFilters, make: selectedMake, model: filters.model };
        setFilters(updatedFilters);
        makeInitializedRef.current = true;
      }
    }, [selectedMake]);
  
    useEffect(() => {
      if (makeInitializedRef.current || selectedMake || !pathname.includes("/listings/") || !makes.length || !currentFilters.make) return;
      const segments = pathname.split("/listings/")[1]?.split("/") || [];
      const matchedMakeSlug = segments.find((segment) => makes.some((m) => m.slug === segment));
      if (matchedMakeSlug) {
        const matched = makes.find((m) => m.slug === matchedMakeSlug);
        if (matched) {
          setSelectedMake(matched.slug);
          setSelectedMakeName(matched.name);
          makeInitializedRef.current = true;
        }
      }
    }, [pathname, selectedMake, makes, currentFilters.make]);
  
    const FILTER_KEYS: (keyof Filters)[] = [
      "category", "make", "model", "condition", "sleeps", "state", "region", "suburb", "pincode",
      "location", "from_price", "to_price", "minKg", "maxKg", "acustom_fromyears", "acustom_toyears",
      "from_length", "to_length", "radius_kms", "search", "keyword",
    ];
  
    const normalizeFilters = (f: Filters): Filters => {
      const out: Filters = { ...f };
      for (const k of FILTER_KEYS) {
        const v = out[k];
        if (typeof v === "string") {
          const t = v.trim();
          out[k] = (t === "" ? undefined : t) as never;
        }
      }
      return out;
    };
  
    const filtersEqual = (a?: Filters | null, b?: Filters | null): boolean => {
      if (a === b) return true;
      if (!a || !b) return false;
      for (const k of FILTER_KEYS) {
        if (a[k] !== b[k]) return false;
      }
      return true;
    };

    const isValidMakeSlug = (slug: string | null | undefined): slug is string =>
      !!slug && makes.some((m) => m.slug === slug);
    const isValidModelSlug = (slug: string | null | undefined): slug is string =>
      !!slug && isNaN(Number(slug)) && model.some((m) => m.slug === slug);
  
    useEffect(() => { mountedRef.current = true; }, []);
  
    const updateAllFiltersAndURL = (override?: Filters) => {
      const DEFAULT_RADIUS = 50;
      const nextRaw: Filters = override ?? filters;
      const next: Filters = {
        ...clean(hydrateLocation(normalizeFilters(nextRaw))),
        page: 1,
      };
      next.make = sanitizeMake(next.make);
      if (next.state) {
        if (next.region === "" || next.region === undefined) delete next.region;
        if (next.suburb === "" || next.suburb === undefined) delete next.suburb;
        if (next.pincode === "" || next.pincode === undefined) delete next.pincode;
      } else {
        delete next.state;
        delete next.region;
        delete next.suburb;
        delete next.pincode;
      }
      setFilters((prev) => (filtersEqual(prev, next) ? (prev as Filters) : next));
      filtersInitialized.current = true;
      if (typeof next.radius_kms !== "number") next.radius_kms = DEFAULT_RADIUS;
      const slugPath = buildSlugFromFilters(next);
      const query = new URLSearchParams();
      if (next.radius_kms && next.radius_kms !== DEFAULT_RADIUS)
        query.set("radius_kms", String(next.radius_kms));
      const safeSlugPath = slugPath.endsWith("/") ? slugPath : `${slugPath}/`;
      const finalURL = query.toString() ? `${slugPath}?${query}` : safeSlugPath;
      if (lastPushedURLRef.current !== finalURL) {
        lastPushedURLRef.current = finalURL;
        if (mountedRef.current) {
          router.replace(finalURL);
        }
      }
    };

    useEffect(() => { setVisibleCount(10); }, [selectedStateName]);
    categoryApiCalledRef.current = true;
  
    type OptimizeType = "category" | "make" | "model" | "state" | "region" | "suburb" | "keyword" | "atm";
    const lastOptimizeRef = useRef<Record<string, string | undefined>>({});
    const triggerOptimizeApi = (type: OptimizeType, value?: string | null) => {
      if (!value) return;
      if (lastOptimizeRef.current[type] === value) return;
      lastOptimizeRef.current[type] = value;
      const url = new URL("https://admin.caravansforsale.com.au/wp-json/cfs/v1/new_optimize_code");
      url.searchParams.set(type, value);
      fetch(url.toString(), { method: "GET", keepalive: true }).catch(() => {});
    };

    const slug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "-");

    // ============================================================
    // ✅ MASTER SEARCH HANDLER - commits ALL temp values at once
    // ============================================================
    const handleMasterSearch = () => {
      triggerGlobalLoaders();

      const updatedFilters: Filters = {
        ...currentFilters,
        category: tempCategory || undefined,
        make: selectedMakeTemp || undefined,
        model: tempModel || undefined,
        condition: tempCondition || undefined,
        minKg: tempAtmFrom ?? undefined,
        maxKg: tempAtmTo ?? undefined,
        from_price: tempPriceFrom ?? undefined,
        to_price: tempPriceTo ?? undefined,
        from_sleep: tempSleepFrom ?? undefined,
        to_sleep: tempSleepTo ?? undefined,
        acustom_fromyears: tempYearFrom ?? undefined,
        acustom_toyears: tempYearTo ?? undefined,
        from_length: tempLengthFrom ?? undefined,
        to_length: tempLengthTo ?? undefined,
        page: 1,
      };

      // Location from suburb search
      if (tempSuggestion && suburbClickedRef.current) {
        const parts = tempSuggestion.uri.split("/");
        const suburbSlug = parts[0] || "";
        const regionSlug = parts[1] || "";
        const stateSlug = parts[2] || "";
        let pincode = parts[3] || "";

        const suburb = suburbSlug.replace(/-suburb$/, "").replace(/-/g, " ").trim();
        const region = regionSlug.replace(/-region$/, "").replace(/-/g, " ").trim();
        const state = stateSlug.replace(/-state$/, "").replace(/-/g, " ").trim();

        if (!/^\d{4}$/.test(pincode)) {
          const m = tempSuggestion.address.match(/\b\d{4}\b/);
          if (m) pincode = m[0];
        }

        const validRegion = getValidRegionName(state, region, states);

        updatedFilters.state = state;
        updatedFilters.region = validRegion;
        updatedFilters.suburb = suburb.toLowerCase();
        updatedFilters.pincode = pincode || undefined;
        updatedFilters.radius_kms = tempRadiusKms;

        // Sync committed location UI state
        setSelectedState(stateSlug);
        setSelectedStateName(AUS_ABBR[state] || state);
        setSelectedRegionName(validRegion || null);
        setSelectedSuburbName(suburb);
        setSelectedpincode(pincode || null);
        setSelectedSuggestion(tempSuggestion);
        setLocationInput(tempSuggestion.short_address || buildShortAddress(suburb, state, pincode));
      } else if (tempStateName) {
        // Location from state/region dropdown selection
        updatedFilters.state = tempStateName;
        updatedFilters.region = tempRegionName || undefined;
        updatedFilters.suburb = tempSuburbName?.toLowerCase() || undefined;
        updatedFilters.pincode = tempPincode || undefined;

        setSelectedStateName(tempStateName);
        setSelectedRegionName(tempRegionName);
        setSelectedSuburbName(tempSuburbName);
        setSelectedpincode(tempPincode);
      }

      // Sync all committed UI states
      setSelectedCategory(tempCategory);
      setSelectedCategoryName(categoryCounts.find((c) => c.slug === tempCategory)?.name || null);
      setSelectedMake(selectedMakeTemp);
      setSelectedMakeName(makeCounts.find((m) => m.slug === selectedMakeTemp)?.name || null);
      setSelectedModel(tempModel);
      setSelectedModelName(modelCounts.find((m) => m.slug === tempModel)?.slug || null);
      setSelectedConditionName(tempCondition);
      setAtmFrom(tempAtmFrom);
      setAtmTo(tempAtmTo);
      setMinPrice(tempPriceFrom);
      setMaxPrice(tempPriceTo);
      setSleepFrom(tempSleepFrom);
      setSleepTo(tempSleepTo);
      setYearFrom(tempYearFrom);
      setYearTo(tempYearTo);
      setLengthFrom(tempLengthFrom);
      setLengthTo(tempLengthTo);
      setRadiusKms(tempRadiusKms);

      // COMMIT
      setFilters(updatedFilters);
      filtersInitialized.current = true;

      startTransition(() => {
        updateAllFiltersAndURL(updatedFilters);
      });
    };

    // ============================================================
    // ✅ CLEAR ALL FILTERS
    // ============================================================
    const handleClearAll = () => {
      triggerGlobalLoaders();

      // Reset all temp states
      setTempCategory(null);
      setSelectedMakeTemp(null);
      setTempModel(null);
      setTempCondition(null);
      setTempAtmFrom(null);
      setTempAtmTo(null);
      setTempPriceFrom(null);
      setTempPriceTo(null);
      setTempSleepFrom(null);
      setTempSleepTo(null);
      setTempYearFrom(null);
      setTempYearTo(null);
      setTempLengthFrom(null);
      setTempLengthTo(null);
      setTempStateName(null);
      setTempRegionName(null);
      setTempSuburbName(null);
      setTempPincode(null);
      setTempSuggestion(null);
      setTempRadiusKms(RADIUS_OPTIONS[0]);
      setSearchText("");
      setModalInput("");

      // Reset committed states
      setSelectedCategory(null);
      setSelectedCategoryName(null);
      setSelectedMake(null);
      setSelectedMakeName(null);
      setSelectedModel(null);
      setSelectedModelName(null);
      setSelectedConditionName(null);
      setModel([]);
      setFilteredSuburbs([]);
      setLocationInput("");
      setSelectedState(null);
      setSelectedStateName(null);
      setSelectedRegionName(null);
      setSelectedSuburbName(null);
      setSelectedpincode(null);
      setSelectedSuggestion(null);
      setMinPrice(null);
      setMaxPrice(null);
      setAtmFrom(null);
      setAtmTo(null);
      setYearFrom(null);
      setYearTo(null);
      setSleepFrom(null);
      setSleepTo(null);
      setLengthFrom(null);
      setLengthTo(null);
      setRadiusKms(RADIUS_OPTIONS[0]);

      const reset: Filters = {
        page: 1,
      };

      filtersInitialized.current = true;
      makeInitializedRef.current = false;
      suburbClickedRef.current = false;

      setFilters(reset);
      startTransition(() => {
        updateAllFiltersAndURL(reset);
      });
    };

    // ✅ Temp filtered suburbs for desktop state/region selection
    const tempFilteredSuburbs = useMemo(() => {
      if (!tempStateName || !tempRegionName || !states.length) return [];
      const matchedState = states.find(
        (s) => s.name.toLowerCase() === tempStateName.toLowerCase() || s.value.toLowerCase() === tempStateName.toLowerCase(),
      );
      if (!matchedState) return [];
      const matchedRegion = matchedState.regions?.find(
        (r) => r.name.toLowerCase() === tempRegionName.toLowerCase() || r.value.toLowerCase() === tempRegionName.toLowerCase(),
      );
      return matchedRegion?.suburbs ?? [];
    }, [tempStateName, tempRegionName, states]);

   return (
     <>
     
           <div className="filter-item pt-0">
             <h4>Caravan Type</h4>
             <ul className="category-list">
               {categoryCounts.map((cat) => (
                 <li key={cat.slug} className="category-item">
                   <label className="category-checkbox-row checkbox">
                     <div className="d-flex align-items-center">
                       <input
                         className="checkbox__trigger visuallyhidden"
                         type="checkbox"
                         checked={tempCategory === cat.slug}
                         onChange={() => {
                           // ✅ TEMP ONLY - no commit
                           setTempCategory(tempCategory === cat.slug ? null : cat.slug);
                           triggerOptimizeApi("category", cat.slug);
                         }}
                       />
                       <span className="checkbox__symbol">
                         <svg
                           aria-hidden="true"
                           className="icon-checkbox"
                           width="28px"
                           height="28px"
                           viewBox="0 0 28 28"
                           version="1"
                           xmlns="http://www.w3.org/2000/svg"
                         >
                           <path d="M4 14l8 7L24 7"></path>
                         </svg>
                       </span>
                       <span className="category-name"> {cat.name}</span>
                     </div>
                     <div>
                       <span className="category-count"> ({cat.count})</span>
                     </div>
                   </label>
                 </li>
               ))}
             </ul>
           </div>

           <div className="filter-item">
             <h4>Location</h4>
             <div className="location-list">
               <div className="row">
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>State</label>
                     <select
                       className="cfs-select-input form-select"
                       value={tempStateName || ""}
                       onChange={(e) => {
                         const stateName = e.target.value;
                         if (!stateName) {
                           setTempStateName(null);
                           setTempRegionName(null);
                           setTempSuburbName(null);
                           setTempPincode(null);
                           return;
                         }
                         // ✅ TEMP ONLY - no commit
                         setTempStateName(stateName);
                         setTempRegionName(null);
                         setTempSuburbName(null);
                         setTempPincode(null);
                       }}
                     >
                       <option value="">Select State</option>
                       {states.map((state) => (
                         <option key={state.value} value={state.name}>
                           {state.name}
                         </option>
                       ))}
                     </select>
                   </div>
                 </div>

                 {tempStateName && (
                   <div className="col-lg-6">
                     <div className="location-item">
                       <label>Region</label>
                       <select
                         className="cfs-select-input form-select"
                         value={tempRegionName || ""}
                         onChange={(e) => {
                           const regionName = e.target.value;
                           if (!regionName) {
                             setTempRegionName(null);
                             setTempSuburbName(null);
                             setTempPincode(null);
                             return;
                           }
                           // ✅ TEMP ONLY - no commit
                           setTempRegionName(regionName);
                           setTempSuburbName(null);
                           setTempPincode(null);
                         }}
                       >
                         <option value="">Select Region</option>
                         {(
                           states.find(
                             (s) =>
                               s.name.toLowerCase().trim() ===
                               tempStateName?.toLowerCase().trim(),
                           )?.regions || []
                         ).map((region, idx) => (
                           <option key={idx} value={region.name}>
                             {region.name}
                           </option>
                         ))}
                       </select>
                     </div>
                   </div>
                 )}
               </div>
             </div>
           </div>

           <div className="filter-item search-filter">
             <h4>Suburb/Postcode</h4>
             <div className="search-box">
               <div className="secrch_icon">
                 <i className="bi bi-search search-icon"></i>
                 <input
                   type="text"
                   className="filter-dropdown cfs-select-input"
                   autoComplete="off"
                   placeholder="Search suburb, postcode, state, region"
                   value={formatted(modalInput)}
                   onFocus={() => setShowSuggestions(true)}
                   onChange={(e) => {
                     // ✅ TEMP ONLY - just fetch suggestions, no commit
                     setShowSuggestions(true);
                     const rawValue = e.target.value;
                     setModalInput(rawValue);
                     const formattedValue = /^\d+$/.test(rawValue)
                       ? rawValue
                       : formatLocationInput(rawValue);

                     if (formattedValue.length < 1) {
                       setLocationSuggestions([]);
                       return;
                     }

                     const suburb = formattedValue.split(" ")[0];
                     fetchLocations(suburb)
                       .then((data) => {
                         const filtered = data.filter((item) => {
                           const searchValue = formattedValue.toLowerCase();
                           return (
                             item.short_address.toLowerCase().includes(searchValue) ||
                             item.address.toLowerCase().includes(searchValue) ||
                             (item.postcode && item.postcode.toString().includes(searchValue))
                           );
                         });
                         setLocationSuggestions(filtered);
                       })
                       .catch(console.error);
                   }}
                   onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                 />

                 {showSuggestions && locationSuggestions.length > 0 && (
                   <ul className="location-suggestions">
                     {locationSuggestions.map((item, i) => {
                       const isSelected = tempSuggestion?.short_address === item.short_address;
                       return (
                         <li
                           key={i}
                           className={`suggestion-item ${isSelected ? "selected" : ""}`}
                           onMouseDown={(e) => {
                             e.preventDefault();
                             // ✅ TEMP ONLY - store suggestion, no commit
                             isUserTypingRef.current = false;
                             setTempSuggestion(item);
                             setLocationInput(item.short_address);
                             setModalInput(item.short_address);
                             setLocationSuggestions([]);
                             setShowSuggestions(false);
                             suburbClickedRef.current = true;
                           }}
                         >
                           {item.address}
                         </li>
                       );
                     })}
                   </ul>
                 )}

                 {tempSuggestion && modalInput === tempSuggestion.short_address && (
                   <div style={{ marginTop: 12 }}>
                     <div style={{ fontWeight: 600, marginBottom: 8 }}>
                       {tempSuggestion.address}{" "}
                       <span>+{tempRadiusKms}km</span>
                     </div>
                     <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                       <input
                         type="range"
                         min={0}
                         max={RADIUS_OPTIONS.length - 1}
                         step={1}
                         value={Math.max(0, RADIUS_OPTIONS.indexOf(tempRadiusKms as (typeof RADIUS_OPTIONS)[number]))}
                         onChange={(e) => {
                           // ✅ TEMP ONLY
                           const idx = parseInt(e.target.value, 10);
                           setTempRadiusKms(RADIUS_OPTIONS[idx]);
                         }}
                         style={{ flex: 1 }}
                         aria-label="Search radius in kilometers"
                       />
                       <div style={{ minWidth: 60, textAlign: "right" }}>+{tempRadiusKms}km</div>
                     </div>
                   </div>
                 )}
               </div>
             </div>
           </div>

           <div className="filter-item">
             <h4>Make & Model</h4>
             <div className="location-list">
               <div className="row">
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Make</label>
                     <select
                       className="cfs-select-input form-select"
                       value={selectedMakeTemp || ""}
                       onChange={(e) => {
                         const makeSlug = e.target.value;
                         if (!makeSlug) {
                           setSelectedMakeTemp(null);
                           setTempModel(null);
                           return;
                         }
                         // ✅ TEMP ONLY
                         const makeObj = makeCounts.find((m) => m.slug === makeSlug);
                         if (makeObj) {
                           handleMakeSelect(makeObj);
                         }
                       }}
                     >
                       <option value="">Select Make</option>
                       {displayedMakes.map((make) => (
                         <option key={make.slug} value={make.slug}>
                           {make.name} ({make.count})
                         </option>
                       ))}
                     </select>
                   </div>
                 </div>

                 {selectedMakeTemp && (
                   <div className="col-lg-6">
                     <div className="location-item">
                       <label>Model</label>
                       <select
                         className="cfs-select-input form-select"
                         value={tempModel || ""}
                         onChange={(e) => {
                           const modelSlug = e.target.value;
                           // ✅ TEMP ONLY
                           setTempModel(modelSlug || null);
                           if (modelSlug) {
                             triggerOptimizeApi("model", modelSlug);
                           }
                         }}
                       >
                         <option value="">Select Model</option>
                         {modelCounts.map((mod) => (
                           <option key={mod.slug} value={mod.slug}>
                             {mod.slug} ({mod.count})
                           </option>
                         ))}
                       </select>
                     </div>
                   </div>
                 )}
               </div>
             </div>
           </div>

           <div className="filter-item">
             <h4>ATM</h4>
             <div className="location-list">
               <div className="row">
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Min</label>
                     <select
                       className="cfs-select-input form-select"
                       value={tempAtmFrom ?? ""}
                       onChange={(e) => {
                         // ✅ TEMP ONLY
                         const val = e.target.value ? Number(e.target.value) : null;
                         setTempAtmFrom(val);
                         triggerOptimizeApi("atm", String(val));
                       }}
                     >
                       <option value="">Any</option>
                       {atm.map((v) => (
                         <option key={v} value={v}>{v} kg</option>
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
                       onChange={(e) => {
                         // ✅ TEMP ONLY
                         const val = e.target.value ? Number(e.target.value) : null;
                         setTempAtmTo(val);
                       }}
                     >
                       <option value="">Any</option>
                       {atm.filter((v) => !tempAtmFrom || v > tempAtmFrom).map((v) => (
                         <option key={v} value={v}>{v} kg</option>
                       ))}
                     </select>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           <div className="filter-item">
             <h4>Price</h4>
             <div className="location-list">
               <div className="row">
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Min</label>
                     <select
                       className="cfs-select-input form-select mb-3"
                       value={tempPriceFrom ?? ""}
                       onChange={(e) => {
                         // ✅ TEMP ONLY
                         const val = e.target.value ? Number(e.target.value) : null;
                         setTempPriceFrom(val);
                       }}
                     >
                       <option value="">Any</option>
                       {price.map((v) => (
                         <option key={v} value={v}>${v.toLocaleString()}</option>
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
                       onChange={(e) => {
                         // ✅ TEMP ONLY
                         const val = e.target.value ? Number(e.target.value) : null;
                         setTempPriceTo(val);
                       }}
                     >
                       <option value="">Any</option>
                       {price.filter((v) => !tempPriceFrom || v > tempPriceFrom).map((v) => (
                         <option key={v} value={v}>${v.toLocaleString()}</option>
                       ))}
                     </select>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           <div className="filter-item condition-field">
             <h4>Condition</h4>
             <ul className="category-list">
               {conditionDatas.map((condition) => (
                 <li key={condition} className="category-item">
                   <label className="category-checkbox-row checkbox">
                     <div className="d-flex align-items-center">
                       <input
                         className="checkbox__trigger visuallyhidden"
                         type="checkbox"
                         checked={tempCondition === condition}
                         onChange={() => {
                           // ✅ TEMP ONLY - toggle
                           setTempCondition(tempCondition === condition ? null : condition);
                         }}
                       />
                       <span className="checkbox__symbol">
                         <svg
                           aria-hidden="true"
                           className="icon-checkbox"
                           width="28px"
                           height="28px"
                           viewBox="0 0 28 28"
                           version="1"
                           xmlns="http://www.w3.org/2000/svg"
                         >
                           <path d="M4 14l8 7L24 7"></path>
                         </svg>
                       </span>
                       <span className="category-name">{condition}</span>
                     </div>
                   </label>
                 </li>
               ))}
             </ul>
           </div>

           <div className="filter-item">
             <h4>Sleep</h4>
             <div className="location-list">
               <div className="row">
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Min</label>
                     <select
                       className="cfs-select-input form-select mb-3"
                       value={tempSleepFrom ?? ""}
                       onChange={(e) => {
                         // ✅ TEMP ONLY
                         const val = e.target.value ? Number(e.target.value) : null;
                         setTempSleepFrom(val);
                       }}
                     >
                       <option value="">Any</option>
                       {sleep.map((v) => (
                         <option key={v} value={v}>{v}</option>
                       ))}
                     </select>
                   </div>
                 </div>
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Max</label>
                     <select
                       className="cfs-select-input form-select"
                       value={tempSleepTo ?? ""}
                       onChange={(e) => {
                         // ✅ TEMP ONLY
                         const val = e.target.value ? Number(e.target.value) : null;
                         setTempSleepTo(val);
                       }}
                     >
                       <option value="">Any</option>
                       {sleep.filter((v) => !tempSleepFrom || v > tempSleepFrom).map((v) => (
                         <option key={v} value={v}>{v}</option>
                       ))}
                     </select>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           <div className="filter-item">
             <h4>Year</h4>
             <div className="location-list">
               <div className="row">
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>From</label>
                     <select
                       className="cfs-select-input form-select"
                       value={tempYearFrom ?? ""}
                       onChange={(e) => {
                         // ✅ TEMP ONLY
                         const val = e.target.value ? Number(e.target.value) : null;
                         setTempYearFrom(val);
                       }}
                     >
                       <option value="">Any</option>
                       {years.map((y) => (
                         <option key={y} value={y}>{y}</option>
                       ))}
                     </select>
                   </div>
                 </div>
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>To</label>
                     <select
                       className="cfs-select-input form-select"
                       value={tempYearTo ?? ""}
                       onChange={(e) => {
                         // ✅ TEMP ONLY
                         const val = e.target.value ? Number(e.target.value) : null;
                         setTempYearTo(val);
                       }}
                     >
                       <option value="">Any</option>
                       {years.filter((y) => !tempYearFrom || y >= tempYearFrom).map((y) => (
                         <option key={y} value={y}>{y}</option>
                       ))}
                     </select>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           <div className="filter-item">
             <h4>Length</h4>
             <div className="location-list">
               <div className="row">
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Min</label>
                     <select
                       className="cfs-select-input form-select mb-3"
                       value={tempLengthFrom ?? ""}
                       onChange={(e) => {
                         // ✅ TEMP ONLY
                         const val = e.target.value ? Number(e.target.value) : null;
                         setTempLengthFrom(val);
                       }}
                     >
                       <option value="">Any</option>
                       {length.map((v) => (
                         <option key={v} value={v}>{v} ft</option>
                       ))}
                     </select>
                   </div>
                 </div>
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Max</label>
                     <select
                       className="cfs-select-input form-select"
                       value={tempLengthTo ?? ""}
                       onChange={(e) => {
                         // ✅ TEMP ONLY
                         const val = e.target.value ? Number(e.target.value) : null;
                         setTempLengthTo(val);
                       }}
                     >
                       <option value="">Any</option>
                       {length.filter((v) => !tempLengthFrom || v > tempLengthFrom).map((v) => (
                         <option key={v} value={v}>{v} ft</option>
                       ))}
                     </select>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           <div className="filter-footer">
             <button className="clear" onClick={handleClearAll}>Clear filters</button>
             <button className="search" onClick={handleMasterSearch}>Search</button>
           </div>
         
     </>
   );
 }
  export default CaravanFilter;