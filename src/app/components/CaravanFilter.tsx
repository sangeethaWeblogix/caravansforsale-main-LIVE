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
import "./filter.css";
import { buildSlugFromFilters } from "./slugBuilter";
import { buildUpdatedFilters } from "./buildUpdatedFilters";
import {
  fetchKeywordSuggestions,
  fetchHomeSearchList,
} from "@/api/homeSearch/api";
import { flushSync } from "react-dom";
import { fetchMakeDetails } from "@/api/make-new/api";
import SearchSuggestionSkeleton from "./Searchsuggestionskeleton ";

type LocationSuggestion = {
  key: string;
  uri: string;
  address: string;
  short_address: string;
  location_type?:
    | "state_only"
    | "region_state"
    | "pincode_location_region_state";
};

type LinkItem = {
  name: string;
  slug: string;
};

type LinksData = {
  states?: LinkItem[];
  regions?: LinkItem[];
  categories?: LinkItem[];
  makes?: LinkItem[];
  models?: LinkItem[];
  conditions?: LinkItem[];
  [key: string]: LinkItem[] | undefined;
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
  hideSSRLinks?: boolean;
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
  hideSSRLinks,
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
  const [linksData, setLinksData] = useState<LinksData | null>(null);
  const [linksLoading, setLinksLoading] = useState(false);
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

  // ADD AFTER line 360 (after fetchCounts closing brace)

  const fetchLinks = async (activeFilters: Filters) => {
    const params = buildParamsFromFilters(activeFilters);
    const url = `https://admin.caravansforsale.com.au/wp-json/cfs/v1/links?${params.toString()}`;

    console.log("🔗 LINKS FETCH URL:", url); // DEBUG

    const res = await fetch(url);
    const json = await res.json();

    console.log("🔗 LINKS RAW RESPONSE:", json); // DEBUG
    console.log("🔗 LINKS KEYS:", Object.keys(json)); // DEBUG

    // Handle both { state, category, make } and { data: { state, category, make } }
    const data = json.data ?? json;
    return data as LinksData;
  };

  // ADD AFTER your existing count useEffects

  useEffect(() => {
    const activeFilters: Filters = mergeFilters(currentFilters, filters);

    let cancelled = false;
    setLinksLoading(true);

    fetchLinks(activeFilters)
      .then((data) => {
        if (!cancelled) setLinksData(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLinksLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    currentFilters.category,
    currentFilters.make,
    currentFilters.model,
    currentFilters.state,
    currentFilters.region,
    currentFilters.suburb,
    currentFilters.condition,
    currentFilters.from_price,
    currentFilters.to_price,
    currentFilters.minKg,
    currentFilters.maxKg,
    currentFilters.acustom_fromyears,
    currentFilters.acustom_toyears,
    currentFilters.from_length,
    currentFilters.to_length,
    currentFilters.keyword,
    filters,
  ]);

  // ADD AFTER line 867 (after buildShortAddress function)

  const formatLinkName = (name: string): string =>
    name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const buildLinkUrl = (type: string, item: LinkItem): string => {
    const activeFilters: Filters = mergeFilters(currentFilters, filters);
    const linkFilters: Filters = { ...activeFilters };

    switch (type) {
      case "states":
        linkFilters.state = item.slug.replace(/-/g, " ");
        delete linkFilters.region;
        delete linkFilters.suburb;
        delete linkFilters.pincode;
        break;
      case "regions":
        linkFilters.region = item.slug.replace(/-/g, " ");
        delete linkFilters.suburb;
        delete linkFilters.pincode;
        break;
      case "categories":
        linkFilters.category = item.slug;
        break;
      case "makes":
        linkFilters.make = item.slug;
        delete linkFilters.model;
        break;
      case "models":
        // Make already set, just add model
        linkFilters.model = item.slug;
        break;
      case "conditions":
        linkFilters.condition = item.slug;
        break;
      default:
        break;
    }

    const slugPath = buildSlugFromFilters(linkFilters);
    return slugPath.endsWith("/") ? slugPath : `${slugPath}/`;
  };
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

  // Helper: flatten the categorized location-search API response
  const flattenLocationResponse = (data: any): LocationSuggestion[] => {
    const results: LocationSuggestion[] = [];

    if (Array.isArray(data?.state_only)) {
      for (const item of data.state_only) {
        results.push({ ...item, location_type: "state_only" as const });
      }
    }

    if (Array.isArray(data?.region_state)) {
      for (const item of data.region_state) {
        results.push({ ...item, location_type: "region_state" as const });
      }
    }

    if (Array.isArray(data?.pincode_location_region_state)) {
      for (const item of data.pincode_location_region_state) {
        results.push({
          ...item,
          location_type: "pincode_location_region_state" as const,
        });
      }
    }

    return results;
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
    excludeFields: string[] = [],
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
      { signal },
    )
      .then((res) => res.json())
      .then((json) => {
        if (!signal.aborted) setCategoryCounts(json.data || []);
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });

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
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });

    // ─── MODEL COUNTS ───
    const activeMake = activeFilters.make;
    if (activeMake) {
      const modelParams = buildCountParamsMulti(activeFilters, ["model"]);
      modelParams.set("group_by", "model");
      modelParams.set("make", activeMake);

      fetch(
        `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${modelParams.toString()}`,
        { signal },
      )
        .then((res) => res.json())
        .then((json) => {
          if (!signal.aborted) setModelCounts(json.data || []);
        })
        .catch((e) => {
          if (e.name !== "AbortError") console.error(e);
        });
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

  const handleMakeTempSelect = (make: { slug: string; name: string }) => {
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
        .then((data) => {
          const flat = Array.isArray(data)
            ? data
            : flattenLocationResponse(data);
          setLocationSuggestions(flat);
        })
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

    triggerGlobalLoaders();
    if (!suburbClickedRef.current || !selectedSuggestion) {
      console.log("❌ Early return - condition failed");
      return;
    }

    console.log("✅ Proceeding with search...");

    const parts = selectedSuggestion.uri.split("/");
    const locationType = selectedSuggestion.location_type;

    let state = "";
    let region: string | undefined = undefined;
    let suburb = "";
    let pincode = "";

    if (locationType === "state_only" || parts.length === 1) {
      // URI: "victoria-state" → only state
      const stateSlug = parts[0] || "";
      state = stateSlug
        .replace(/-state$/, "")
        .replace(/-/g, " ")
        .trim();

      setSelectedState(stateSlug);
      setSelectedStateName(AUS_ABBR[state] || state);
      setSelectedRegionName(null);
      setSelectedSuburbName(null);
      setSelectedpincode(null);

      const updatedFilters = buildUpdatedFilters(currentFilters, {
        make: sanitizeMake(selectedMake || filters.make || currentFilters.make),
        model: selectedModel || filters.model || currentFilters.model,
        category:
          selectedCategory || filters.category || currentFilters.category,
        state,
        region: undefined,
        suburb: undefined,
        pincode: undefined,
        radius_kms: undefined,
      });

      console.log("📦 updatedFilters (state_only):", updatedFilters);

      setFilters(updatedFilters);
      filtersInitialized.current = true;
      suburbClickedRef.current = true;

      setTimeout(() => {
        console.log("🚀 Calling updateAllFiltersAndURL (state_only)");
        updateAllFiltersAndURL(updatedFilters);
      }, 100);

      const shortAddr =
        selectedSuggestion?.short_address || AUS_ABBR[state] || state;
      isUserTypingRef.current = false;
      setLocationInput(shortAddr);
    } else if (locationType === "region_state" || parts.length === 2) {
      // URI: "victoria-state/melbourne-region" → state + region
      const stateSlug = parts[0] || "";
      const regionSlug = parts[1] || "";
      state = stateSlug
        .replace(/-state$/, "")
        .replace(/-/g, " ")
        .trim();
      const regionRaw = regionSlug
        .replace(/-region$/, "")
        .replace(/-/g, " ")
        .trim();

      const validRegion = getValidRegionName(state, regionRaw, states);

      setSelectedState(stateSlug);
      setSelectedStateName(AUS_ABBR[state] || state);
      setSelectedRegionName(validRegion || regionRaw);
      setSelectedSuburbName(null);
      setSelectedpincode(null);

      const updatedFilters = buildUpdatedFilters(currentFilters, {
        make: sanitizeMake(selectedMake || filters.make || currentFilters.make),
        model: selectedModel || filters.model || currentFilters.model,
        category:
          selectedCategory || filters.category || currentFilters.category,
        state,
        region: validRegion || regionRaw,
        suburb: undefined,
        pincode: undefined,
        radius_kms: undefined,
      });

      console.log("📦 updatedFilters (region_state):", updatedFilters);

      setFilters(updatedFilters);
      filtersInitialized.current = true;
      suburbClickedRef.current = true;

      setTimeout(() => {
        console.log("🚀 Calling updateAllFiltersAndURL (region_state)");
        updateAllFiltersAndURL(updatedFilters);
      }, 100);

      const shortAddr =
        selectedSuggestion?.short_address ||
        `${regionRaw} ${AUS_ABBR[state] || state}`;
      isUserTypingRef.current = false;
      setLocationInput(shortAddr);
    } else {
      // URI: "state/region/suburb/pincode" → full location
      const stateSlug = parts[0] || "";
      const regionSlug = parts[1] || "";
      const suburbSlug = parts[2] || "";
      pincode = parts[3] || "";

      suburb = suburbSlug
        .replace(/-suburb$/, "")
        .replace(/-/g, " ")
        .trim();
      const regionRaw = regionSlug
        .replace(/-region$/, "")
        .replace(/-/g, " ")
        .trim();
      state = stateSlug
        .replace(/-state$/, "")
        .replace(/-/g, " ")
        .trim();

      if (!/^\d{4}$/.test(pincode)) {
        const m = selectedSuggestion.address.match(/\b\d{4}\b/);
        if (m) pincode = m[0];
      }

      const validRegion = getValidRegionName(state, regionRaw, states);

      setSelectedState(stateSlug);
      setSelectedStateName(AUS_ABBR[state] || state);
      setSelectedRegionName(validRegion || null);
      setSelectedSuburbName(suburb);
      setSelectedpincode(pincode || null);

      const updatedFilters = buildUpdatedFilters(currentFilters, {
        make: sanitizeMake(selectedMake || filters.make || currentFilters.make),
        model: selectedModel || filters.model || currentFilters.model,
        category:
          selectedCategory || filters.category || currentFilters.category,
        suburb: suburb.toLowerCase(),
        pincode: pincode || undefined,
        state,
        region: validRegion,
        radius_kms: radiusKms,
      });

      console.log("📦 updatedFilters (full location):", updatedFilters);

      setFilters(updatedFilters);
      filtersInitialized.current = true;
      suburbClickedRef.current = true;

      setTimeout(() => {
        console.log("🚀 Calling updateAllFiltersAndURL (full location)");
        updateAllFiltersAndURL(updatedFilters);
      }, 100);

      const shortAddr =
        selectedSuggestion?.short_address ||
        buildShortAddress(suburb, state, pincode);
      isUserTypingRef.current = false;
      setLocationInput(shortAddr);
    }

    setShowSuggestions(false);
    setIsModalOpen(false);
    setLocationSuggestions([]);
    suburbClickedRef.current = false;
  };

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
      window.history.replaceState(null, "", finalURL);

      if (mountedRef.current) {
        router.replace(finalURL);
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
      const parts = it.uri.split("/");
      const sta = parts[0] || "";
      const reg = parts[1] || "";
      const sub = parts[2] || "";
      const pc = parts[3] || "";
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
        const rawData = await fetchLocations(selectedSuburbName);
        const data = Array.isArray(rawData)
          ? rawData
          : flattenLocationResponse(rawData);
        console.log("🌆 location data sub:", selectedSuburbName);
        console.log("🌆 location data fetched:", data);

        // ✅ Normalize input suburb for safe comparison
        const target = selectedSuburbName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");

        // ✅ Filter only exact suburb matches (ignore East/North variations)
        const exactMatches = (data || []).filter((item) => {
          // New API URI format: "state/region/suburb/pincode"
          const parts = item.uri?.split("/") || [];
          const suburbPart =
            parts.find((p: string) => p.endsWith("-suburb")) || parts[0] || "";
          const suburbFromUri = suburbPart
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
      <div className="filter-card mobile-search">
        {/* ─── Links Section ─── */}

        {/* Category Accordion */}
        {/* Category Accordion */}
        {/* {!hideSSRLinks && (

        <div className="cfs-links-section">
   {linksData && !linksLoading && (
    <>
    {(["states", "categories", "makes", "conditions", "regions","models"] as string[]).map((sectionKey) => {
      const items = linksData[sectionKey];
      if (!items || items.length === 0) return null;

      const titles: Record<string, string> = {
        categories: "Browse by Category",
        states: "Browse by State",
        regions: "Browse by Region",
        makes: "Browse by Make",
        models: "Browse by Model",
        conditions: "Browse by Condition",
      };

      return (
        <div key={sectionKey} className="cfs-links-group">
          <h5 className="cfs-filter-label">
            {titles[sectionKey] || sectionKey}
          </h5>
          <ul className="cfs-links-list">
            {items.map((item) => (
              <li key={item.slug} className="cfs-links-item">
                <a
                  href={buildLinkUrl(sectionKey, item)}
                  className="cfs-links-link"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    triggerGlobalLoaders();
                    const url = buildLinkUrl(sectionKey, item);
                    router.push(url);
                  }}
                >
                  {formatLinkName(item.name)}
                </a>
                <h1>filter</h1>
              </li>
            ))}
          </ul>
        </div>
      );
    })}
    </>

)}
  </div>
        )} */}

        <div className="cs-full_width_section">
          <div
            className="filter-accordion"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <h5 className="cfs-filter-label">Type</h5>
            <BiChevronDown />
          </div>

          {selectedCategoryName && (
            <div className="filter-chip">
              <span>{selectedCategoryName}</span>
              <span
                className="filter-chip-close"
                onClick={() => {
                  triggerGlobalLoaders();
                  resetCategoryFilter();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 64 64"
                >
                  <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                </svg>
              </span>
            </div>
          )}
        </div>
        {isCategoryModalOpen && (
          <div className="cfs-modal">
            <div
              className="cfs-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="cfs-modal-header">
                <h5 className="cfs-filter-label">Search by Type</h5>
                <span
                  className="cfs-close"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 64 64"
                  >
                    <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                  </svg>
                </span>
              </div>

              {/* Body */}
              <div className="cfs-modal-body">
                <div className="cfs-modal-search-section">
                  <ul className="location-suggestions category-list">
                    {categoryCounts.map((cat) => (
                      <li key={cat.slug} className="category-item">
                        <label className="category-checkbox-row checkbox">
                          <div className="d-flex align-items-center">
                            <input
                              type="checkbox"
                              className="checkbox__trigger visuallyhidden"
                              checked={tempCategory === cat.slug}
                              onChange={() => {
                                setTempCategory(cat.slug);
                                triggerOptimizeApi("category", cat.slug); // ✅
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
                            <span className="category-name">{cat.name}</span>
                          </div>
                          <div>
                            <span className="category-count">
                              ({cat.count})
                            </span>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="cfs-modal-footer">
                <button
                  className="cfs-btn btn"
                  onClick={() => {
                    const finalCategory = tempCategory || undefined;

                    triggerGlobalLoaders(); // ✅ skeleton ONLY HERE

                    const updatedFilters = {
                      ...currentFilters,
                      category: finalCategory,
                      page: 1,
                    };

                    // ✅ FINAL COMMIT
                    setFilters(updatedFilters);
                    filtersInitialized.current = true;

                    startTransition(() => {
                      updateAllFiltersAndURL(updatedFilters); // ✅ FETCH + URL
                    });

                    // UI sync
                    setSelectedCategory(finalCategory || null);
                    setSelectedCategoryName(
                      categories.find((c) => c.slug === finalCategory)?.name ||
                        null,
                    );

                    categoryApiCalledRef.current = false;
                    setIsCategoryModalOpen(false);
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Accordion */}
        {/* ===== LOCATION (DROP-IN) ===== */}
        {/* ===== LOCATION ===== */}

        {/* Keyword (opens its own modal) */}
        {/* Keyword (opens its own modal) */}
        <div className="cs-full_width_section">
          {/* Header: opens STATE list */}
          <div className="filter-accordion" onClick={() => openOnly("state")}>
            <h5 className="cfs-filter-label">Location</h5>
            <BiChevronDown
              onClick={(e) => {
                e.stopPropagation();
                openOnly(stateLocationOpen ? null : "state");
              }}
              style={{
                cursor: "pointer",
                transform: stateLocationOpen ? "rotate(180deg)" : "",
              }}
            />
          </div>

          {/* STATE CHIP */}
          {selectedStateName && (
            <div
              className="filter-chip"
              style={accordionStyle(!selectedRegionName && !selectedSuburbName)}
            >
              <span style={{ flexGrow: 1 }} onClick={() => openOnly("state")}>
                {selectedStateName}
              </span>

              {!selectedRegionName && !selectedSuburbName && (
                <div style={iconRowStyle}>
                  <span
                    className="filter-chip-close"
                    onClick={() => {
                      triggerGlobalLoaders();
                      resetStateFilters();
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      x="0px"
                      y="0px"
                      width="100"
                      height="100"
                      viewBox="0 0 64 64"
                    >
                      <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                    </svg>
                  </span>
                  {/* This arrow toggles the REGION panel */}
                  <BiChevronDown
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = !stateRegionOpen;
                      setStateRegionOpen(next);
                      if (!next) setStateSuburbOpen(false);
                    }}
                    style={arrowStyle(stateRegionOpen)}
                  />
                </div>
              )}
            </div>
          )}

          {/* REGION CHIP */}
          {(selectedRegionName ||
            (selectedSuburbName && !selectedRegionName)) && (
            <div
              className="filter-chip"
              style={accordionRegionStyle(!selectedSuburbName)}
            >
              <span style={{ flexGrow: 1 }} onClick={() => openOnly("region")}>
                {selectedRegionName
                  ? selectedRegionName
                  : (() => {
                      // 🧩 Try extracting region directly from URI first
                      if (selectedSuggestion?.uri) {
                        const parts = selectedSuggestion.uri.split("/");
                        const regionPart = parts.find((p) =>
                          p.endsWith("-region"),
                        );
                        if (regionPart) {
                          const regionName = regionPart
                            .replace("-region", "")
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize
                          console.log("🧭 Region from URI:", regionName);
                          setSelectedRegionName(regionName); // cache it
                          return regionName;
                        }
                      }

                      // 🧩 If URI not found, fallback to static region match
                      const matchedState = states.find(
                        (s) =>
                          s.name.toLowerCase() ===
                            selectedStateName?.toLowerCase() ||
                          s.value.toLowerCase() ===
                            selectedStateName?.toLowerCase(),
                      );

                      const matchedRegion = matchedState?.regions?.find(
                        (region) =>
                          region.suburbs?.some(
                            (sub) =>
                              sub.name.toLowerCase().trim() ===
                              selectedSuburbName?.toLowerCase().trim(),
                          ),
                      );

                      console.log(
                        "🧩 Matched Region (Fallback):",
                        matchedRegion,
                      );

                      return (
                        matchedRegion?.value || matchedRegion?.name || "Region"
                      );
                    })()}
              </span>

              {!selectedSuburbName && (
                <div style={iconRowStyle}>
                  <span
                    className="filter-chip-close"
                    onClick={() => {
                      triggerGlobalLoaders();
                      resetRegionFilters();
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      x="0px"
                      y="0px"
                      width="100"
                      height="100"
                      viewBox="0 0 64 64"
                    >
                      <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                    </svg>
                  </span>
                  <BiChevronDown
                    onClick={(e) => {
                      e.stopPropagation();
                      setStateSuburbOpen(!stateSuburbOpen);
                    }}
                    style={arrowStyle(stateSuburbOpen)}
                  />
                </div>
              )}
            </div>
          )}

          {/* SUBURB CHIP */}
          {selectedSuburbName && (
            <div className="filter-chip" style={accordionSubStyle(true)}>
              <span style={{ flexGrow: 1 }}>{selectedSuburbName}</span>
              <span
                className="filter-chip-close"
                onClick={() => {
                  triggerGlobalLoaders();
                  resetSuburbFilters();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 64 64"
                >
                  <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                </svg>
              </span>
            </div>
          )}

          {/* STATE LIST */}
          {!selectedState && stateLocationOpen && (
            <div className="filter-accordion-items">
              {states.map((state) => (
                <div
                  key={state.value}
                  className={`filter-accordion-item ${
                    selectedState === state.value ? "selected" : ""
                  }`}
                  onClick={() => {
                    triggerGlobalLoaders();
                    setSelectedState(state.value);
                    setSelectedStateName(state.name);
                    setSelectedRegionName(null);
                    setSelectedSuburbName(null);

                    // setFilteredRegions(state.regions || []);
                    setFilteredSuburbs([]);

                    // Open Region immediately
                    setStateLocationOpen(false);
                    setStateRegionOpen(true);
                    setStateSuburbOpen(false);

                    const updatedFilters: Filters = {
                      ...currentFilters,
                      state: state.name,
                      region: undefined,
                      suburb: undefined,
                      pincode: undefined,
                    };
                    setFilters(updatedFilters);
                    filtersInitialized.current = true;

                    startTransition(() => {
                      updateAllFiltersAndURL(updatedFilters);
                      // keep Region open after router.push
                      setTimeout(() => {
                        setStateRegionOpen(true);
                        setStateSuburbOpen(false);
                      }, 0);
                    });
                  }}
                >
                  {state.name}
                </div>
              ))}
            </div>
          )}

          {/* REGION LIST (only if a state is chosen and suburb not yet chosen) */}
          {stateRegionOpen && !!selectedStateName && !selectedSuburbName && (
            <div
              className="filter-accordion-items"
              // style={{
              //   maxHeight: 250, // limit height to make scroll visible
              //   overflowY: "auto",
              //   overflowX: "hidden",
              // }}
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
                  // Load next 10 regions when reaching bottom
                  setVisibleCount((prev) => prev + 10);
                }
              }}
            >
              {(
                states.find(
                  (s) =>
                    s.name.toLowerCase().trim() ===
                    selectedStateName?.toLowerCase().trim(),
                )?.regions || []
              )
                .slice(0, visibleCount)
                .map((region, idx) => (
                  <div
                    key={idx}
                    className="filter-accordion-item"
                    style={{ marginLeft: 16, cursor: "pointer" }}
                    onClick={() => {
                      triggerGlobalLoaders();
                      // ✅ Always trigger even if same region clicked
                      setSelectedRegionName((prev) => {
                        if (prev === region.name) return region.name + " "; // force re-render
                        return region.name;
                      });

                      setSelectedRegion(region.value);
                      const suburbs = region.suburbs || [];
                      setFilteredSuburbs(suburbs);
                      setSelectedSuburbName(null);

                      setStateRegionOpen(false);
                      setStateSuburbOpen(true);

                      const updatedFilters: Filters = {
                        ...currentFilters,
                        state: selectedStateName || currentFilters.state,
                        region: region.name,
                        suburb: undefined,
                        pincode: undefined,
                      };
                      setFilters(updatedFilters);
                      filtersInitialized.current = true;

                      // 🚀 Update URL + Reopen suburb after navigation
                      updateAllFiltersAndURL(updatedFilters);

                      // 🧩 Reopen suburb panel *after* navigation completes
                      setTimeout(() => {
                        setStateRegionOpen(false);
                        setStateSuburbOpen(true);
                      }, 400);
                    }}
                  >
                    {region.name}
                  </div>
                ))}
            </div>
          )}

          {/* SUBURB LIST */}
          {/* SUBURB LIST - WITH STRONG DEDUPLICATION */}
          {stateSuburbOpen &&
            selectedStateName &&
            selectedRegionName &&
            !selectedSuburbName && (
              <div className="filter-accordion-items">
                {Array.isArray(filteredSuburbs) &&
                filteredSuburbs.length === 0 ? (
                  // <p style={{ marginLeft: 20 }}>❌ No suburbs available</p>
                  <p style={{ marginLeft: 20 }}></p>
                ) : (
                  filteredSuburbs.map((suburb, idx) => (
                    <div
                      key={`${suburb.value}-${idx}`}
                      className="filter-accordion-item"
                      style={suburbStyle(suburb.name === selectedSuburbName)}
                      onClick={async () => {
                        triggerGlobalLoaders();
                        const pincode =
                          suburb.value?.match(/\d{4}$/)?.[0] || null;

                        // fetch suggestion (optional – keeps your existing logic)
                        let match: LocationSuggestion | null = null;
                        try {
                          const rawRes = await fetchLocations(suburb.name);
                          const res = Array.isArray(rawRes)
                            ? rawRes
                            : flattenLocationResponse(rawRes);
                          match = findSuggestionFor(
                            suburb.name,
                            selectedRegionName,
                            selectedStateName,
                            pincode,
                            res || [],
                          );
                        } catch {}

                        // build a fallback suggestion if API doesn't match
                        if (!match) {
                          const uSub = slug(suburb.name);
                          const uReg = slug(selectedRegionName || "");
                          const uSta = slug(selectedStateName || "");
                          match = {
                            key: `${uSub}-${uReg}-${uSta}-${pincode || ""}`,
                            uri: `${uSta}-state/${uReg}-region/${uSub}-suburb/${pincode || ""}`,
                            address: [
                              suburb.name,
                              selectedRegionName || "",
                              selectedStateName || "",
                              pincode || "",
                            ]
                              .filter(Boolean)
                              .join(", "),
                            short_address: `${suburb.name}${
                              pincode ? ` ${pincode}` : ""
                            }`,
                          };
                        }

                        // ✅ validate region against the selected state
                        const safeState =
                          selectedStateName || currentFilters.state || null;
                        const validRegion = getValidRegionName(
                          safeState,
                          selectedRegionName,
                          states,
                        );

                        // drive UI
                        setSelectedSuggestion(match);
                        setLocationInput(match.short_address);
                        setSelectedSuburbName(suburb.name);
                        setSelectedpincode(pincode || null);
                        setSelectedRegionName(validRegion || null); // drop invalid region in UI

                        // close panels
                        setStateLocationOpen(false);
                        setStateRegionOpen(false);
                        setStateSuburbOpen(false);

                        // ✅ build filters (region only if valid)
                        const updatedFilters: Filters = hydrateLocation({
                          ...currentFilters,
                          state: safeState || undefined,
                          region: validRegion, // undefined if invalid
                          suburb: suburb.name.toLowerCase(),
                          pincode: pincode || undefined,
                          radius_kms:
                            typeof radiusKms === "number" && radiusKms !== 50
                              ? radiusKms
                              : undefined,
                        });

                        setFilters(updatedFilters);
                        filtersInitialized.current = true;

                        // fire API + URL sync
                        // onFilterChange(updatedFilters);
                        lastSentFiltersRef.current = updatedFilters;
                        // startTransition(() =>
                        //   updateAllFiltersAndURL(updatedFilters)
                        // );
                      }}
                    >
                      {suburb.name}
                    </div>
                  ))
                )}
              </div>
            )}
        </div>
        {/* Suburb / pincode */}
        <div className="cs-full_width_section">
          <h5 className="cfs-filter-label">Suburb / Postcode</h5>
          <input
            type="text"
            id="afilter_locations_text"
            className="cfs-select-input"
            placeholder=""
            value={formatLocationInput(locationInput)} // 👈 display formatted          onClick={() => setIsModalOpen(true)}
            onChange={(e) => setLocationInput(e.target.value)}
            onClick={() => setIsModalOpen(true)}
          />

          {/* ✅ Show selected suburb below input, like a pill with X */}
          {selectedSuburbName && selectedStateName && selectedpincode && (
            <div className="filter-chip">
              {/* {locationInput} */}
              {formatLocationInput(locationInput)}
              <span
                className="filter-chip-close"
                onClick={() => {
                  triggerGlobalLoaders();
                  resetSuburbFilters();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 64 64"
                >
                  <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                </svg>
              </span>
            </div>
          )}
        </div>

        {/* Make Accordion */}
        {/* Make Accordion */}
        <div className="cs-full_width_section">
          <div
            className="filter-accordion"
            onClick={() => setIsMakeModalOpen(true)}
          >
            <h5 className="cfs-filter-label"> Make</h5>
            <BiChevronDown />
          </div>
          {selectedMakeName && (
            <div className="filter-chip">
              <span>{selectedMakeName}</span>
              <span
                className="filter-chip-close"
                onClick={() => {
                  triggerGlobalLoaders();
                  resetMakeFilters();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 64 64"
                >
                  <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                </svg>
              </span>
            </div>
          )}
        </div>
        {selectedMake && selectedMakeName && (
          <div className="cs-full_width_section">
            <div
              className="filter-accordion"
              style={{
                cursor: "pointer",
              }}
              onClick={() => setIsModalMakeOpen(true)}
            >
              <h5 className="cfs-filter-label">Model</h5>
              <BiChevronDown />
            </div>
            {selectedModelName && (
              <div className="filter-chip">
                <span>{selectedModelName}</span>
                <span
                  className="filter-chip-close"
                  onClick={() => {
                    setSelectedModel(null);
                    setSelectedModelName(null);
                    const updatedFilters: Filters = {
                      ...currentFilters,
                      model: undefined,
                    };
                    setFilters(updatedFilters);
                    updateAllFiltersAndURL(updatedFilters);
                    setIsModalMakeOpen(true);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 64 64"
                  >
                    <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                  </svg>
                </span>
              </div>
            )}

            {isModalMakeOpen && (
              <div className="cfs-modal">
                <div
                  className="cfs-modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="cfs-modal-header">
                    <h5 className="cfs-filter-label">Search by Model</h5>
                    <span
                      className="cfs-close"
                      onClick={() => setIsModalMakeOpen(false)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        x="0px"
                        y="0px"
                        width="100"
                        height="100"
                        viewBox="0 0 64 64"
                      >
                        <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                      </svg>
                    </span>
                  </div>

                  {/* Body */}
                  <div className="cfs-modal-body">
                    <div className="cfs-modal-search-section">
                      <ul className="location-suggestions category-list">
                        {modelCounts.map((mod) => (
                          <li key={mod.slug} className="category-item">
                            <label className="category-checkbox-row checkbox">
                              <div className="d-flex align-items-center">
                                <input
                                  type="checkbox"
                                  className="checkbox__trigger visuallyhidden"
                                  checked={tempModel === mod.slug}
                                  onChange={() => {
                                    setTempModel(mod.slug);
                                    triggerOptimizeApi("model", mod.slug); // ✅
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
                                <span className="category-name">
                                  {mod.slug}
                                </span>
                              </div>
                              <div>
                                <span className="category-count">
                                  ({mod.count})
                                </span>
                              </div>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="cfs-modal-footer">
                    <button
                      className="cfs-btn btn"
                      onClick={() => {
                        const finalModel = tempModel || undefined;

                        triggerGlobalLoaders(); // ✅ skeleton ONLY HERE

                        const updatedFilters = {
                          ...currentFilters,
                          model: finalModel,
                          page: 1,
                        };

                        // ✅ FINAL COMMIT
                        setFilters(updatedFilters);
                        filtersInitialized.current = true;

                        startTransition(() => {
                          updateAllFiltersAndURL(updatedFilters); // ✅ FETCH + URL
                        });

                        // UI sync
                        setSelectedModel(finalModel || null);
                        setSelectedModelName(
                          modelCounts.find((m) => m.slug === finalModel)
                            ?.slug || null,
                        );

                        setIsModalMakeOpen(false);
                      }}
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ATM Range */}
        {/* ATM Range */}
        {/* ATM Range */}

        <div className="cs-full_width_section">
          <div
            className="filter-accordion"
            onClick={() => {
              setTempAtmFrom(atmFrom);
              setTempAtmTo(atmTo);
              setIsATMModalOpen(true);
            }}
          >
            <h5 className="cfs-filter-label">ATM</h5>
            <BiChevronDown />
          </div>

          {/* ✅ Filter Chip Display */}
          {(atmFrom || atmTo) && (
            <div className="filter-chip">
              <span>
                {atmFrom ? `${atmFrom.toLocaleString()} Kg` : "Min"} –{" "}
                {atmTo ? `${atmTo.toLocaleString()} Kg` : "Max"}
              </span>
              <span
                className="filter-chip-close"
                onClick={() => {
                  triggerGlobalLoaders();

                  setAtmFrom(null);
                  setAtmTo(null);

                  const updatedFilters: Filters = {
                    ...currentFilters,
                    minKg: undefined,
                    maxKg: undefined,
                  };

                  setFilters(updatedFilters);

                  startTransition(() => {
                    updateAllFiltersAndURL(updatedFilters);
                  });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 64 64"
                >
                  <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                </svg>
              </span>
            </div>
          )}
        </div>

        {isATMModalOpen && (
          <div className="cfs-modal">
            <div
              className="cfs-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="cfs-modal-header">
                <h5 className="cfs-filter-label">Search by ATM</h5>
                <span
                  className="cfs-close"
                  onClick={() => setIsATMModalOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 64 64"
                  >
                    <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                  </svg>
                </span>
              </div>

              {/* Body */}
              <div className="cfs-modal-body">
                {/* FROM */}
                <p className="mb-0 label-text">Min</p>
                <select
                  className="cfs-select-input form-select mb-3"
                  value={tempAtmFrom ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setTempAtmFrom(val);

                    // 🔥 OPTIMIZE ONLY
                    triggerOptimizeApi("atm", String(val));
                  }}
                >
                  <option value="">Any</option>
                  {atm.map((v) => (
                    <option key={v} value={v}>
                      {v} kg
                    </option>
                  ))}
                </select>

                {/* TO */}
                <p className="mb-0 label-text">Max</p>
                <select
                  className="cfs-select-input form-select"
                  value={tempAtmTo ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setTempAtmTo(val);
                  }}
                >
                  <option value="">Any</option>
                  {atm
                    .filter((v) => !tempAtmFrom || v > tempAtmFrom)
                    .map((v) => (
                      <option key={v} value={v}>
                        {v} kg
                      </option>
                    ))}
                </select>
              </div>

              {/* Footer */}
              <div className="cfs-modal-footer">
                <button
                  className="cfs-btn btn"
                  onClick={() => {
                    triggerGlobalLoaders();

                    const updatedFilters: Filters = {
                      ...currentFilters,
                      minKg: tempAtmFrom ?? undefined,
                      maxKg: tempAtmTo ?? undefined,
                      page: 1,
                    };

                    // ✅ FINAL COMMIT
                    setAtmFrom(tempAtmFrom);
                    setAtmTo(tempAtmTo);
                    setFilters(updatedFilters);
                    filtersInitialized.current = true;

                    startTransition(() => {
                      updateAllFiltersAndURL(updatedFilters);
                    });

                    setIsATMModalOpen(false);
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Price Range */}
        {/* <div className="cs-full_width_section">
              <h5 className="cfs-filter-label">Price</h5>
              <div className="row">
                <div className="col-6">
                  <h6 className="cfs-filter-label-sub">From</h6>
                  <select
                    className="cfs-select-input"
                    value={minPrice?.toString() || ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : null;
                      triggerGlobalLoaders();
                      setMinPrice(val);
                      const updated: Filters = {
                        ...currentFilters,
                        from_price: val ?? undefined,
                        to_price: maxPrice ?? undefined,
                      };
                      commit(updated);
                    }}
                  >
                    <option value="">Min</option>
                    {price.map((val) => (
                      <option key={val} value={val}>
                        ${val.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
    
                <div className="col-6">
                  <h6 className="cfs-filter-label-sub">To</h6>
                  <select
                    className="cfs-select-input"
                    value={maxPrice?.toString() || ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : null;
                      triggerGlobalLoaders();
                      setMaxPrice(val);
                      const updated: Filters = {
                        ...currentFilters,
                        from_price: minPrice ?? undefined,
                        to_price: val ?? undefined,
                      };
                      commit(updated);
                    }}
                  >
                    <option value="">Max</option>
                    {price
                      .filter((val) => !minPrice || val > minPrice)
                      .map((val) => (
                        <option key={val} value={val}>
                          ${val.toLocaleString()}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
    
              {(minPrice || maxPrice) && (
                <div className="filter-chip">
                  <span>
                    {minPrice ? `$${minPrice.toLocaleString()}` : "Min"} –{" "}
                    {maxPrice ? `$${maxPrice.toLocaleString()}` : "Max"}
                  </span>
                  <span
                    className="filter-chip-close"
                    onClick={() => {
                      triggerGlobalLoaders();
                      setMinPrice(null);
                      setMaxPrice(null);
                      commit({
                        ...currentFilters,
                        from_price: undefined,
                        to_price: undefined,
                      });
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 64 64">
   <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
   </svg>
                  </span>
                </div>
              )}
            </div> */}
        {/* PRICE */}

        {/* PRICE */}
        <div className="cs-full_width_section">
          <div
            className="filter-accordion"
            onClick={() => {
              setTempPriceFrom(minPrice);
              setTempPriceTo(maxPrice);
              setIsPriceModalOpen(true);
            }}
          >
            <h5 className="cfs-filter-label">Price</h5>
            <BiChevronDown />
          </div>

          {(minPrice || maxPrice) && (
            <div className="filter-chip">
              <span>
                {minPrice ? `$${minPrice.toLocaleString()}` : "Min"} –{" "}
                {maxPrice ? `$${maxPrice.toLocaleString()}` : "Max"}
              </span>
              <span
                className="filter-chip-close"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerGlobalLoaders();

                  setMinPrice(null);
                  setMaxPrice(null);

                  const updatedFilters: Filters = {
                    ...currentFilters,
                    from_price: undefined,
                    to_price: undefined,
                  };

                  setFilters(updatedFilters);
                  filtersInitialized.current = true;

                  startTransition(() => {
                    updateAllFiltersAndURL(updatedFilters);
                  });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 64 64"
                >
                  <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                </svg>
              </span>
            </div>
          )}
        </div>
        {isPriceModalOpen && (
          <div className="cfs-modal">
            <div
              className="cfs-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="cfs-modal-header">
                <h5 className="cfs-filter-label">Search by Price</h5>
                <span
                  className="cfs-close"
                  onClick={() => setIsPriceModalOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 64 64"
                  >
                    <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                  </svg>
                </span>
              </div>

              {/* Body */}
              <div className="cfs-modal-body">
                {/* FROM */}
                <p className="mb-0 label-text">Min</p>
                <select
                  className="cfs-select-input form-select mb-3"
                  value={tempPriceFrom ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setTempPriceFrom(val);

                    // ✅ background optimize ONLY (no URL, no data)
                    triggerOptimizeApi("keyword", String(val));
                  }}
                >
                  <option value="">Any</option>
                  {price.map((v) => (
                    <option key={v} value={v}>
                      ${v.toLocaleString()}
                    </option>
                  ))}
                </select>

                {/* TO */}
                <p className="mb-0 label-text">Max</p>
                <select
                  className="cfs-select-input form-select"
                  value={tempPriceTo ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setTempPriceTo(val);
                  }}
                >
                  <option value="">Any</option>
                  {price
                    .filter((v) => !tempPriceFrom || v > tempPriceFrom)
                    .map((v) => (
                      <option key={v} value={v}>
                        ${v.toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              {/* Footer */}
              <div className="cfs-modal-footer">
                <button
                  className="cfs-btn btn"
                  onClick={() => {
                    triggerGlobalLoaders();

                    const updatedFilters: Filters = {
                      ...currentFilters,
                      from_price: tempPriceFrom ?? undefined,
                      to_price: tempPriceTo ?? undefined,
                      page: 1,
                    };

                    // ✅ FINAL COMMIT (same as ATM)
                    setMinPrice(tempPriceFrom);
                    setMaxPrice(tempPriceTo);
                    setFilters(updatedFilters);
                    filtersInitialized.current = true;

                    startTransition(() => {
                      updateAllFiltersAndURL(updatedFilters);
                    });

                    setIsPriceModalOpen(false);
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Condition Accordion */}
        <div className="cs-full_width_section">
          <div
            className="filter-accordion"
            onClick={() => toggle(setConditionOpen)}
          >
            <h5 className="cfs-filter-label"> Condition</h5>
            <BiChevronDown
              style={{
                cursor: "pointer",
              }}
            />
          </div>
          {selectedConditionName && (
            <div className="filter-chip">
              <span>{selectedConditionName}</span>
              <span
                className="filter-chip-close"
                onClick={() => {
                  triggerGlobalLoaders();
                  setSelectedConditionName(null);
                  commit({ ...currentFilters, condition: undefined });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 64 64"
                >
                  <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                </svg>
              </span>
            </div>
          )}
          {conditionOpen && (
            <div className="filter-accordion-items">
              {conditionDatas.map((condition, index) => (
                <div
                  key={index}
                  className={`filter-accordion-item ${
                    selectedConditionName === condition ? "selected" : ""
                  }`}
                  onClick={() => {
                    triggerGlobalLoaders();
                    setSelectedConditionName(condition);
                    setConditionOpen(false);
                    commit({ ...currentFilters, condition });
                  }}
                >
                  {condition}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= SLEEP ================= */}
        <div className="cs-full_width_section">
          <div
            className="filter-accordion"
            onClick={() => {
              setTempSleepFrom(sleepFrom);
              setTempSleepTo(sleepTo);
              setIsSleepModalOpen(true);
            }}
          >
            <h5 className="cfs-filter-label">Sleep</h5>
            <BiChevronDown />
          </div>

          {(sleepFrom || sleepTo) && (
            <div className="filter-chip">
              <span>
                {sleepFrom ?? "Min"} – {sleepTo ?? "Max"} People
              </span>
              <span
                className="filter-chip-close"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerGlobalLoaders();

                  setSleepFrom(null);
                  setSleepTo(null);

                  const updatedFilters: Filters = {
                    ...currentFilters,
                    from_sleep: undefined,
                    to_sleep: undefined,
                  };

                  setFilters(updatedFilters);
                  startTransition(() => updateAllFiltersAndURL(updatedFilters));
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 64 64"
                >
                  <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                </svg>
              </span>
            </div>
          )}
        </div>

        {isSleepModalOpen && (
          <div className="cfs-modal">
            <div
              className="cfs-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="cfs-modal-header">
                <h5 className="cfs-filter-label">Search by Sleep</h5>
                <span
                  className="cfs-close"
                  onClick={() => setIsSleepModalOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 64 64"
                  >
                    <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                  </svg>
                </span>
              </div>

              {/* Body */}
              <div className="cfs-modal-body">
                {/* FROM */}
                <p className="mb-0 label-text">Min</p>
                <select
                  className="cfs-select-input form-select mb-3"
                  value={tempSleepFrom ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setTempSleepFrom(val);
                    // 🔥 background only (no commit)
                  }}
                >
                  <option value="">Any</option>
                  {sleep.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>

                {/* TO */}
                <p className="mb-0 label-text">Max</p>
                <select
                  className="cfs-select-input form-select"
                  value={tempSleepTo ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setTempSleepTo(val);
                  }}
                >
                  <option value="">Any</option>
                  {sleep
                    .filter((v) => !tempSleepFrom || v > tempSleepFrom)
                    .map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                </select>
              </div>

              {/* Footer */}
              <div className="cfs-modal-footer">
                <button
                  className="cfs-btn btn"
                  onClick={() => {
                    triggerGlobalLoaders();

                    const updatedFilters: Filters = {
                      ...currentFilters,
                      from_sleep: tempSleepFrom ?? undefined,
                      to_sleep: tempSleepTo ?? undefined,
                      page: 1,
                    };

                    setSleepFrom(tempSleepFrom);
                    setSleepTo(tempSleepTo);
                    setFilters(updatedFilters);
                    filtersInitialized.current = true;

                    startTransition(() =>
                      updateAllFiltersAndURL(updatedFilters),
                    );
                    setIsSleepModalOpen(false);
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Year Range */}

        {/* ================= YEAR ================= */}
        <div className="cs-full_width_section">
          <div
            className="filter-accordion"
            onClick={() => {
              setTempYear(yearFrom); // reuse yearFrom as selected year
              setIsYearModalOpen(true);
            }}
          >
            <h5 className="cfs-filter-label">Year</h5>
            <BiChevronDown />
          </div>

          {yearFrom && (
            <div className="filter-chip">
              <span>{yearFrom}</span>
              <span
                className="filter-chip-close"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerGlobalLoaders();

                  setYearFrom(null);
                  setYearTo(null);

                  const updatedFilters: Filters = {
                    ...currentFilters,
                    acustom_fromyears: undefined,
                    acustom_toyears: undefined,
                  };

                  setFilters(updatedFilters);
                  startTransition(() => updateAllFiltersAndURL(updatedFilters));
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 64 64"
                >
                  <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                </svg>
              </span>
            </div>
          )}
        </div>
        {isYearModalOpen && (
          <div className="cfs-modal">
            <div
              className="cfs-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="cfs-modal-header">
                <h5 className="cfs-filter-label">Search by Year</h5>
                <span
                  className="cfs-close"
                  onClick={() => setIsYearModalOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 64 64"
                  >
                    <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                  </svg>
                </span>
              </div>

              {/* Body */}
              <div className="cfs-modal-body">
                <select
                  className="cfs-select-input form-select"
                  value={tempYear ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setTempYear(val);
                    // 🔥 background only – no commit
                  }}
                >
                  <option value="">Any</option>

                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Footer */}
              <div className="cfs-modal-footer">
                <button
                  className="cfs-btn btn"
                  onClick={() => {
                    triggerGlobalLoaders();

                    const updatedFilters: Filters = {
                      ...currentFilters,
                      acustom_fromyears: tempYear ?? undefined,
                      acustom_toyears: tempYear ?? undefined,
                      page: 1,
                    };

                    setYearFrom(tempYear);
                    setYearTo(tempYear);
                    setFilters(updatedFilters);
                    filtersInitialized.current = true;

                    startTransition(() =>
                      updateAllFiltersAndURL(updatedFilters),
                    );
                    setIsYearModalOpen(false);
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Length Range */}
        {/* ================= LENGTH ================= */}

        <div className="cs-full_width_section">
          <div
            className="filter-accordion"
            onClick={() => {
              setTempLengthFrom(lengthFrom);
              setTempLengthTo(lengthTo);
              setIsLengthModalOpen(true);
            }}
          >
            <h5 className="cfs-filter-label">Length</h5>
            <BiChevronDown />
          </div>

          {(lengthFrom || lengthTo) && (
            <div className="filter-chip">
              <span>
                {lengthFrom ? `${lengthFrom} ft` : "Min"} –{" "}
                {lengthTo ? `${lengthTo} ft` : "Max"}
              </span>
              <span
                className="filter-chip-close"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerGlobalLoaders();

                  setLengthFrom(null);
                  setLengthTo(null);

                  const updatedFilters: Filters = {
                    ...currentFilters,
                    from_length: undefined,
                    to_length: undefined,
                  };

                  setFilters(updatedFilters);
                  startTransition(() => updateAllFiltersAndURL(updatedFilters));
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 64 64"
                >
                  <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                </svg>
              </span>
            </div>
          )}
        </div>

        {isLengthModalOpen && (
          <div className="cfs-modal">
            <div
              className="cfs-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="cfs-modal-header">
                <h5 className="cfs-filter-label">Search by Length</h5>
                <span
                  className="cfs-close"
                  onClick={() => setIsLengthModalOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 64 64"
                  >
                    <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                  </svg>
                </span>
              </div>

              {/* Body */}
              <div className="cfs-modal-body">
                {/* FROM */}
                <p className="mb-0 label-text">Min</p>
                <select
                  className="cfs-select-input form-select mb-3"
                  value={tempLengthFrom ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setTempLengthFrom(val);
                  }}
                >
                  <option value="">Any</option>
                  {length.map((v) => (
                    <option key={v} value={v}>
                      {v} ft
                    </option>
                  ))}
                </select>

                {/* TO */}
                <p className="mb-0 label-text">Max</p>
                <select
                  className="cfs-select-input form-select"
                  value={tempLengthTo ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setTempLengthTo(val);
                  }}
                >
                  <option value="">Any</option>
                  {length
                    .filter((v) => !tempLengthFrom || v > tempLengthFrom)
                    .map((v) => (
                      <option key={v} value={v}>
                        {v} ft
                      </option>
                    ))}
                </select>
              </div>

              {/* Footer */}
              <div className="cfs-modal-footer">
                <button
                  className="cfs-btn btn"
                  onClick={() => {
                    triggerGlobalLoaders();

                    const updatedFilters: Filters = {
                      ...currentFilters,
                      from_length: tempLengthFrom ?? undefined,
                      to_length: tempLengthTo ?? undefined,
                      page: 1,
                    };

                    setLengthFrom(tempLengthFrom);
                    setLengthTo(tempLengthTo);
                    setFilters(updatedFilters);
                    filtersInitialized.current = true;

                    startTransition(() =>
                      updateAllFiltersAndURL(updatedFilters),
                    );
                    setIsLengthModalOpen(false);
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Keyword Search (hidden or toggle if needed) */}
        <div className="cs-full_width_section">
          <h5 className="cfs-filter-label">Keyword</h5>
          <input
            type="text"
            className="cfs-select-input"
            placeholder="Search By Keyword"
            value={toHumanFromQuery(keywordInput)} // ⬅️ show nicely
            onClick={() => {
              pickedSourceRef.current = null;
              setModalKeyword(""); // always empty on open
              setKeywordSuggestions([]); // clear list
              setBaseKeywords([]); // optional
              setIsKeywordModalOpen(true);
            }}
            readOnly
          />

          {keywordText && (
            <div className="filter-chip">
              <span>{toHumanFromQuery(keywordInput)}</span>
              <span
                className="filter-chip-close"
                onClick={() => {
                  const next = {
                    ...currentFilters,
                    keyword: undefined,
                    search: undefined,
                  };
                  triggerGlobalLoaders();

                  setKeywordInput("");
                  setFilters(next);
                  updateAllFiltersAndURL(next);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 64 64"
                >
                  <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                </svg>
              </span>
            </div>
          )}
        </div>
        {/* Reset Button */}

        {/* Modal */}

        {isMakeModalOpen && (
          <div className="cfs-modal">
            <div className="cfs-modal-content">
              <div className="cfs-modal-header">
                <h5 className="cfs-filter-label">Search by Manufacturer</h5>
                <span
                  onClick={() => {
                    // ✅ Clear temp states when opening modal - same pattern as ATM, Price etc.
                    setSelectedMakeTemp(null);
                    setSearchMake("");
                    setIsMakeModalOpen(false);
                  }}
                  className="cfs-close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 64 64"
                  >
                    <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                  </svg>
                </span>
              </div>

              <div className="cfs-modal-body">
                <div className="cfs-modal-secrch-section">
                  {/* 🔍 Search Input */}
                  <div className="secrch_icon" style={{ position: "relative" }}>
                    <i
                      className="bi bi-search search-icon"
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#888",
                        fontSize: "18px",
                        pointerEvents: "none",
                      }}
                    ></i>
                    <input
                      type="text"
                      style={{ paddingLeft: "40px" }}
                      // placeholder="Search make..."
                      className="filter-dropdown cfs-select-input"
                      autoComplete="off"
                      value={searchText}
                      onChange={(e) => {
                        setSearchText(e.target.value);
                      }}
                    />
                  </div>

                  <ul className="location-suggestions ">
                    {!isSearching && popularMakes.length > 0 && (
                      <>
                        <p className="mb-1 mt-3 label-text fs-6 fw-semibold">
                          Popular manufacturers
                        </p>
                        {popularMakes.map((make) => (
                          <li key={make.slug} className="category-item">
                            <label
                              className="
                        category-checkbox-row checkbox"
                            >
                              <div
                                className="d-flex align-items-center position-relative"
                                onChange={() => handleMakeSelect(make)}
                              >
                                <input
                                  className="checkbox__trigger visuallyhidden"
                                  type="checkbox"
                                  checked={selectedMakeTemp === make.slug}
                                  onChange={() => handleMakeSelect(make)}
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
                                <span className="category-name">
                                  {make.name}
                                </span>
                              </div>
                              <div>
                                <span className="category-count">
                                  ({make.count})
                                </span>
                              </div>
                            </label>
                          </li>
                        ))}
                      </>
                    )}

                    <>
                      <p className="mb-1 mt-3 label-text fs-6 fw-semibold">
                        {isSearching ? "Search Result" : "All  Manufacturers"}
                      </p>
                      {displayedMakes.map((make) => (
                        <li key={make.slug} className="category-item">
                          <label
                            className="
                        category-checkbox-row checkbox"
                          >
                            <div
                              className="d-flex align-items-center position-relative"
                              onChange={() => handleMakeSelect(make)}
                            >
                              <input
                                className="checkbox__trigger visuallyhidden"
                                type="checkbox"
                                checked={selectedMakeTemp === make.slug}
                                onChange={() => handleMakeSelect(make)}
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
                              <span className="category-name">{make.name}</span>
                            </div>
                            <div>
                              <span className="category-count">
                                ({make.count})
                              </span>
                            </div>
                          </label>
                        </li>
                      ))}

                      {displayedMakes.length === 0 && (
                        <li className="suggestion-item muted">
                          No manufacturers found
                        </li>
                      )}
                    </>
                  </ul>
                </div>
              </div>

              <div className="cfs-modal-footer">
                <button
                  type="button"
                  className="cfs-btn btn"
                  onClick={() => {
                    if (!selectedMakeTemp) return;

                    triggerGlobalLoaders();

                    const updatedFilters: Filters = {
                      ...currentFilters,
                      make: selectedMakeTemp,
                      model: undefined, // 🔥 reset model
                      page: 1,
                    };

                    // UI sync
                    setSelectedMake(selectedMakeTemp);
                    setFilters(updatedFilters);

                    // close modal
                    setIsMakeModalOpen(false);

                    // 🔥 model list auto open
                    setModelOpen(true);

                    startTransition(() => {
                      updateAllFiltersAndURL(updatedFilters);
                    });
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="cfs-modal">
            <div className="cfs-modal-content">
              <div className="cfs-modal-header">
                <h5 className="cfs-filter-label">Search by Location</h5>
                <span
                  onClick={() => setIsModalOpen(false)}
                  className="cfs-close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 64 64"
                  >
                    <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                  </svg>
                </span>
              </div>

              <div className="cfs-modal-body">
                <div className="cfs-modal-secrch-section">
                  <p className="mb-1 label-text">
                    Search suburb, postcode, state, region
                  </p>
                  <div className="secrch_icon" style={{ position: "relative" }}>
                    <i
                      className="bi bi-search search-icon"
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#888",
                        fontSize: "18px",
                        pointerEvents: "none",
                      }}
                    ></i>
                    <input
                      style={{ paddingLeft: "40px" }}
                      type="text"
                      //placeholder="Suburb or postcode..."
                      className="filter-dropdown cfs-select-input"
                      autoComplete="off"
                      value={formatted(modalInput)} // 👈 modalInput} // 👈 use modalInput
                      onFocus={() => setShowSuggestions(true)}
                      onChange={(e) => {
                        // isUserTypingRef.current = true;
                        setShowSuggestions(true);

                        const rawValue = e.target.value;
                        // Format for filtering suggestions only
                        setModalInput(rawValue); // 👈 Store raw value
                        // const formattedValue = formatLocationInput(modalInput);
                        const formattedValue = /^\d+$/.test(rawValue)
                          ? rawValue // if user types only numbers, don’t format
                          : formatLocationInput(rawValue);

                        // Use the existing locationSuggestions state or fetch new data
                        // Since you're already fetching locations in useEffect, you can filter the existing suggestions
                        // OR trigger the same API call logic here
                        if (formattedValue.length < 1) {
                          setLocationSuggestions([]);
                          return;
                        }

                        // Use the same API call logic as in your useEffect
                        const suburb = formattedValue.split(" ")[0];
                        fetchLocations(suburb)
                          .then((rawData) => {
                            const data = Array.isArray(rawData)
                              ? rawData
                              : flattenLocationResponse(rawData);
                            const filtered = data.filter((item) => {
                              const searchValue = formattedValue.toLowerCase();
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
                                    .includes(searchValue)) // ✅ added
                              );
                            });
                            setLocationSuggestions(filtered);
                          })
                          .catch(console.error);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 150)
                      }
                    />
                  </div>

                  {/* 🔽 Styled suggestion list */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <ul className="location-suggestions">
                      {locationSuggestions.map((item, i) => {
                        const isSelected =
                          selectedSuggestion?.short_address ===
                          item.short_address;
                        return (
                          <li
                            key={i}
                            className={`suggestion-item ${
                              isSelected ? "selected" : ""
                            }`}
                            onMouseDown={(e) => {
                              e.preventDefault();

                              // use onMouseDown to avoid blur race
                              isUserTypingRef.current = false; // programmatic update
                              setSelectedSuggestion(item);
                              //  setLocationInput(item.short_address);
                              setModalInput(item.short_address);
                              setLocationSuggestions([]);
                              setShowSuggestions(false); // ✅ keep closed
                              suburbClickedRef.current = true;
                            }}
                          >
                            {item.address}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {selectedSuggestion &&
                    modalInput === selectedSuggestion.short_address &&
                    selectedSuggestion.uri.split("/").length >= 3 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>
                          {selectedSuggestion.address}
                          {selectedSuggestion.location_type !== "state_only" &&
                            selectedSuggestion.location_type !==
                              "region_state" && <span> +{radiusKms}km</span>}
                        </div>
                        {selectedSuggestion.location_type !== "state_only" &&
                          selectedSuggestion.location_type !==
                            "region_state" && (
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
                                    radiusKms as (typeof RADIUS_OPTIONS)[number],
                                  ),
                                )}
                                onChange={(e) => {
                                  const idx = parseInt(e.target.value, 10);
                                  setRadiusKms(RADIUS_OPTIONS[idx]);
                                }}
                                style={{ flex: 1 }}
                                aria-label="Search radius in kilometers"
                              />
                              <div style={{ minWidth: 60, textAlign: "right" }}>
                                +{radiusKms}km
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                </div>
              </div>

              <div className="cfs-modal-footer">
                <button
                  type="button"
                  className="cfs-btn btn"
                  onClick={() => {
                    handleSearchClick();
                    if (selectedSuggestion)
                      setLocationInput(selectedSuggestion.short_address);
                    setIsModalOpen(false);
                    setLocationSuggestions([]); // ✅ close modal
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}
        {isKeywordModalOpen && (
          <div className="cfs-modal">
            <div className="cfs-modal-content">
              <div className="cfs-modal-header">
                <h5 className="cfs-filter-label">Search by Keyword</h5>
                <span
                  onClick={() => {
                    setIsKeywordModalOpen(false);
                    setModalKeyword("");
                    setKeywordSuggestions([]);
                  }}
                  className="cfs-close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="100"
                    height="100"
                    viewBox="0 0 64 64"
                  >
                    <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                  </svg>
                </span>
              </div>

              <div className="cfs-modal-body">
                <div className="cfs-modal-search-section">
                  <div className="secrch_icon" style={{ position: "relative" }}>
                    <i
                      className="bi bi-search search-icon"
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#888",
                        fontSize: "18px",
                        pointerEvents: "none",
                      }}
                    ></i>
                    <input
                      style={{ paddingLeft: "40px" }}
                      type="text"
                      placeholder="Try caravans with bunks"
                      className="filter-dropdown cfs-select-input"
                      autoComplete="off"
                      value={modalKeyword}
                      onFocus={() => setShowSuggestions(true)} // ✅ only show when focusing
                      onChange={(e) => {
                        pickedSourceRef.current = "typed";
                        setModalKeyword(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyKeywordFromModal();
                      }}
                    />
                  </div>
                  {showSuggestions && (
                    <>
                      {/* Show base list when field is empty (<2 chars) */}
                      {modalKeyword.trim().length < 2 &&
                        (baseLoading ? (
                          <div style={{ marginTop: 8 }}>Loading…</div>
                        ) : (
                          <div style={{ marginTop: 8 }}>
                            {/* 🏷 Title for base list */}
                            <h6 className="cfs-suggestion-title">
                              Popular searches
                            </h6>
                            <ul
                              className="location-suggestions"
                              style={{ marginTop: 8 }}
                            >
                              {baseKeywords.length ? (
                                baseKeywords.map((k, i) => (
                                  <li
                                    key={`${k.label}-${i}`}
                                    className="suggestion-item lowercase"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      pickedSourceRef.current = "base";
                                      setModalKeyword(k.label);
                                    }}
                                  >
                                    {k.label}
                                  </li>
                                ))
                              ) : (
                                <li className="suggestion-item">
                                  No popular items
                                </li>
                              )}
                            </ul>
                          </div>
                        ))}

                      {/* Show typed suggestions when >=2 chars */}
                      {modalKeyword.trim().length >= 2 &&
                        (keywordLoading ? (
                          <div style={{ marginTop: 8 }}>
                            <SearchSuggestionSkeleton
                              count={4}
                              label="Suggested searches"
                            />
                          </div>
                        ) : (
                          <div style={{ marginTop: 8 }}>
                            {/* 🏷 Title for typed suggestions */}
                            <h6 className="cfs-suggestion-title">
                              Suggested searches
                            </h6>
                            <ul
                              className="location-suggestions"
                              style={{ marginTop: 8 }}
                            >
                              {keywordSuggestions.length ? (
                                keywordSuggestions.map((k, i) => (
                                  <li
                                    key={`${k.label}-${i}`}
                                    className="suggestion-item"
                                    onMouseDown={() => {
                                      pickedSourceRef.current = "typed";
                                      setModalKeyword(k.label);
                                      setKeywordSuggestions([]);
                                      setBaseKeywords([]);
                                      setShowSuggestions(false);

                                      // ✅ Prevent re-trigger of fetch
                                      setKeywordLoading(false);
                                    }}
                                  >
                                    {k.label}
                                  </li>
                                ))
                              ) : (
                                <li className="suggestion-item">No matches</li>
                              )}
                            </ul>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              </div>

              <div className="cfs-modal-footer">
                <button
                  type="button"
                  className="cfs-btn btn"
                  onClick={applyKeywordFromModal}
                  disabled={!modalKeyword.trim()}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CaravanFilter;
