"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { fetchListings, ApiResponse, Item } from "../../../api/listings/api";
import Listing from "./LisitingContent";
import ExculsiveContent from "./exculsiveContent";
import CaravanFilter from "../CaravanFilter";
import SkeletonListing from "../skelton";
import { flushSync } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import "./newList.css";

import {
  redirect,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { buildSlugFromFilters } from "../slugBuilter";
import { parseSlugToFilters } from "../../components/urlBuilder";
import Head from "next/head";
import "./loader.css";
// import Link from "next/link";

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
  categories?: string[];
  people?: string;
  make?: string;
  slug?: string;
  description?: string;
  sku?: string;
  gallery?: string[];
  // Include additional properties that might come from API
  title?: string;
  weight?: string;
  price?: string;
  thumbnail?: string;
  url?: string;
  sleeps?: string;
  manufacturer?: string;
  is_exclusive?: boolean;
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
}

interface Props extends Filters {
  page?: string | number;
  initialData?: ApiResponse;
}

/** ------------ Helper Functions ------------ */

// Add this helper function to transform API items to Products
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
    categories: item.categories,
    people: item.people || "",
    make: item.make || "",
    slug: item.slug,
    description: item.description,
    sku: item.sku,
    gallery: item.gallery || [],
    is_exclusive: item.is_exclusive,

    // keep extra props
  }));
}

/** ------------ Component ------------ */

