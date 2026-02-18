  
  "use client";
  
  import { Suspense, useCallback, useEffect, useRef, useState } from "react";
  import { fetchListings, ApiResponse, Item } from "../../../api/listings/api";
  import Listing from "./LisitingContent";
  import ExculsiveContent from "./exculsiveContent";
  import CaravanFilter from "../CaravanFilter";
  import { flushSync } from "react-dom";
  import { v4 as uuidv4 } from "uuid";
  import "./newList.css";
  import dynamic from "next/dynamic";
  
  import "../filter.css";
  
  const ListingSkeleton = dynamic(() => import("../skelton"), { ssr: false });
  
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
    list_page_title?: string;
    weight?: string;
    price?: string;
    thumbnail?: string;
    url?: string;
    sleeps?: string;
    manufacturer?: string;
    is_exclusive?: boolean;
    is_premium?: boolean;
    image_url?: string[];
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
  }
  
  interface Props extends Filters {
    page?: string | number;
    initialData?: ApiResponse;
    linksData?: any;
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
      model: item.model || "",
      slug: item.slug,
      description: item.description,
      sku: item.sku,
      gallery: item.gallery || [],
      is_exclusive: item.is_exclusive,
      is_premium: item.is_premium,
      image_format: item.image_format || [],
      image_url: item.image_url || [],
  
      // keep extra props
    }));
  }
  
  /** ------------ Component ------------ */
  
  export default function ListingsPage({
    initialData,
    linksData: serverLinksData, 
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
   //  const [scrollStarted, setScrollStarted] = useState(false);
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
 
  // Update readPage to fallback to extracting page from clickid
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
  
    if (searchParams.has("page")) {
      redirect("/404");
    }
    // ✅ If page is missing → default to 1
  
    const fromYears = searchParams.get("acustom_fromyears");
    const toYears = searchParams.get("acustom_toyears");
  
    if (fromYears !== null || toYears !== null) {
      redirect("/404");
    }
  
    const getIP = async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        return data.ip || "";
      } catch {
        return "";
      }
    };
  
    const postTrackEvent = async (url: string, product_id: number) => {
      const ip = await getIP();
      const user_agent = navigator.userAgent;
  
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id,
          ip,
          user_agent,
        }),
      });
    };
  
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = Number(entry.target.getAttribute("data-product-id"));
              postTrackEvent(
                "https://admin.caravansforsale.com.au/wp-json/cfs/v1/update-impressions",
                id,
              );
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 },
      );
  
      document
        .querySelectorAll(".product-card[data-product-id]")
        .forEach((el) => {
          observer.observe(el);
        });
  
      return () => observer.disconnect();
    }, []);
  
    // Initialize state with initialData if provided
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
    const [pageTitle, setPageTitle] = useState(
      initialData?.list_page_title || " ",
    );
    const [metaTitle, setMetaTitle] = useState(initialData?.seo?.metatitle || "");
    const [metaDescription, setMetaDescription] = useState(
      initialData?.seo?.metadescription || "",
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
              10,
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
  
    // const updateURLWithFilters = useCallback(
    //   (nextFilters: Filters, pageNum: number) => {
    //     console.log(pageNum);
    //     const slug = buildSlugFromFilters(nextFilters);
    //     const query = new URLSearchParams();
  
    // if (nextFilters.orderby) query.set("orderby", String(nextFilters.orderby));
  
    //     const r = Number(nextFilters.radius_kms);
    //     if (!Number.isNaN(r) && r !== DEFAULT_RADIUS) {
    //       query.set("radius_kms", String(r));
    //     }
    //     if (clickid) query.set("clickid", clickid); // only clickid
  
    //     const safeSlug = slug.endsWith("/") ? slug : `${slug}/`; // 👈 important
    //     const finalURL = query.toString() ? `${safeSlug}?${query}` : safeSlug;
    //     console.log("final", finalURL);
    //     router.push(finalURL, { scroll: false }); // ✅ Prevent auto-scroll
    //     setTimeout(() => {
    //       window.scrollTo({ top: 0, behavior: "smooth" });
    //     }, 150);
    //   },
    //   [router, DEFAULT_RADIUS]
    // );
    // Add this useEffect near your other effects
  
    const updateURLWithFilters = useCallback(
     (nextFilters: Filters, pageNum: number, clickidParam?: string) => {
 
        console.log(pageNum);
        const slug = buildSlugFromFilters(nextFilters); // your slug builder
        const query = new URLSearchParams();
  
        if (nextFilters.orderby)
          query.set("orderby", String(nextFilters.orderby));
        const r = Number(nextFilters.radius_kms);
        if (!Number.isNaN(r) && r !== DEFAULT_RADIUS) {
          query.set("radius_kms", String(r));
        }
       //  if (clickid) query.set("clickid", clickid);
  const cid = clickidParam !== undefined ? clickidParam : new URLSearchParams(window.location.search).get("clickid");
     if (cid && cid !== "") query.set("clickid", cid);
 
        // Use current pathname (do not force a route push)
        const path = window.location.pathname;
        const safeSlug = slug ? (slug.endsWith("/") ? slug : `${slug}/`) : path;
        const finalURL = query.toString() ? `${safeSlug}?${query}` : safeSlug;
  
        // Replace history only — avoids Next.js navigation / redirect
        window.history.pushState({}, "", finalURL);
  
        // then fetch data client-side
       //  setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 150);
      },
      [DEFAULT_RADIUS, clickid],
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
   // Replace the existing ensureclickid function with this:
  // Replace the existing ensureclickid function with this:
  const generateClickidForPage = (pageNum: number): string => {
   if (pageNum <= 1) return "";
 
   const filterString = JSON.stringify(filtersRef.current);
   const str = `${filterString}_page_${pageNum}`;
   let h1 = pageNum * 2654435761;
   let h2 = pageNum * 2246822519;
   let h3 = pageNum * 3266489917;
   let h4 = pageNum * 668265263;
   // let h1 = 0, h2 = 0, h3 = 0, h4 = 0;
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
 
 const ensureclickid = (pageNum: number): string => {
   const id = generateClickidForPage(pageNum);
   if (!id) {
     setclickid(null);
     return "";
   }
   setclickid(id);
 
   // const url = new URL(window.location.href);
   // url.searchParams.set("clickid", id);
   // window.history.replaceState({}, "", url.toString());
 
   return id;
 };
  
    useEffect(() => {
      if (initialData?.data?.products) {
        const transformed = transformApiItemsToProducts(
          initialData.data.products,
        );
        setProducts(transformed);
        setCategories(initialData.data.all_categories || []);
        setMakes(initialData.data.make_options || []);
        setStateOptions(initialData.data.states || []);
        setModels(initialData.data.model_options || []);
        setPageTitle(initialData.list_page_title || "");
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
          if (entry.isIntersecting  && !isNextLoading) {
           //  setScrollStarted(true);
            try {
              const response = await preFetchListings(
                pagination.current_page + 1,
                filtersRef.current,
              );
  
              if (response?.success) {
                console.log(
                  "Prefetch success for page:",
                  pagination.current_page + 1,
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
        { threshold: 0.1 },
      );
  
      observer.observe(sentinelRef.current);
      return () => observer.disconnect();
    }, [pagination.current_page, isNextLoading]);
  
    const preFetchListings = async (
      pageNum: number,
      appliedFilters: Filters = filtersRef.current,
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
        skipInitialCheck = false,
      ): Promise<ApiResponse | undefined> => {
        if (initialData && !skipInitialCheck && isUsingInitialData) {
          setIsUsingInitialData(false);
          return initialData;
        }
  
        try {
         //  window.scrollTo({ top: 0, behavior: "smooth" });
  
          const safeFilters = normalizeSearchFromMake(appliedFilters);
          console.log("appp1", appliedFilters);
          console.log("app", safeFilters.orderby);
  
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
              : [],
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
      [DEFAULT_RADIUS, router, initialData, isUsingInitialData],
    );
  
    const handleNextPage = useCallback(async () => {
      if (pagination.current_page >= pagination.total_pages) return;
  
       // scrollToTop();
  
      flushSync(() => {
        setIsMainLoading(true);
        setIsFeaturedLoading(true);
        setIsPremiumLoading(true);
      });
  
      const nextPage = pagination.current_page + 1;
  
      // ✅ always ensure clickid
   const id = ensureclickid(nextPage);
      savePage(id, nextPage);
  
      try {
        if (nextPageData?.data?.products?.length) {
          // ✅ use prefetched data
          setProducts(transformApiItemsToProducts(nextPageData.data.products));
          setPremiumProducts(
            transformApiItemsToProducts(nextPageData.data.premium_products ?? []),
          );
          setFeaturedProducts(
            transformApiItemsToProducts(
              nextPageData.data.featured_products ?? [],
            ),
          );
          setExculisiveProducts(
            transformApiItemsToProducts(
              nextPageData.data.exclusive_products ?? [],
            ),
          );
  
          if (nextPageData.pagination) {
            setPagination(nextPageData.pagination);
          }
        } else {
          // ✅ fallback fetch
          await loadListings(nextPage, filtersRef.current, true);
        }
  
        // ✅ VERY IMPORTANT: URL update using router
        updateURLWithFilters(filtersRef.current, nextPage);
      } catch (error) {
        console.error("Error loading next page:", error);
      } finally {
        setIsMainLoading(false);
        setIsFeaturedLoading(false);
        setIsPremiumLoading(false);
  
       //  setScrollStarted(false);
        setNextPageData(null);
        setIsNextLoading(false);
      }
    }, [
      pagination.current_page,
      pagination.total_pages,
      nextPageData,
      loadListings,
      updateURLWithFilters,
    ]);
  
    // ✅ FIXED: Proper handlePrevPage function
    const handlePrevPage = useCallback(async () => {
      if (pagination.current_page <= 1) return;
  
      const prevPage = pagination.current_page - 1;
  
      setIsMainLoading(true);
      setIsFeaturedLoading(true);
      setIsPremiumLoading(true);
  
      try {
        if (prevPage > 1) {
          // ✅ ALWAYS generate NEW clickid
         const id = ensureclickid(prevPage);
       if (id) savePage(id, prevPage);
       await loadListings(prevPage, filtersRef.current, true);
   updateURLWithFilters(filtersRef.current, prevPage, id);
     } else {
       // ✅ first page → remove clickid
       setclickid(null);
        await loadListings(1, filtersRef.current, true);
   updateURLWithFilters(filtersRef.current, 1, ""); 
       const url = new URL(window.location.href);
       url.searchParams.delete("clickid");
       window.history.pushState({}, "", url.toString());
     }
  
        await loadListings(prevPage, filtersRef.current, true);
    
     
      } catch (err) {
        console.error(err);
      } finally {
        setIsMainLoading(false);
        setIsFeaturedLoading(false);
        setIsPremiumLoading(false);
      }
    }, [pagination, loadListings]);
  
    // add near other refs
    const restoredOnceRef = useRef(false);
    // 3️⃣  restore effect
  
    // restore effect
   
  
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
  
      if (isClearAllRef.current) {
        isClearAllRef.current = false;
        return;
      }
      if (restoredOnceRef.current) {
        restoredOnceRef.current = false; // reset for future real changes
        return;
      }
  
      const slugParts = pathKey.split("/listings/")[1]?.split("/") || [];
      const parsedFromURL = parseSlugToFilters(slugParts);
      const orderbyFromQuery = searchParams.get("orderby") ?? undefined;
  
      const pageFromURL = validatePage(searchParams.get("page"));
  
      const merged: Filters = {
        ...parsedFromURL,
        ...incomingFiltersRef.current,
        ...(orderbyFromQuery ? { orderby: orderbyFromQuery } : {}),
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
  
    const mergeFiltersSafely = (prev: Filters, next: Filters): Filters => {
      const merged: Filters = { ...prev };
  
      Object.entries(next).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          // ❌ do nothing → keep previous value
          return;
        }
        merged[key as keyof Filters] = value;
      });
  
      return merged;
    };
  
    const handleFilterChange = useCallback(
      async (newFilters: Filters) => {
        // ✅ Show skeleton for ALL sections immediately
        // setIsLoading(true);
        // setIsMainLoading(true);
        // setIsFeaturedLoading(true);
        // setIsPremiumLoading(true);
  
        const mergedFilters = mergeFiltersSafely(filtersRef.current, newFilters);
  
        // cleanup empty values
        if ("orderby" in newFilters && !newFilters.orderby) {
          mergedFilters.orderby = undefined;
        }
        // ensureclickid();
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
          // setIsMainLoading(false);
          // setIsFeaturedLoading(false);
          // setIsPremiumLoading(false);
        }
      },
      [updateURLWithFilters, loadListings],
    );
    useEffect(() => {
      console.log("Loading state:", {
        isLoading,
        isMainLoading,
        isFeaturedLoading,
        isPremiumLoading,
      });
    }, [isLoading, isMainLoading, isFeaturedLoading, isPremiumLoading]);
  
  
   // ✅ Add this ref near your other refs
  const isPopStateRef = useRef(false);
  
  // ✅ Full popstate handler
 useEffect(() => {
   const handlePopState = () => {
     isPopStateRef.current = true;
 
     const path = window.location.pathname;
     const slugParts = path.split("/listings/")[1]?.split("/") || [];
     const parsed = parseSlugToFilters(slugParts);
 
     const sp = new URLSearchParams(window.location.search);
     const orderby = sp.get("orderby") ?? undefined;
     const urlClickid = sp.get("clickid") || null;
 
     const merged: Filters = {
       ...parsed,
       ...(orderby ? { orderby } : {}),
     };
 
     filtersRef.current = merged;
     setFilters(merged);
     setclickid(urlClickid);
 
     const savedPage = urlClickid ? readPage(urlClickid) : null;
     const pageToLoad = savedPage && savedPage > 0 ? savedPage : 1;
 
     // ✅ Prevent URL-watcher effect from double-fetching
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
     });
   };
 
   window.addEventListener("popstate", handlePopState);
   return () => window.removeEventListener("popstate", handlePopState);
 }, [loadListings]);
  // ✅ Ensure page 1 has a history entry
 useEffect(() => {
   if (!searchParams.has("clickid")) {
     // Page 1 - make sure current URL is in history
     window.history.replaceState({ page: 1 }, "", window.location.href);
   }
 }, []);
  // ✅ Update your existing clickid restore useEffect
   // ✅ KEEP ONLY THIS ONE
  useEffect(() => {
    if (!clickid) return;
  
    // ✅ Skip if triggered by popstate - already handled
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }
  
    const savedPage = readPage(clickid);
    if (savedPage && savedPage > 0) {
      restoredOnceRef.current = true;
      setPagination((p) => ({ ...p, current_page: savedPage }));
      setUrlParams({ clickid });
      loadListings(savedPage, filtersRef.current, true).finally(() => {
        setIsRestored(true);
      });
    } else {
      setUrlParams({ clickid });
      setIsRestored(true);
    }
  }, [clickid]);
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
  
      isClearAllRef.current = true; // 🔒 mark clear-all
  
      // ✅ show skeleton
      setIsLoading(true);
      setIsMainLoading(true);
      setIsFeaturedLoading(true);
      setIsPremiumLoading(true);
  
      // ✅ HARD CLEAR DATA (IMPORTANT)
      setProducts([]);
      setFeaturedProducts([]);
      setPremiumProducts([]);
      setExculisiveProducts([]);
      setEmptyProduct([]);
  
      const clearedFilters: Filters = {};
  
      flushSync(() => {
        setFilters(clearedFilters);
        filtersRef.current = clearedFilters;
      });
  
      try {
        // ✅ update URL only (no duplicate fetch)
        router.replace("/listings", { scroll: false });
  
        // ❌ DO NOT call loadListings here
      } catch (err) {
        console.error("Clear all failed:", err);
      }
    };
  
    // Mobile offcanvas filter state
    const mobileFiltersRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      import("bootstrap/js/dist/offcanvas").catch(() => {});
    }, []);
  
  
    // 1. Add state for client-side links
  const [clientLinksData, setClientLinksData] = useState<any>(null);
  const [clientMounted, setClientMounted] = useState(false);
  
  // 2. Add useEffect to fetch links when filters change
  useEffect(() => {
    setClientMounted(true);
    
    const fetchLinks = async () => {
      try {
        const params = new URLSearchParams();
        Object.entries(filtersRef.current).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "" && k !== "page") {
            params.set(k, String(v));
          }
        });
        const res = await fetch(
          `https://admin.caravansforsale.com.au/wp-json/cfs/v1/links?${params.toString()}`
        );
        const json = await res.json();
        setClientLinksData(json.data ?? json);
      } catch (e) {
        console.error("Links fetch error:", e);
      }
    };
  
    fetchLinks();
  }, [
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
    filters.keyword,
    filters.search,
  ]);
  
  // 4. Add buildClientLinkUrl helper in Listings.tsx (simplified version of filter's buildLinkUrl)
  const buildClientLinkUrl = (type: string, item: { slug: string }) => {
    const linkFilters: Filters = { ...filtersRef.current };
  
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
        linkFilters.model = item.slug;
        break;
      case "conditions":
        linkFilters.condition = item.slug;
        break;
         case "prices":
      case "atm_ranges":
      case "length_ranges":
      case "sleep_ranges":
          break;
    }
  
    const slugPath = buildSlugFromFilters(linkFilters);
   const base = slugPath.endsWith("/") ? slugPath.slice(0, -1) : slugPath;
  
    if (["prices", "atm_ranges", "length_ranges", "sleep_ranges"].includes(type)) {
      return `${base}/${item.slug}/`;
    }
  
    return `${base}/` || "/listings/";
  };
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
                        {/* ✅ SSR Links — will appear in View Page Source */}
   {clientMounted && clientLinksData && (
      <div className="cfs-links-section" id="client-links">
        {(["states", "categories", "regions", ] as string[]).map((sectionKey) => {
          const items = clientLinksData[sectionKey];
          if (!items || items.length === 0) return null;
  
          const titles: Record<string, string> = {
            states: "Browse by State",
            categories: "Browse by Category",
            regions: "Browse by Region",
    //         makes: "Browse by Make",
    //         models: "Browse by Model",
    //         conditions: "Browse by Condition",
    //          prices: "Browse by Price",
    // atm_ranges: "Browse by ATM",
    // length_ranges: "Browse by Length",
    // sleep_ranges: "Browse by Sleep",
          };
  
          return (
            <div key={sectionKey} className="cfs-links-group">
              <h5 className="cfs-filter-label">{titles[sectionKey] || sectionKey}</h5>
              <ul className="cfs-links-list">
                {items.map((item: any) => {
                  const linkUrl = buildClientLinkUrl(sectionKey, item);
                  return (
                    <li key={item.slug} className="cfs-links-item">
                      <a
                        href={linkUrl}
                        target=""
                        className="cfs-links-link"
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          router.push(linkUrl);
                        }}
                      >
  {item.name.includes(" ") 
    ? item.name.replace(/\b\w/g, (c: string) => c.toUpperCase())
    : item.name.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
  }                    </a>
                      
                    </li>
                    
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    )}
    <Suspense fallback={<div className="filter-placeholder">Loading filters...</div>}>
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
                    <ListingSkeleton count={8} />
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
                        // isNextLoading={isNextLoading}
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
            <Suspense>
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