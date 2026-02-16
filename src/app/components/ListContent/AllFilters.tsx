 
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
    currentFilters,
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
  
    useEffect(() => {
      if (!selectedMake || makes.length === 0) {
        setModel([]);
        return;
      }
  
      const make = makes.find((m) => m.slug === selectedMake);
      setModel(make?.models || []);
      setModelOpen(true);
    }, [selectedMake, makes]);
  
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
  // ✅ Smart merge: local filters win, but only if they have a real value
  // ✅ Smart merge: local filters win ONLY if they have a real value
  
 
 // ✅ NEW: buildCountParams that supports excluding MULTIPLE fields
  // ✅ Smart merge: local filters win ONLY if they have a real value
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
 
 // ✅ NEW: buildCountParams that supports excluding MULTIPLE fields
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
     // Skip ALL excluded fields
     if (excludeFields.includes(key)) return;
 
     if (value !== undefined && value !== null && value !== "") {
       params.set(key, String(value));
     }
   });
 
   return params;
 };
 
  // Replace your count useEffect with this:
 
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
 
   // 🔍 DEBUG: Log exact URL being fetched
   const makeURL = `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${makeParams.toString()}`;
   console.log("🔢 MAKE FETCH URL:", makeURL);
 
   fetch(makeURL, { signal })
     .then((res) => res.json())
     .then((json) => {
       if (!signal.aborted) {
         console.log("🔢 MAKE RESPONSE:", json.data?.length, "makes received");
         console.log("🔢 MAKE SAMPLE:", json.data?.slice(0, 3));
         setMakeCounts(json.data || []);
         setPopularMakes(json.popular_makes || []);
       } else {
         console.log("🔢 MAKE ABORTED — stale response ignored");
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
   currentFilters.category,
   currentFilters.make,
   currentFilters.model,
   currentFilters.condition,
   currentFilters.state,
   currentFilters.region,
   currentFilters.suburb,
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
     const handleMakeSelect = (make) => {
      // SAME make click again → unselect
      if (selectedMakeTemp === make.slug) {
        setSelectedMakeTemp(null);
        setSearchMake("");
        return;
      }
  
      // New selection
      setSelectedMakeTemp(make.slug);
  
      // old UI behaviour
      triggerOptimizeApi("make", make.slug);
    };
 
  
    const handleMakeTempSelect = (make: {
      slug: string;
      name: string;
    }) => {
      setSelectedMakeTemp(make.slug);
      setSearchMake(make.name);
  
      // ⚡ OLD UI behaviour preserved
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
        // Skip the field we're grouping by (so category count doesn't filter by category)
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
  
    // 🔥 dependency
  
    // const isNonEmpty = (s: string | undefined | null): s is string =>
    //   typeof s === "string" && s.trim().length > 0;
    // 🔽 put this inside the component, under updateAllFiltersAndURL
    const commit = (next: Filters) => {
      // Preserve existing filters that aren't being explicitly updated
      const mergedFilters = {
        ...currentFilters,
        ...filters, // Include any pending local filter changes
        ...next, // Apply the new changes
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
  
    // pick a human-readable text from item
    const [tempCategory, setTempCategory] = useState<string | null>(null);
    const [tempModel, setTempModel] = useState<string | null>(null);
    useEffect(() => {
      if (isCategoryModalOpen) {
        setTempCategory(selectedCategory);
      }
      if (isMakeModalOpen) {
        setTempModel(selectedModel);
      }
    }, [isCategoryModalOpen, isMakeModalOpen]);
  
    // works for (HomeSearchItem | string)[]
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
  
    useEffect(() => {
      if (!isKeywordModalOpen) return;
      setBaseLoading(true);
      fetchHomeSearchList()
        .then((list) => {
          const items: KeywordItem[] = (
            list as Array<HomeSearchItem | string>
          ).map((x) =>
            typeof x === "string"
              ? { label: x }
              : {
                  label:
                    x.label ??
                    x.name ??
                    x.title ??
                    x.keyword ??
                    x.value ??
                    x.slug ??
                    "",
                  url: (x as HomeSearchItem).url || "",
                },
          );
  
          const uniq = Array.from(
            new Map(items.map((i) => [i.label.trim(), i])).values(),
          ).filter((i) => i.label);
  
          setBaseKeywords(uniq);
        })
        .catch(() => setBaseKeywords([]))
        .finally(() => setBaseLoading(false));
    }, [isKeywordModalOpen]);
    useEffect(() => {
      if (!isKeywordModalOpen) return;
  
      const q = modalKeyword.trim();
      if (q.length < 2) {
        setKeywordSuggestions([]);
        setKeywordLoading(false);
        return;
      }
  
      const ctrl = new AbortController();
      setKeywordLoading(true);
  
      const t = setTimeout(async () => {
        try {
          const list = await fetchKeywordSuggestions(q, ctrl.signal);
          const items: KeywordItem[] = list.map((x) => ({
            label: (x.keyword || "").trim(),
            url: (x.url || "").trim(),
          }));
  
          setKeywordSuggestions(
            Array.from(new Set(items.map((i) => i.label))).map(
              (label) => items.find((i) => i.label === label)!,
            ),
          );
        } catch (e: unknown) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          console.warn("[keyword] fetch failed:", e);
        } finally {
          setKeywordLoading(false);
        }
      }, 300);
  
      return () => {
        ctrl.abort();
        clearTimeout(t);
      };
    }, [isKeywordModalOpen, modalKeyword]);
    // useEffect(() => {
    //   if (!isKeywordModalOpen) return;
  
    //   const q = modalKeyword.trim();
    //   if (q.length < 2) {
    //     setKeywordSuggestions([]);
    //     setKeywordLoading(false);
    //     return;
    //   }
  
    //   const ctrl = new AbortController();
    //   setKeywordLoading(true);
  
    //   const t = setTimeout(async () => {
    //     try {
    //       const list = await fetchKeywordSuggestions(q, ctrl.signal);
    //       // const items: KeywordItem[] = list.map((x) => ({
    //       //   label: (x.keyword || "").trim(),
    //       //   url: (x.url || "").trim(),
    //       // }));
    //       const items: KeywordItem[] = Array.from(
    //         new Map(
    //           list.map((x, idx: number) => [
    //             (x.keyword || "").toString().trim(),
    //             {
    //               id: x.id ?? idx, // fallback id
    //               label: (x.keyword || "").toString().trim(), // ✅ always set label
    //               url: (x.url || "").toString(),
    //             },
    //           ])
    //         ).values()
    //       );
    //       setKeywordSuggestions(
    //         sortKeywords(
    //           Array.from(new Set(items.map((i) => i.label.toLowerCase()))).map(
    //             (label) => items.find((i) => i.label.toLowerCase() === label)!
    //           )
    //         )
    //       );
    //     } catch (e: unknown) {
    //       if (e instanceof DOMException && e.name === "AbortError") return;
    //       console.warn("[keyword] fetch failed:", e);
    //     } finally {
    //       setKeywordLoading(false);
    //     }
    //   }, 300);
  
    //   return () => {
    //     ctrl.abort();
    //     clearTimeout(t);
    //   };
    // }, [isKeywordModalOpen, modalKeyword]);
  
    // ✅ Base list apply → search=<raw>
  
    // add near other useMemos
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
  
    // keep the read-only input in sync
    useEffect(() => {
      if (keywordInput !== keywordText) setKeywordInput(keywordText);
    }, [keywordText]);
    // const toQueryPlus = (s: string) =>
    //   s.trim().toLowerCase().replace(/\s+/g, "+");
    const toQueryPlus = (s: string) =>
      s
        .trim()
        .toLowerCase()
        .replace(/[+\-]+/g, " ")
        .replace(/\s+/g, "+");
  
    const toHumanFromQuery = (s?: string) =>
      (s ?? "").toString().replace(/\+/g, " ").replace(/-/g, " ");
    // ✅ One button for modal footer
    // ✅ Modal submit → base => search, typed/suggested => keyword
    // Base list -> search=<plus joined>
    // put near other small helpers
    const keepCategory = (): Partial<Filters> => ({
      category:
        filters.category ??
        selectedCategory ??
        currentFilters.category ??
        undefined,
    });
  
    // Modal primary button -> always search=<plus joined>
    const applyKeywordFromModal = () => {
      const raw = modalKeyword.trim();
      if (!raw) return;
      triggerGlobalLoaders();
  
      const allItems = [...baseKeywords, ...keywordSuggestions];
      const match = allItems.find(
        (x) => x.label.toLowerCase() === raw.toLowerCase(),
      );
  
      if (match?.url && match.url.trim().length > 0) {
        router.push(match.url);
        setIsKeywordModalOpen(false);
        setModalKeyword("");
        return;
      }
  
      const next: Filters = {
        ...currentFilters,
        ...keepCategory(),
        search: toQueryPlus(raw),
        keyword: undefined,
      };
  
      setIsKeywordModalOpen(false);
      setModalKeyword("");
      setFilters(next);
      filtersInitialized.current = true;
      startTransition(() => {
        updateAllFiltersAndURL(next);
      });
    };
  
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
  
    // 🔧 FIXED hydrateLocation function
    const hydrateLocation = (next: Filters): Filters => {
      const out: Filters = { ...next };
  
      for (const key of ["state", "region", "suburb", "pincode"] as const) {
        if (typeof out[key] === "string" && !out[key]?.trim()) delete out[key];
      }
  
      // ⛔ DO NOT rehydrate if user manually cleared
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
  
    // const clearKeyword = () => {
    //   const next: Filters = {
    //     ...currentFilters,
    //     keyword: undefined,
    //     search: undefined,
    //   };
  
    //   setKeywordInput(""); // ← clear the field instantly
    //   setFilters(next); // update local first (wins in effect)
    //   filtersInitialized.current = true;
    //   lastSentFiltersRef.current = next; // avoid re-send flicker
    //   // onFilterChange(next); // if your parent needs it
    //   updateAllFiltersAndURL(next);
    // };
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
        setMakes(list); // includes models[]
        setModelOpen(true);
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
        // const mks = isOptionArray(d?.["make_options"])
        //   ? (d!["make_options"] as Option[])
        //   : [];
        const sts = isStateOptionArray(d?.["states"])
          ? (d!["states"] as StateOption[])
          : [];
  
        setCategories(cats); // ✅ always Option[]
        // setMakes(mks); // ✅ always Option[]
        setStates(sts); // ✅ always StateOption[]
      };
      loadFilters();
    }, []);
  
    useEffect(() => {
      if (typeof currentFilters.radius_kms === "number") {
        setRadiusKms(currentFilters.radius_kms);
      }
    }, [currentFilters.radius_kms]);
  
    const displayedMakes = useMemo(() => {
      if (!searchText.trim()) return makeCounts; // ✅ full list
      return makeCounts.filter((m) =>
        m.name.toLowerCase().includes(searchText.toLowerCase()),
      );
    }, [makeCounts, searchText, isSearching]);
  
    const handleATMChange = (newFrom: number | null, newTo: number | null) => {
      triggerGlobalLoaders();
      setAtmFrom(newFrom);
      setAtmTo(newTo);
  
      const updatedFilters = buildUpdatedFilters(currentFilters, {
        minKg: newFrom ?? undefined,
        maxKg: newTo ?? undefined,
      });
  
      setFilters(updatedFilters);
      filtersInitialized.current = true;
  
      startTransition(() => {
        updateAllFiltersAndURL(updatedFilters);
      });
    };
    // ✅ validate region only if it exists under the given state
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
      return reg?.name; // return canonical name if valid, else undefined
    };
    // neww
  
    // keywordSuggestions sort செய்யும் helper
    // const sortKeywords = (items: KeywordItem[]): KeywordItem[] => {
    //   return [...items].sort((a, b) => {
    //     const al = a.label.toLowerCase();
    //     const bl = b.label.toLowerCase();
  
    //     const isNumA = /^\d/.test(al);
    //     const isNumB = /^\d/.test(bl);
  
    //     // numbers last
    //     if (!isNumA && isNumB) return -1;
    //     if (isNumA && !isNumB) return 1;
  
    //     return al.localeCompare(bl); // normal alphabetical
    //   });
    // };
  
    useEffect(() => {
      if (!filtersInitialized.current) {
        setAtmFrom(
          currentFilters.minKg !== undefined
            ? Number(currentFilters.minKg)
            : null,
        );
        setAtmTo(
          currentFilters.maxKg !== undefined
            ? Number(currentFilters.maxKg)
            : null,
        );
      }
    }, [currentFilters.minKg, currentFilters.maxKg]);
  
    // correct -2
    useEffect(() => {
      setAtmFrom(
        currentFilters.minKg !== undefined ? Number(currentFilters.minKg) : null,
      );
      setAtmTo(
        currentFilters.maxKg !== undefined ? Number(currentFilters.maxKg) : null,
      );
  
      setMinPrice(
        currentFilters.from_price !== undefined
          ? Number(currentFilters.from_price)
          : null,
      );
      setMaxPrice(
        currentFilters.to_price !== undefined
          ? Number(currentFilters.to_price)
          : null,
      );
  
      setLengthFrom(
        currentFilters.from_length !== undefined
          ? Number(currentFilters.from_length)
          : null,
      );
      setLengthTo(
        currentFilters.to_length !== undefined
          ? Number(currentFilters.to_length)
          : null,
      );
  
      setSelectedConditionName(currentFilters.condition ?? null);
    }, [
      currentFilters.minKg,
      currentFilters.maxKg,
      currentFilters.from_price,
      currentFilters.to_price,
      currentFilters.from_length,
      currentFilters.to_length,
      currentFilters.sleeps,
      currentFilters.condition,
    ]);
  
    // correct 3
    useEffect(() => {
      if (!selectedMake || makes.length === 0) {
        setModel([]);
        return;
      }
  
      const make = makes.find((m) => m.slug === selectedMake);
      setModel(make?.models || []);
      setModelOpen(true);
    }, [selectedMake, makes]);
  
    const [locationSuggestions, setLocationSuggestions] = useState<
      LocationSuggestion[]
    >([]);
    const [modalInput, setModalInput] = useState(""); // 🔐 modal-only
    const toggle = (setter: Dispatch<SetStateAction<boolean>>) => {
      setter((prev) => !prev);
    };
  
    const [isPending, startTransition] = useTransition();
    console.log(isPending);
  
    const accordionStyle = (highlight: boolean) => ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: "4px",
      padding: "6px 12px",
      cursor: "pointer",
      background: highlight ? "#f7f7f7" : "transparent",
    });
    const accordionSubStyle = (highlight: boolean) => ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: "4px",
      padding: "6px 30px",
      cursor: "pointer",
      background: highlight ? "#f7f7f7" : "transparent",
    });
    const accordionRegionStyle = (highlight: boolean) => ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: "4px",
      padding: "6px 23px",
      cursor: "pointer",
      background: highlight ? "#f7f7f7" : "transparent",
    });
    const suburbStyle = (isSelected: boolean) => ({
      marginLeft: "24px",
      cursor: "pointer",
      padding: "6px 12px",
      borderRadius: "4px",
      backgroundColor: isSelected ? "#e8f0fe" : "transparent",
    });
    const iconRowStyle = {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    };
  
    const arrowStyle = (isOpen: boolean) => ({
      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
      transition: "0.3s",
      marginLeft: "8px",
      cursor: "pointer",
    });
  
    // const suburbStyle = (isSelected: boolean) => ({
    //   marginLeft: "24px",
    //   cursor: "pointer",
    //   padding: "6px 12px",
    //   borderRadius: "4px",
    //   backgroundColor: isSelected ? "#e8f0fe" : "transparent",
    // });
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
      // Allow React to flush UI state
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
          ? {
              ...keepCategory(),
              ...filters,
              ...currentFilters,
              search: toQueryPlus(raw.replace(/-/g, " ")),
              keyword: undefined,
            }
          : {
              ...keepCategory(),
              ...filters,
              ...currentFilters,
              search: toQueryPlus(raw),
              keyword: undefined,
            };
  
      setKeywordInput(raw);
      setFilters(next);
      lastSentFiltersRef.current = next;
    }, [pathname]);
  
    // 🔁 Keep the read-only Keyword input in sync with the applied filters
    useEffect(() => {
      const v = (
        filters.keyword ??
        filters.search ?? // ← local first
        currentFilters.keyword ??
        currentFilters.search ??
        ""
      ).toString();
  
      if (keywordInput !== v) setKeywordInput(v);
    }, [
      filters.keyword,
      filters.search, // watch local first
      currentFilters.keyword,
      currentFilters.search,
    ]);
  
    const resetStateFilters = () => {
      // UI
      setSelectedState(null);
      setSelectedStateName(null);
      setSelectedRegion("");
      setSelectedRegionName(null);
      setSelectedSuburbName(null);
      setSelectedpincode(null);
      setFilteredSuburbs([]);
      setLocationInput("");
  
      // Filters
      const updatedFilters: Filters = {
        ...currentFilters,
        state: undefined,
        region: undefined,
        suburb: undefined,
        pincode: undefined,
        location: null,
      };
  
      setFilters(updatedFilters);
      filtersInitialized.current = true;
  
      startTransition(() => {
        updateAllFiltersAndURL(updatedFilters);
      });
    };
    const regionManuallyClearedRef = useRef(false);
    const resetRegionFilters = () => {
      regionManuallyClearedRef.current = true; // 👈 IMPORTANT
  
      // UI
      setSelectedRegion("");
      setSelectedRegionName(null);
      setSelectedSuburbName(null);
      setSelectedpincode(null);
      setFilteredSuburbs([]);
  
      const updatedFilters: Filters = {
        ...currentFilters,
      };
  
      delete updatedFilters.region;
      delete updatedFilters.suburb;
      delete updatedFilters.pincode;
  
      setFilters(updatedFilters);
      filtersInitialized.current = true;
  
      startTransition(() => {
        updateAllFiltersAndURL(updatedFilters);
      });
    };
  
    const formatted = (s: string) =>
      s
        .replace(/ - /g, "  ") // replace hyphen separators with double spaces
        .replace(/\s+/g, " ");
  
    const formatLocationInput = (s: string) =>
      s
        .replace(/_/g, " ") // underscores -> space
        .replace(/\s*-\s*/g, "  ") // hyphen (with any spaces) -> double space
        .replace(/\s{3,}/g, "  ") // collapse 3+ spaces -> 2
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    const suburbManuallyClearedRef = useRef(false);
  
    const resetSuburbFilters = () => {
      suburbManuallyClearedRef.current = true; // 👈 VERY IMPORTANT
  
      setSelectedSuburbName(null);
      setSelectedpincode(null);
      setLocationInput("");
  
      const updatedFilters: Filters = {
        ...currentFilters,
      };
  
      delete updatedFilters.suburb;
      delete updatedFilters.pincode;
  
      setFilters(updatedFilters);
      filtersInitialized.current = true;
  
      startTransition(() => {
        updateAllFiltersAndURL(updatedFilters);
      });
    };
  
    const handleSearchClick = () => {
      console.log("🔍 handleSearchClick called");
      console.log("suburbClickedRef:", suburbClickedRef.current);
      console.log("selectedSuggestion:", selectedSuggestion);
      
      // Remove resetSuburbFilters call here as it clears the selections
      // resetSuburbFilters();
      triggerGlobalLoaders();
      if (!suburbClickedRef.current || !selectedSuggestion) {
        console.log("❌ Early return - condition failed");
        return;
      }
  
      console.log("✅ Proceeding with search...");
  
      const parts = selectedSuggestion.uri.split("/");
      const suburbSlug = parts[0] || "";
      const regionSlug = parts[1] || "";
      const stateSlug = parts[2] || "";
      let pincode = parts[3] || "";
  
      const suburb = suburbSlug
        .replace(/-suburb$/, "")
        .replace(/-/g, " ")
        .trim();
      const region = regionSlug
        .replace(/-region$/, "")
        .replace(/-/g, " ")
        .trim();
      const state = stateSlug
        .replace(/-state$/, "")
        .replace(/-/g, " ")
        .trim();
  
      if (!/^\d{4}$/.test(pincode)) {
        const m = selectedSuggestion.address.match(/\b\d{4}\b/);
        if (m) pincode = m[0];
      }
  
      const validRegion = getValidRegionName(state, region, states);
  
      setSelectedState(stateSlug);
      setSelectedStateName(AUS_ABBR[state] || state);
      setSelectedRegionName(validRegion || null);
      setSelectedSuburbName(suburb);
      setSelectedpincode(pincode || null);
  
      // const radiusForFilters =
      //   typeof radiusKms === "number" ? radiusKms : RADIUS_OPTIONS[0];
  
      const updatedFilters = buildUpdatedFilters(currentFilters, {
        make: sanitizeMake(selectedMake || filters.make || currentFilters.make),
        model: selectedModel || filters.model || currentFilters.model,
        category: selectedCategory || filters.category || currentFilters.category,
        suburb: suburb.toLowerCase(),
        pincode: pincode || undefined,
        state,
        region: validRegion,
        radius_kms: radiusKms,
      });
  
      console.log("📦 updatedFilters:", updatedFilters);
  
      setFilters(updatedFilters);
      filtersInitialized.current = true;
  
      suburbClickedRef.current = true;
      setTimeout(() => {
        console.log("🚀 Calling updateAllFiltersAndURL");
        updateAllFiltersAndURL(updatedFilters);
      }, 100);
      const shortAddr =
        selectedSuggestion?.short_address ||
        buildShortAddress(suburb, state, pincode);
      isUserTypingRef.current = false;
      setLocationInput(shortAddr);
  
      setShowSuggestions(false);
      setIsModalOpen(false);
      setLocationSuggestions([]);
      suburbClickedRef.current = false;
    };
  
    // const resetFilters = () => {
    //   const reset: Filters = {
    //     make: undefined,
    //     model: undefined,
    //     category: undefined,
    //     condition: undefined,
    //     state: undefined,
    //     region: undefined,
    //     suburb: undefined,
    //     pincode: undefined,
    //     from_price: undefined,
    //     to_price: undefined,
    //     from_sleep: undefined,
    //     to_sleep: undefined,
    //     minKg: undefined,
    //     maxKg: undefined,
    //     sleeps: undefined,
    //     from_length: undefined,
    //     to_length: undefined,
    //     acustom_fromyears: undefined,
    //     acustom_toyears: undefined,
    //     location: null,
    //     radius_kms: RADIUS_OPTIONS[0], // ✅ 50 in payload
    //   };
  
    //   // Clear UI states
    //   setSelectedCategory(null);
    //   setSelectedCategoryName(null);
    //   setSelectedMake(null);
    //   setSelectedMakeName(null);
    //   setSelectedModel(null);
    //   setSelectedModelName(null);
    //   setSelectedConditionName(null);
    //   setModel([]);
    //   // setFilteredRegions([]);
    //   setFilteredSuburbs([]);
    //   setLocationInput("");
    //   setSelectedState(null);
    //   setSelectedStateName(null);
    //   setSelectedRegionName(null);
    //   setSelectedSuburbName(null);
    //   setSelectedpincode(null);
    //   setMinPrice(null);
    //   setMaxPrice(null);
    //   setAtmFrom(null);
    //   setAtmTo(null);
    //   setYearFrom(null);
    //   setYearTo(null);
    //   setSleepFrom(null);
    //   setSleepTo(null);
    //   setLengthFrom(null);
    //   setLengthTo(null);
    //   setRadiusKms(RADIUS_OPTIONS[0]);
  
    //   filtersInitialized.current = true;
    //   makeInitializedRef.current = false;
    //   regionSetAfterSuburbRef.current = false;
    //   suburbClickedRef.current = false;
    //   clearKeyword();
    //   // ✅ Fix: Call parent state update
    //   onFilterChange(reset);
  
    //   setFilters(reset);
  
    //   startTransition(() => {
    //     updateAllFiltersAndURL({ ...reset });
    //   });
    // };
    const isKnownMake = (slug?: string | null) =>
      !!slug && makes.some((m) => m.slug === slug);
  
    const sanitizeMake = (value?: string | null) =>
      isKnownMake(value) ? value! : undefined;
  
    const clean = (f: Filters): Filters => ({
      ...f,
      make: sanitizeMake(f.make),
    });
  
    useEffect(() => {
      if (!selectedSuggestion) return;
  
      if (radiusDebounceRef.current) clearTimeout(radiusDebounceRef.current);
  
      radiusDebounceRef.current = window.setTimeout(() => {
        // ✅ Always start from both currentFilters + filters
        const base: Filters = {
          ...currentFilters,
          ...filters,
          state: selectedStateName ?? currentFilters.state ?? filters.state,
          region: getValidRegionName(
            selectedStateName ?? currentFilters.state ?? filters.state,
            selectedRegionName ?? currentFilters.region ?? filters.region,
            states,
          ),
          suburb: selectedSuburbName ?? currentFilters.suburb ?? filters.suburb,
          pincode: selectedpincode ?? currentFilters.pincode ?? filters.pincode,
          make: selectedMake ?? filters.make,
          model: selectedModel ?? filters.model,
          category: selectedCategory ?? filters.category,
        };
  
        const updated = buildUpdatedFilters(base, { radius_kms: radiusKms });
  
        setFilters(updated);
        filtersInitialized.current = true;
  
        startTransition(() => {
          updateAllFiltersAndURL(updated);
        });
      }, 250);
  
      return () => {
        if (radiusDebounceRef.current) clearTimeout(radiusDebounceRef.current);
      };
    }, [
      radiusKms,
      selectedStateName,
      selectedRegion,
      selectedRegionName,
      selectedSuburbName,
      selectedpincode,
      selectedMake,
      selectedModel,
      selectedCategory,
    ]);
  
    const statesKey = useMemo(() => {
      if (!Array.isArray(states)) return "";
      // Use stable, cheap fields; avoid dumping whole objects
      return states.map((s) => `${s.value}:${s.regions?.length ?? 0}`).join(",");
    }, [states]);
  
    // 2) Keep your original effect body unchanged
    // put this near other refs
  
    // helper to make a stable signature of a suburbs array
    const suburbsKey = (subs?: Suburb[]) =>
      (subs ?? []).map((s) => `${s.name}|${s.value}`).join("||");
  
    // ✅ only sets state when the suburbs list actually changed
    useEffect(() => {
      if (!selectedStateName || !selectedRegionName || !states.length) return;
  
      const matchedState = states.find(
        (s) =>
          s.name.toLowerCase() === selectedStateName.toLowerCase() ||
          s.value.toLowerCase() === selectedStateName.toLowerCase(),
      );
      if (!matchedState) return;
  
      const matchedRegion = matchedState.regions?.find(
        (r) =>
          r.name.toLowerCase() === selectedRegionName.toLowerCase() ||
          r.value.toLowerCase() === selectedRegionName.toLowerCase(),
      );
  
      const nextSubs = matchedRegion?.suburbs ?? [];
      const nextKey = suburbsKey(nextSubs);
  
      if (prevSuburbsKeyRef.current !== nextKey) {
        prevSuburbsKeyRef.current = nextKey;
        setFilteredSuburbs(nextSubs);
      }
      // 👇 DON'T write else { setFilteredSuburbs([]) } here repeatedly.
    }, [selectedStateName, selectedRegionName, statesKey]);
  
    useEffect(() => {
      if (currentFilters.state) setSelectedStateName(currentFilters.state);
      if (currentFilters.region) setSelectedRegionName(currentFilters.region); // only set if present
      if (currentFilters.suburb) setSelectedSuburbName(currentFilters.suburb);
      if (currentFilters.pincode) setSelectedpincode(currentFilters.pincode);
    }, [
      currentFilters.state,
      currentFilters.region,
      currentFilters.suburb,
      currentFilters.pincode,
    ]);
  
    useEffect(() => {
      if (!isModalOpen || !showSuggestions || !isUserTypingRef.current) return;
  
      const q = modalInput.trim();
      if (q.length < 2) {
        setLocationSuggestions([]);
        return;
      }
  
      const t = setTimeout(() => {
        const suburb = q.split(" ")[0];
        fetchLocations(suburb)
          .then((data) => {
            // 🔥 FIX: Filter the results based on current input
            const formattedValue = formatLocationInput(q);
            const filtered = data.filter(
              (item) =>
                item.short_address
                  .toLowerCase()
                  .includes(formattedValue.toLowerCase()) ||
                item.address.toLowerCase().includes(formattedValue.toLowerCase()),
            );
            setLocationSuggestions(filtered);
          })
          .catch(console.error);
      }, 300);
  
      return () => clearTimeout(t);
    }, [modalInput, showSuggestions, isModalOpen]);
  
    useEffect(() => {
      if (
        currentFilters.category &&
        !selectedCategory &&
        categories.length > 0 &&
        !filtersInitialized.current
      ) {
        const cat = categories.find((c) => c.slug === currentFilters.category);
        if (cat) {
          setSelectedCategory(cat.slug);
          setSelectedCategoryName(cat.name);
        }
      }
    }, [currentFilters.category, selectedCategory, categories]);
  
    // adaa
  
    // 👇 Add this inside your component
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
        selectedMake &&
        !selectedModel &&
        currentFilters.model &&
        model.length > 0
      ) {
        const match = model.find((m) => m.slug === currentFilters.model);
        if (match) {
          setSelectedModel(match.slug);
          setSelectedModelName(match.name);
  
          // ✅ Auto-close dropdown once hydrated
          setModelOpen(false);
        }
      }
  
      if (selectedModel && model.length > 0 && !selectedModelName) {
        const match = model.find((m) => m.slug === selectedModel);
        if (match) {
          setSelectedModelName(match.name);
  
          // ✅ Close dropdown if model was restored
          setModelOpen(false);
        }
      }
    }, [
      selectedMake,
      selectedModel,
      model,
      currentFilters.model,
      selectedModelName,
    ]);
  
    useEffect(() => {
      if (
        !makeInitializedRef.current &&
        selectedMake &&
        filtersInitialized.current &&
        (!filters.make || filters.make !== selectedMake)
      ) {
        const updatedFilters = {
          ...currentFilters,
          make: selectedMake,
          model: filters.model,
        };
        setFilters(updatedFilters);
        // onFilterChange(updatedFilters);
        makeInitializedRef.current = true;
      }
    }, [selectedMake]);
  
    useEffect(() => {
      // Block hydration if we already initialized or make was reset
      if (
        makeInitializedRef.current || // already hydrated
        selectedMake || // already selected in UI
        !pathname.includes("/listings/") || // not in listings page
        !makes.length || // no make list
        !currentFilters.make // ❌ make no longer in filters after reset
      ) {
        return;
      }
  
      const segments = pathname.split("/listings/")[1]?.split("/") || [];
  
      const matchedMakeSlug = segments.find((segment) =>
        makes.some((m) => m.slug === segment),
      );
  
      if (matchedMakeSlug) {
        const matched = makes.find((m) => m.slug === matchedMakeSlug);
        if (matched) {
          setSelectedMake(matched.slug);
          setSelectedMakeName(matched.name);
  
          makeInitializedRef.current = true;
  
          // // Optional: sync filters
          // const updatedFilters: Filters = {
          //   ...currentFilters,
          //   make: matched.slug,
          // };
  
          // setFilters(updatedFilters);
          // startTransition(() => {
          //   updateAllFiltersAndURL(updatedFilters);
          // });
        }
      }
    }, [pathname, selectedMake, makes, currentFilters.make]);
  
    // --- helpers ---
    // List only the keys you actually care about for equality + URL
    const FILTER_KEYS: (keyof Filters)[] = [
      "category",
      "make",
      "model",
      "condition",
      "sleeps",
      "state",
      "region",
      "suburb",
      "pincode",
      "location",
      "from_price",
      "to_price",
      "minKg",
      "maxKg",
      "acustom_fromyears",
      "acustom_toyears",
      "from_length",
      "to_length",
      "radius_kms",
      "search",
      "keyword",
    ];
  
    const normalizeFilters = (f: Filters): Filters => {
      // convert empty strings to undefined, trim strings
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
    useEffect(() => {
      if (!hasCategoryBeenSetRef.current && selectedCategory) {
        hasCategoryBeenSetRef.current = true;
      }
    }, [selectedCategory]);
    // router issue
  
    useEffect(() => {
      if (!selectedModel || model.length === 0) return;
  
      const modelMatch = model.find((m) => m.slug === selectedModel);
      if (modelMatch) {
        setSelectedModelName(modelMatch.name);
      }
    }, [model, selectedModel]);
  
    // useEffect(() => {
    //   if (!selectedCategory && !selectedMake && !selectedStateName) {
    //     console.warn("🚨 Important filters are null!", {
    //       pathname,
    //       filters,
    //       selectedCategory,
    //       selectedMake,
    //       selectedStateName,
    //     });
    //   }
    // }, [filters, selectedCategory, selectedMake, selectedStateName]);
  
    const isValidMakeSlug = (slug: string | null | undefined): slug is string =>
      !!slug && makes.some((m) => m.slug === slug);
    const isValidModelSlug = (slug: string | null | undefined): slug is string =>
      !!slug && isNaN(Number(slug)) && model.some((m) => m.slug === slug);
  
    useEffect(() => {
      mountedRef.current = true;
    }, []);
  
    // ✅ Update all filters and URL with validation
    // 🔁 replace this whole function
    const updateAllFiltersAndURL = (override?: Filters) => {
      const DEFAULT_RADIUS = 50;
  
      const nextRaw: Filters = override ?? filters;
      const next: Filters = {
        ...clean(hydrateLocation(normalizeFilters(nextRaw))),
        page: 1, // ← Add this line to reset page
      };
  
      next.make = sanitizeMake(next.make); // belt & suspenders
      // ✅ safer location preservation logic
      if (next.state) {
        // only delete region/suburb if they're explicitly empty strings
        if (next.region === "" || next.region === undefined) delete next.region;
        if (next.suburb === "" || next.suburb === undefined) delete next.suburb;
        if (next.pincode === "" || next.pincode === undefined)
          delete next.pincode;
      } else {
        // if no state, clear all location data
        delete next.state;
        delete next.region;
        delete next.suburb;
        delete next.pincode;
      }
  
      setFilters((prev) => (filtersEqual(prev, next) ? (prev as Filters) : next));
      filtersInitialized.current = true;
      if (typeof next.radius_kms !== "number") next.radius_kms = DEFAULT_RADIUS;
  
      // 2) notify parent only if changed
      // if (!filtersEqual(lastSentFiltersRef.current, next)) {
      //   lastSentFiltersRef.current = next;
      //   onFilterChange(next);
      // }
  
      // 3) build URL once0000000000000000
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
          // onFilterChange(next);
        }
      }
    };
  
    useEffect(() => {
      if (keepModelOpenRef.current) {
        setModelOpen(true);
      }
    }, [model, filters]);
  
    // ✅ Update handleModelSelect with valid check
    const handleModelSelect = (mod: Model) => {
      keepModelOpenRef.current = false;
      const safeMake = isValidMakeSlug(selectedMake) ? selectedMake : undefined;
      const safeModel = isValidModelSlug(mod.slug) ? mod.slug : undefined;
  
      setSelectedModel(mod.slug);
      setSelectedModelName(mod.name);
      triggerGlobalLoaders();
      const updatedFilters: Filters = {
        ...currentFilters,
        make: safeMake,
        model: safeModel,
      };
  
      setFilters(updatedFilters);
      filtersInitialized.current = true;
      setModelOpen(false);
      startTransition(() => {
        updateAllFiltersAndURL(updatedFilters); // Trigger API + URL sync
      });
    };
    // const buildAddress = (
    //   suburb?: string | null,
    //   state?: string | null,
    //   pincode?: string | null
    // ) => {
    //   const abbr = state && AUS_ABBR[state] ? AUS_ABBR[state] : state || "";
    //   return [suburb, abbr, pincode].filter(Boolean).join(" - ");
    // };
  
    // const [mounted, setMounted] = useState(false);
    // useEffect(() => setMounted(true), []);
  
    const resetCategoryFilter = () => {
      setSelectedCategory(null);
      setSelectedCategoryName(null);
  
      const updatedFilters: Filters = {
        ...currentFilters,
        category: undefined,
      };
  
      setFilters(updatedFilters);
      filtersInitialized.current = true;
  
      startTransition(() => {
        updateAllFiltersAndURL(updatedFilters); // Trigger API + URL sync
      });
    };
  
    const openOnly = (which: "state" | "region" | "suburb" | null) => {
      setStateLocationOpen(which === "state");
      setStateRegionOpen(which === "region");
      setStateSuburbOpen(which === "suburb");
    };
  
    useEffect(() => {
      // If we have a region selected but no suburb, keep suburb panel open
      if (selectedRegionName && !selectedSuburbName) {
        setStateRegionOpen(false);
        setStateSuburbOpen(true);
      }
  
      // If we have a state selected but no region, keep region panel open
      if (selectedStateName && !selectedRegionName) {
        setStateLocationOpen(false);
        setStateRegionOpen(true);
      }
    }, [selectedStateName, selectedRegionName, selectedSuburbName]);
  
    const slug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "-");
  
    const findSuggestionFor = (
      suburb: string,
      region: string | null,
      state: string | null,
      pincode: string | null,
      suggestions: LocationSuggestion[],
    ): LocationSuggestion | null => {
      const ss = slug(suburb);
      const rr = slug(region || "");
      const st = slug(state || "");
  
      // match by URI parts first
      const byUri = suggestions.find((it) => {
        const [sub, reg, sta, pc] = it.uri.split("/");
        const matchSub = sub?.startsWith(`${ss}-suburb`);
        const matchReg = reg?.startsWith(`${rr}-region`);
        const matchSta = sta?.startsWith(`${st}-state`);
        const matchPc = pincode ? (pc || "").includes(pincode) : true;
        return matchSub && matchReg && matchSta && matchPc;
      });
      if (byUri) return byUri;
  
      // fallback by address text
      const byText = suggestions.find((it) => {
        const A = it.address.toLowerCase();
        return (
          A.includes(suburb.toLowerCase()) &&
          (!region || A.includes(region.toLowerCase())) &&
          (!state || A.includes(state.toLowerCase())) &&
          (!pincode || A.includes(pincode))
        );
      });
      return byText || null;
    };
    const locKey = useMemo(
      () =>
        [
          selectedSuburbName ?? "",
          selectedRegionName ?? "",
          selectedStateName ?? "",
          selectedpincode ?? "",
        ].join("|"),
      [
        selectedSuburbName,
        selectedRegionName,
        selectedStateName,
        selectedpincode,
      ],
    );
  
    useEffect(() => {
      if (!selectedSuburbName || !selectedStateName) return;
  
      // run once per unique combo
      if (hydratedKeyRef.current === locKey) return;
      hydratedKeyRef.current = locKey; // mark early to prevent re-entry
  
      let cancelled = false;
  
      (async () => {
        try {
          const data = await fetchLocations(selectedSuburbName);
          console.log("🌆 location data sub:", selectedSuburbName);
          console.log("🌆 location data fetched:", data);
  
          // ✅ Normalize input suburb for safe comparison
          const target = selectedSuburbName
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
  
          // ✅ Filter only exact suburb matches (ignore East/North variations)
          const exactMatches = (data || []).filter((item) => {
            // normalize fetched suburb from URI
            const suburbFromUri = item.uri
              ?.split("/")[0]
              ?.replace(/-suburb$/, "")
              ?.replace(/-/g, " ")
              ?.trim()
              ?.toLowerCase();
  
            return suburbFromUri === target;
          });
  
          console.log("🎯 exact suburb matches:", exactMatches);
  
          const match = findSuggestionFor(
            selectedSuburbName,
            selectedRegionName,
            selectedStateName,
            selectedpincode || null,
            exactMatches || [],
          );
  
          if (!match || cancelled) return;
  
          if (!selectedSuggestion || selectedSuggestion.key !== match.key) {
            setSelectedSuggestion(match);
          }
          console.log("🌇 location input Hydrating:", locationInput);
          if (locationInput !== match.short_address) {
            isUserTypingRef.current = false;
            setLocationInput(match.short_address);
          }
        } catch (e) {
          if (!cancelled) console.error(e);
        }
      })();
  
      return () => {
        cancelled = true;
      };
    }, [locKey]);
  
    console.log("region", selectedRegionName);
    useEffect(() => {
      console.log("🔍 Region Auto-detection State:", {
        selectedSuburbName,
        selectedStateName,
        selectedRegionName,
        hasStates: states.length > 0,
        regionSetAfterSuburb: regionSetAfterSuburbRef.current,
        suburbClicked: suburbClickedRef.current,
        shouldAutoDetect:
          selectedSuburbName &&
          selectedStateName &&
          !regionSetAfterSuburbRef.current &&
          !suburbClickedRef.current,
      });
    }, [selectedSuburbName, selectedStateName, selectedRegionName, states]);
    useEffect(() => {
      setVisibleCount(10);
    }, [selectedStateName]);
    categoryApiCalledRef.current = true;
  
    type OptimizeType =
      | "category"
      | "make"
      | "model"
      | "state"
      | "region"
      | "suburb"
      | "keyword"
      | "atm";
  
    const lastOptimizeRef = useRef<Record<string, string | undefined>>({});
  
    const triggerOptimizeApi = (type: OptimizeType, value?: string | null) => {
      if (!value) return;
  
      // 🔒 prevent duplicate calls for same value
      if (lastOptimizeRef.current[type] === value) return;
      lastOptimizeRef.current[type] = value;
  
      const url = new URL(
        "https://admin.caravansforsale.com.au/wp-json/cfs/v1/new_optimize_code",
      );
      url.searchParams.set(type, value);
  
      fetch(url.toString(), {
        method: "GET",
        keepalive: true,
      }).catch(() => {});
    };
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
                                 setTempCategory(cat.slug);
                                 triggerOptimizeApi(
                                   "category",
                                   cat.slug,
                                 ); // ✅
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
                     <select className="cfs-select-input form-select">
                       <option>Any</option>
                       <option>Australian Capital Territory</option>
                       <option>New South Wales</option>
                       <option>Northern Territory</option>
                       <option>Queensland</option>
                       <option>South Australia</option>
                       <option>Tasmania</option>
                       <option>Victoria</option>
                       <option>Victoria</option>
                       <option>Western Australia</option>
                     </select>
                   </div>
                 </div>
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Region</label>
                     <select className="cfs-select-input form-select" disabled>
                       <option>Any</option>
                       <option>Melbourne</option>
                       <option>Brisbane</option>
                       <option>Adelaide</option>
                     </select>
                   </div>
                 </div>
               </div>
             </div>
           </div>
           <div className="filter-item search-filter">
             <h4>Suburb/Postcode</h4>
             <div className="search-box">
               <div className="secrch_icon">
                 <i className="bi bi-search search-icon"></i>
                 <input
                   className="filter-dropdown cfs-select-input"
                   placeholder="Search suburb, postcode, state, region"
                   autocomplete="off"
                   type="text"
                   value=""
                 />
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
                     <select className="cfs-select-input form-select">
                       <option>Any</option>
                       <option>JB</option>
                       <option>Lotus</option>
                       <option>New Age</option>
                       <option>Snowy River</option>
                       <option>Titanium</option>
                     </select>
                   </div>
                 </div>
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Model</label>
                     <select className="cfs-select-input form-select" disabled>
                       <option>Any</option>
                       <option>JB Model 1</option>
                       <option>JB Model 2</option>
                       <option>JB Model 3</option>
                     </select>
                   </div>
                 </div>
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
                     <select className="cfs-select-input form-select">
                       <option value="">Any</option>
                       <option value="600">600 kg</option>
                       <option value="800">800 kg</option>
                       <option value="1000">1000 kg</option>
                       <option value="1250">1250 kg</option>
                       <option value="1500">1500 kg</option>
                       <option value="1750">1750 kg</option>
                       <option value="2000">2000 kg</option>
                       <option value="2250">2250 kg</option>
                       <option value="2500">2500 kg</option>
                       <option value="2750">2750 kg</option>
                       <option value="3000">3000 kg</option>
                       <option value="3500">3500 kg</option>
                       <option value="4000">4000 kg</option>
                       <option value="4500">4500 kg</option>
                     </select>
                   </div>
                 </div>
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Max</label>
                     <select className="cfs-select-input form-select">
                       <option value="">Any</option>
                       <option value="600">600 kg</option>
                       <option value="800">800 kg</option>
                       <option value="1000">1000 kg</option>
                       <option value="1250">1250 kg</option>
                       <option value="1500">1500 kg</option>
                       <option value="1750">1750 kg</option>
                       <option value="2000">2000 kg</option>
                       <option value="2250">2250 kg</option>
                       <option value="2500">2500 kg</option>
                       <option value="2750">2750 kg</option>
                       <option value="3000">3000 kg</option>
                       <option value="3500">3500 kg</option>
                       <option value="4000">4000 kg</option>
                       <option value="4500">4500 kg</option>
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
                     <select className="cfs-select-input form-select">
                       <option value="">Any</option>
                       <option value="10000">$10,000</option>
                       <option value="20000">$20,000</option>
                       <option value="30000">$30,000</option>
                       <option value="40000">$40,000</option>
                       <option value="50000">$50,000</option>
                       <option value="60000">$60,000</option>
                       <option value="70000">$70,000</option>
                     </select>
                   </div>
                 </div>
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Max</label>
                     <select className="cfs-select-input form-select">
                       <option value="">Any</option>
                       <option value="10000">$10,000</option>
                       <option value="20000">$20,000</option>
                       <option value="30000">$30,000</option>
                       <option value="40000">$40,000</option>
                       <option value="50000">$50,000</option>
                       <option value="60000">$60,000</option>
                       <option value="70000">$70,000</option>
                     </select>
                   </div>
                 </div>
               </div>
             </div>
           </div>
           <div className="filter-item condition-field">
             <h4>Condition</h4>
             <ul className="category-list">
               <li className="category-item">
                 <label className="category-checkbox-row checkbox">
                   <div className="d-flex align-items-center">
                     <input
                       className="checkbox__trigger visuallyhidden"
                       type="checkbox"
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
                     <span className="category-name">Used</span>
                   </div>
                 </label>
               </li>
             </ul>
           </div>
           <div className="filter-item">
             <h4>Sleep</h4>
             <div className="location-list">
               <div className="row">
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Min</label>
                     <select className="cfs-select-input form-select">
                       <option value="">Any</option>
                       <option value="1">1</option>
                       <option value="2">2</option>
                       <option value="3">3</option>
                       <option value="4">4</option>
                       <option value="5">5</option>
                       <option value="6">6</option>
                       <option value="7">7</option>
                     </select>
                   </div>
                 </div>
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Max</label>
                     <select className="cfs-select-input form-select">
                       <option value="">Any</option>
                       <option value="1">1</option>
                       <option value="2">2</option>
                       <option value="3">3</option>
                       <option value="4">4</option>
                       <option value="5">5</option>
                       <option value="6">6</option>
                       <option value="7">7</option>
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
                     <select className="cfs-select-input form-select">
                       <option value="">Any</option>
                       <option value="2026">2026</option>
                       <option value="2025">2025</option>
                       <option value="2024">2024</option>
                       <option value="2023">2023</option>
                       <option value="2022">2022</option>
                       <option value="2021">2021</option>
                       <option value="2020">2020</option>
                       <option value="2019">2019</option>
                       <option value="2018">2018</option>
                       <option value="2017">2017</option>
                       <option value="2016">2016</option>
                       <option value="2015">2015</option>
                       <option value="2014">2014</option>
                       <option value="2013">2013</option>
                       <option value="2012">2012</option>
                       <option value="2011">2011</option>
                       <option value="2010">2010</option>
                       <option value="2009">2009</option>
                       <option value="2008">2008</option>
                       <option value="2007">2007</option>
                       <option value="2006">2006</option>
                       <option value="2005">2005</option>
                       <option value="2004">2004</option>
                     </select>
                   </div>
                 </div>
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>To</label>
                     <select className="cfs-select-input form-select">
                       <option value="">Any</option>
                       <option value="2026">2026</option>
                       <option value="2025">2025</option>
                       <option value="2024">2024</option>
                       <option value="2023">2023</option>
                       <option value="2022">2022</option>
                       <option value="2021">2021</option>
                       <option value="2020">2020</option>
                       <option value="2019">2019</option>
                       <option value="2018">2018</option>
                       <option value="2017">2017</option>
                       <option value="2016">2016</option>
                       <option value="2015">2015</option>
                       <option value="2014">2014</option>
                       <option value="2013">2013</option>
                       <option value="2012">2012</option>
                       <option value="2011">2011</option>
                       <option value="2010">2010</option>
                       <option value="2009">2009</option>
                       <option value="2008">2008</option>
                       <option value="2007">2007</option>
                       <option value="2006">2006</option>
                       <option value="2005">2005</option>
                       <option value="2004">2004</option>
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
                     <label>Any</label>
                     <select className="cfs-select-input form-select">
                       <option value="">Any</option>
                       <option value="12">12 ft</option>
                       <option value="13">13 ft</option>
                       <option value="14">14 ft</option>
                       <option value="15">15 ft</option>
                       <option value="16">16 ft</option>
                       <option value="17">17 ft</option>
                       <option value="18">18 ft</option>
                       <option value="19">19 ft</option>
                       <option value="20">20 ft</option>
                       <option value="21">21 ft</option>
                       <option value="22">22 ft</option>
                       <option value="23">23 ft</option>
                       <option value="24">24 ft</option>
                       <option value="25">25 ft</option>
                       <option value="26">26 ft</option>
                       <option value="27">27 ft</option>
                       <option value="28">28 ft</option>
                     </select>
                   </div>
                 </div>
                 <div className="col-lg-6">
                   <div className="location-item">
                     <label>Any</label>
                     <select className="cfs-select-input form-select">
                       <option value="">Any</option>
                       <option value="12">12 ft</option>
                       <option value="13">13 ft</option>
                       <option value="14">14 ft</option>
                       <option value="15">15 ft</option>
                       <option value="16">16 ft</option>
                       <option value="17">17 ft</option>
                       <option value="18">18 ft</option>
                       <option value="19">19 ft</option>
                       <option value="20">20 ft</option>
                       <option value="21">21 ft</option>
                       <option value="22">22 ft</option>
                       <option value="23">23 ft</option>
                       <option value="24">24 ft</option>
                       <option value="25">25 ft</option>
                       <option value="26">26 ft</option>
                       <option value="27">27 ft</option>
                       <option value="28">28 ft</option>
                     </select>
                   </div>
                 </div>
               </div>
             </div>
           </div>
           
     </>
   );
 }
  export default CaravanFilter;
 