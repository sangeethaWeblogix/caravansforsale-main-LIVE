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
import { useSearchParams } from "next/navigation";
import { fetchProductList } from "@/api/productList/api";
import { fetchModelsByMake } from "@/api/model/api";
import "./filter.css";
import { buildSlugFromFilters } from "./slugBuilter";
import { buildUpdatedFilters } from "./buildUpdatedFilters";
import {
  fetchKeywordSuggestions,
  fetchHomeSearchList,
} from "@/api/homeSearch/api";

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

interface Make {
  name: string;
  slug: string;
}
interface Model {
  name: string;
  slug: string;
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
};

const CaravanFilter: React.FC<CaravanFilterProps> = ({
  onFilterChange,
  currentFilters,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const RADIUS_OPTIONS = [50, 100, 250, 500, 1000] as const;
  const [radiusKms, setRadiusKms] = useState<number>(RADIUS_OPTIONS[0]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<Option[]>([]);
  const [makes, setMakes] = useState<Option[]>([]);
  const [model, setModel] = useState<Model[]>([]);

  const [states, setStates] = useState<StateOption[]>([]);
  const [makeOpen, setMakeOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  // const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);
  const [filteredSuburbs, setFilteredSuburbs] = useState<Suburb[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [conditionOpen, setConditionOpen] = useState(false);
  const [sleepsOpen, setSleepsOpen] = useState(false);
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
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<LocationSuggestion | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [baseKeywords, setBaseKeywords] = useState<string[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [baseLoading, setBaseLoading] = useState(false);
  const pickedSourceRef = useRef<"base" | "typed" | null>(null);
  const [atmFrom, setAtmFrom] = useState<number | null>(null);
  const [atmTo, setAtmTo] = useState<number | null>(null);
  const [lengthFrom, setLengthFrom] = useState<number | null>(null);
  const [lengthTo, setLengthTo] = useState<number | null>(null);

  const conditionDatas = ["Near New", "New", "Used"];
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedSleepName, setSelectedSleepName] = useState<string | null>(
    null
  );
  const filtersInitialized = useRef(false);
  const [yearFrom, setYearFrom] = useState<number | null>(null);
  const [yearTo, setYearTo] = useState<number | null>(null);
  const [showAllMakes, setShowAllMakes] = useState(false);

  const atm = [
    600, 800, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000,
    4500,
  ];

  const price = [
    10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000,
    125000, 150000, 175000, 200000, 225000, 250000, 275000, 300000,
  ];

  const years = [
    2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013,
    2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 1994, 1984, 1974,
    1964, 1954, 1944, 1934, 1924, 1914,
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
  const isNonEmpty = (s: string | undefined | null): s is string =>
    typeof s === "string" && s.trim().length > 0;
  // 🔽 put this inside the component, under updateAllFiltersAndURL
  const commit = (next: Filters) => {
    setFilters(next);
    filtersInitialized.current = true;
    lastSentFiltersRef.current = next; // dedupe
    startTransition(() => {
      updateAllFiltersAndURL(next); // ← pass the fresh object
    });
  };

  // pick a human-readable text from item
  const toHuman = (it: HomeSearchItem) =>
    (
      it.label ??
      it.name ??
      it.title ??
      it.keyword ??
      it.value ??
      it.slug ??
      ""
    ).toString();

  // works for (HomeSearchItem | string)[]
  const labelsFrom = (arr: Array<HomeSearchItem | string> = []): string[] =>
    arr.map((x) => (typeof x === "string" ? x : toHuman(x))).filter(isNonEmpty);
  useEffect(() => {
    if (!isKeywordModalOpen) return;
    setBaseLoading(true);
    fetchHomeSearchList()
      .then((list) => {
        // list: HomeSearchItem[] | string[]
        const names = labelsFrom(list).slice(0, 20);
        setBaseKeywords([...new Set(names)]);
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
        const names = labelsFrom(list).slice(0, 20);
        setKeywordSuggestions(Array.from(new Set(names)));
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
    const next: Filters = {
      ...currentFilters,
      ...keepCategory(), // ⬅️ preserve selected category
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
    const abbr = state ? AUS_ABBR[state] || state : "";
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

    // 1) Ensure state is present from UI if missing
    if (!out.state && selectedStateName) {
      out.state = selectedStateName;
    }

    // 2) Validate region against the chosen state
    const validRegion = getValidRegionName(
      out.state || selectedStateName,
      out.region,
      states
    );

    if (out.region && !validRegion) {
      // region provided but not valid for this state → drop it
      delete out.region;
    } else if (validRegion) {
      // region valid → normalize to canonical region name
      out.region = validRegion;
    }

    // 3) If suburb exists, we **don't** force a region.
    //    If suburb is missing and region missing, that's fine too.

    // 4) Normalize empty strings to undefined for cleanliness
    if (typeof out.suburb === "string" && out.suburb.trim() === "")
      delete out.suburb;
    if (typeof out.pincode === "string" && out.pincode.trim() === "")
      delete out.pincode;

    return out;
  };
  // near other handlers
  // const clearKeyword = () => {
  //   // reset local UI
  //   pickedSourceRef.current = null;
  //   setKeywordInput("");
  //   setKeywordSuggestions([]);
  //   // if you keep a base list in state:
  //   // setBaseKeywords([]);

  //   // reset filters
  //   const next: Filters = {
  //     ...currentFilters,
  //     keyword: undefined,
  //     search: undefined,
  //   };

  //   setFilters(next);
  //   filtersInitialized.current = true;

  //   startTransition(() => {
  //     onFilterChange(next); // parent -> API payload clear
  //     updateAllFiltersAndURL(next); // URL params keyword/search remove + page=1
  //   });
  // };
  const clearKeyword = () => {
    const next: Filters = {
      ...currentFilters,
      keyword: undefined,
      search: undefined,
    };

    setKeywordInput(""); // ← clear the field instantly
    setFilters(next); // update local first (wins in effect)
    filtersInitialized.current = true;
    lastSentFiltersRef.current = next; // avoid re-send flicker
    // onFilterChange(next); // if your parent needs it
    updateAllFiltersAndURL(next);
  };
  const didFetchRef = useRef(false);
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    const loadFilters = async () => {
      const res = await fetchProductList();
      if (res?.data) {
        setCategories(res.data.all_categories || []);
        setMakes(res.data.make_options || []);
        setStates(res.data.states || []);
      }
    };
    loadFilters();
  }, []);

  // type UnknownRec = Record<string, unknown>;

  // const isOptionArray = (v: unknown): v is Option[] =>
  //   Array.isArray(v) &&
  //   v.every(
  //     (o) =>
  //       typeof o === "object" &&
  //       o !== null &&
  //       typeof (o as UnknownRec).name === "string" &&
  //       typeof (o as UnknownRec).slug === "string"
  //   );

  // const isStateOptionArray = (v: unknown): v is StateOption[] =>
  //   Array.isArray(v) &&
  //   v.every(
  //     (s) =>
  //       typeof s === "object" &&
  //       s !== null &&
  //       typeof (s as UnknownRec).name === "string" &&
  //       typeof (s as UnknownRec).value === "string"
  //   );

  // useEffect(() => {
  //   const loadFilters = async () => {
  //     const res = await fetchProductList();
  //     const d = (res?.data ?? undefined) as UnknownRec | undefined;

  //     const cats = isOptionArray(d?.["all_categories"])
  //       ? (d!["all_categories"] as Option[])
  //       : [];
  //     const mks = isOptionArray(d?.["make_options"])
  //       ? (d!["make_options"] as Option[])
  //       : [];
  //     const sts = isStateOptionArray(d?.["states"])
  //       ? (d!["states"] as StateOption[])
  //       : [];

  //     setCategories(cats); // ✅ always Option[]
  //     // setMakes(mks); // ✅ always Option[]
  //     setStates(sts); // ✅ always StateOption[]
  //   };
  //   loadFilters();
  // }, []);

  useEffect(() => {
    if (typeof currentFilters.radius_kms === "number") {
      setRadiusKms(currentFilters.radius_kms);
    }
  }, [currentFilters.radius_kms]);
  // useEffect(() => {
  //   if (!filtersInitialized.current) return;

  //   commit({
  //     ...currentFilters,
  //     acustom_fromyears: yearFrom ?? undefined,
  //     acustom_toyears: yearTo ?? undefined,
  //   });
  // }, [yearFrom, yearTo]);
  const handleATMChange = (newFrom: number | null, newTo: number | null) => {
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
  // useEffect(() => {
  //   if (!selectedSuburbName || !selectedpincode) return;
  //   const shortAddr = buildShortAddress(
  //     selectedSuburbName,
  //     selectedStateName,
  //     selectedpincode
  //   );
  //   if (locationInput !== shortAddr) {
  //     isUserTypingRef.current = false;
  //     setLocationInput(shortAddr);
  //   }
  // }, [selectedSuburbName, selectedpincode, selectedStateName]);

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

    setSelectedSleepName(
      currentFilters.sleeps
        ? currentFilters.sleeps.replace("-people", "")
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

  const isModelFetchCompleteRef = useRef(false); // ADD THIS

  // correct 3
  useEffect(() => {
    if (!selectedMake) {
      setModel([]);
      setSelectedModel(null);
      setSelectedModelName(null);
      return;
    }

    isModelFetchCompleteRef.current = false;

    fetchModelsByMake(selectedMake)
      .then((models) => {
        setModel(models || []);
        isModelFetchCompleteRef.current = true;

        // ✅ Moved clearing logic here
        setSelectedModel(null);
        setSelectedModelName(null);

        const updatedFilters: Filters = {
          ...currentFilters,
          make: selectedMake || currentFilters.make,
          category: selectedCategory || currentFilters.category,
          state: selectedStateName || currentFilters.state,
          region: selectedRegionName || selectedRegion || currentFilters.region,
          suburb: selectedSuburbName || currentFilters.suburb,
          pincode: selectedpincode || currentFilters.pincode,
        };

        setFilters(updatedFilters);
        // onFilterChange(updatedFilters);
      })
      .catch(console.error);
  }, [selectedMake]);

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
  const iconRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const closeIconStyle = {
    fontWeight: "bold",
    cursor: "pointer",
  };

  const arrowStyle = (isOpen: boolean) => ({
    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
    transition: "0.3s",
    marginLeft: "8px",
    cursor: "pointer",
  });

  const suburbStyle = (isSelected: boolean) => ({
    marginLeft: "24px",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "4px",
    backgroundColor: isSelected ? "#e8f0fe" : "transparent",
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
    // ✅ Clear all location-related UI state
    setSelectedState(null);
    setSelectedStateName(null);
    setSelectedRegion("");
    setSelectedRegionName(null);
    setSelectedSuburbName(null);
    setSelectedpincode(null);
    // setFilteredRegions([]);
    setFilteredSuburbs([]);
    setLocationInput("");
    setStateRegionOpen(false);

    // ✅ Delay filter clearing until React state updates apply
    setTimeout(() => {
      const updatedFilters: Filters = {
        ...currentFilters,
        state: undefined,
        region: undefined,
        suburb: undefined,
        pincode: undefined,
        location: null,
      };

      filtersInitialized.current = true;
      setFilters(updatedFilters);

      startTransition(() => {
        updateAllFiltersAndURL(updatedFilters);
      });
    }, 0); // Allow React to flush UI state
  };
  // const suppressLocationAutoClearRef = useRef(false);
  // useEffect(() => {
  //   // 👇 prevent unintended region/state clearing when we explicitly reset only suburb
  //   if (suppressLocationAutoClearRef.current) {
  //     suppressLocationAutoClearRef.current = false;
  //     return;
  //   }

  //   const noLocationInFilters =
  //     !currentFilters.state &&
  //     !currentFilters.region &&
  //     !currentFilters.suburb &&
  //     !currentFilters.pincode;

  //   if (noLocationInFilters && selectedStateName) {
  //     setSelectedState(null);
  //     setSelectedStateName(null);
  //     setSelectedRegionName(null);
  //     setSelectedSuburbName(null);
  //     setFilteredSuburbs([]);
  //     setLocationInput("");
  //   }
  // }, [
  //   currentFilters.state,
  //   currentFilters.region,
  //   currentFilters.suburb,
  //   currentFilters.pincode,
  //   selectedStateName,
  // ]);

  const resetRegionFilters = () => {
    setSelectedRegion("");
    setSelectedRegionName(null);
    setSelectedSuburbName(null);
    setSelectedpincode(null);
    setFilteredSuburbs([]);

    const updatedFilters: Filters = {
      ...currentFilters,
      region: undefined,
      suburb: undefined,
      pincode: undefined,
    };

    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };
  const formatLocationInput = (s: string) =>
    s
      .replace(/_/g, " ")
      .replace(/\s*-\s*/g, "  ") // normalize any old dash → space
      .replace(/\s{3,}/g, "  ") // collapse extra spaces
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize words
  // capitalize each word

  useEffect(() => {
    const noLocationInFilters =
      !currentFilters.state &&
      !currentFilters.region &&
      !currentFilters.suburb &&
      !currentFilters.pincode;

    if (noLocationInFilters && selectedStateName) {
      // only runs on full location reset
      setSelectedState(null);
      setSelectedStateName(null);
      setSelectedRegionName(null);
      setSelectedSuburbName(null);
      setFilteredSuburbs([]);
      setLocationInput("");
    }
  }, [
    currentFilters.state,
    currentFilters.region,
    currentFilters.suburb,
    currentFilters.pincode,
    selectedStateName,
  ]);

  const resetSuburbFilters = () => {
    // ✅ keep state & region
    // suppressLocationAutoClearRef.current = true; // 👈 tell the auto-clear effect to skip once
    setSelectedSuburbName(null);
    setSelectedpincode(null);
    setLocationInput("");
    setRadiusKms(RADIUS_OPTIONS[0]); // reset radius to default
    setLocationSuggestions([]);

    // ✅ rehydrate suburb list for the currently selected region
    if (selectedStateName && selectedRegionName) {
      const st = states.find(
        (s) =>
          s.name.toLowerCase() === selectedStateName.toLowerCase() ||
          s.value.toLowerCase() === selectedStateName.toLowerCase()
      );
      const reg = st?.regions?.find(
        (r) =>
          r.name.toLowerCase() === selectedRegionName.toLowerCase() ||
          r.value.toLowerCase() === selectedRegionName.toLowerCase()
      );
      setFilteredSuburbs(reg?.suburbs ?? []);
    }

    const updatedFilters: Filters = {
      ...currentFilters,
      // ✅ explicitly preserve state & region
      state: selectedStateName || currentFilters.state,
      region: selectedRegionName || currentFilters.region,
      suburb: undefined,
      pincode: undefined,
      radius_kms: RADIUS_OPTIONS[0], // reset radius to default
    };

    setFilters(updatedFilters);
    filtersInitialized.current = true;

    startTransition(() => {
      updateAllFiltersAndURL(updatedFilters);
    });
  };

  // const handleSearchClick = () => {
  //   // If you don't want the auto-clear here, you can remove this call
  //   resetSuburbFilters();

  //   // ❌ remove any alert("enter")
  //   // user must pick a suggestion
  //   if (!suburbClickedRef.current || !selectedSuggestion) return;

  //   // uri looks like: "<suburb>-suburb/<region>-region/<state>-state/<pincode>"
  //   const parts = selectedSuggestion.uri.split("/");
  //   const suburbSlug = parts[0] || "";
  //   const regionSlug = parts[1] || "";
  //   const stateSlug = parts[2] || "";
  //   let pincode = parts[3] || "";

  //   const suburb = suburbSlug
  //     .replace(/-suburb$/, "")
  //     .replace(/-/g, " ")
  //     .trim();
  //   const region = regionSlug
  //     .replace(/-region$/, "")
  //     .replace(/-/g, " ")
  //     .trim();
  //   const state = stateSlug
  //     .replace(/-state$/, "")
  //     .replace(/-/g, " ")
  //     .trim();

  //   // fallback: pull 4-digit pincode from address if needed
  //   if (!/^\d{4}$/.test(pincode)) {
  //     const m = selectedSuggestion.address.match(/\b\d{4}\b/);
  //     if (m) pincode = m[0];
  //   }

  //   // ✅ validate region from suggestion against our states list
  //   const regionFromSug = region; // parsed from suggestion
  //   const validRegion = getValidRegionName(state, regionFromSug, states);

  //   // set UI selections (normalize region to valid or clear it)
  //   setSelectedState(stateSlug);
  //   setSelectedStateName(state);
  //   setSelectedRegionName(validRegion || null); // ⬅️ only keep if valid
  //   setSelectedSuburbName(suburb);
  //   setSelectedpincode(pincode || null);

  //   const radiusForFilters =
  //     typeof radiusKms === "number" ? radiusKms : RADIUS_OPTIONS[0];

  //   // ✅ build filters with validated region
  //   const updatedFilters = buildUpdatedFilters(currentFilters, {
  //     // make: (selectedMake || filters.make || currentFilters.make)?.includes("=")
  //     //   ? undefined
  //     //   : selectedMake || filters.make || currentFilters.make,
  //     make: sanitizeMake(selectedMake || filters.make || currentFilters.make),
  //     model: selectedModel || filters.model || currentFilters.model,
  //     category: selectedCategory || filters.category || currentFilters.category,
  //     suburb: suburb.toLowerCase(),
  //     pincode: pincode || undefined,
  //     state,
  //     region: validRegion, // undefined if invalid → API gets state+suburb only
  //     radius_kms: radiusForFilters,
  //   });

  //   setFilters(updatedFilters);
  //   filtersInitialized.current = true;

  //   // triggers URL update + onFilterChange (API payload)
  //   startTransition(() => updateAllFiltersAndURL(updatedFilters));

  //   const shortAddr =
  //     selectedSuggestion?.short_address ||
  //     buildShortAddress(suburb, state, pincode);
  //   isUserTypingRef.current = false;
  //   setLocationInput(shortAddr);

  //   setShowSuggestions(false);
  //   // setRadiusKms(RADIUS_OPTIONS[0]);
  //   setIsModalOpen(false);
  //   setLocationSuggestions([]);
  //   suburbClickedRef.current = false;
  // };

  // useEffect(() => {
  //   if (!selectedSuggestion && filters.suburb && filters.pincode) {
  //     setLocationInput(`${filters.suburb} ${filters.pincode}`);
  //   }
  // }, [selectedSuggestion, filters.suburb, filters.pincode]);
  function getStateAbbr(state?: string) {
    if (!state) return "";
    const normalized = state.trim().toLowerCase(); // normalize
    const found = Object.keys(AUS_ABBR).find(
      (key) => key.toLowerCase() === normalized
    );
    return found ? AUS_ABBR[found] : state; // return abbr or original
  }

  const handleSearchClick = () => {
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
    setSelectedStateName(state);
    setSelectedRegionName(validRegion || null);
    setSelectedSuburbName(suburb);
    setSelectedpincode(pincode || null);

    const radiusForFilters =
      typeof radiusKms === "number" ? radiusKms : RADIUS_OPTIONS[0];

    // ✅ merged filters (suburb + category + others)
    const updatedFilters: Filters = {
      ...currentFilters,
      ...filters,
      make: sanitizeMake(selectedMake || filters.make || currentFilters.make),
      model: selectedModel || filters.model || currentFilters.model,
      category: selectedCategory || filters.category || currentFilters.category,
      suburb: suburb.toLowerCase(),
      pincode: pincode || undefined,
      state,
      region: validRegion || undefined,
      radius_kms: radiusForFilters,
    };

    setFilters(updatedFilters);
    filtersInitialized.current = true;
    lastSentFiltersRef.current = updatedFilters;

    const shortAddr =
      selectedSuggestion?.short_address ||
      buildShortAddress(suburb, state, pincode);
    setLocationInput(shortAddr);
    setShowSuggestions(false);
    setIsModalOpen(false);
    setLocationSuggestions([]);
    suburbClickedRef.current = false;

    startTransition(() => updateAllFiltersAndURL(updatedFilters));
  };

  // master sync

  const resetFilters = () => {
    const reset: Filters = {
      make: undefined,
      search: undefined,
      model: undefined,
      category: undefined,
      condition: undefined,
      state: undefined,
      region: undefined,
      suburb: undefined,
      pincode: undefined,
      from_price: undefined,
      to_price: undefined,
      minKg: undefined,
      maxKg: undefined,
      sleeps: undefined,
      from_length: undefined,
      to_length: undefined,
      acustom_fromyears: undefined,
      acustom_toyears: undefined,
      location: null,
      radius_kms: RADIUS_OPTIONS[0], // default radius, treat carefully in URL
    };

    // Clear UI states:
    setSelectedCategory(null);
    setSelectedCategoryName(null);
    setSelectedMake(null);
    setSelectedMakeName(null);
    setSelectedModel(null);
    setSelectedModelName(null);
    setSelectedConditionName(null);
    setSelectedSleepName(null);
    setModel([]);
    setFilteredSuburbs([]);
    setLocationInput("");
    setSelectedState(null);
    setSelectedStateName(null);
    setSelectedRegionName(null);
    setSelectedSuburbName(null);
    setSelectedpincode(null);
    setMinPrice(null);
    setMaxPrice(null);
    setAtmFrom(null);
    setAtmTo(null);
    setYearFrom(null);
    setYearTo(null);
    setLengthFrom(null);
    setLengthTo(null);
    setRadiusKms(RADIUS_OPTIONS[0]);

    clearKeyword(); // Make sure this only affects keyword-related UI/state without conflicting URL updates
    setKeywordInput("");
    setModalKeyword("");
    setKeywordSuggestions([]);
    setBaseKeywords([]);

    filtersInitialized.current = true;
    makeInitializedRef.current = false;
    regionSetAfterSuburbRef.current = false;
    suburbClickedRef.current = false;

    setFilters(reset);
    onFilterChange(reset);

    startTransition(() => {
      updateAllFiltersAndURL(reset); // This triggers URL update with clean reset slug
    });
  };

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
      const base: Filters = {
        ...filters,
        state: selectedStateName ?? filters.state,
        make: sanitizeMake(filters.make),
        region: getValidRegionName(
          selectedStateName ?? filters.state,
          selectedRegionName ?? filters.region,
          states
        ),
        suburb: selectedSuburbName ?? filters.suburb,
        pincode: selectedpincode ?? filters.pincode,
        radius_kms: radiusKms,
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
    selectedSuggestion,
    selectedState,
    selectedRegionName,
    selectedSuburbName,
    selectedpincode,
  ]);

  // 1) Make a stable key for `states`
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

  const suburbFilterReadyRef = useRef(false);
  useEffect(() => {
    if (
      !selectedRegionName &&
      currentFilters.region &&
      !selectedSuburbName && // avoid conflict
      !pathname.includes("-region") // ← only if not in URL
    ) {
      setSelectedRegionName(currentFilters.region);
    }
  }, [currentFilters.region, selectedRegionName, selectedSuburbName]);

  useEffect(() => {
    if (
      !suburbFilterReadyRef.current ||
      !selectedSuburbName ||
      !selectedpincode ||
      !selectedStateName ||
      !selectedRegionName ||
      !locationInput
    )
      return;

    suburbFilterReadyRef.current = true;

    const updatedFilters = {
      ...currentFilters,
      make: selectedMake || currentFilters.make,
      model: selectedModel || currentFilters.model,
      category: selectedCategory || currentFilters.category,
      suburb: selectedSuburbName.toLowerCase(),
      pincode: selectedpincode || currentFilters.pincode,
      state: selectedStateName,
      region: selectedRegionName || currentFilters.region,
    };

    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
    filtersInitialized.current = true;
    suburbClickedRef.current = false;
  }, [
    selectedSuburbName,
    selectedpincode,
    selectedStateName,
    selectedRegionName,
    locationInput,
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
        .then((data) => setLocationSuggestions(data))
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
  useEffect(() => {
    const fromYearParam = searchParams.get("acustom_fromyears");
    const toYearParam = searchParams.get("acustom_toyears");

    if (fromYearParam) {
      setYearFrom(parseInt(fromYearParam));
    }
    if (toYearParam) {
      setYearTo(parseInt(toYearParam));
    }
  }, [searchParams]);

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
      }
    }

    if (selectedModel && model.length > 0 && !selectedModelName) {
      const match = model.find((m) => m.slug === selectedModel);
      if (match) {
        setSelectedModelName(match.name);
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
      onFilterChange(updatedFilters);
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

        // Optional: sync filters
        const updatedFilters: Filters = {
          ...currentFilters,
          make: matched.slug,
        };

        setFilters(updatedFilters);
        onFilterChange(updatedFilters);
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

  const isValidMakeSlug = (slug: string | null | undefined): slug is string =>
    !!slug && makes.some((m) => m.slug === slug);
  const isValidModelSlug = (slug: string | null | undefined): slug is string =>
    !!slug && isNaN(Number(slug)) && model.some((m) => m.slug === slug);

  // useEffect(() => {
  //   if (!filtersInitialized.current) return;

  //   const slugPath = buildSlugFromFilters(filters);
  //   const query = new URLSearchParams();

  //   if (!searchParams.has("page")) {
  //     const page = searchParams.get("page");
  //     if (page && page !== "1") {
  //       query.set("page", page);
  //     }
  //   }

  //   // ✅ Clean URL before pushing
  //   const deduped = new URLSearchParams(query.toString());
  //   const finalURL = deduped.toString() ? `${slugPath}?${deduped}` : slugPath;

  //   if (lastPushedURLRef.current !== finalURL) {
  //     lastPushedURLRef.current = finalURL;
  //     startTransition(() => {
  //       router.push(finalURL);
  //     });
  //   }
  // }, [filters]);
  function formatsuburbLocationInput(
    suburb?: string | null,
    state?: string | null,
    pincode?: string | null
  ) {
    return [suburb, getStateAbbr(state ?? undefined), pincode]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const lastSentFiltersRef = useRef<Filters | null>(null);

  // ✅ Update all filters and URL with validation
  // 🔁 replace this whole function
  const updateAllFiltersAndURL = (override?: Filters) => {
    const DEFAULT_RADIUS = 50;

    const nextRaw: Filters = override ?? filters;
    const next: Filters = clean(hydrateLocation(normalizeFilters(nextRaw)));
    next.make = sanitizeMake(next.make); // belt & suspenders

    setFilters((prev) => (filtersEqual(prev, next) ? (prev as Filters) : next));
    filtersInitialized.current = true;

    if (!filtersEqual(lastSentFiltersRef.current, next)) {
      lastSentFiltersRef.current = next;
      onFilterChange(next);
    }

    // Build URL slug and query
    const slugPath = buildSlugFromFilters(next);
    const query = new URLSearchParams();

    if (next.acustom_fromyears)
      query.set("acustom_fromyears", String(next.acustom_fromyears));
    if (next.acustom_toyears)
      query.set("acustom_toyears", String(next.acustom_toyears));
    if (next.radius_kms && next.radius_kms !== DEFAULT_RADIUS)
      query.set("radius_kms", String(next.radius_kms));
    if (next.page && Number(next.page) > 1) {
      query.set("page", String(next.page));
    }

    // NEW: Detect if all filters are cleared (no query & no slug)
    const isEmptyFilters = (() => {
      const relevantKeys: (keyof Filters)[] = [
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
      return relevantKeys.every((key) => {
        const val = next[key];
        if (val === undefined || val === null) return true;
        if (typeof val === "string" && val.trim() === "") return true;
        return false;
      });
    })();

    let finalURL: string;

    if (isEmptyFilters) {
      // If all filters empty, push base /listings path without slug or query
      finalURL = "/listings";
    } else {
      const safeSlugPath = slugPath.endsWith("/") ? slugPath : `${slugPath}/`;
      finalURL = query.toString() ? `${slugPath}?${query}` : safeSlugPath;
    }

    if (lastPushedURLRef.current !== finalURL) {
      lastPushedURLRef.current = finalURL;
      router.push(finalURL);
    }
  };

  // ✅ Update handleModelSelect with valid check
  const handleModelSelect = (mod: Model) => {
    const safeMake = isValidMakeSlug(selectedMake) ? selectedMake : undefined;
    const safeModel = isValidModelSlug(mod.slug) ? mod.slug : undefined;

    setSelectedModel(mod.slug);
    setSelectedModelName(mod.name);
    setModelOpen(false);

    const updatedFilters: Filters = {
      ...currentFilters,
      make: safeMake,
      model: safeModel,
      category: selectedCategory || currentFilters.category,
      state: selectedStateName || currentFilters.state,
      region: selectedRegionName || currentFilters.region,
      suburb: selectedSuburbName || currentFilters.suburb,
      pincode: selectedpincode || currentFilters.pincode,
    };

    setFilters(updatedFilters);
    filtersInitialized.current = true;

    startTransition(() => {
      router.push(buildSlugFromFilters(updatedFilters));
      // onFilterChange(updatedFilters); // ✅ correct model slug is used
    });
  };

  useEffect(() => {
    // Run only once after a suburb is chosen (per mount)
    if (
      regionSetAfterSuburbRef.current || // already set once
      !selectedSuburbName || // need a suburb
      !selectedStateName || // need a state
      states.length === 0
    ) {
      return;
    }

    const matchedState = states.find(
      (s) =>
        s.name.toLowerCase() === selectedStateName.toLowerCase() ||
        s.value.toLowerCase() === selectedStateName.toLowerCase()
    );

    const matchedRegion = matchedState?.regions?.find((region) =>
      region.suburbs?.some(
        (sub) =>
          sub.name.toLowerCase().trim() ===
          selectedSuburbName.toLowerCase().trim()
      )
    );

    if (!matchedRegion) return;

    // ✅ Set UI state for region
    setSelectedRegionName(matchedRegion.name);
    setSelectedRegion(matchedRegion.value);

    // ✅ Update filters but DO NOT trigger URL push
    //    (don't flip filtersInitialized.current to true)
    setFilters((prev) => ({
      ...prev,
      state: selectedStateName || matchedState?.name,
      region: matchedRegion.name, // keep region in local filters (UI needs it)
      suburb: selectedSuburbName,
      pincode: selectedpincode ?? "",
    }));

    // ✅ Close all panels so nothing re-opens on remount
    setStateLocationOpen(false);
    setStateRegionOpen(false);
    setStateSuburbOpen(false);

    // mark done
    regionSetAfterSuburbRef.current = true;
  }, [selectedSuburbName, selectedStateName, states, selectedpincode]);

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
    if (selectedRegionName && !selectedSuburbName) {
      setStateRegionOpen(false);
      setStateSuburbOpen(true);
    }
  }, [selectedRegionName, selectedSuburbName]);
  // when a state is chosen and no suburb yet → keep Region panel visible
  useEffect(() => {
    if (selectedStateName && !selectedSuburbName) {
      setStateLocationOpen(false);
    }
  }, [selectedStateName, selectedSuburbName]);

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
  // const locKey = useMemo(
  //   () =>
  //     [
  //       selectedSuburbName ?? "",
  //       selectedRegionName ?? "",
  //       selectedStateName ?? "",
  //       selectedpincode ?? "",
  //     ].join("|"),
  //   [selectedSuburbName, selectedRegionName, selectedStateName, selectedpincode]
  // );

  // const hydratedKeyRef = useRef("");

  // useEffect(() => {
  //   if (!selectedSuburbName || !selectedStateName) {
  //     return; // nothing to do if suburb/state missing
  //   }

  //   // run once per unique combo
  //   if (hydratedKeyRef.current === locKey) {
  //     return; // already handled this locKey
  //   } else {
  //     hydratedKeyRef.current = locKey; // mark new key
  //   }

  //   (async () => {
  //     try {
  //       const data = await fetchLocations(selectedSuburbName);

  //       const match = findSuggestionFor(
  //         selectedSuburbName,
  //         selectedRegionName,
  //         selectedStateName,
  //         selectedpincode || null,
  //         data || []
  //       );

  //       if (match) {
  //         // set only if different
  //         if (!selectedSuggestion || selectedSuggestion.key !== match.key) {
  //           setSelectedSuggestion(match);
  //         }

  //         if (locationInput !== match.short_address) {
  //           isUserTypingRef.current = true; // programmatic update
  //           setLocationInput(match.short_address);
  //         }
  //       }
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   })();

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [locKey]);

  useEffect(() => {
    if (typeof currentFilters.radius_kms === "number") {
      setRadiusKms(currentFilters.radius_kms);
    }
  }, [currentFilters.radius_kms]);

  return (
    <div className="filter-card mobile-search">
      <div className="card-title align-items-center d-flex justify-content-between hidden-xs">
        <h3 className="filter_title">Filter</h3>
      </div>
      {/* Category Accordion */}
      <div className="cs-full_width_section">
        <div
          className="filter-accordion"
          onClick={() => toggle(setCategoryOpen)}
        >
          <h5 className="cfs-filter-label">Category</h5>
          <BiChevronDown />
        </div>

        {/* ✅ Selected Category Chip */}
        {selectedCategoryName && (
          <div className="filter-chip">
            <span>{selectedCategoryName}</span>
            <span className="filter-chip-close" onClick={resetCategoryFilter}>
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
                    setSelectedCategory(cat.slug);
                    setSelectedCategoryName(cat.name);
                    setCategoryOpen(false);
                    const updatedFilters: Filters = {
                      ...currentFilters,
                      category: cat.slug,
                      state: selectedStateName || currentFilters.state,
                      suburb: selectedSuburbName || currentFilters.suburb,
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
            className="filter-accordion-item"
            style={accordionStyle(!selectedRegionName && !selectedSuburbName)}
          >
            <span style={{ flexGrow: 1 }} onClick={() => openOnly("state")}>
              {selectedStateName}
            </span>

            {!selectedRegionName && (
              <div style={iconRowStyle}>
                <span onClick={resetStateFilters} style={closeIconStyle}>
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
        {selectedRegionName && (
          <div
            className="filter-accordion-item"
            style={accordionRegionStyle(!selectedSuburbName)}
          >
            <span style={{ flexGrow: 1 }} onClick={() => openOnly("region")}>
              {selectedRegionName}
            </span>

            {!selectedSuburbName && (
              <div style={iconRowStyle}>
                <span onClick={resetRegionFilters} style={closeIconStyle}>
                  ×
                </span>
                {/* This arrow toggles the SUBURB panel */}
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
          <div
            className="filter-accordion-item"
            style={accordionSubStyle(true)}
          >
            <span style={{ flexGrow: 1 }}>{selectedSuburbName}</span>
            <span onClick={resetSuburbFilters} style={closeIconStyle}>
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
          <div className="filter-accordion-items">
            {(
              states.find(
                (s) =>
                  s.name.toLowerCase().trim() ===
                  selectedStateName?.toLowerCase().trim()
              )?.regions || []
            ).map((region, idx) => (
              <div
                key={idx}
                className="filter-accordion-item"
                style={{ marginLeft: 16, cursor: "pointer" }}
                onClick={() => {
                  setSelectedRegionName(region.name);
                  setSelectedRegion(region.value);
                  setFilteredSuburbs(region.suburbs || []);
                  setSelectedSuburbName(null);

                  // Open Suburb immediately
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

                  startTransition(() => {
                    updateAllFiltersAndURL(updatedFilters);
                    // keep Suburb open after router.push
                    setTimeout(() => {
                      setStateRegionOpen(false);
                      setStateSuburbOpen(true);
                    }, 0);
                  });
                }}
              >
                {region.name}
              </div>
            ))}
          </div>
        )}

        {/* SUBURB LIST */}
        {stateSuburbOpen && selectedStateName && selectedRegionName && (
          <div className="filter-accordion-items">
            {Array.isArray(filteredSuburbs) && filteredSuburbs.length === 0 ? (
              <p style={{ marginLeft: 20 }}></p>
            ) : (
              filteredSuburbs.map((suburb, idx) => (
                <div
                  key={`${suburb.value}-${idx}`}
                  className="filter-accordion-item"
                  style={suburbStyle(suburb.name === selectedSuburbName)}
                  onClick={async () => {
                    const pincode = suburb.value?.match(/\d{4}$/)?.[0] || null;

                    // try fetching suggestion
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

                    // fallback if no API match
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
                          selectedRegionName,
                          selectedStateName,
                          pincode,
                        ]
                          .filter(Boolean)
                          .join(", "),
                        short_address: `${suburb.name}${
                          pincode ? ` ${pincode}` : ""
                        }`,
                      };
                    }

                    const safeState =
                      selectedStateName || currentFilters.state || null;
                    const validRegion = getValidRegionName(
                      safeState,
                      selectedRegionName,
                      states
                    );

                    // UI state
                    setSelectedSuggestion(match);
                    setLocationInput(match.short_address);
                    setSelectedSuburbName(suburb.name);
                    setSelectedpincode(pincode || null);
                    setSelectedRegionName(validRegion || null);
                    setStateLocationOpen(false);
                    setStateRegionOpen(false);
                    setStateSuburbOpen(false);

                    // ✅ merged filters (preserves category + others)
                    const updatedFilters: Filters = {
                      ...currentFilters,
                      state: safeState || undefined,
                      region: validRegion || undefined,
                      suburb: suburb.name.toLowerCase(),
                      pincode: pincode || undefined,
                      radius_kms:
                        typeof radiusKms === "number" && radiusKms !== 50
                          ? radiusKms
                          : undefined,
                    };

                    setFilters(updatedFilters);
                    filtersInitialized.current = true;
                    lastSentFiltersRef.current = updatedFilters;

                    startTransition(() =>
                      updateAllFiltersAndURL(updatedFilters)
                    );
                  }}
                >
                  {suburb.name}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {/* Keyword (opens its own modal) */}
      {/* Keyword (opens its own modal) */}

      {/* Suburb / pincode */}
      <div className="cs-full_width_section">
        <h5 className="cfs-filter-label">Suburb / pincode</h5>
        <input
          type="text"
          id="afilter_locations_text"
          className="cfs-select-input"
          placeholder="Search suburb or postcode"
          value={
            isUserTypingRef.current
              ? locationInput
              : formatsuburbLocationInput(
                  selectedSuburbName,
                  selectedStateName,
                  selectedpincode
                )
          }
          onChange={(e) => {
            isUserTypingRef.current = true;
            setLocationInput(e.target.value);
          }}
          onClick={() => setIsModalOpen(true)}
        />

        {selectedSuburbName && selectedStateName && selectedpincode && (
          <div className="filter-chip">
            {[
              selectedSuburbName,
              getStateAbbr(selectedStateName), // ✅ safe abbreviation
              selectedpincode,
            ]
              .filter(Boolean)
              .join(" - ")}
            <span
              className="filter-chip-close"
              onClick={resetSuburbFilters}
              style={{ cursor: "pointer", marginLeft: "8px" }}
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
            <span className="filter-chip-close" onClick={resetMakeFilters}>
              ×
            </span>
          </div>
        )}
        {makeOpen && (
          <div className="filter-accordion-items">
            {Array.isArray(makes) &&
              (showAllMakes ? makes : makes.slice(0, 10)).map((make) => (
                <div
                  key={make.slug}
                  className={`filter-accordion-item ${
                    selectedMake === make.slug ? "selected" : ""
                  }`}
                  onClick={() => {
                    // ✅ Reset model state
                    setSelectedModel(null);
                    setSelectedModelName(null);

                    // ✅ Force update make
                    setSelectedMake(make.slug);
                    setSelectedMakeName(make.name);

                    // ✅ Immediately open model dropdown
                    setModelOpen(true); // <== Force open immediately

                    // ✅ Update filters
                    const updatedFilters: Filters = {
                      ...currentFilters,
                      make: make.slug,
                      model: undefined,
                    };

                    setFilters(updatedFilters);
                    // onFilterChange(updatedFilters);
                    filtersInitialized.current = true;

                    // ✅ Update URL
                    startTransition(() => {
                      updateAllFiltersAndURL(updatedFilters); // ✅ this triggers the API + URL update
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
                onClick={() => setShowAllMakes((prev) => !prev)}
              >
                {showAllMakes ? "Show Less ▲" : "Show More ▼"}
              </div>
            )}
          </div>
        )}
      </div>
      {selectedMake && (
        <div className="cs-full_width_section">
          <div
            className="filter-accordion"
            onClick={() => toggle(setModelOpen)}
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
              {model.map((mod) => (
                <div
                  key={mod.slug}
                  className={`filter-accordion-item ${
                    selectedModel === mod.slug ? "selected" : ""
                  }`}
                  onClick={() => handleModelSelect(mod)} // ✅ Call here
                >
                  {mod.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              {atm.map((val) => (
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
                setAtmFrom(null);
                setAtmTo(null);

                const updatedFilters: Filters = {
                  ...currentFilters,
                  minKg: undefined,
                  maxKg: undefined,
                };

                setFilters(updatedFilters);
                // onFilterChange(updatedFilters);
                //                 onFilterChange(updatedFilters);

                startTransition(() => {
                  updateAllFiltersAndURL(updatedFilters); // ✅ pass it here
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
              {price.map((value, idx) => (
                <option key={idx} value={value}>
                  ${value.toLocaleString()}{" "}
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
      {/* 8883944599
                     9524163042 */}
      {/* Condition Accordion */}
      <div className="cs-full_width_section">
        <div
          className="filter-accordion"
          onClick={() => toggle(setConditionOpen)}
        >
          <h5 className="cfs-filter-label"> Condition</h5>
          <BiChevronDown />
        </div>
        {selectedConditionName && (
          <div className="filter-chip">
            <span>{selectedConditionName}</span>
            <span
              className="filter-chip-close"
              onClick={() => {
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

      {/* Sleeps Accordion */}
      <div className="cs-full_width_section">
        <div className="filter-accordion" onClick={() => toggle(setSleepsOpen)}>
          <h5 className="cfs-filter-label">Sleep</h5>
          <BiChevronDown />
        </div>
        {selectedSleepName && (
          <div className="filter-chip">
            <span>{selectedSleepName} People</span>
            <span
              className="filter-chip-close"
              onClick={() => {
                setSelectedSleepName("");
                commit({ ...currentFilters, sleeps: undefined });
              }}
            >
              ×
            </span>
          </div>
        )}

        {sleepsOpen && (
          <div className="filter-accordion-items">
            {sleep.map((sleepValue, index) => (
              <div
                key={index}
                className={`filter-accordion-item ${
                  selectedSleepName === String(sleepValue) ? "selected" : ""
                }`}
                onClick={() => {
                  const selectedValue = String(sleepValue);
                  const already = selectedSleepName === selectedValue;
                  setSelectedSleepName(already ? null : selectedValue);
                  setSleepsOpen(false);
                  commit({
                    ...currentFilters,
                    sleeps: already ? undefined : `${selectedValue}-people`,
                  });
                }}
              >
                {sleepValue} People
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Year Range */}
      <div className="cs-full_width_section">
        <h5 className="cfs-filter-label">Year</h5>
        <div className="row">
          <div className="col-6">
            <h6 className="cfs-filter-label-sub">From</h6>
            <select
              className="cfs-select-input"
              value={yearFrom?.toString() || ""}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : null;

                setYearFrom(val);

                // ✅ API trigger with latest `From` + existing `To`
                commit({
                  ...currentFilters,
                  acustom_fromyears: val ?? undefined,
                  acustom_toyears: yearTo ?? undefined,
                });
              }}
            >
              <option value="">Min</option>
              {years.map((value) => (
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
              value={yearTo?.toString() || ""}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : null;

                setYearTo(val);

                // ✅ API trigger with latest `To` + existing `From`
                commit({
                  ...currentFilters,
                  acustom_fromyears: yearFrom ?? undefined,
                  acustom_toyears: val ?? undefined,
                });
              }}
            >
              <option value="">Max</option>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(yearFrom || yearTo) && (
          <div className="filter-chip">
            <span>
              {yearFrom ? yearFrom : "Min"} – {yearTo ? yearTo : "Max"}
            </span>
            <span
              className="filter-chip-close"
              // onClick={() => {
              //   setYearFrom(null);
              //   setYearTo(null);

              //   const updatedFilters: Filters = {
              //     ...currentFilters,
              //     acustom_fromyears: undefined,
              //     acustom_toyears: undefined,
              //   };

              //   setFilters(updatedFilters);

              //   startTransition(() => {
              //     updateAllFiltersAndURL(updatedFilters); // ✅ pass it here
              //   });
              // }}
              onClick={() => {
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
                setLengthTo(val);
                commit({
                  ...currentFilters,
                  from_length: lengthFrom ?? undefined,
                  to_length: val ?? undefined,
                });
              }}
            >
              <option value="">Max</option>
              {length.map((value, idx) => (
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
              // onClick={() => {
              //   setLengthFrom(null);
              //   setLengthTo(null);

              //   const updatedFilters: Filters = {
              //     ...currentFilters,
              //     from_length: undefined,
              //     to_length: undefined,
              //   };
              //   setFilters(updatedFilters);

              //   // Remove slug segments related to length
              //   const segments = pathname.split("/").filter(Boolean);
              //   const newSegments = segments.filter(
              //     (s) =>
              //       !s.match(/^between-\d+-\d+-length-in-feet$/) &&
              //       !s.match(/^over-\d+-length-in-feet$/) &&
              //       !s.match(/^under-\d+-length-in-feet$/)
              //   );

              //   const newPath = `/${newSegments.join("/")}`;
              //   router.push(
              //     newPath + (searchParams.toString() ? `?${searchParams}` : "")
              //   );
              // }}
              onClick={() => {
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
      <button onClick={resetFilters} className="btn cfs-btn fullwidth_btn">
        Reset Filters
      </button>
      {/* Modal */}
      {isModalOpen && (
        <div className="cfs-modal">
          <div className="cfs-modal-content">
            <div className="cfs-modal-header">
              <span onClick={() => setIsModalOpen(false)} className="cfs-close">
                ×
              </span>
            </div>

            <div className="cfs-modal-body">
              <div className="cfs-modal-search-section">
                <h5 className="cfs-filter-label">Select Location</h5>
                <input
                  type="text"
                  placeholder="Suburb, pincode..."
                  className="filter-dropdown cfs-select-input"
                  autoComplete="off"
                  value={formatLocationInput(modalInput)} // 👈 use modalInput
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    isUserTypingRef.current = true;
                    setShowSuggestions(true);
                    setModalInput(e.target.value); // 👈 update modalInput
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
                          onMouseDown={() => {
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
                        {selectedSuggestion.address} <span>+{radiusKms}km</span>
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
                  onChange={(e) => {
                    pickedSourceRef.current = "typed";
                    setModalKeyword(e.target.value);
                  }}
                  onFocus={() => {
                    // load base list if empty
                    if (!baseKeywords.length) {
                      setBaseLoading(true);
                      fetchHomeSearchList()
                        .then((list) => {
                          const names = (list as Array<HomeSearchItem | string>)
                            .map((x) =>
                              typeof x === "string"
                                ? x
                                : x.label ??
                                  x.name ??
                                  x.title ??
                                  x.keyword ??
                                  x.value ??
                                  x.slug ??
                                  ""
                            )
                            .filter(
                              (s): s is string =>
                                typeof s === "string" && s.trim().length > 0
                            );

                          setBaseKeywords([...new Set(names)].slice(0, 20));
                        })
                        .catch(() => setBaseKeywords([]))
                        .finally(() => setBaseLoading(false));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyKeywordFromModal();
                  }}
                />

                {/* Show base list when field is empty (<2 chars) */}
                {modalKeyword.trim().length < 2 &&
                  (baseLoading ? (
                    <div style={{ marginTop: 8 }}>Loading…</div>
                  ) : (
                    <ul
                      className="location-suggestions"
                      style={{ marginTop: 8 }}
                    >
                      {baseKeywords.length ? (
                        baseKeywords.map((k, i) => (
                          <li
                            key={`${k}-${i}`}
                            className="suggestion-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              pickedSourceRef.current = "base";
                              setModalKeyword(k);
                            }}
                          >
                            {k}
                          </li>
                        ))
                      ) : (
                        <li className="suggestion-item">No popular items</li>
                      )}
                    </ul>
                  ))}

                {/* Show typed suggestions when >=2 chars */}
                {modalKeyword.trim().length >= 2 &&
                  (keywordLoading ? (
                    <div style={{ marginTop: 8 }}>Loading…</div>
                  ) : (
                    <ul
                      className="location-suggestions"
                      style={{ marginTop: 8 }}
                    >
                      {keywordSuggestions.length ? (
                        keywordSuggestions.map((k, i) => (
                          <li
                            key={`${k}-${i}`}
                            className="suggestion-item"
                            onMouseDown={() => {
                              pickedSourceRef.current = "typed";
                              setModalKeyword(k);
                            }}
                          >
                            {k}
                          </li>
                        ))
                      ) : (
                        <li className="suggestion-item">No matches</li>
                      )}
                    </ul>
                  ))}
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
  );
};

export default CaravanFilter;
