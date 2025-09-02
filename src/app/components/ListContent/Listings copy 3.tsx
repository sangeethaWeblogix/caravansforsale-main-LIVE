"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { fetchListings } from "../../../api/listings/api";
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

type Props = Filters & { page?: string | number };

/** ------------ Component ------------ */

export default function ListingsPage({ ...incomingFilters }: Props) {
  const DEFAULT_RADIUS = 50 as const;

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

    const path = pathKey;
    const slugParts = path.split("/listings/")[1]?.split("/") || [];

    // Convert Next.js searchParams into a plain object
    const query: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const parsed = parseSlugToFilters(slugParts, query);
    console.log("metsparsed", parsed);

    const merged = { ...parsed, ...incomingFilters };
    filtersRef.current = merged;
    setFilters(merged);
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
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
    }
  }, []);

  const calledOnceRef = useRef(false);

  useEffect(() => {
    console.log("URL changed. Parsing filters and reloading listings.");

    if (!calledOnceRef.current) {
      loadListings();
      calledOnceRef.current = true;
    }
  }, [pathname, searchParams]);

  const handleNextPage = () => {
    if (pagination.current_page < pagination.total_pages) {
      const nextPage = pagination.current_page + 1;
      console.log("🟢 Triggering updateURLWithFilters with page:", nextPage);
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
          setProducts((response.data?.products as Product[]) ?? []);
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
          setMetaDescription("We couldn’t find listings for your filters.");
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

  /* ---- SINGLE source of truth: URL -> fetch ----
     This is the only effect that calls loadListings.
     It also de-dupes across StrictMode remounts via LAST_GLOBAL_REQUEST_KEY. */

  const searchKey = searchParams.toString();
  const pathKey = pathname;

  const incomingFiltersRef = useRef<Filters>(incomingFilters);
  useEffect(() => {
    const prev = JSON.stringify(incomingFiltersRef.current);
    const next = JSON.stringify(incomingFilters);
    if (prev !== next) incomingFiltersRef.current = incomingFilters;
  }, [incomingFilters]);

  useEffect(() => {
    if (!initializedRef.current) return;

    const path = pathKey;
    const slugParts = path.split("/listings/")[1]?.split("/") || [];

    // ✅ Here you DO pass query
    const query: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const parsedFromURL = parseSlugToFilters(slugParts, query);
    console.log("metsparsed2", parsedFromURL);

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
      ...incomingFiltersRef.current,
      orderby: orderbyQP,
      acustom_fromyears: fromyear,
      acustom_toyears: toyear,

      radius_kms: radiusFromURL !== DEFAULT_RADIUS ? radiusFromURL : undefined,
    };

    // Compare current and previous filters to avoid unnecessary fetches
    const prevFiltersJson = JSON.stringify(filtersRef.current);
    const nextFiltersJson = JSON.stringify(merged);

    if (prevFiltersJson !== nextFiltersJson) {
      filtersRef.current = merged;
      setFilters(merged);
    }

    setPagination((prev) => ({ ...prev, current_page: pageFromURL }));

    const requestKey = JSON.stringify({ page: pageFromURL, filters: merged });
    if (LAST_GLOBAL_REQUEST_KEY === requestKey) return;
    LAST_GLOBAL_REQUEST_KEY = requestKey;
    initializedRef.current = true; // ✅ only here

    loadListings(pageFromURL, merged);
  }, [searchKey, pathKey, loadListings]);

  const handleFilterChange = useCallback(
    (newFilters: Filters) => {
      const mergedFilters = { ...filtersRef.current, ...newFilters };

      if ("orderby" in newFilters && !newFilters.orderby) {
        mergedFilters.orderby = undefined; // ✅ no `any`, no `delete`
      }

      if ("acustom_fromyears" in newFilters && !newFilters.acustom_fromyears) {
        mergedFilters.acustom_fromyears = undefined;
      }
      if ("acustom_toyears" in newFilters && !newFilters.acustom_toyears) {
        mergedFilters.acustom_toyears = undefined;
      }
      setFilters(mergedFilters);
      filtersRef.current = mergedFilters;

      const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
      setPagination({
        current_page: pageFromURL,
        total_pages: 1,
        total_items: 0,
        per_page: 12,
        total_products: 0,
      });

      updateURLWithFilters(mergedFilters, 1);
    },
    [searchParams, updateURLWithFilters, loadListings]
  );
  // first load from URL

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
                      onFilterChange={(partial) => {
                        handleFilterChange(partial);
                      }}
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
