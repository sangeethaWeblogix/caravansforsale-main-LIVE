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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);

  const [locationInput, setLocationInput] = useState("");

  const [selectedMake, setSelectedMake] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedpincode, setSelectedpincode] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<
    string | null
  >(null);
  const [selectedMakeName, setSelectedMakeName] = useState<string | null>(null);
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null
  );
  // top (other states kula)
  const [modalKeyword, setModalKeyword] = useState("");
  const [showAllModels, setShowAllModels] = useState(false);

  const suburbClickedRef = useRef(false);
  const [selectedConditionName, setSelectedConditionName] = useState<
    string | null
  >(null);
  const [stateRegionOpen, setStateRegionOpen] = useState(true);
  const [stateLocationOpen, setStateLocationOpen] = useState(false);
  const [stateSuburbOpen, setStateSuburbOpen] = useState(true);

  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedStateName, setSelectedStateName] = useState<string | null>(
    null
  );
  const [selectedRegionName, setSelectedRegionName] = useState<string | null>(
    null
  );
  const [selectedSuburbName, setSelectedSuburbName] = useState<string | null>(
    null
  );
  // const [navigating, setNavigating] = useState(false);

  const [selectedSuggestion, setSelectedSuggestion] =
    useState<LocationSuggestion | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordSuggestions, setKeywordSuggestions] = useState<KeywordItem[]>(
    []
  );
  const [isMakeModalOpen, setIsMakeModalOpen] = useState(false);
  const [searchMake, setSearchMake] = useState("");
  const [filteredMakes, setFilteredMakes] = useState(makes);
  const [selectedMakeTemp, setSelectedMakeTemp] = useState<string | null>(null);

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
              }
        );

        const uniq = Array.from(
          new Map(items.map((i) => [i.label.trim(), i])).values()
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
            (label) => items.find((i) => i.label === label)!
          )
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

    const allItems = [...baseKeywords, ...keywordSuggestions];
    const match = allItems.find(
      (x) => x.label.toLowerCase() === raw.toLowerCase()
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
    pincode?: string | null
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
        typeof (o as UnknownRec).slug === "string"
    );

  const isStateOptionArray = (v: unknown): v is StateOption[] =>
    Array.isArray(v) &&
    v.every(
      (s) =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as UnknownRec).name === "string" &&
        typeof (s as UnknownRec).value === "string"
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
    allStates: StateOption[]
  ): string | undefined => {
    if (!stateName || !regionName) return undefined;
    const st = allStates.find(
      (s) =>
        s.name.toLowerCase() === stateName.toLowerCase() ||
        s.value.toLowerCase() === stateName.toLowerCase()
    );
    if (!st?.regions?.length) return undefined;
    const reg = st.regions.find(
      (r) =>
        r.name.toLowerCase() === regionName.toLowerCase() ||
        r.value.toLowerCase() === regionName.toLowerCase()
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
        currentFilters.minKg !== undefined ? Number(currentFilters.minKg) : null
      );
      setAtmTo(
        currentFilters.maxKg !== undefined ? Number(currentFilters.maxKg) : null
      );
    }
  }, [currentFilters.minKg, currentFilters.maxKg]);

  // correct -2
  useEffect(() => {
    setAtmFrom(
      currentFilters.minKg !== undefined ? Number(currentFilters.minKg) : null
    );
    setAtmTo(
      currentFilters.maxKg !== undefined ? Number(currentFilters.maxKg) : null
    );

    setMinPrice(
      currentFilters.from_price !== undefined
        ? Number(currentFilters.from_price)
        : null
    );
    setMaxPrice(
      currentFilters.to_price !== undefined
        ? Number(currentFilters.to_price)
        : null
    );

    setLengthFrom(
      currentFilters.from_length !== undefined
        ? Number(currentFilters.from_length)
        : null
    );
    setLengthTo(
      currentFilters.to_length !== undefined
        ? Number(currentFilters.to_length)
        : null
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
    // Remove resetSuburbFilters call here as it clears the selections
    // resetSuburbFilters();
    triggerGlobalLoaders();
    if (!suburbClickedRef.current || !selectedSuggestion) return;

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

    setFilters(updatedFilters);
    filtersInitialized.current = true;

    suburbClickedRef.current = true;
    setTimeout(() => {
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
  const radiusDebounceRef = useRef<number | null>(null);
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
          states
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
  const prevSuburbsKeyRef = useRef<string>("");

  // helper to make a stable signature of a suburbs array
  const suburbsKey = (subs?: Suburb[]) =>
    (subs ?? []).map((s) => `${s.name}|${s.value}`).join("||");

  // ✅ only sets state when the suburbs list actually changed
  useEffect(() => {
    if (!selectedStateName || !selectedRegionName || !states.length) return;

    const matchedState = states.find(
      (s) =>
        s.name.toLowerCase() === selectedStateName.toLowerCase() ||
        s.value.toLowerCase() === selectedStateName.toLowerCase()
    );
    if (!matchedState) return;

    const matchedRegion = matchedState.regions?.find(
      (r) =>
        r.name.toLowerCase() === selectedRegionName.toLowerCase() ||
        r.value.toLowerCase() === selectedRegionName.toLowerCase()
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

  const regionSetAfterSuburbRef = useRef(false);
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
              item.address.toLowerCase().includes(formattedValue.toLowerCase())
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

  const makeInitializedRef = useRef(false); // ✅ add at top of component

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
      makes.some((m) => m.slug === segment)
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

  const hasCategoryBeenSetRef = useRef(false);
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
  const lastPushedURLRef = useRef<string>("");

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
  const mountedRef = useRef(false);

  const lastSentFiltersRef = useRef<Filters | null>(null);

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

  const keepModelOpenRef = useRef(false);

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
    suggestions: LocationSuggestion[]
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
  const isUserTypingRef = useRef(false);
  const locKey = useMemo(
    () =>
      [
        selectedSuburbName ?? "",
        selectedRegionName ?? "",
        selectedStateName ?? "",
        selectedpincode ?? "",
      ].join("|"),
    [selectedSuburbName, selectedRegionName, selectedStateName, selectedpincode]
  );

  const hydratedKeyRef = useRef("");

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
          exactMatches || []
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
  const [visibleCount, setVisibleCount] = useState(10);
  useEffect(() => {
    setVisibleCount(10);
  }, [selectedStateName]);

  return (
    <>
      <div className="filter-card mobile-search">
        {/* Category Accordion */}
        <div className="cs-full_width_section">
          <div
            className="filter-accordion"
            onClick={() => toggle(setCategoryOpen)}
          >
            <h5 className="cfs-filter-label">Category</h5>
            <BiChevronDown
              style={{
                cursor: "pointer",
              }}
            />
          </div>

          {/* ✅ Selected Category Chip */}
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
                ×
              </span>
            </div>
          )}

          {/* ✅ Dropdown menu */}
          {categoryOpen && (
            <div className="filter-accordion-items">
              {Array.isArray(categories) &&
                categories.map((cat) => (
                  <div
                    key={cat.slug}
                    className={`filter-accordion-item ${
                      selectedCategory === cat.slug ? "selected" : ""
                    }`}
                    onClick={() => {
                      triggerGlobalLoaders();
                      // setNavigating(true);
                      setSelectedCategory(cat.slug);
                      setSelectedCategoryName(cat.name);
                      setCategoryOpen(false);
                      const updatedFilters: Filters = {
                        ...currentFilters,
                        category: cat.slug,
                      };
                      setFilters(updatedFilters);
                      filtersInitialized.current = true;
                      startTransition(() => {
                        updateAllFiltersAndURL(updatedFilters); // ✅ this triggers the API + URL update
                      });
                    }}
                  >
                    {cat.name}
                  </div>
                ))}
            </div>
          )}
        </div>

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
                    ×
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
                          p.endsWith("-region")
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
                            selectedStateName?.toLowerCase()
                      );

                      const matchedRegion = matchedState?.regions?.find(
                        (region) =>
                          region.suburbs?.some(
                            (sub) =>
                              sub.name.toLowerCase().trim() ===
                              selectedSuburbName?.toLowerCase().trim()
                          )
                      );

                      console.log(
                        "🧩 Matched Region (Fallback):",
                        matchedRegion
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
                    ×
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
                ×
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
                    selectedStateName?.toLowerCase().trim()
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
                          const res = await fetchLocations(suburb.name);
                          match = findSuggestionFor(
                            suburb.name,
                            selectedRegionName,
                            selectedStateName,
                            pincode,
                            res || []
                          );
                        } catch {}

                        // build a fallback suggestion if API doesn't match
                        if (!match) {
                          const uSub = slug(suburb.name);
                          const uReg = slug(selectedRegionName || "");
                          const uSta = slug(selectedStateName || "");
                          match = {
                            key: `${uSub}-${uReg}-${uSta}-${pincode || ""}`,
                            uri: `${uSub}-suburb/${uReg}-region/${uSta}-state/${
                              pincode || ""
                            }`,
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
                          states
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
                ×
              </span>
            </div>
          )}
        </div>

        {/* Make Accordion */}
        {/* Make Accordion */}
        <div className="cs-full_width_section">
          <div className="filter-accordion" onClick={() => toggle(setMakeOpen)}>
            <h5 className="cfs-filter-label"> Make</h5>
            <BiChevronDown
              style={{
                cursor: "pointer",
                transform: makeOpen ? "rotate(180deg)" : "",
              }}
            />
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
                ×
              </span>
            </div>
          )}
          {makeOpen && (
            <div className="filter-accordion-items">
              {Array.isArray(makes) &&
                (makes.length <= 10
                  ? [...makes].sort((a, b) => a.name.localeCompare(b.name))
                  : [...makes]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .slice(0, 10)
                ).map((make) => (
                  <div
                    key={make.slug}
                    className={`filter-accordion-item ${
                      selectedMake === make.slug ? "selected" : ""
                    }`}
                    onClick={() => {
                      // ✅ Reset model state
                      triggerGlobalLoaders();
                      setSelectedModel(null);
                      setSelectedModelName(null);

                      // ✅ Force update make
                      setSelectedMake(make.slug);
                      setSelectedMakeName(make.name);
                      setModel(make.models || []);
                      keepModelOpenRef.current = true;

                      // ✅ Immediately oxxxxxxxx`pen model dropdown
                      setModelOpen(true);

                      // ✅ Update filters
                      const updatedFilters: Filters = {
                        ...currentFilters,
                        make: make.slug,
                        model: undefined,
                      };

                      setFilters(updatedFilters);
                      filtersInitialized.current = true;

                      // ✅ Update URL

                      setMakeOpen(false);
                      setModelOpen(true);
                      startTransition(() => {
                        updateAllFiltersAndURL(updatedFilters);
                      });
                    }}
                  >
                    {make.name}
                  </div>
                ))}

              {/* Show More / Show Less toggle */}
              {makes.length > 10 && (
                <div
                  className="filter-accordion-subitem"
                  style={{
                    cursor: "pointer",
                    color: "#007BFF",
                    marginTop: "8px",
                    fontWeight: 500,
                  }}
                  onClick={() => setIsMakeModalOpen(true)} // ✅ open modal
                >
                  Search By Manufacturer
                </div>
              )}
            </div>
          )}
        </div>
        {selectedMake && selectedMakeName && (
          <div className="cs-full_width_section">
            <div
              className="filter-accordion"
              onClick={() => toggle(setModelOpen)}
            >
              <h5 className="cfs-filter-label">Model</h5>
              <BiChevronDown
                style={{
                  cursor: "pointer",
                }}
              />
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
                    setModelOpen(true);
                  }}

                  // const updatedFilters: Filters = {
                  //   ...currentFilters,
                  //   model: undefined,
                  // };
                  // setFilters(updatedFilters);
                  // onFilterChange(updatedFilters);

                  // Remove model from slug
                  //   const segments = pathname.split("/").filter(Boolean);
                  //   const newSegments = segments.filter(
                  //     (s) => s !== selectedModel
                  //   );

                  //   const newPath = `/${newSegments.join("/")}`;
                  //   router.push(
                  //     newPath +
                  //       (searchParams.toString() ? `?${searchParams}` : "")
                  //   );
                  // }}
                >
                  ×
                </span>
              </div>
            )}

            {modelOpen && (
              <div className="filter-accordion-items">
                {(showAllModels ? model : model.slice(0, 5)).map((mod) => (
                  <div
                    key={mod.slug}
                    className={`filter-accordion-item ${
                      selectedModel === mod.slug ? "selected" : ""
                    }`}
                    onClick={() => handleModelSelect(mod)}
                  >
                    {mod.name}
                  </div>
                ))}

                {model.length > 5 && (
                  <div
                    className="show-more-less"
                    style={{
                      marginTop: "8px",
                      cursor: "pointer",
                      color: "#0070f3",
                      fontWeight: "500",
                    }}
                    onClick={() => setShowAllModels(!showAllModels)}
                  >
                    {showAllModels ? "Show Less" : "Show More"}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ATM Range */}
        {/* ATM Range */}
        {/* ATM Range */}
        <div className="cs-full_width_section">
          <h5 className="cfs-filter-label">ATM</h5>
          <div className="row">
            {/* ATM From */}
            <div className="col-6">
              <h6 className="cfs-filter-label-sub">From</h6>
              <select
                className="cfs-select-input"
                value={atmFrom?.toString() || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                  handleATMChange(val, atmTo); // ✅ pass current `atmTo`
                }}
              >
                <option value="">Min</option>
                {atm.map((val) => (
                  <option key={val} value={val}>
                    {val.toLocaleString()} kg
                  </option>
                ))}
              </select>
            </div>

            {/* ATM To */}
            <div className="col-6">
              <h6 className="cfs-filter-label-sub">To</h6>
              <select
                className="cfs-select-input"
                value={atmTo?.toString() || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                  handleATMChange(atmFrom, val); // ✅ pass current `atmFrom`
                }}
              >
                <option value="">Max</option>
                {atm
                  .filter((val) => !atmFrom || val > atmFrom) // ✅ Show only values >= From
                  .map((val) => (
                    <option key={val} value={val}>
                      {val.toLocaleString()} kg
                    </option>
                  ))}
              </select>
            </div>
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
                ×
              </span>
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="cs-full_width_section">
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
                ×
              </span>
            </div>
          )}
        </div>

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
                ×
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

        <div className="cs-full_width_section">
          <h5 className="cfs-filter-label">Sleep</h5>
          <div className="row">
            <div className="col-6">
              <h6 className="cfs-filter-label-sub">From</h6>
              <select
                className="cfs-select-input"
                value={sleepFrom?.toString() || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                  triggerGlobalLoaders();
                  setSleepFrom(val);
                  commit({
                    ...currentFilters,
                    from_sleep: val ?? undefined,
                    to_sleep: sleepTo ?? currentFilters.to_sleep,
                  });
                }}
              >
                <option value="">Min</option>
                {sleep.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6">
              <h6 className="cfs-filter-label-sub">To</h6>
              <select
                className="cfs-select-input"
                value={sleepTo?.toString() || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                  triggerGlobalLoaders();
                  setSleepTo(val);
                  commit({
                    ...currentFilters,
                    from_sleep: sleepFrom ?? currentFilters.from_sleep,
                    to_sleep: val ?? undefined,
                  });
                }}
              >
                <option value="">Max</option>
                {sleep
                  .filter((value) => !sleepFrom || value > sleepFrom)
                  .map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {(sleepFrom || sleepTo) && (
            <div className="filter-chip">
              <span>
                {sleepFrom ? sleepFrom : "Min"} – {sleepTo ? sleepTo : "Max"}{" "}
                People
              </span>
              <span
                className="filter-chip-close"
                onClick={() => {
                  triggerGlobalLoaders();

                  setSleepFrom(null);
                  setSleepTo(null);
                  commit({
                    ...currentFilters,
                    from_sleep: undefined,
                    to_sleep: undefined,
                  });
                }}
              >
                ×
              </span>
            </div>
          )}
        </div>

        {/* Year Range */}

        <div className="cs-full_width_section">
          {/* Accordion Header */}
          <div className="filter-accordion" onClick={() => toggle(setYearOpen)}>
            <h5 className="cfs-filter-label">Year</h5>
            <BiChevronDown
              style={{
                cursor: "pointer",
              }}
            />
          </div>

          {/* Selected Year Chip */}
          {yearFrom && yearTo && (
            <div className="filter-chip">
              <span>{yearFrom}</span>
              <span
                className="filter-chip-close"
                onClick={() => {
                                    triggerGlobalLoaders();

                  setYearFrom(null);
                  setYearTo(null);
                  commit({
                    ...currentFilters,
                    acustom_fromyears: undefined,
                    acustom_toyears: undefined,
                  });
                }}
              >
                ×
              </span>
            </div>
          )}

          {/* Dropdown Items */}
          {yearOpen && (
            <div className="filter-accordion-items">
              {years.map((yearValue, index) => (
                <div
                  key={index}
                  className={`filter-accordion-item ${
                    yearFrom === yearValue ? "selected" : ""
                  }`}
                  onClick={() => {
                    triggerGlobalLoaders();
                    const already = yearFrom === yearValue;
                    const selectedValue = already ? null : yearValue;

                    setYearFrom(selectedValue);
                    setYearTo(selectedValue);
                    setYearOpen(false);

                    commit({
                      ...currentFilters,
                      acustom_fromyears: selectedValue ?? undefined,
                      acustom_toyears: selectedValue ?? undefined,
                    });
                  }}
                >
                  {yearValue}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Length Range */}
        <div className="cs-full_width_section">
          <h5 className="cfs-filter-label">Length</h5>
          <div className="row">
            <div className="col-6">
              <h6 className="cfs-filter-label-sub">From</h6>
              <select
                className="cfs-select-input"
                value={lengthFrom || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                                    triggerGlobalLoaders();

                  setLengthFrom(val);
                  commit({
                    ...currentFilters,
                    from_length: val ?? undefined,
                    to_length: lengthTo ?? undefined,
                  });
                }}
              >

                <option value="">Min</option>
                {length.map((value, idx) => (
                  <option key={idx} value={value}>
                    {value} ft
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6">
              <h6 className="cfs-filter-label-sub">To</h6>
              <select
                className="cfs-select-input"
                value={lengthTo?.toString() || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                                    triggerGlobalLoaders();

                  setLengthTo(val);
                  commit({
                    ...currentFilters,
                    from_length: lengthFrom ?? undefined,
                    to_length: val ?? undefined,
                  });
                }}
              >
                <option value="">Max</option>
                {length
                  .filter((value) => !lengthFrom || value > lengthFrom)
                  .map((value, idx) => (
                    <option key={idx} value={value}>
                      {value} ft
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {(lengthFrom || lengthTo) && (
            <div className="filter-chip">
              <span>
                {lengthFrom ? `${lengthFrom} ft` : "Min"} –{" "}
                {lengthTo ? `${lengthTo} ft` : "Max"}
              </span>
              <span
                className="filter-chip-close"
                onClick={() => {
                                    triggerGlobalLoaders();

                  setLengthFrom(null);
                  setLengthTo(null);
                  commit({
                    ...currentFilters,
                    from_length: undefined,
                    to_length: undefined,
                  });
                }}
              >
                ×
              </span>
            </div>
          )}
        </div>
        {/* Keyword Search (hidden or toggle if needed) */}
        <div className="cs-full_width_section">
          <h5 className="cfs-filter-label">Keyword</h5>
          <input
            type="text"
            className="cfs-select-input"
            placeholder="Click to choose / type"
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
                  setKeywordInput("");
                  setFilters(next);
                  updateAllFiltersAndURL(next);
                }}
              >
                ×
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
                <span
                  onClick={() => setIsMakeModalOpen(false)}
                  className="cfs-close"
                >
                  ×
                </span>
              </div>

              <div className="cfs-modal-body">
                <div className="cfs-modal-search-section">
                  <h5 className="cfs-filter-label">Search Manufacturer</h5>

                  {/* 🔍 Search Input */}
                  <input
                    type="text"
                    placeholder="Search make..."
                    className="filter-dropdown cfs-select-input"
                    autoComplete="off"
                    value={searchMake}
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      setSearchMake(e.target.value);
                      if (!query.trim()) {
                        setFilteredMakes([]);
                        return;
                      }
                      setFilteredMakes(
                        makes.filter((m) =>
                          m.name.toLowerCase().includes(query)
                        )
                      );
                    }}
                  />

                  {/* 🔽 Filtered Makes */}
                  {filteredMakes.length > 0 && (
                    <ul className="location-suggestions">
                      {filteredMakes.map((make) => (
                        <li
                          key={make.slug}
                          className={`suggestion-item ${
                            selectedMakeTemp === make.slug ? "selected" : ""
                          }`}
                          onMouseDown={() => {
                            // ✅ Click: fill input and hide suggestions
                            setSearchMake(make.name);
                            setSelectedMakeTemp(make.slug);
                            setSelectedMakeName(make.name);
                            setFilteredMakes([]); // hide list
                          }}
                        >
                          {make.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="cfs-modal-footer">
                <button
                  type="button"
                  className="cfs-btn btn"
                  onClick={() => {
                    triggerGlobalLoaders();

                    if (!selectedMakeTemp) return;

                    const updatedFilters: Filters = {
                      ...currentFilters,
                      make: selectedMakeTemp,
                      model: undefined,
                    };

                    setSelectedMake(selectedMakeTemp);
                    setFilters(updatedFilters);
                    filtersInitialized.current = true;

                    // ✅ Close modal & open model dropdown
                    setIsMakeModalOpen(false);
                    setMakeOpen(false);
                    setModelOpen(true);

                    startTransition(() =>
                      updateAllFiltersAndURL(updatedFilters)
                    );
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
                <span
                  onClick={() => setIsModalOpen(false)}
                  className="cfs-close"
                >
                  ×
                </span>
              </div>

              <div className="cfs-modal-body">
                <div className="cfs-modal-search-section">
                  <h5 className="cfs-filter-label">Select Location</h5>
                  <input
                    type="text"
                    placeholder="Suburb or postcode..."
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
                        .then((data) => {
                          // Filter the API results based on the formatted input
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
                                item.postcode.toString().includes(searchValue)) // ✅ added
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
                              setLocationInput(item.short_address);
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
                    modalInput === selectedSuggestion.short_address && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>
                          {selectedSuggestion.address}{" "}
                          <span>+{radiusKms}km</span>
                        </div>

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
                                radiusKms as (typeof RADIUS_OPTIONS)[number]
                              )
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
                <span
                  onClick={() => {
                    setIsKeywordModalOpen(false);
                    setModalKeyword("");
                    setKeywordSuggestions([]);
                  }}
                  className="cfs-close"
                >
                  ×
                </span>
              </div>

              <div className="cfs-modal-body">
                <div className="cfs-modal-search-section">
                  <h5 className="cfs-filter-label">Search by Keyword</h5>

                  <input
                    type="text"
                    placeholder="eg: offroad, bunk, ensuite…"
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
                          <div style={{ marginTop: 8 }}>Loading…</div>
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
