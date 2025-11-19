   "use client";
  
  import { Suspense, useCallback, useEffect, useRef, useState } from "react";
  import { fetchListings, ApiResponse, Item } from "../../../api/listings/api";
  import Listing from "./LisitingContent";
  import ExculsiveContent from "./exculsiveContent";
  import CaravanFilter from "../CaravanFilter";
  import SkeletonListing from "../skelton";
  import Link from "next/link";
  import { flushSync } from "react-dom";
  import { v4 as uuidv4 } from "uuid";
  import "./newList.css"
  
  
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
  import {
    fetchExclusiveListings,
    ExclusiveProduct,
  } from "@/api/exculsiveproduct/api";
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
  
  
    // Include additional properties that might come from API
    title?: string;
    weight?: string;
    price?: string;
    thumbnail?: string;
    url?: string;
    sleeps?: string;
    manufacturer?: string;
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
    console.log(isRestored)
    // 1️⃣  persistence helpers  (top of file near imports)
    const PAGE_KEY = (id: string) => `page_${id}`;
    const savePage = (id: string, page: number) => {
      try { localStorage.setItem(PAGE_KEY(id), String(page)); } catch { }
    };
    const readPage = (id: string): number | null => {
      try {
        const v = localStorage.getItem(PAGE_KEY(id));
        return v ? parseInt(v, 10) : null;
      } catch { return null; }
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
    const [emptyProduct, setEmptyProduct] = useState(false);
    console.log("emp", emptyProduct, isRestored)
  
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
        console.log(pageNum)
        const slug = buildSlugFromFilters(nextFilters);
        const query = new URLSearchParams();
  
        if (nextFilters.orderby)
          query.set("orderby", String(nextFilters.orderby));
  
        const r = Number(nextFilters.radius_kms);
        if (!Number.isNaN(r) && r !== DEFAULT_RADIUS) {
          query.set("radius_kms", String(r));
        }
        if (clickid) query.set("clickid", clickid); // only clickid
  
        const safeSlug = slug.endsWith("/") ? slug : `${slug}/`; // 👈 important
        const finalURL = query.toString() ? `${safeSlug}?${query}` : safeSlug;
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
    const ensureclickid = useCallback(() => {
      if (!clickid) {
        const id = uuidv4();
        setclickid(id);
        // reflect only clickid (no page)
        setUrlParams({ clickid: id });
        return id;
      }
      return clickid;
    }, [clickid]);
  
  
  
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
    const [items, setItems] = useState<ExclusiveProduct[]>([]);
  
    useEffect(() => {
      console.log("🚀 Running Exclusive Listings fetch...");
      if (products.length < 0 && !emptyProduct) return;
  
      const loadExclusiveListings = async () => {
        try {
          const res = await fetchExclusiveListings(1);
          console.log("Exclusive Listings Response:", res);
  
          if (res.items && res.items.length > 0) {
            setItems(res.items); // ✅ store in state
            console.log(`🧾 Stored ${res.items.length} items in state`);
          } else {
            console.warn("⚠️ No exclusive items found.");
            setItems([]);
          }
        } catch {
          console.error("❌ Exclusive Listings Error:");
        }
      };
  
      loadExclusiveListings();
    }, []);
  
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
                console.log("Prefetch success for page:", pagination.current_page + 1);
                console.log("responsepre", response)
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
  
    const preFetchListings = async (pageNum: number, appliedFilters: Filters = filtersRef.current): Promise<ApiResponse | undefined> => {
      try {
        console.log("pageNumpageNum", pageNum)
        const safeFilters = normalizeSearchFromMake(appliedFilters);
        const radiusNum = asNumber(safeFilters.radius_kms);
        const radiusParam = typeof radiusNum === "number" && radiusNum !== DEFAULT_RADIUS ? String(radiusNum) : undefined;
  
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
    }
  
    console.log("🔥 Exclusive Listings State:", items);
    const loadListings = useCallback(
      async (
        pageNum = 1,
        appliedFilters: Filters = filtersRef.current,
        skipInitialCheck = false
      ): Promise<ApiResponse | undefined> => {
        // Return cached initial data (first render)
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
  
          // ✅ Update all product states
          const products = response?.data?.products ?? [];
          const validProducts = Array.isArray(products)
            ? products.filter((item) => item != null)
            : [];
  
          if (validProducts.length > 0) {
            const transformedProducts = transformApiItemsToProducts(validProducts);
            setProducts(transformedProducts);
            setPremiumProducts(response?.data?.premium_products ?? []);
            setFeaturedProducts(response?.data?.featured_products ?? []);
            setExculisiveProducts(response?.data?.exclusive_products ?? []);
  
            setCategories(response?.data?.all_categories ?? []);
            setMakes(response?.data?.make_options ?? []);
            setStateOptions(response?.data?.states ?? []);
            setModels(response?.data?.model_options ?? []);
            setPageTitle(response?.title ?? " ");
  
            if (response.pagination) setPagination(response.pagination);
            setMetaDescription(response?.seo?.metadescription ?? "");
            setMetaTitle(response?.seo?.metatitle ?? "");
          } else {
  
            setEmptyProduct(true);
            // 🚨 Step 3 — No valid products → Fetch Exclusive Listings fallback
            console.warn(
              "⚠️ No valid caravans found — fetching Exclusive Listings..."
            );
  
            try {
  
              const fallback = await fetchExclusiveListings(pageNum);
              console.log("🔁 Exclusive API Response:", fallback);
  
              const fallbackItems = fallback?.items ?? [];
              console.log(`🔁 Exclusive items count: ${fallbackItems.length}`);
  
              if (fallbackItems.length > 0) {
                console.log(`✅ Loaded ${fallbackItems.length} exclusive items`);
                setItems(fallbackItems);
                setProducts(fallbackItems as unknown as Product[]);
                setPageTitle("Exclusive Listings");
                setMetaTitle("Exclusive Caravans for Sale");
                setMetaDescription(
                  "Explore our exclusive collection of caravans."
                );
                setPagination({
                  current_page: fallback.currentPage || 1,
                  per_page: fallback.perPage || 12,
                  total_products: fallback.totalProducts || fallbackItems.length,
                  total_pages: fallback.totalPages || 1,
                  total_items: fallback.totalProducts || fallbackItems.length,
                });
              } else {
                console.warn("⚠️ No exclusive items found either.");
                setProducts([]);
              }
            } catch (err) {
              console.error("❌ Failed to fetch exclusive fallback:", err);
              setProducts([]);
            }
          }
  
          return response;
        } catch (error) {
          console.error("❌ Failed to fetch listings:", error);
          setProducts([]);
          return undefined;
        } finally {
          setIsLoading(false);
          console.log("✅ loadListings complete.");
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
        savePage(id, nextPage);// NEW: create clickid if first time
        // sessionStorage.setItem(`page_${id}`, String(nextPage)); // save page for this session
        try {
          if (nextPageData != null) {
            const products = nextPageData?.data?.products ?? [];
            const validProducts = Array.isArray(products)
              ? products.filter((item) => item != null)
              : [];
  
            if (validProducts.length > 0) {
              const transformedProducts = transformApiItemsToProducts(validProducts);
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
  
          setScrollStarted(false)
          setNextPageData(null);
          setIsNextLoading(false)
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
        sessionStorage.setItem(`page_${id}`, String(prevPage));
        try {
          await loadListings(prevPage, filtersRef.current, true);
        } catch (error) {
          console.error("Error loading previous page:", error);
        } finally {
          setIsMainLoading(false);
          setIsFeaturedLoading(false);
          setIsPremiumLoading(false);
  
          setScrollStarted(false)
          setNextPageData(null);
          setIsNextLoading(false)
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
        setPagination(p => ({ ...p, current_page: savedPage }));
        setUrlParams({ clickid });
        loadListings(savedPage, filtersRef.current, true).finally(() => {
          setIsRestored(true);  // ✅ mark restore complete
        });
      } else {
        setUrlParams({ clickid });
        setIsRestored(true); // ✅ no saved page, ready anyway
      }
    }, [clickid]);
  
  
  
  
    console.log("paginationapi", pagination);
    // const loadListings = useCallback(
    //   async (
    //     pageNum = 1,
    //     appliedFilters: Filters = filtersRef.current,
    //     skipInitialCheck = false
    //   ) => {
    //     // If we have initial data and this is the first load, skip the API call
    //     if (initialData && !skipInitialCheck && isUsingInitialData) {
    //       setIsUsingInitialData(false); // Next time, fetch from API
    //       return;
    //     }
  
    //     setIsLoading(true);
    //     window.scrollTo({ top: 0, behavior: "smooth" });
  
    //     try {
    //       const safeFilters = normalizeSearchFromMake(appliedFilters);
  
    //       const radiusNum = asNumber(safeFilters.radius_kms);
    //       const radiusParam =
    //         typeof radiusNum === "number" && radiusNum !== DEFAULT_RADIUS
    //           ? String(radiusNum)
    //           : undefined;
  
    //       const response = await fetchListings({
    //         ...safeFilters,
    //         page: pageNum,
    //         condition: safeFilters.condition,
    //         minKg: safeFilters.minKg?.toString(),
    //         maxKg: safeFilters.maxKg?.toString(),
    //         sleeps: safeFilters.sleeps,
    //         from_price: safeFilters.from_price?.toString(),
    //         to_price: safeFilters.to_price?.toString(),
    //         acustom_fromyears: safeFilters.acustom_fromyears?.toString(),
    //         acustom_toyears: safeFilters.acustom_toyears?.toString(),
    //         from_length: safeFilters.from_length?.toString(),
    //         to_length: safeFilters.to_length?.toString(),
    //         make: safeFilters.make,
    //         model: safeFilters.model,
    //         state: safeFilters.state,
    //         region: safeFilters.region,
    //         suburb: safeFilters.suburb,
    //         pincode: safeFilters.pincode,
    //         orderby: safeFilters.orderby,
    //         search: safeFilters.search,
    //         keyword: safeFilters.keyword,
    //         radius_kms: radiusParam,
    //       });
  
    //       const hasFilters = Object.values(safeFilters).some(
    //         (val) => val !== undefined && val !== null && val !== ""
    //       );
  
    //       const productsFound = (response?.data?.products?.length ?? 0) > 0;
  
    //       if (productsFound) {
    //         const transformedProducts = transformApiItemsToProducts(
    //           response.data?.products || []
    //         );
    //         setProducts(transformedProducts);
    //         setCategories(response.data?.all_categories ?? []);
    //         setMakes(response.data?.make_options ?? []);
    //         setStateOptions(response.data?.states ?? []);
    //         setModels(response.data?.model_options ?? []);
    //         setPageTitle(response.title ?? " ");
    //         if (response.pagination) setPagination(response.pagination);
    //         setMetaDescription(response.seo?.metadescription ?? "");
    //         setMetaTitle(response.seo?.metatitle ?? "");
    //       } else if (hasFilters) {
    //         setProducts([]);
  
    //         setTimeout(() => {
    //           const empty: Filters = {};
    //           filtersRef.current = empty;
    //           setFilters(empty);
    //           router.push("/not-found");
    //         }, 2500);
    //       } else {
    //         setProducts([]);
    //         setPagination((prev) => ({
    //           current_page: 1,
    //           total_pages: 1,
    //           per_page: prev.per_page,
    //           total_products: 0,
    //           total_items: 0,
    //         }));
    //       }
    //     } catch (error) {
    //       console.error("❌ Failed to fetch listings:", error);
    //       setProducts([]);
    //     } finally {
    //       setIsLoading(false);
    //     }
    //   },
    //   [DEFAULT_RADIUS, router, initialData, isUsingInitialData]
    // );
    //  const handleFilterChange = useCallback(
    //     async (newFilters: Filters) => {
    //       setIsLoading(true); // ✅ show skeleton immediately
  
    //       const mergedFilters = { ...filtersRef.current, ...newFilters };
    //       console.log("filters", newFilters, mergedFilters);
    //       // cleanup empty values
    //       if ("orderby" in newFilters && !newFilters.orderby) {
    //         mergedFilters.orderby = undefined;
    //       }
  
  
    //       filtersRef.current = mergedFilters;
    //       setFilters(mergedFilters);
  
    //       // reset pagination when filters change
    //       setPagination({
    //         current_page: 1,
    //         total_pages: 1,
    //         total_items: 0,
    //         per_page: 12,
    //         total_products: 0,
    //       });
  
    //       // ✅ update URL
    //       updateURLWithFilters(mergedFilters, 1);
  
    //       // ✅ fetch data immediately (don’t wait for URL watcher)
    //       await loadListings(1, mergedFilters, true);
  
    //       setIsLoading(false); // ✅ hide loader when done
    //     },
    //     [updateURLWithFilters, loadListings]
    //   );
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
  
    // useEffect(() => {
    //   if (!initializedRef.current) return;
  
    //   const slugParts = pathKey.split("/listings/")[1]?.split("/") || [];
    //   const parsedFromURL = parseSlugToFilters(slugParts);
  
    //   // const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
    //   const pageFromURL = validatePage(searchParams.get("page"));
    //   const orderbyQP = searchParams.get("orderby") || undefined;
    //   const fromyear = searchParams.get("acustom_fromyears") || undefined;
    //   const toyear = searchParams.get("acustom_toyears") || undefined;
  
    //   const radiusQP = searchParams.get("radius_kms");
    //   const radiusFromURL = radiusQP
    //     ? Math.max(5, parseInt(radiusQP, 10))
    //     : undefined;
  
    //   const merged: Filters = {
    //     ...parsedFromURL,
    //     ...incomingFiltersRef.current,
    //     orderby: orderbyQP,
    //     acustom_fromyears: fromyear,
    //     acustom_toyears: toyear,
    //     radius_kms: radiusFromURL !== DEFAULT_RADIUS ? radiusFromURL : undefined,
    //   };
  
    //   // Check if anything actually changed
    //   const filtersChanged =
    //     JSON.stringify(merged) !== JSON.stringify(prevFiltersRef.current);
    //   const pageChanged = pageFromURL !== prevPageRef.current;
  
    //   if (!filtersChanged && !pageChanged) {
    //     // Nothing changed, no need to fetch
    //     return;
    //   }
  
    //   // Update refs with current values
    //   prevFiltersRef.current = { ...merged };
    //   prevPageRef.current = pageFromURL;
  
    //   filtersRef.current = merged;
    //   setFilters(merged);
    //   setPagination((prev) => ({ ...prev, current_page: pageFromURL }));
  
    //   const requestKey = JSON.stringify({ page: pageFromURL, filters: merged });
    //   if (LAST_GLOBAL_REQUEST_KEY === requestKey) return;
    //   LAST_GLOBAL_REQUEST_KEY = requestKey;
  
    //   loadListings(pageFromURL, merged, true);
    // }, [searchKey, pathKey, loadListings, DEFAULT_RADIUS, searchParams]);
  
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
          setEmptyProduct(true);
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
      console.log("Loading state:", { isLoading, isMainLoading, isFeaturedLoading, isPremiumLoading });
    }, [isLoading, isMainLoading, isFeaturedLoading, isPremiumLoading]);
  
  
    // const handleFilterChange = useCallback(
    //   (newFilters: Filters) => {
    //     setIsLoading(true);
    //     const mergedFilters = { ...filtersRef.current, ...newFilters };
  
    //     if ("orderby" in newFilters && !newFilters.orderby) {
    //       mergedFilters.orderby = undefined;
    //     }
    //     if ("acustom_fromyears" in newFilters && !newFilters.acustom_fromyears) {
    //       mergedFilters.acustom_fromyears = undefined;
    //     }
    //     if ("acustom_toyears" in newFilters && !newFilters.acustom_toyears) {
    //       mergedFilters.acustom_toyears = undefined;
    //     }
    //     setFilters(mergedFilters);
    //     filtersRef.current = mergedFilters;
  
    //     const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
    //     setPagination({
    //       current_page: pageFromURL,
    //       total_pages: 1,
    //       total_items: 0,
    //       per_page: 12,
    //       total_products: 0,
    //     });
  
    //     updateURLWithFilters(mergedFilters, 1);
    //   },
    //   [searchParams, updateURLWithFilters]
    // );
  
    // Mobile offcanvas filter state
    const mobileFiltersRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      import("bootstrap/js/dist/offcanvas").catch(() => { });
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
                  <div className="filter hidden-xs">
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
  
                {/* Listings */}
                {/* Listings */}
  
                {isLoading || isMainLoading || isFeaturedLoading || isPremiumLoading ? (
                  <div className="col-lg-6">
                    <SkeletonListing count={8} />
                  </div>
                ) : products.length > 0 ? (
                  <Listing
                    products={products}
                    data={items}
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
                ) :
                  <ExculsiveContent
                    data={items}
                    pagination={pagination}
                    onNext={handleNextPage}
                    onPrev={handlePrevPage}
                    metaDescription={metaDescription}
                    metaTitle={metaTitle}
                    isPremiumLoading={isPremiumLoading}
  
                  />
                }
  
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