export default function ListingsPage({
  initialData,
  ...incomingFilters
}: Props) {
  const DEFAULT_RADIUS = 50 as const;

  const [filters, setFilters] = useState<Filters>({});
  const filtersRef = useRef<Filters>({});
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isMainLoading, setIsMainLoading] = useState(false);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(false);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);
  const [isUsingInitialData, setIsUsingInitialData] = useState(!!initialData);
  const [scrollStarted, setScrollStarted] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [nextPageData, setNextPageData] = useState<ApiResponse | null>(null);

  const [clickid, setclickid] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  console.log(isRestored);
  // 1️⃣  persistence helpers  (top of file near imports)
  const PAGE_KEY = (id: string) => `page_${id}`;
  const savePage = (id: string, page: number) => {
    try {
      localStorage.setItem(PAGE_KEY(id), String(page));
    } catch {}
  };
  const readPage = (id: string): number | null => {
    try {
      const v = localStorage.getItem(PAGE_KEY(id));
      return v ? parseInt(v, 10) : null;
    } catch {
      return null;
    }
  };

  const rawPage = searchParams.get("page");

  // ✅ If page is missing → default to 1
  const page = rawPage ? parseInt(rawPage, 10) : 1;

  // ✅ Only validate `page`
  if (rawPage !== null) {
    // page must be all digits
    if (!/^\d+$/.test(rawPage)) {
      redirect("/404");
    }

    // must be >= 1
    if (!Number.isInteger(page) || page < 1) {
      redirect("/404");
    }
  }

  // ✅ Validate malformed URLs (client-side guard)
  useEffect(() => {
    const rawQuery = window.location.search;
    if (
      /[&#*+]+$/.test(rawQuery) || // Ends with & or special chars
      /page=$/.test(rawQuery) || // Empty ?page=
      /page=[A-Za-z]+/.test(rawQuery) || // Letters in page value
      /page=\d+[A-Za-z]+/.test(rawQuery) // Numbers followed by letters (2a, 5b)
    ) {
      window.location.href = "/not-found";
    }
  }, []);

  // Initialize state with initialData if provided
  const [products, setProducts] = useState<Product[]>(
    initialData?.data?.products
      ? transformApiItemsToProducts(initialData.data.products)
      : []
  );
  const [exculisiveProducts, setExculisiveProducts] = useState<Product[]>(
    initialData?.data?.exclusive_products
      ? transformApiItemsToProducts(initialData.data.exclusive_products)
      : []
  );
  const [fetauredProducts, setFeaturedProducts] = useState<Product[]>(
    initialData?.data?.featured_products
      ? transformApiItemsToProducts(initialData.data.featured_products)
      : []
  );
  const [preminumProducts, setPremiumProducts] = useState<Product[]>(
    initialData?.data?.premium_products
      ? transformApiItemsToProducts(initialData.data.premium_products)
      : []
  );
  const [emptyProduct, setEmptyProduct] = useState<Product[]>(
    initialData?.data?.emp_exclusive_products
      ? transformApiItemsToProducts(initialData.data.emp_exclusive_products)
      : []
  );

  const [categories, setCategories] = useState<Category[]>(
    initialData?.data?.all_categories || []
  );
  const [makes, setMakes] = useState<MakeOption[]>(
    initialData?.data?.make_options || []
  );
  const [stateOptions, setStateOptions] = useState<StateOption[]>(
    initialData?.data?.states || []
  );
  const [models, setModels] = useState<MakeOption[]>(
    initialData?.data?.model_options || []
  );
  const [pageTitle, setPageTitle] = useState(initialData?.title || " ");
  const [metaTitle, setMetaTitle] = useState(initialData?.seo?.metatitle || "");
  const [metaDescription, setMetaDescription] = useState(
    initialData?.seo?.metadescription || ""
  );
  const [pagination, setPagination] = useState<Pagination>(() => {
    // Use initial data if available, otherwise fall back to default
    if (initialData?.pagination) {
      return {
        current_page: initialData.pagination.current_page || 1,
        total_pages: initialData.pagination.total_pages || 1,
        per_page: initialData.pagination.per_page || 12,
        total_products: initialData.pagination.total_products || 0,
        total_items: initialData.pagination.total_products || 0,
      };
    }

    const fromURL =
      typeof window !== "undefined"
        ? parseInt(
            new URLSearchParams(window.location.search).get("page") || "1",
            10
          )
        : 1;
    return {
      current_page: fromURL,
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

  // Parse slug ONCE on mount; do not fetch here
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const path = pathname;
    const slugParts = path.split("/listings/")[1]?.split("/") || [];
    const parsed = parseSlugToFilters(slugParts);

    const merged = { ...parsed, ...incomingFilters };
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
      return 1; // no ?page → default to 1
    }

    if (raw.trim() === "") {
      redirect("/404"); // 🚫 block empty ?page=
    }

    if (!/^\d+$/.test(raw)) {
      redirect("/404"); // 🚫 block non-numeric
    }

    const page = parseInt(raw, 10);

    if (!Number.isInteger(page) || page < 1) {
      redirect("/404"); // 🚫 block invalid numbers
    }

    return page;
  };

  const updateURLWithFilters = useCallback(
    (nextFilters: Filters, pageNum: number) => {
      console.log(pageNum);
      const slug = buildSlugFromFilters(nextFilters);
      const query = new URLSearchParams();

      if (nextFilters.orderby) query.set("orderby", nextFilters.orderby);

      const r = Number(nextFilters.radius_kms);
      if (!Number.isNaN(r) && r !== DEFAULT_RADIUS) {
        query.set("radius_kms", String(r));
      }
      if (clickid) query.set("clickid", clickid); // only clickid

      const safeSlug = slug.endsWith("/") ? slug : `${slug}/`; // 👈 important
      const finalURL = query.toString() ? `${safeSlug}?${query}` : safeSlug;
      console.log("final", finalURL);
      router.push(finalURL, { scroll: false }); // ✅ Prevent auto-scroll
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 150);
    },
    [router, DEFAULT_RADIUS]
  );

  // put near your other helpers
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

  // tiny util
  const ensureclickid = (): string => {
    const newId = uuidv4();
    setclickid(newId);

    // URL-லும் உடனே update பண்ணு
    const url = new URL(window.location.href);
    url.searchParams.set("clickid", newId);
    window.history.replaceState({}, "", url.toString());

    return newId;
  };

  useEffect(() => {
    if (initialData?.data?.products) {
      const transformed = transformApiItemsToProducts(
        initialData.data.products
      );
      setProducts(transformed);
      setCategories(initialData.data.all_categories || []);
      setMakes(initialData.data.make_options || []);
      setStateOptions(initialData.data.states || []);
      setModels(initialData.data.model_options || []);
      setPageTitle(initialData.title || "");
      setMetaTitle(initialData.seo?.metatitle || "");
      setMetaDescription(initialData.seo?.metadescription || "");
      if (initialData.pagination) setPagination(initialData.pagination);
    }
  }, [initialData]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !scrollStarted && !isNextLoading) {
          setScrollStarted(true);
          try {
            const response = await preFetchListings(
              pagination.current_page + 1,
              filtersRef.current
            );

            if (response?.success) {
              console.log(
                "Prefetch success for page:",
                pagination.current_page + 1
              );
              console.log("responsepre", response);
              setNextPageData(response);
              setIsNextLoading(true);
            } else {
              setNextPageData(null);
            }
          } catch (err) {
            console.error("Prefetch failed:", err);
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [pagination.current_page, scrollStarted, isNextLoading]);

  const preFetchListings = async (
    pageNum: number,
    appliedFilters: Filters = filtersRef.current
  ): Promise<ApiResponse | undefined> => {
    try {
      console.log("pageNumpageNum", pageNum);
      const safeFilters = normalizeSearchFromMake(appliedFilters);
      const radiusNum = asNumber(safeFilters.radius_kms);
      const radiusParam =
        typeof radiusNum === "number" && radiusNum !== DEFAULT_RADIUS
          ? String(radiusNum)
          : undefined;

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
        model: safeFilters.model,
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

      return response;
    } catch (err) {
      console.error("Failed to prefetch Next data", err);
    }
  };

  const loadListings = useCallback(
    async (
      pageNum = 1,
      appliedFilters: Filters = filtersRef.current,
      skipInitialCheck = false
    ): Promise<ApiResponse | undefined> => {
      if (initialData && !skipInitialCheck && isUsingInitialData) {
        setIsUsingInitialData(false);
        return initialData;
      }

      try {
        window.scrollTo({ top: 0, behavior: "smooth" });

        const safeFilters = normalizeSearchFromMake(appliedFilters);
        const radiusNum = asNumber(safeFilters.radius_kms);
        const radiusParam =
          typeof radiusNum === "number" && radiusNum !== DEFAULT_RADIUS
            ? String(radiusNum)
            : undefined;

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
          model: safeFilters.model,
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

        // ---- Extract all product groups ----
        const productsList = response?.data?.products ?? [];
        const featuredList = response?.data?.featured_products ?? [];
        const premiumList = response?.data?.premium_products ?? [];
        const exclusiveList = response?.data?.exclusive_products ?? [];
        const emptyExclusiveList = response?.data?.emp_exclusive_products ?? [];

        // ---- Store NORMAL PRODUCTS ----
        const validProducts = Array.isArray(productsList)
          ? productsList.filter((p) => p != null)
          : [];

        setProducts(
          validProducts.length > 0
            ? transformApiItemsToProducts(validProducts)
            : []
        );

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
        setModels(response?.data?.model_options ?? []);
        setMetaDescription(response?.seo?.metadescription ?? "");
        setMetaTitle(response?.seo?.metatitle ?? "");
        if (response.pagination) setPagination(response.pagination);

        return response;
      } catch (err) {
        console.error("❌ Listing Fetch Error:", err);
        return undefined;
      }
    },
    [DEFAULT_RADIUS, router, initialData, isUsingInitialData]
  );

  const scrollToTop = () => {
    setTimeout(() => {
      document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
      document.body.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  };
  const handleNextPage = useCallback(async () => {
    if (pagination.current_page < pagination.total_pages) {
      scrollToTop();
      setIsMainLoading(true);
      setIsFeaturedLoading(true);
      setIsPremiumLoading(true);

      const nextPage = pagination.current_page + 1;
      const id = ensureclickid();
      savePage(id, nextPage); // NEW: create clickid if first time
      // sessionStorage.setItem(`page_${id}`, String(nextPage)); // save page for this session
      try {
        if (nextPageData != null) {
          const products = nextPageData?.data?.products ?? [];
          const validProducts = Array.isArray(products)
            ? products.filter((item) => item != null)
            : [];

          if (validProducts.length > 0) {
            const transformedProducts =
              transformApiItemsToProducts(validProducts);
            setProducts(transformedProducts);
            setPremiumProducts(nextPageData?.data?.premium_products ?? []);
            setFeaturedProducts(nextPageData?.data?.featured_products ?? []);
            setExculisiveProducts(nextPageData?.data?.exclusive_products ?? []);
            if (nextPageData.pagination) setPagination(nextPageData.pagination);
          }
        } else {
          await loadListings(nextPage, filtersRef.current, true);
        }
      } catch (error) {
        console.error("Error loading next page:", error);
      } finally {
        setIsMainLoading(false);
        setIsFeaturedLoading(false);
        setIsPremiumLoading(false);

        setScrollStarted(false);
        setNextPageData(null);
        setIsNextLoading(false);
      }
    }
  }, [pagination, loadListings, clickid, ensureclickid, nextPageData]);

  // ✅ FIXED: Proper handlePrevPage function
  const handlePrevPage = useCallback(async () => {
    if (pagination.current_page > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });

      setIsMainLoading(true);
      setIsFeaturedLoading(true);
      setIsPremiumLoading(true);

      const prevPage = pagination.current_page - 1;
      const id = ensureclickid(); // NEW
      savePage(id, prevPage);
      sessionStorage.setItem(`page_${id}`, String(prevPage));
      try {
        await loadListings(prevPage, filtersRef.current, true);
      } catch (error) {
        console.error("Error loading previous page:", error);
      } finally {
        setIsMainLoading(false);
        setIsFeaturedLoading(false);
        setIsPremiumLoading(false);

        setScrollStarted(false);
        setNextPageData(null);
        setIsNextLoading(false);
      }
    }
  }, [pagination, loadListings, clickid, ensureclickid]);

  // add near other refs
  const restoredOnceRef = useRef(false);
  // 3️⃣  restore effect

  // restore effect
  useEffect(() => {
    if (!clickid) return;
    const savedPage = readPage(clickid);
    if (savedPage && savedPage > 0) {
      restoredOnceRef.current = true;
      setPagination((p) => ({ ...p, current_page: savedPage }));
      setUrlParams({ clickid });
      loadListings(savedPage, filtersRef.current, true).finally(() => {
        setIsRestored(true); // ✅ mark restore complete
      });
    } else {
      setUrlParams({ clickid });
      setIsRestored(true); // ✅ no saved page, ready anyway
    }
  }, [clickid]);

  console.log("paginationapi", pagination);
  /* ---- SINGLE source of truth: URL -> fetch ---- */
  const searchKey = searchParams.toString();
  const pathKey = pathname;

  const incomingFiltersRef = useRef<Filters>(incomingFilters);
  useEffect(() => {
    const prev = JSON.stringify(incomingFiltersRef.current);
    const next = JSON.stringify(incomingFilters);
    if (prev !== next) incomingFiltersRef.current = incomingFilters;
  }, [incomingFilters]);

  // Add these refs to track previous values
  const prevFiltersRef = useRef<Filters>({});
  const prevPageRef = useRef(1);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (restoredOnceRef.current) {
      restoredOnceRef.current = false; // reset for future real changes
      return;
    }

    const slugParts = pathKey.split("/listings/")[1]?.split("/") || [];
    const parsedFromURL = parseSlugToFilters(slugParts);

    const pageFromURL = validatePage(searchParams.get("page"));

    const merged: Filters = {
      ...parsedFromURL,
      ...incomingFiltersRef.current,
    };

    const filtersChanged =
      JSON.stringify(merged) !== JSON.stringify(prevFiltersRef.current);
    const pageChanged = pageFromURL !== prevPageRef.current;

    if (!filtersChanged && !pageChanged) return;

    prevFiltersRef.current = { ...merged };
    prevPageRef.current = pageFromURL;

    filtersRef.current = merged;
    setFilters(merged);
    setPagination((prev) => ({ ...prev, current_page: pageFromURL }));

    // ✅ Prevent re-fetch on initial load (SSR already has data)
    if (isUsingInitialData && initialData) {
      setIsUsingInitialData(false);
      return;
    }

    // ✅ If client-side navigation happens and no data → 404
    loadListings(pageFromURL, merged, true).then((res) => {
      if (!res?.data?.products?.length) {
      }
    });
  }, [searchKey, pathKey, loadListings, DEFAULT_RADIUS, searchParams]);

  const handleFilterChange = useCallback(
    async (newFilters: Filters) => {
      // ✅ Show skeleton for ALL sections immediately
      flushSync(() => {
        setIsLoading(true);
        setIsMainLoading(true);
        setIsFeaturedLoading(true);
        setIsPremiumLoading(true);
      });

      const mergedFilters = { ...filtersRef.current, ...newFilters };

      // cleanup empty values
      if ("orderby" in newFilters && !newFilters.orderby) {
        mergedFilters.orderby = undefined;
      }
      ensureclickid();
      filtersRef.current = mergedFilters;
      setFilters(mergedFilters);

      // reset pagination when filters change
      setPagination({
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        per_page: 12,
        total_products: 0,
      });

      try {
        // ✅ update URL
        updateURLWithFilters(mergedFilters, 1);

        // ✅ fetch data immediately
        await loadListings(1, mergedFilters, true);
      } catch (error) {
        console.error("Error applying filters:", error);
      } finally {
        // ✅ Hide all loaders when done
        setIsLoading(false);
        setIsMainLoading(false);
        setIsFeaturedLoading(false);
        setIsPremiumLoading(false);
      }
    },
    [updateURLWithFilters, loadListings]
  );
  useEffect(() => {
    console.log("Loading state:", {
      isLoading,
      isMainLoading,
      isFeaturedLoading,
      isPremiumLoading,
    });
  }, [isLoading, isMainLoading, isFeaturedLoading, isPremiumLoading]);

  // Only check real user filters
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
    "acustom_fromyears",
    "acustom_toyears",
    "from_sleep",
    "to_sleep",
    "from_length",
    "to_length",
    "search",
    "keyword",
  ];

  const hasActiveFilters = FILTER_KEYS_TO_CHECK.some((key) => {
    const value = filters[key];
    return value !== undefined && value !== "" && value !== null;
  });

  const resetAllFilters = () => {
    if (!hasActiveFilters) return;

    // just clear UI filters — no fetching
    const clearedFilters: Filters = {};

    flushSync(() => {
      setFilters(clearedFilters);
      filtersRef.current = clearedFilters;
    });

    // update URL without triggering listing reload
    router.replace("/listings", { scroll: false });
  };

  // Mobile offcanvas filter state
  const mobileFiltersRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    import("bootstrap/js/dist/offcanvas").catch(() => {});
  }, []);

  return (
    <>
      <Head>
        <title>{metaTitle || "Default Title"}</title>
        <meta
          name="description"
          content={metaDescription || "Default Description"}
        />
        <meta property="og:title" content={metaTitle || "Default Title"} />
        <meta
          property="og:description"
          content={metaDescription || "Default Description"}
        />
        <meta name="twitter:title" content={metaTitle || "Default Title"} />
        <meta
          name="twitter:description"
          content={metaDescription || "Default Description"}
        />
      </Head>

      <section className="services product_listing new_listing bg-gray-100 section-padding pb-30 style-1">
        <div className="container container-xxl">
          <div className="content mb-4">
            {/*<div className="text-sm text-gray-600 header">
                <Link href="/" className="hover:underline">
                  Home
                </Link>{" "}
                &gt; <span className="font-medium text-black"> Listings</span>
              </div>
  
              <h1 className="page-title">{pageTitle}</h1>*/}
            <div ref={sentinelRef} style={{ height: "1px" }} />
            <div className="row">
              {/* Desktop sidebar */}
              <div className="col-lg-3">
                <div className="filter filter_sticky hidden-xs hidden-sm">
                  <div className="card-title align-items-center d-flex justify-content-between hidden-xs">
                    <h3 className="filter_title">Filters</h3>
                    <span className="text-uppercase clear_btn">
                      <button
                        onClick={resetAllFilters}
                        disabled={!hasActiveFilters}
                        className={`clear_btn ${
                          !hasActiveFilters ? "disabled" : ""
                        }`}
                        style={{ border: "none", backgroundColor: "white" }}
                      >
                        <i className="bi bi-arrow-repeat me-1"></i> Clear All
                      </button>{" "}
                    </span>
                  </div>
                  <div className="smooth_scroll">
                    <Suspense fallback={<div>Loading filters...</div>}>
                      <CaravanFilter
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
                      />
                    </Suspense>
                  </div>
                </div>
              </div>

              {/* Listings */}
              {/* Listings */}

              {isLoading ||
              isMainLoading ||
              isFeaturedLoading ||
              isPremiumLoading ? (
                <div className="col-lg-6">
                  <SkeletonListing count={8} />
                </div>
              ) : (
                <>
                  {/** CASE 1: SHOW LISTING PAGE */}
                  {(products.length > 0 ||
                    fetauredProducts.length > 0 ||
                    preminumProducts.length > 0) && (
                    <Listing
                      pageTitle={pageTitle}
                      products={products}
                      data={products}
                      pagination={pagination}
                      onNext={handleNextPage}
                      onPrev={handlePrevPage}
                      metaDescription={metaDescription}
                      metaTitle={metaTitle}
                      onFilterChange={handleFilterChange}
                      currentFilters={filters}
                      preminumProducts={preminumProducts}
                      fetauredProducts={fetauredProducts}
                      exculisiveProducts={exculisiveProducts}
                      isMainLoading={isMainLoading}
                      isFeaturedLoading={isFeaturedLoading}
                      isPremiumLoading={isPremiumLoading}
                      isNextLoading={isNextLoading}
                    />
                  )}

                  {/** CASE 2: SHOW EXCLUSIVE PAGE */}
                  {products.length === 0 &&
                    fetauredProducts.length === 0 &&
                    preminumProducts.length === 0 &&
                    emptyProduct.length > 0 && (
                      <ExculsiveContent
                        data={emptyProduct}
                        pageTitle={pageTitle}
                        metaDescription={metaDescription}
                        metaTitle={metaTitle}
                        isPremiumLoading={isPremiumLoading}
                      />
                    )}
                </>
              )}
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
          <Suspense fallback={<div>Loading filters...</div>}>
            <CaravanFilter
              categories={categories}
              makes={makes}
              models={models}
              states={stateOptions}
              onFilterChange={(partial) => {
                handleFilterChange(partial);
              }}
              currentFilters={filters}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
