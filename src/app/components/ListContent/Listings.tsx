"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { fetchListings, ApiResponse, Item } from "../../../api/listings/api";
import Listing from "./LisitingContent";
import ExculsiveContent from "./exculsiveContent";
import CaravanFilter from "../CaravanFilter";
import SkeletonListing from "../skelton";
import Link from "next/link";
import {
  notFound,
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
  is_exclusive: boolean;
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
    is_exclusive: item.is_exclusive ?? false,
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

  const [isUsingInitialData, setIsUsingInitialData] = useState(!!initialData);

  const rawPage = searchParams.get("page");

  // ✅ If page is missing → default to 1
  const page = rawPage ? parseInt(rawPage, 10) : 1;

  // ✅ Only validate `page`
  if (rawPage !== null) {
    // page must be all digits
    if (!/^\d+$/.test(rawPage)) {
      notFound();
    }

    // must be >= 1
    if (!Number.isInteger(page) || page < 1) {
      notFound();
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
  const [data, setData] = useState<Product[]>([]);

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
        total_items: initialData.pagination.total_items || 0,
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
      notFound(); // 🚫 block empty ?page=
    }

    if (!/^\d+$/.test(raw)) {
      notFound(); // 🚫 block non-numeric
    }

    const page = parseInt(raw, 10);

    if (!Number.isInteger(page) || page < 1) {
      notFound(); // 🚫 block invalid numbers
    }

    return page;
  };

  const updateURLWithFilters = useCallback(
    (nextFilters: Filters, pageNum: number) => {
      const slug = buildSlugFromFilters(nextFilters);
      const query = new URLSearchParams();

      if (nextFilters.orderby)
        query.set("orderby", String(nextFilters.orderby));
      if (nextFilters.acustom_fromyears)
        query.set(
          "acustom_fromyears",
          nextFilters.acustom_fromyears.toString()
        );
      if (nextFilters.acustom_toyears)
        query.set("acustom_toyears", nextFilters.acustom_toyears.toString());

      const r = Number(nextFilters.radius_kms);
      if (!Number.isNaN(r) && r !== DEFAULT_RADIUS) {
        query.set("radius_kms", String(r));
      }
      if (pageNum > 1) query.set("page", String(pageNum));

      const safeSlug = slug.endsWith("/") ? slug : `${slug}/`; // 👈 important
      const finalURL = query.toString() ? `${safeSlug}?${query}` : safeSlug;
      router.push(finalURL);
    },
    [router, DEFAULT_RADIUS]
  );

  const handleNextPage = () => {
    if (pagination.current_page < pagination.total_pages) {
      const nextPage = pagination.current_page + 1;
      updateURLWithFilters(filtersRef.current, nextPage);
    }
  };

  const handlePrevPage = () => {
    if (pagination.current_page > 1) {
      const prevPage = pagination.current_page - 1;
      updateURLWithFilters(filtersRef.current, prevPage);
    }
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
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ExclusiveProduct[]>([]);

  useEffect(() => {
    console.log("🚀 Running Exclusive Listings fetch...");

    const loadExclusiveListings = async () => {
      try {
        setLoading(true);
        const res = await fetchExclusiveListings(1);
        console.log("✅ Exclusive Listings Response:", res);

        if (res.items && res.items.length > 0) {
          setItems(res.items); // ✅ store in state
          console.log(`🧾 Stored ${res.items.length} items in state`);
        } else {
          console.warn("⚠️ No exclusive items found.");
          setItems([]);
        }
      } catch (err: any) {
        console.error("❌ Exclusive Listings Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadExclusiveListings();
  }, []);

  console.log("🔥 Exclusive Listings State:", items);
  const loadListings = useCallback(
    async (
      pageNum = 1,
      appliedFilters: Filters = filtersRef.current,
      skipInitialCheck = false
    ): Promise<ApiResponse | undefined> => {
      // 🧠 Return cached initial data (first render)
      if (initialData && !skipInitialCheck && isUsingInitialData) {
        setIsUsingInitialData(false);
        return initialData;
      }

      setIsLoading(true);
      window.scrollTo({ top: 0, behavior: "smooth" });

      try {
        console.log("🚀 Starting loadListings with filters:", appliedFilters);

        const safeFilters = normalizeSearchFromMake(appliedFilters);
        const radiusNum = asNumber(safeFilters.radius_kms);
        const radiusParam =
          typeof radiusNum === "number" && radiusNum !== DEFAULT_RADIUS
            ? String(radiusNum)
            : undefined;

        // ✅ Step 1 — Fetch main caravan listings
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
          radius_kms: radiusParam,
        });

        console.log("📦 Main API Response:", response);

        // ✅ Step 2 — Check if products exist (FIXED CONDITION)
        const products = response?.data?.products ?? [];

        // 🔍 BETTER CHECK: Handle empty array, null, undefined, or invalid array
        const isProductsArray = Array.isArray(products);
        const validProducts = isProductsArray
          ? products.filter((item) => item != null)
          : [];
        const hasValidProducts =
          Array.isArray(products) &&
          products.some(
            (p) => p && Object.keys(p).length > 0 && (p.id || p.slug) // any key you expect to exist
          );

        console.log("🔍 Products Analysis:", {
          rawProducts: products,
          isArray: isProductsArray,
          validProductsCount: validProducts.length,
          hasValidProducts: hasValidProducts,
        });

        if (hasValidProducts) {
          console.log(
            `✅ Found ${validProducts.length} valid caravans in main listings.`
          );

          const transformedProducts =
            transformApiItemsToProducts(validProducts);
          setProducts(transformedProducts);
          setCategories(response?.data?.all_categories ?? []);
          setMakes(response?.data?.make_options ?? []);
          setStateOptions(response?.data?.states ?? []);
          setModels(response?.data?.model_options ?? []);
          setPageTitle(response?.title ?? " ");
          if (response.pagination) setPagination(response.pagination);
          setMetaDescription(response?.seo?.metadescription ?? "");
          setMetaTitle(response?.seo?.metatitle ?? "");
        } else {
          // 🚨 Step 3 — No valid products → Fetch Exclusive Listings fallback
          console.warn(
            "⚠️ No valid caravans found — fetching Exclusive Listings..."
          );

          try {
            alert("no data found");
            const fallback = await fetchExclusiveListings(pageNum);
            console.log("🔁 Exclusive API Response:", fallback);

            const fallbackItems = fallback?.items ?? [];
            console.log(`🔁 Exclusive items count: ${fallbackItems.length}`);

            if (fallbackItems.length > 0) {
              console.log(`✅ Loaded ${fallbackItems.length} exclusive items`);
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
        window.location.href = "/not-found"; // instant client redirect
      }
    });
  }, [searchKey, pathKey, loadListings, DEFAULT_RADIUS, searchParams]);

  const handleFilterChange = useCallback(
    async (newFilters: Filters) => {
      // setIsLoading(true); // ✅ show skeleton immediately

      const mergedFilters = { ...filtersRef.current, ...newFilters };
      console.log("filters", newFilters, mergedFilters);
      // cleanup empty values
      if ("orderby" in newFilters && !newFilters.orderby) {
        mergedFilters.orderby = undefined;
      }
      if ("acustom_fromyears" in newFilters && !newFilters.acustom_fromyears) {
        mergedFilters.acustom_fromyears = undefined;
      }
      if ("acustom_toyears" in newFilters && !newFilters.acustom_toyears) {
        mergedFilters.acustom_toyears = undefined;
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

      // ✅ update URL
      updateURLWithFilters(mergedFilters, 1);

      // ✅ fetch data immediately (don’t wait for URL watcher)
      await loadListings(1, mergedFilters, true);

      setIsLoading(false); // ✅ hide loader when done
    },
    [updateURLWithFilters, loadListings]
  );

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

      <section className="services product_listing bg-gray-100 section-padding pb-30 style-1">
        <div className="container">
          <div className="content">
            <div className="text-sm text-gray-600 header">
              <Link href="/" className="hover:underline">
                Home
              </Link>{" "}
              &gt; <span className="font-medium text-black"> Listings</span>
            </div>

            <h1 className="page-title">{pageTitle}</h1>

            <div className="row">
              {/* Desktop sidebar */}
              <div className="col-lg-3 col-sm-4 hidden-xs">
                <div className="filter">
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

              {/* Listings */}
              {/* Listings */}
              {isLoading ? (
                <div className="skeleton-wrapper">
                  <SkeletonListing count={8} />
                </div>
              ) : products.length > 0 ? (
                <Listing
                  products={products}
                  data={data}
                  pagination={pagination}
                  onNext={handleNextPage}
                  onPrev={handlePrevPage}
                  metaDescription={metaDescription}
                  metaTitle={metaTitle}
                  onFilterChange={handleFilterChange}
                  currentFilters={filters}
                />
              ) : (
                <ExculsiveContent
                  data={items}
                  pagination={pagination}
                  onNext={handleNextPage}
                  onPrev={handlePrevPage}
                  metaDescription={metaDescription}
                  metaTitle={metaTitle}
                  onFilterChange={handleFilterChange}
                  currentFilters={filters}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Offcanvas */}
      <div
        ref={mobileFiltersRef}
        id="mobileFilters"
        className="offcanvas offcanvas-end d-lg-none"
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
