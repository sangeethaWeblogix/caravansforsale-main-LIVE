"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  fetchListings,
  type ApiResponse as FetchApiResponse,
} from "../../../api/listings/api";
import Listing from "./LisitingContent";
import CaravanFilter from "../CaravanFilter";
import SkeletonListing from "../skelton";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildSlugFromFilters } from "../slugBuilter";
import { parseSlugToFilters } from "../../components/urlBuilder";
import Head from "next/head";

/* --------- GLOBAL de-dupe across StrictMode remounts --------- */
let LAST_GLOBAL_REQUEST_KEY = "";

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

// Use the same type as the API response
type Props = Filters & {
  page?: string | number;
  initialData?: FetchApiResponse;
};

/** ------------ Component ------------ */

export default function ListingsPage({
  initialData,
  ...incomingFilters
}: Props) {
  const DEFAULT_RADIUS = 50 as const;

  // Helper function to convert ApiData products to Product[]
  const convertApiProductsToProducts = (apiProducts: any[]): Product[] => {
    return apiProducts.map((product) => ({
      id: product.id || 0,
      name: product.name || "",
      length: product.length || "",
      kg: product.kg || "",
      regular_price: product.regular_price || "",
      sale_price: product.sale_price,
      price_difference: product.price_difference,
      image: product.image || "",
      link: product.link || "",
      condition: product.condition || "",
      location: product.location,
      categories: product.categories,
      people: product.people,
      make: product.make,
      slug: product.slug,
      is_exclusive: product.is_exclusive || false,
    }));
  };

  // Track if we've used the initial data
  const hasUsedInitialData = useRef(false);

  // Initialize state
  const [filters, setFilters] = useState<Filters>({});
  const filtersRef = useRef<Filters>({});
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [pageTitle, setPageTitle] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [makes, setMakes] = useState<MakeOption[]>([]);
  const [models, setModels] = useState<MakeOption[]>([]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // Initialize pagination
  const [pagination, setPagination] = useState<Pagination>(() => {
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

  // Initialize with initialData on first render
  useEffect(() => {
    if (initialData && !hasUsedInitialData.current) {
      hasUsedInitialData.current = true;

      setProducts(
        initialData.data?.products
          ? convertApiProductsToProducts(initialData.data.products)
          : []
      );
      setPageTitle(initialData.title || "");
      setCategories(initialData.data?.all_categories || []);
      setMakes(initialData.data?.make_options || []);
      setModels(initialData.data?.model_options || []);
      setMetaTitle(initialData.seo?.metatitle || "");
      setMetaDescription(initialData.seo?.metadescription || "");
      setStateOptions(initialData.data?.states || []);

      if (initialData.pagination) {
        setPagination({
          current_page: initialData.pagination.current_page,
          total_pages: initialData.pagination.total_pages,
          total_items: initialData.pagination.total_items,
          per_page: initialData.pagination.per_page,
          total_products: initialData.pagination.total_products,
        });
      }
    }
  }, [initialData]);

  const asNumber = (v: unknown): number | undefined => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  // Parse slug ONCE on mount
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;

    const path = window.location.pathname;
    const slugParts = path.split("/listings/")[1]?.split("/") || [];

    // Convert searchParams to a plain object
    const query: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const parsed = parseSlugToFilters(slugParts, query);

    // Clean the parsed filters
    const cleanParsed: Filters = {};
    Object.entries(parsed).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleanParsed[key as keyof Filters] = value;
      }
    });

    const merged = { ...cleanParsed, ...incomingFilters };
    filtersRef.current = merged;
    setFilters(merged);
    initializedRef.current = true;
  }, [incomingFilters, searchParams]);

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

  const updateURLWithFilters = useCallback(
    (nextFilters: Filters, pageNum: number) => {
      // Clean the filters before building the slug
      const cleanFilters: Filters = {};
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanFilters[key as keyof Filters] = value;
        }
      });

      const slug = buildSlugFromFilters(cleanFilters);
      const query = new URLSearchParams();

      // Add query parameters only if they have values
      if (cleanFilters.orderby)
        query.set("orderby", String(cleanFilters.orderby));
      if (cleanFilters.acustom_fromyears)
        query.set(
          "acustom_fromyears",
          cleanFilters.acustom_fromyears.toString()
        );
      if (cleanFilters.acustom_toyears)
        query.set("acustom_toyears", cleanFilters.acustom_toyears.toString());

      const r = Number(cleanFilters.radius_kms);
      if (!Number.isNaN(r) && r !== DEFAULT_RADIUS) {
        query.set("radius_kms", String(r));
      }

      // Only add page parameter if it's greater than 1
      if (pageNum > 1) {
        query.set("page", String(pageNum));
      }

      const safeSlug = slug.endsWith("/") ? slug : `${slug}/`;
      const finalURL = query.toString() ? `${safeSlug}?${query}` : safeSlug;

      console.log("Navigating to:", finalURL);
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

  const loadListings = useCallback(
    async (pageNum = 1, appliedFilters: Filters = filtersRef.current) => {
      setIsLoading(true);
      window.scrollTo({ top: 0, behavior: "smooth" });

      try {
        const safeFilters = normalizeSearchFromMake(appliedFilters);

        const radiusNum = asNumber(safeFilters.radius_kms);
        const radiusParam =
          typeof radiusNum === "number" && radiusNum !== DEFAULT_RADIUS
            ? String(radiusNum)
            : undefined;

        const response = await fetchListings({
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

        const hasFilters = Object.values(safeFilters).some(
          (val) => val !== undefined && val !== null && val !== ""
        );

        const productsFound = (response?.data?.products?.length ?? 0) > 0;

        if (productsFound) {
          setProducts(
            convertApiProductsToProducts(response.data?.products || [])
          );
          setCategories(response.data?.all_categories ?? []);
          setMakes(response.data?.make_options ?? []);
          setStateOptions(response.data?.states ?? []);
          setModels(response.data?.model_options ?? []);
          setPageTitle(response.title ?? "Caravan Listings");
          if (response.pagination) setPagination(response.pagination);

          setMetaDescription(response.seo?.metadescription ?? "");
          setMetaTitle(response.seo?.metatitle ?? "");
        } else if (hasFilters) {
          setProducts([]);
          setPageTitle("No results found. Redirecting...");
          setMetaTitle("No listings found");
          setMetaDescription("We couldn't find listings for your filters.");
          setTimeout(() => {
            const empty: Filters = {};
            filtersRef.current = empty;
            setFilters(empty);
            router.push("/listings");
          }, 2500);
        } else {
          setProducts([]);
          setPagination((prev) => ({
            current_page: 1,
            total_pages: 1,
            per_page: prev.per_page,
            total_products: 0,
            total_items: 0,
          }));
        }
      } catch (error) {
        console.error("❌ Failed to fetch listings:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [DEFAULT_RADIUS, router]
  );

  const searchKey = searchParams.toString();
  const pathKey = pathname;

  // Main effect to handle URL changes and load listings
  useEffect(() => {
    if (!initializedRef.current) return;

    const path = pathKey;
    const slugParts = path.split("/listings/")[1]?.split("/") || [];

    // Convert searchParams to a plain object
    const query: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const parsedFromURL = parseSlugToFilters(slugParts, query);

    const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
    const orderbyQP = searchParams.get("orderby") || undefined;
    const fromyear = searchParams.get("acustom_fromyears") || undefined;
    const toyear = searchParams.get("acustom_toyears") || undefined;
    const radiusQP = searchParams.get("radius_kms");

    const radiusFromURL = radiusQP
      ? Math.max(5, parseInt(radiusQP, 10))
      : undefined;

    const merged: Filters = {
      ...parsedFromURL,
      orderby: orderbyQP,
      acustom_fromyears: fromyear,
      acustom_toyears: toyear,
      radius_kms: radiusFromURL !== DEFAULT_RADIUS ? radiusFromURL : undefined,
    };

    // Clean the merged filters
    const cleanMerged: Filters = {};
    Object.entries(merged).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleanMerged[key as keyof Filters] = value;
      }
    });

    // Compare current and previous filters to avoid unnecessary fetches
    const prevFiltersJson = JSON.stringify(filtersRef.current);
    const nextFiltersJson = JSON.stringify(cleanMerged);

    if (prevFiltersJson !== nextFiltersJson) {
      filtersRef.current = cleanMerged;
      setFilters(cleanMerged);
    }

    setPagination((prev) => ({
      ...prev,
      current_page: pageFromURL,
    }));

    const requestKey = JSON.stringify({
      page: pageFromURL,
      filters: cleanMerged,
    });
    if (LAST_GLOBAL_REQUEST_KEY === requestKey) return;
    LAST_GLOBAL_REQUEST_KEY = requestKey;

    // Always load listings when URL changes
    loadListings(pageFromURL, cleanMerged);
  }, [searchKey, pathKey, loadListings]);

  const handleFilterChange = useCallback(
    (newFilters: Filters) => {
      // Create a clean copy of new filters
      const cleanNewFilters: Filters = {};
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanNewFilters[key as keyof Filters] = value;
        }
      });

      // Merge with existing filters but prioritize new values
      const mergedFilters = { ...filtersRef.current, ...cleanNewFilters };

      // Remove any filters that were explicitly set to empty
      Object.keys(newFilters).forEach((key) => {
        if (
          newFilters[key as keyof Filters] === undefined ||
          newFilters[key as keyof Filters] === null ||
          newFilters[key as keyof Filters] === ""
        ) {
          delete mergedFilters[key as keyof Filters];
        }
      });

      // Reset page to 1 when filters change
      setPagination((prev) => ({
        ...prev,
        current_page: 1,
      }));

      setFilters(mergedFilters);
      filtersRef.current = mergedFilters;

      // Always reset to page 1 when filters change
      updateURLWithFilters(mergedFilters, 1);
    },
    [updateURLWithFilters]
  );

  // Mobile offcanvas filter state
  const mobileFiltersRef = useRef<HTMLDivElement>(null);
  const [draftFilters, setDraftFilters] = useState<Filters>({});
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
              <div className="col-lg-3 d-none d-lg-block">
                <div className="filter">
                  <Suspense fallback={<div>Loading filters...</div>}>
                    <CaravanFilter
                      categories={categories}
                      makes={makes}
                      models={models}
                      states={stateOptions}
                      onFilterChange={handleFilterChange}
                      currentFilters={filters}
                    />
                  </Suspense>
                </div>
              </div>

              {/* Listings */}
              {isLoading ? (
                <SkeletonListing />
              ) : (
                <Listing
                  products={products}
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
          <h5 className="offcanvas-title mb-0" id="mobileFiltersLabel">
            Filters
          </h5>
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
              currentFilters={draftFilters}
              onFilterChange={(partial) => {
                setDraftFilters((prev) => ({ ...prev, ...partial }));
              }}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
