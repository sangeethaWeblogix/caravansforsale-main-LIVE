 "use client";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchListings, ApiResponse, Item } from "../../../api/listings/api";
import Listing from "./LisitingContent";
import ExculsiveContent from "./exculsiveContent";
import FilterModal from "./FilterModal";
import { flushSync } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import "./newList.css?=303";
import "./top-filters.css?=514";
import ListingSkeleton, { SidebarListingSkeleton } from "../skelton";
import {
  redirect,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { buildSlugFromFilters } from "../slugBuilter";
import { parseSlugToFilters } from "../../components/urlBuilder";
 import "./loader.css";
import FilterSlider from "./FilterSlider";
import StaticLinks from "./StaticLinks";
import { useBanners } from "@/components/BannerHandler";
// import { useBannerTracking } from "@/hooks/useBannerTracking";
import ListingBottomSections from "./ListingBottomSections";
import type { BottomLinksData } from "@/api/bottomLinks/api";

/* --------- GLOBAL de-dupe across StrictMode remounts --------- */
// let LAST_GLOBAL_REQUEST_KEY = "";

/** ------------ Local types (match what UI renders) ------------ */
interface Product {
  id: number;
  name: string;
  length: string;
  kg: string;
  regular_price: string;
  sale_price?: string;
  price_difference?: string;
  image: string;
  link: string;
  condition: string;
  location?: string;
  region?: string;
  categories?: string[];
  people?: string;
  make?: string;
  slug?: string;
  description?: string;
  sku?: string;
  gallery?: string[];
  h1?: string;
  weight?: string;
  price?: string;
  thumbnail?: string;
  url?: string;
  sleeps?: string;
  manufacturer?: string;
  is_exclusive?: boolean;
  is_premium?: boolean;
  image_url?: string[];
  seller_type?: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_items?: number;
  per_page: number;
  total_products: number;
}

export interface Category {
  name: string;
  slug: string;
}

export interface StateOption {
  value: string;
  name: string;
}

export interface MakeOption {
  name: string;
  slug: string;
}

export interface Filters {
  category?: string;
  image_format?: string[];
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
  orderby?: string;
  search?: string;
  keyword?: string;
  radius_kms?: number | string;
  from_sleep?: string | number;
  to_sleep?: string | number;
  seller_type?: string;
}

type ProductListResponse = {
  data: {
    all_categories: Category[];
    states: StateOption[];
  };
};

interface Props extends Filters {
  page?: string | number;
  initialData?: ApiResponse;
  linksData?: any;
  productListData?: ProductListResponse;
  initialCategoryCounts?: { name: string; slug: string; count: number }[];
  initialMakeCounts?: { name: string; slug: string; count: number }[];
  initialBottomLinksData?: BottomLinksData | null;
  initialDistances?: Record<string, number>;
}

/** ------------ Helper Functions ------------ */
function transformApiItemsToProducts(items: Item[]): Product[] {
  return items.map((item) => ({
    id: typeof item.id === "number" ? item.id : parseInt(String(item.id)) || 0,
    name: item.name || "",
    sleep: item.people || "",
    length: item.length || "",
    kg: item.kg || "",
    regular_price: item.regular_price || "",
    sale_price: item.sale_price,
    price_difference: item.price_difference,
    image: item.image || "",
    link: item.link || "",
    condition: item.condition || "",
    location: item.location,
    region: item.region,
    suburb: item.suburb,
    pincode: item.pincode,
    categories: item.categories,
    people: item.people || "",
    make: item.make || "",
    model: item.model || "",
    slug: item.slug,
    description: item.description,
    sku: item.sku,
    gallery: item.gallery || [],
    is_exclusive: item.is_exclusive,
    is_premium: item.is_premium,
    image_format: item.image_format || [],
    image_url: item.image_url || [],
    seller_type: item.seller_type,
  }));
}

/** ------------ Component ------------ */
export default function ListingsPage({
  initialData,
  productListData,
  linksData: serverLinksData,
  initialCategoryCounts,
  initialMakeCounts,
  initialBottomLinksData,
  initialDistances,
  ...incomingFilters
}: Props) {
  const DEFAULT_RADIUS = 50 as const;
  const [openModal, setOpenModal] = useState(false);
  const [filters, setFilters] = useState<Filters>(incomingFilters);
  const filtersRef = useRef<Filters>({});
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [relatedChips, setRelatedChips] = useState<
    { label: string; url: string; group: string }[]
  >([]);
  const [isMainLoading, setIsMainLoading] = useState(false);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(false);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);

  const isSliderFetchingRef = useRef(false);
  const [clickid, setclickid] = useState<string | null>(null);

  // ✅ FIX: Single ref to track whether we've consumed initialData.
  // No state variable — avoids circular dep with loadListings/useEffect.
  const hasConsumedInitialDataRef = useRef(false);
  // Track the last initialData reference we applied — used to detect server re-renders on filter navigation.
  const prevInitialDataRef = useRef<ApiResponse | null>(initialData ?? null);
  // When set true, the URL-change effect skips the client fetch (initialData sync already applied).
  const shouldSkipFetchRef = useRef(false);
 // Initialize state with initialData (always provided now — page.tsx always fetches)
  const [products, setProducts] = useState<Product[]>(
    initialData?.data?.products
      ? transformApiItemsToProducts(initialData.data.products)
      : [],
  );

  const [exculisiveProducts, setExculisiveProducts] = useState<Product[]>(
    initialData?.data?.exclusive_products
      ? transformApiItemsToProducts(initialData.data.exclusive_products)
      : [],
  );

  const [fetauredProducts, setFeaturedProducts] = useState<Product[]>(
    initialData?.data?.featured_products
      ? transformApiItemsToProducts(initialData.data.featured_products)
      : [],
  );

  const [preminumProducts, setPremiumProducts] = useState<Product[]>(
    initialData?.data?.premium_products
      ? transformApiItemsToProducts(initialData.data.premium_products)
      : [],
  );

  const [emptyProduct, setEmptyProduct] = useState<Product[]>(
    initialData?.data?.emp_exclusive_products
      ? transformApiItemsToProducts(initialData.data.emp_exclusive_products)
      : [],
  );

  const [sliderCategoryCounts, setSliderCategoryCounts] = useState<
    { name: string; slug: string; count: number }[]
  >(initialCategoryCounts ?? []);
  const [sliderCatLoading, setSliderCatLoading] = useState(false);

  const [sliderMakeCounts, setSliderMakeCounts] = useState<
    { name: string; slug: string; count: number }[]
  >(initialMakeCounts ?? []);

  const [categories, setCategories] = useState<Category[]>(
    initialData?.data?.all_categories || [],
  );

  const [makes, setMakes] = useState<MakeOption[]>(
    initialData?.data?.make_options || [],
  );

  const [stateOptions, setStateOptions] = useState<StateOption[]>(
    initialData?.data?.states || [],
  );

  const [models, setModels] = useState<MakeOption[]>(
    initialData?.data?.model_options || [],
  );
  const modelsRef = useRef<MakeOption[]>(initialData?.data?.model_options || []);
  const resolveModelSlug = (urlSlug: string | undefined): string | undefined => {
    if (!urlSlug) return urlSlug;
    const found = modelsRef.current.find(
      (m) =>
        m.slug === urlSlug ||
        m.slug.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") === urlSlug
    );
    return found?.slug ?? urlSlug;
  };
  const withResolvedModel = (f: Filters): Filters => {
    if (!f.model) return f;
    const resolved = resolveModelSlug(f.model);
    return resolved && resolved !== f.model ? { ...f, model: resolved } : f;
  };

  const [pageTitle, setPageTitle] = useState(initialData?.seo_v2?.h1 || " ");
  const [metaTitle, setMetaTitle] = useState(
    initialData?.seo_v2?.meta_title ?? initialData?.seo_v2?.metatitle ?? "",
  );
  const [metaDescription, setMetaDescription] = useState(
    initialData?.seo_v2?.metadescription || "",
  );

  // Update browser tab title whenever metaTitle state changes (filter navigation, initialData update)
  useEffect(() => {
    if (metaTitle) document.title = metaTitle;
  }, [metaTitle]);

  // 1️⃣  persistence helpers
  const PAGE_KEY = (id: string) => `page_${id}`;

  const readPage = (id: string): number | null => {
    try {
      const v = localStorage.getItem(PAGE_KEY(id));
      if (v) return parseInt(v, 10);
      const match = id.match(/p(\d+)$/);
      if (match) return parseInt(match[1], 10);
      return null;
    } catch {
      const match = id.match(/p(\d+)$/);
      if (match) return parseInt(match[1], 10);
      return null;
    }
  };

  useEffect(() => {
  if (searchParams.has("page")) {
    redirect("/410");
  }
  const fromYears = searchParams.get("acustom_fromyears");
  const toYears = searchParams.get("acustom_toyears");
  if (fromYears !== null || toYears !== null) {
    redirect("/410");
  }
}, [searchParams]);

  // const postTrackEvent = async (product_id: number) => {
  //   try {
  //     await fetch("/api/track", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ product_id }),
  //     });
  //   } catch {}
  // };

  // useEffect(() => {
  //   const cards = document.querySelectorAll(".product-card[data-product-id]");
  //   if (!cards.length) return;
  //   const observer = new IntersectionObserver(
  //     (entries) => {
  //       entries.forEach((entry) => {
  //         if (entry.isIntersecting) {
  //           const id = Number(entry.target.getAttribute("data-product-id"));
  //           if (id) postTrackEvent(id);
  //           observer.unobserve(entry.target);
  //         }
  //       });
  //     },
  //     { threshold: 0.3 },
  //   );
  //   cards.forEach((el) => observer.observe(el));
  //   return () => observer.disconnect();
  // }, [products]);

 
 // ✅ Always use initialData or default — never window in useState
const [pagination, setPagination] = useState<Pagination>(() => {
  if (initialData?.pagination) {
    return {
      current_page: initialData.pagination.current_page || 1,
      total_pages: initialData.pagination.total_pages || 1,
      per_page: initialData.pagination.per_page || 12,
      total_products: initialData.pagination.total_products || 0,
      total_items: initialData.pagination.total_products || 0,
    };
  }
  // ✅ Always default — window access in useEffect மட்டும்
  return {
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    per_page: 12,
    total_products: 0,
  };
});

  const asNumber = (v: unknown): number | undefined => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  // Shuffle SSR-seeded products once on client mount (avoids hydration mismatch)
  const mountShuffledRef = useRef(false);
  useEffect(() => {
    if (mountShuffledRef.current) return;
    mountShuffledRef.current = true;
    setProducts(prev => prev.length > 0 ? shuffleArray([...prev]) : prev);
  }, []);

  // Pre-fetch next page in background to warm server cache
  const prefetchedPageRef = useRef<number>(-1);
  useEffect(() => {
    const { current_page, total_pages } = pagination;
    if (current_page >= total_pages) return;
    const nextPage = current_page + 1;
    if (prefetchedPageRef.current === nextPage) return;
    prefetchedPageRef.current = nextPage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchListings({ ...filtersRef.current, page: nextPage } as any).catch(() => {});
  }, [pagination.current_page, pagination.total_pages]);

  // Parse slug ONCE on mount; do not fetch here
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const path = pathname;
    const slugParts = path.split("/listings/")[1]?.split("/") || [];
    const parsed = parseSlugToFilters(slugParts);
    const merged = withResolvedModel({ ...parsed, ...incomingFilters });
    filtersRef.current = merged;
    setFilters(merged);
  }, [incomingFilters, pathname]);

  const normalizeSearchFromMake = (f: Filters): Filters => {
    if (!f?.make) return f;
    const decoded = decodeURIComponent(String(f.make));
    if (!decoded.includes("=")) return f;
    const [k, v = ""] = decoded.split("=", 2);
    if (k === "search" || k === "keyword") {
      const out: Filters = { ...f, [k]: v };
      delete out.make;
      if (out.keyword) out.search = undefined;
      return out;
    }
    return f;
  };

  const validatePage = (raw: string | null): number => {
    if (raw === null) {
      return 1;
    }
    if (raw.trim() === "") {
      redirect("/410");
    }
    if (!/^\d+$/.test(raw)) {
      redirect("/410");
    }
    const page = parseInt(raw, 10);
    if (!Number.isInteger(page) || page < 1) {
      redirect("/410");
    }
    return page;
  };

  const updateURLWithFilters = useCallback(
    (nextFilters: Filters, _pageNum: number, clickidParam?: string) => {
      const slug = buildSlugFromFilters(nextFilters);
      const query = new URLSearchParams();

      if (nextFilters.orderby)
        query.set("orderby", String(nextFilters.orderby));
      const r = Number(nextFilters.radius_kms);
      if (!Number.isNaN(r) && r !== 25 && (nextFilters.suburb || r !== DEFAULT_RADIUS)) {
        query.set("radius_kms", String(r));
      }

      const cid =
        clickidParam !== undefined
          ? clickidParam
          : new URLSearchParams(window.location.search).get("clickid");
      if (cid && cid !== "") query.set("clickid", cid);

      const path = window.location.pathname;
      const safeSlug = slug ? (slug.endsWith("/") ? slug : `${slug}/`) : path;
      const finalURL = query.toString() ? `${safeSlug}?${query}` : safeSlug;
      window.history.pushState({}, "", finalURL);
    },
    [DEFAULT_RADIUS, clickid],
  );

  const getUrlParams = () => new URLSearchParams(window.location.search);
  const setUrlParams = (params: Record<string, string | undefined>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    });
    window.history.replaceState({}, "", url.toString());
  };

  useEffect(() => {
    const qp = typeof window !== "undefined" ? getUrlParams() : null;
    const incoming = qp?.get("clickid") || null;
    if (incoming) setclickid(incoming);
  }, []);

  const generateClickidForPage = (pageNum: number): string => {
    if (pageNum <= 1) return "";
    const filterString = JSON.stringify(filtersRef.current);
    const str = `${filterString}_page_${pageNum}`;
    let h1 = pageNum * 2654435761;
    let h2 = pageNum * 2246822519;
    let h3 = pageNum * 3266489917;
    let h4 = pageNum * 668265263;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 = ((h1 << 5) - h1 + c) | 0;
      h2 = ((h2 << 7) - h2 + c * 31) | 0;
      h3 = ((h3 << 3) - h3 + c * 127) | 0;
      h4 = ((h4 << 11) - h4 + c * 17) | 0;
    }
    const part1 = Math.abs(h1 ^ 0x5f3759df).toString(36);
    const part2 = Math.abs(h2 ^ 0x1b873593).toString(36);
    const part3 = Math.abs(h3 ^ 0xe6546b64).toString(36);
    const part4 = Math.abs(h4 ^ 0x85ebca6b).toString(36);
    const suffix = `p${pageNum}`;
    const hash = `${part1}${part2}${part3}${part4}`;
    return `${hash.slice(0, 25 - suffix.length)}${suffix}`;
  };

  const latestListingsRequestRef = useRef(0);

  // Mirror of generateTitleFromFilters in meta.ts — used when seo_v2 returns no title (e.g. year filter pages)
  const computeTitleFromFilters = useCallback((f: Filters): string => {
    const titleCase = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const parts: string[] = [];
    if (f.condition) parts.push(titleCase(String(f.condition)));
    if (f.make) parts.push(titleCase(String(f.make)));
    if (f.category) parts.push(titleCase(String(f.category).replace(/-category$/, "")));
    const noun = parts.length ? `${parts.join(" ")} Caravans` : "Caravans";
    const stateStr = f.state ? ` in ${titleCase(String(f.state))}, Australia` : " in Australia";
    return `${noun} for Sale${stateStr}`;
  }, []);

  const loadListings = useCallback(
    async (
      pageNum = 1,
      appliedFilters: Filters = filtersRef.current,
      skipInitialCheck = false,
    ): Promise<ApiResponse | undefined> => {
      // On first call, return initialData without fetching.
      // This prevents a double-fetch on mount — useState already seeded
      // products from initialData, so we just need to signal "done".
      if (initialData && !skipInitialCheck && !hasConsumedInitialDataRef.current) {
        hasConsumedInitialDataRef.current = true;
        return initialData;
      }

      try {
        const safeFilters = normalizeSearchFromMake(appliedFilters);

        const radiusNum = asNumber(safeFilters.radius_kms);
        const radiusParam =
          typeof radiusNum === "number" && (safeFilters.suburb || radiusNum !== DEFAULT_RADIUS)
            ? String(radiusNum)
            : undefined;

        const requestId = ++latestListingsRequestRef.current;

        const response: ApiResponse = await fetchListings({
          ...safeFilters,
          page: pageNum,
          condition: safeFilters.condition,
          minKg: safeFilters.minKg?.toString(),
          maxKg: safeFilters.maxKg?.toString(),
          sleeps: safeFilters.sleeps,
          from_price: safeFilters.from_price?.toString(),
          to_price: safeFilters.to_price?.toString(),
          acustom_fromyears: safeFilters.acustom_fromyears?.toString(),
          acustom_toyears: safeFilters.acustom_toyears?.toString(),
          from_length: safeFilters.from_length?.toString(),
          to_length: safeFilters.to_length?.toString(),
          make: safeFilters.make,
          model: resolveModelSlug(safeFilters.model),
          state: safeFilters.state,
          region: safeFilters.region,
          suburb: safeFilters.suburb,
          pincode: safeFilters.pincode,
          orderby: safeFilters.orderby,
          search: safeFilters.search,
          keyword: safeFilters.keyword,
          from_sleep: safeFilters.from_sleep?.toString(),
          to_sleep: safeFilters.to_sleep?.toString(),
          radius_kms: radiusParam,
        });

        if (requestId !== latestListingsRequestRef.current) {
          return response;
        }

        // ---- Extract all product groups ----
        const productsList = response?.data?.products ?? [];
        const featuredList = response?.data?.featured_products ?? [];
        const premiumList = response?.data?.premium_products ?? [];
        const exclusiveList = response?.data?.exclusive_products ?? [];
        const emptyExclusiveList = response?.data?.emp_exclusive_products ?? [];
console.log("emptyExclusiveList", emptyExclusiveList)
        // ---- Store NORMAL PRODUCTS (shuffled client-side on every fresh load) ----
        const validProducts = Array.isArray(productsList)
          ? productsList.filter((p) => p != null)
          : [];
        const transformed = validProducts.length > 0 ? transformApiItemsToProducts(validProducts) : [];
        setProducts(transformed.length > 0 ? shuffleArray(transformed) : transformed);

        // ---- Store FEATURED, PREMIUM, EXCLUSIVE ----
        setFeaturedProducts(transformApiItemsToProducts(featuredList ?? []));
        setPremiumProducts(transformApiItemsToProducts(premiumList ?? []));
        setExculisiveProducts(transformApiItemsToProducts(exclusiveList ?? []));

        // ---- Store EMPTY EXCLUSIVE ----
        setEmptyProduct(transformApiItemsToProducts(emptyExclusiveList ?? []));

        // ---- Other metadata ----
        setCategories(response?.data?.all_categories ?? []);
        setMakes(response?.data?.make_options ?? []);
        setStateOptions(response?.data?.states ?? []);
        modelsRef.current = response?.data?.model_options ?? [];
        setModels(response?.data?.model_options ?? []);
        setMetaDescription(response?.seo_v2?.metadescription ?? "");
        setMetaTitle(
          response?.seo_v2?.meta_title ??
          response?.seo_v2?.metatitle ??
          response?.seo_v2?.list_page_metatitle ??
          computeTitleFromFilters(safeFilters)
        );
        if (response?.seo_v2?.h1) setPageTitle(response.seo_v2.h1);
        if (response.pagination) setPagination(response.pagination);

        return response;
      } catch (err) {
        console.error("❌ Listing Fetch Error:", err);
        return undefined;
      }
    },
    // ✅ FIX: Only stable deps. No state variables that flip and cause loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [DEFAULT_RADIUS, initialData, computeTitleFromFilters],
  );

  const handleNextPage = useCallback(() => {
    if (pagination.current_page >= pagination.total_pages) return;
    const nextPage = pagination.current_page + 1;
    const id = uuidv4();
    try { localStorage.setItem(`page_${id}`, String(nextPage)); } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("clickid", id);
    window.location.href = url.toString();
  }, [pagination.current_page, pagination.total_pages]);

  const handlePrevPage = useCallback(() => {
    if (pagination.current_page <= 1) return;
    const prevPage = pagination.current_page - 1;
    const url = new URL(window.location.href);
    if (prevPage <= 1) {
      url.searchParams.delete("clickid");
      window.location.href = url.toString();
    } else {
      const id = uuidv4();
      try { localStorage.setItem(`page_${id}`, String(prevPage)); } catch {}
      url.searchParams.set("clickid", id);
      window.location.href = url.toString();
    }
  }, [pagination.current_page]);

  const restoredOnceRef = useRef(false);

  /* ---- SINGLE source of truth: URL -> fetch ---- */
  const searchKey = searchParams.toString();
  const pathKey = pathname;
  const incomingFiltersRef = useRef<Filters>(incomingFilters);

  useEffect(() => {
    const prev = JSON.stringify(incomingFiltersRef.current);
    const next = JSON.stringify(incomingFilters);
    if (prev !== next) incomingFiltersRef.current = incomingFilters;
  }, [incomingFilters]);

  // Sync state from server when initialData changes (ISR provided new data on filter navigation).
  // This eliminates the duplicate client-side fetch after router.push().
  useEffect(() => {
    if (!initialData || initialData === prevInitialDataRef.current) return;
    if (!hasConsumedInitialDataRef.current) return; // First mount — useState handles it
    prevInitialDataRef.current = initialData;
    shouldSkipFetchRef.current = true;

    const productsList = initialData.data?.products ?? [];
    const validProducts = Array.isArray(productsList) ? productsList.filter((p) => p != null) : [];
    const syncTransformed = validProducts.length > 0 ? transformApiItemsToProducts(validProducts) : [];
    setProducts(syncTransformed.length > 0 ? shuffleArray(syncTransformed) : syncTransformed);
    setFeaturedProducts(transformApiItemsToProducts(initialData.data?.featured_products ?? []));
    setPremiumProducts(transformApiItemsToProducts(initialData.data?.premium_products ?? []));
    setExculisiveProducts(transformApiItemsToProducts(initialData.data?.exclusive_products ?? []));
    setEmptyProduct(transformApiItemsToProducts(initialData.data?.emp_exclusive_products ?? []));
    setCategories(initialData.data?.all_categories ?? []);
    setMakes(initialData.data?.make_options ?? []);
    setStateOptions(initialData.data?.states ?? []);
    modelsRef.current = initialData.data?.model_options ?? [];
    setModels(initialData.data?.model_options ?? []);
    setMetaDescription(initialData.seo_v2?.metadescription ?? "");
    const apiTitle = initialData.seo_v2?.meta_title ?? initialData.seo_v2?.metatitle ?? initialData.seo_v2?.list_page_metatitle ?? "";
    if (apiTitle) {
      setMetaTitle(apiTitle);
    } else {
      const slugParts = window.location.pathname.replace(/^\/listings\//, "").replace(/\/$/, "").split("/").filter(Boolean);
      setMetaTitle(computeTitleFromFilters(parseSlugToFilters(slugParts, {})));
    }
    if (initialData.seo_v2?.h1) setPageTitle(initialData.seo_v2.h1);
    if (initialData.pagination) setPagination(initialData.pagination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, computeTitleFromFilters]);

  const prevFiltersRef = useRef<Filters>({});
  const prevPageRef = useRef(1);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (isClearAllRef.current) {
      isClearAllRef.current = false;
      return;
    }
    if (restoredOnceRef.current) {
      restoredOnceRef.current = false;
      return;
    }
    if (isSliderFetchingRef.current) {
      isSliderFetchingRef.current = false;
      return;
    }
    if (isPopStateRef.current) return;

    const slugParts = pathKey.split("/listings/")[1]?.split("/") || [];
    const parsedFromURL = parseSlugToFilters(slugParts);
    const orderbyFromQuery = searchParams.get("orderby") ?? undefined;
    const radiusFromQuery = searchParams.get("radius_kms") ?? undefined;
    const pageFromURL = validatePage(searchParams.get("page"));

    const merged: Filters = withResolvedModel({
      ...parsedFromURL,
      ...incomingFiltersRef.current,
      ...(orderbyFromQuery ? { orderby: orderbyFromQuery } : {}),
      ...(radiusFromQuery ? { radius_kms: radiusFromQuery } : {}),
    });

    const filtersChanged =
      JSON.stringify(merged) !== JSON.stringify(prevFiltersRef.current);
    const pageChanged = pageFromURL !== prevPageRef.current;

    if (!filtersChanged && !pageChanged) return;

    prevFiltersRef.current = { ...merged };
    prevPageRef.current = pageFromURL;
    filtersRef.current = merged;
    setFilters(merged);
    setPagination((prev) => ({ ...prev, current_page: pageFromURL }));

    // ✅ FIX: Use ref to guard initial mount. Skip fetch when initialData
    // was provided — useState already seeded the products.
    if (!hasConsumedInitialDataRef.current && initialData) {
      hasConsumedInitialDataRef.current = true;
      return;
    }

    // Server already returned fresh data via ISR (initialData sync effect applied it).
    // Skip the duplicate client fetch but still clear any loading states FilterSlider may have set.
    if (shouldSkipFetchRef.current) {
      shouldSkipFetchRef.current = false;
      setIsLoading(false);
      setIsMainLoading(false);
      setIsFeaturedLoading(false);
      setIsPremiumLoading(false);
      return;
    }

    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      setIsLoading(true);
      setIsMainLoading(true);
      setIsFeaturedLoading(true);
      setIsPremiumLoading(true);
      loadListings(pageFromURL, merged, true)
        .then((res) => {
          if (!res?.data?.products?.length) {
            // no products
          }
        })
        .finally(() => {
          setIsLoading(false);
          setIsMainLoading(false);
          setIsFeaturedLoading(false);
          setIsPremiumLoading(false);
        });
    }, 300);
  }, [searchKey, pathKey, loadListings, DEFAULT_RADIUS, searchParams]);

  const mergeFiltersSafely = (prev: Filters, next: Filters): Filters => {
    const merged: Filters = { ...prev };
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        delete merged[key as keyof Filters];
        return;
      }
      merged[key as keyof Filters] = value;
    });
    return merged;
  };

  const handleFilterChange = useCallback(
    async (newFilters: Filters) => {
      flushSync(() => {
        setIsLoading(true);
        setIsMainLoading(true);
        setIsFeaturedLoading(true);
        setIsPremiumLoading(true);
      });

      const mergedFilters = mergeFiltersSafely(filtersRef.current, newFilters);
      if ("orderby" in newFilters && !newFilters.orderby) {
        mergedFilters.orderby = undefined;
      }

      filtersRef.current = mergedFilters;
      setFilters(mergedFilters);
      setPagination({
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        per_page: 12,
        total_products: 0,
      });

      try {
        isSliderFetchingRef.current = true; // prevent URL-change effect from firing a duplicate fetch
        updateURLWithFilters(mergedFilters, 1);
        await loadListings(1, mergedFilters, true);
      } catch (error) {
        console.error("Error applying filters:", error);
      } finally {
        setIsLoading(false);
        setIsMainLoading(false);
        setIsFeaturedLoading(false);
        setIsPremiumLoading(false);
      }
    },
    [updateURLWithFilters, loadListings],
  );

  const isPopStateRef = useRef(false);
  const filterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      isPopStateRef.current = true;
      const path = window.location.pathname;
      const slugParts = path.split("/listings/")[1]?.split("/") || [];
      const parsed = parseSlugToFilters(slugParts);
      const sp = new URLSearchParams(window.location.search);
      const orderby = sp.get("orderby") ?? undefined;
      const urlClickid = sp.get("clickid") || null;

      const merged: Filters = withResolvedModel({
        ...parsed,
        ...(orderby ? { orderby } : {}),
      });

      filtersRef.current = merged;
      setFilters(merged);
      setclickid(urlClickid);

      const savedPage = urlClickid ? readPage(urlClickid) : null;
      const pageToLoad = savedPage && savedPage > 0 ? savedPage : 1;

      prevFiltersRef.current = { ...merged };
      prevPageRef.current = pageToLoad;
      restoredOnceRef.current = true;

      setIsMainLoading(true);
      setIsFeaturedLoading(true);
      setIsPremiumLoading(true);

      setPagination((p) => ({ ...p, current_page: pageToLoad }));
      loadListings(pageToLoad, merged, true).finally(() => {
        setIsMainLoading(false);
        setIsFeaturedLoading(false);
        setIsPremiumLoading(false);
        isPopStateRef.current = false;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [loadListings]);

  useEffect(() => {
    if (!searchParams.has("clickid")) {
      window.history.replaceState({ page: 1 }, "", window.location.href);
    }
  }, []);

  useEffect(() => {
    if (!clickid) return;
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }
    const savedPage = readPage(clickid);
    if (savedPage && savedPage > 0) {
      restoredOnceRef.current = true;
      setPagination((p) => ({ ...p, current_page: savedPage }));
      setUrlParams({ clickid });
      loadListings(savedPage, filtersRef.current, true);
    } else {
      setUrlParams({ clickid });
    }
  }, [clickid]);

  const FILTER_KEYS_TO_CHECK: (keyof Filters)[] = [
    "category",
    "make",
    "model",
    "condition",
    "state",
    "region",
    "suburb",
    "pincode",
    "from_price",
    "to_price",
    "minKg",
    "maxKg",
    "from_sleep",
    "to_sleep",
    "from_length",
    "to_length",
    "search",
    "keyword",
    "orderby",
    "acustom_fromyears",
    "acustom_toyears",
  ];

  const hasActiveFilters = FILTER_KEYS_TO_CHECK.some((key) => {
    const value = filters[key];
    return value !== undefined && value !== "" && value !== null;
  });

  const isClearAllRef = useRef(false);

  const resetAllFilters = async () => {
    if (!hasActiveFilters) return;

    isClearAllRef.current = true;
    // Keep stale products visible (dimmed via listings-loading) until new results arrive
    setIsLoading(true);
    setIsMainLoading(true);
    setIsFeaturedLoading(true);
    setIsPremiumLoading(true);

    const clearedFilters: Filters = {};
    flushSync(() => {
      setFilters(clearedFilters);
      filtersRef.current = clearedFilters;
    });

    try {
      router.replace("/listings", { scroll: false });
    } catch (err) {
      console.error("Clear all failed:", err);
    }
  };

  const mobileFiltersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("bootstrap/js/dist/offcanvas").catch(() => {});
  }, []);

  // useEffect(() => {
  //   const controller = new AbortController();
  //   setSliderCatLoading(true);
  //   const params = new URLSearchParams();
  //   const f = filtersRef.current;
  //   if (f.make) params.set("make", f.make);
  //   if (f.model) params.set("model", resolveModelSlug(f.model) ?? f.model);
  //   if (f.condition) params.set("condition", f.condition);
  //   if (f.state) params.set("state", f.state.toLowerCase());
  //   if (f.region) params.set("region", f.region);
  //   if (f.suburb) params.set("suburb", f.suburb);
  //   if (f.pincode) params.set("pincode", f.pincode);
  //   if (f.from_price) params.set("from_price", String(f.from_price));
  //   if (f.to_price) params.set("to_price", String(f.to_price));
  //   if (f.minKg) params.set("from_atm", String(f.minKg));
  //   if (f.maxKg) params.set("to_atm", String(f.maxKg));
  //   if (f.acustom_fromyears) params.set("acustom_fromyears", String(f.acustom_fromyears));
  //   if (f.acustom_toyears) params.set("acustom_toyears", String(f.acustom_toyears));
  //   if (f.from_length) params.set("from_length", String(f.from_length));
  //   if (f.to_length) params.set("to_length", String(f.to_length));
  //   if (f.from_sleep) params.set("from_sleep", String(f.from_sleep));
  //   if (f.to_sleep) params.set("to_sleep", String(f.to_sleep));
  //   if (f.search) params.set("search", f.search);
  //   if (f.keyword) params.set("keyword", f.keyword);
  //   params.set("group_by", "category");
  //   fetch(`/api/params-count?${params.toString()}`, { signal: controller.signal })
  //     .then((r) => r.json())
  //     .then((json) => {
  //       if (!controller.signal.aborted) { setSliderCategoryCounts(json.data || []); setSliderCatLoading(false); }
  //     })
  //     .catch((e) => { if (e.name !== "AbortError") setSliderCatLoading(false); });
  //   return () => controller.abort();
  // }, [
  //   filters.make, filters.model, filters.condition, filters.state, filters.region, filters.suburb,
  //   filters.from_price, filters.to_price, filters.minKg, filters.maxKg, filters.acustom_fromyears,
  //   filters.acustom_toyears, filters.from_length, filters.to_length, filters.from_sleep,
  //   filters.to_sleep, filters.search, filters.keyword,
  // ]);

  // useEffect(() => {
  //   const controller = new AbortController();
  //   const params = new URLSearchParams();
  //   if (filters.make) params.set("make", filters.make);
  //   if (filters.model) params.set("model", resolveModelSlug(filters.model) ?? filters.model);
  //   if (filters.condition) params.set("condition", filters.condition);
  //   if (filters.state) params.set("state", filters.state.toLowerCase());
  //   if (filters.region) params.set("region", filters.region);
  //   if (filters.suburb) params.set("suburb", filters.suburb);
  //   if (filters.pincode) params.set("pincode", String(filters.pincode));
  //   if (filters.from_price) params.set("from_price", String(filters.from_price));
  //   if (filters.to_price) params.set("to_price", String(filters.to_price));
  //   if (filters.minKg) params.set("from_atm", String(filters.minKg));
  //   if (filters.maxKg) params.set("to_atm", String(filters.maxKg));
  //   if (filters.acustom_fromyears) params.set("acustom_fromyears", String(filters.acustom_fromyears));
  //   if (filters.acustom_toyears) params.set("acustom_toyears", String(filters.acustom_toyears));
  //   if (filters.from_length) params.set("from_length", String(filters.from_length));
  //   if (filters.to_length) params.set("to_length", String(filters.to_length));
  //   if (filters.from_sleep) params.set("from_sleep", String(filters.from_sleep));
  //   if (filters.to_sleep) params.set("to_sleep", String(filters.to_sleep));
  //   if (filters.search) params.set("search", filters.search);
  //   if (filters.keyword) params.set("keyword", filters.keyword);
  //   params.set("group_by", "make");
  //   fetch(`/api/params-count?${params.toString()}`, { signal: controller.signal })
  //     .then((r) => r.json())
  //     .then((json) => { if (!controller.signal.aborted) setSliderMakeCounts(json.data || []); })
  //     .catch(() => {});
  //   return () => controller.abort();
  // }, [
  //   filters.make, filters.model, filters.condition, filters.state, filters.region, filters.suburb,
  //   filters.from_price, filters.to_price, filters.minKg, filters.maxKg, filters.acustom_fromyears,
  //   filters.acustom_toyears, filters.from_length, filters.to_length, filters.from_sleep,
  //   filters.to_sleep, filters.search, filters.keyword,
  // ]);

  const [modalFocusSection, setModalFocusSection] = useState<
    string | undefined
  >();

  const handleOpenModal = (section?: string) => {
    setModalFocusSection(section);
    setOpenModal(true);
  };

  const handleSliderFilterSelect = async (newFilters: Partial<Filters>) => {
    const next: Filters = { ...filtersRef.current };
    (Object.keys(newFilters) as (keyof Filters)[]).forEach((key) => {
      const val = newFilters[key];
      if (val === null || val === undefined || val === "") {
        delete next[key];
      } else {
        (next as any)[key] = val;
      }
    });

    if ("state" in newFilters) {
      if (!("region" in newFilters)) {
        delete next.region;
      }
      if (!("suburb" in newFilters)) {
        delete next.suburb;
        delete next.pincode;
      }
    }

    if (next.state) {
      next.state = next.state
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    if (next.region) {
      next.region = next.region
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    if ("region" in newFilters && !("suburb" in newFilters)) {
      delete next.suburb;
      delete next.pincode;
    }

    if ("make" in newFilters) {
      if (!("model" in newFilters)) {
        delete next.model;
      }
    }

    filtersRef.current = next;
    setFilters({ ...next });

    flushSync(() => {
      setIsMainLoading(true);
      setIsFeaturedLoading(true);
      setIsPremiumLoading(true);
    });
    setPagination({
      current_page: 1,
      total_pages: 1,
      total_items: 0,
      per_page: 12,
      total_products: 0,
    });

    isSliderFetchingRef.current = true;
    updateURLWithFilters(next, 1);

    try {
      const radiusNum =
        typeof next.radius_kms === "number"
          ? next.radius_kms
          : typeof next.radius_kms === "string"
            ? parseInt(next.radius_kms, 10)
            : undefined;
      const radiusParam =
        typeof radiusNum === "number" && !isNaN(radiusNum) && (next.suburb || radiusNum !== DEFAULT_RADIUS)
          ? String(radiusNum)
          : undefined;

      const response: ApiResponse = await fetchListings({
        ...next,
        page: 1,
        category: next.category,
        make: next.make,
        model: resolveModelSlug(next.model),
        condition: next.condition,
        region: next.region,
        state: next.state,
        suburb: next.suburb,
        minKg: next.minKg?.toString(),
        maxKg: next.maxKg?.toString(),
        from_price: next.from_price?.toString(),
        to_price: next.to_price?.toString(),
        acustom_fromyears: next.acustom_fromyears?.toString(),
        acustom_toyears: next.acustom_toyears?.toString(),
        from_length: next.from_length?.toString(),
        to_length: next.to_length?.toString(),
        from_sleep: next.from_sleep?.toString(),
        to_sleep: next.to_sleep?.toString(),
        radius_kms: radiusParam,
      });

      const validProducts = (response?.data?.products ?? []).filter(
        (p: any) => p != null,
      );
      setProducts(
        validProducts.length > 0
          ? transformApiItemsToProducts(validProducts)
          : [],
      );
      setFeaturedProducts(
        transformApiItemsToProducts(response?.data?.featured_products ?? []),
      );
      setPremiumProducts(
        transformApiItemsToProducts(response?.data?.premium_products ?? []),
      );
      setExculisiveProducts(
        transformApiItemsToProducts(response?.data?.exclusive_products ?? []),
      );
      setEmptyProduct(
        transformApiItemsToProducts(
          response?.data?.emp_exclusive_products ?? [],
        ),
      );

      if (response?.pagination) setPagination(response.pagination);
      const sliderTitle = response?.seo_v2?.meta_title ?? response?.seo_v2?.metatitle ?? "";
      if (sliderTitle) setMetaTitle(sliderTitle);
      if (response?.seo_v2?.metadescription)
        setMetaDescription(response.seo_v2.metadescription);
      if (response?.seo_v2?.h1) setPageTitle(response.seo_v2?.h1);
    } catch (err) {
      console.error("❌ slider filter fetch error:", err);
    } finally {
      setIsMainLoading(false);
      setIsFeaturedLoading(false);
      setIsPremiumLoading(false);
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.state) count++;
    if (filters.make) count++;
    if (filters.minKg || filters.maxKg) count++;
    if (filters.from_price || filters.to_price) count++;
    if (filters.condition) count++;
    if (filters.acustom_fromyears) count++;
    if (filters.from_sleep || filters.to_sleep) count++;
    if (filters.from_length || filters.to_length) count++;
    if (filters.search || filters.keyword) count++;
    return count;
  }, [
    filters.category,
    filters.state,
    filters.make,
    filters.minKg,
    filters.maxKg,
    filters.from_price,
    filters.to_price,
    filters.condition,
    filters.acustom_fromyears,
    filters.from_sleep,
    filters.to_sleep,
    filters.from_length,
    filters.to_length,
    filters.search,
    filters.keyword,
  ]);

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const { matchedBanners, isMobile } = useBanners();
  // const { bannerRefs, trackClick } = useBannerTracking(matchedBanners);

  const [currentTopBanner, setCurrentTopBanner] = useState<
    (typeof matchedBanners)[0] | null
  >(null);
  
  const topBannerInitRef = useRef(false);

  // ✅ FIX: Single useEffect for top banners. Removed the duplicate that
  // used inline topBanners (.filter() = new ref every render) as a dep.
  useEffect(() => {
    const top = matchedBanners.filter(
      (b) => b.position === "top" && b.placement === "listings",
    );

    if (top.length === 0) return;

    if (!topBannerInitRef.current && top.length > 0) {
    topBannerInitRef.current = true;
    setCurrentTopBanner(shuffleArray(top)[0]); // ✅ already in useEffect, ok
  }
}, [matchedBanners]);

  
  return (
    <>
 

      <div suppressHydrationWarning>
        <div>
          <StaticLinks filters={incomingFilters} />
        </div>
      </div>

      <div className="container">
        <div className="display_ad"></div>
      </div>

      <div className="search-bar">
        <div className="container">
          <div className="row align-items-end">
            <div className="col-lg-12">
              <div className="filter_left">
                <div className="filter_btn_top">
                  <button
                    className="filter-btn"
                    onClick={() => setOpenModal(true)}
                  >
                    {activeFilterCount > 0 ? (
                      <span className="filter-count">{activeFilterCount}</span>
                    ) : (
                      <span>
                        <i className="bi bi-filter"></i>
                      </span>
                    )}{" "}
                    Filters
                  </button>
                </div>
                <div className="filter-slider-wrap">
                  <FilterSlider
                    productListData={productListData}
                    setIsLoading={setIsLoading}
                    setIsMainLoading={setIsMainLoading}
                    setIsFeaturedLoading={setIsFeaturedLoading}
                    setIsPremiumLoading={setIsPremiumLoading}
                    currentFilters={filters}
                    categoryCounts={sliderCategoryCounts}
                    isCategoryCountLoading={sliderCatLoading}
                    initialMakeOptions={initialMakeCounts ?? makes}
                    stateOptions={stateOptions}
                    onOpenModal={handleOpenModal}
                    onCategorySelect={(slug) =>
                      handleSliderFilterSelect({
                        category: slug ?? undefined,
                      })
                    }
                    onLocationSelect={(state, region) => {
                      if (state === null && region === null) {
                        handleSliderFilterSelect({
                          state: undefined,
                          region: undefined,
                        });
                        return;
                      }
                      const cap = (s: string | null) =>
                        s
                          ? s
                              .toLowerCase()
                              .replace(/\b\w/g, (c) => c.toUpperCase())
                          : undefined;
                      handleSliderFilterSelect({
                        state: cap(state),
                        region: cap(region),
                      });
                    }}
                    onPriceSelect={(from, to) => {
                      const next: Partial<Filters> = {};
                      if (from !== null && from !== undefined) {
                        next.from_price = from;
                      } else {
                        next.from_price = undefined;
                      }
                      if (to !== null && to !== undefined) {
                        next.to_price = to;
                      } else {
                        next.to_price = undefined;
                      }
                      handleSliderFilterSelect(next);
                    }}
                    onMakeSelect={(make, model) => {
                      const next: Partial<Filters> = {};
                      if (make !== null && make !== undefined) {
                        next.make = make;
                      } else {
                        next.make = undefined;
                      }
                      if (model !== null && model !== undefined) {
                        next.model = model;
                      }
                      if (filtersRef.current.category) {
                        next.category = filtersRef.current.category;
                      }
                      handleSliderFilterSelect(next);
                    }}
                    onAtmSelect={(min, max) => {
                      const next: Partial<Filters> = {};
                      if (min !== null && min !== undefined) {
                        next.minKg = min;
                      } else {
                        next.minKg = undefined;
                      }
                      if (max !== null && max !== undefined) {
                        next.maxKg = max;
                      } else {
                        next.maxKg = undefined;
                      }
                      handleSliderFilterSelect(next);
                    }}
                    onFilterChange={(f) => handleSliderFilterSelect(f)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {openModal && (
        <FilterModal
          productListData={productListData}
          onClose={() => setOpenModal(false)}
          onClearAll={resetAllFilters}
          categories={categories}
          makes={makes}
          models={models}
          states={stateOptions}
          onFilterChange={(partial) => {
            handleFilterChange(partial);
          }}
          currentFilters={filters}
          setIsFeaturedLoading={setIsFeaturedLoading}
          setIsPremiumLoading={setIsPremiumLoading}
          setIsMainLoading={setIsMainLoading}
          focusSection={modalFocusSection}
          initialCategoryCounts={sliderCategoryCounts}
        />
      )}

      <section className="services product_listing new_listing bg-gray-100 section-padding pb-3 style-1">
        <div className="container">
          <div className="content mb-4">
            <div className="row">
              {products.length > 0 ||
              fetauredProducts.length > 0 ||
              preminumProducts.length > 0 ? (
                <Listing
                  pageTitle={pageTitle}
                  products={products}
                  data={products}
                  pagination={pagination}
                  onNext={handleNextPage}
                  onPrev={handlePrevPage}
                  onFilterChange={handleFilterChange}
                  currentFilters={filters}
                  preminumProducts={preminumProducts}
                  fetauredProducts={fetauredProducts}
                  exculisiveProducts={exculisiveProducts}
                  isMainLoading={isMainLoading}
                  isFeaturedLoading={isFeaturedLoading}
                  isPremiumLoading={isPremiumLoading}
                  initialDistances={initialDistances}
                />
              ) : isLoading ||
                isMainLoading ||
                isFeaturedLoading ||
                isPremiumLoading ? (
                <>
                  <div className="col-lg-9">
                    <div className="top-filter mb-10">
                      <div className="row align-items-center">
                        <div className="col-md-8 col-12 mb-2 mb-md-0">
                          <div className="skeleton skel-page-title" />
                        </div>
                        <div className="col-md-4 col-12">
                          <div className="skeleton skel-sort-select" />
                        </div>
                      </div>
                    </div>
                    <ListingSkeleton count={8} />
                  </div>
                  <div className="col-lg-3 d-none d-lg-block">
                    <SidebarListingSkeleton />
                  </div>
                </>
              ) : emptyProduct.length > 0 ? (
                <ExculsiveContent
                  data={emptyProduct}
                  pageTitle={pageTitle}
                  isPremiumLoading={isPremiumLoading}
                  currentFilters={filters}
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Offcanvas */}
      <div
        ref={mobileFiltersRef}
        id="mobileFilters"
        className="offcanvas mobile-filter-xs offcanvas-end d-lg-none"
        tabIndex={-1}
        aria-labelledby="mobileFiltersLabel"
        data-bs-scroll="true"
        data-bs-backdrop="true"
        style={{ maxHeight: "100dvh" }}
      >
        <div className="offcanvas-header mobile_filter_xs sticky-top bg-white">
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body pt-2">
          <Suspense>
            {openModal && (
              <FilterModal
                onClose={() => setOpenModal(false)}
                onClearAll={resetAllFilters}
                categories={categories}
                makes={makes}
                models={models}
                states={stateOptions}
                onFilterChange={(partial) => {
                  handleFilterChange(partial);
                }}
                currentFilters={filters}
                setIsFeaturedLoading={setIsFeaturedLoading}
                setIsPremiumLoading={setIsPremiumLoading}
                setIsMainLoading={setIsMainLoading}
                initialCategoryCounts={sliderCategoryCounts}
              />
            )}
          </Suspense>
        </div>
      </div>

     {/* <ListingBottomSections
        filters={filters}
        initialData={initialBottomLinksData}
        categoryName={categories.find((c) => c.slug === filters.category)?.name ?? ""}
        categoryCounts={sliderCategoryCounts}
        makeCounts={sliderMakeCounts}
      /> */}
    </>
  );
  
}
