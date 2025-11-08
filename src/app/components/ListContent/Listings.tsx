 "use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { fetchListings } from "@/api/listings/api";
import { fetchProductListings } from "@/api/new-list/api";
import Listing from "./LisitingContent";
import CaravanFilter from "../../components/CaravanFilter";
import SkeletonListing from "../../components/skelton";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import Head from "next/head";
import "./newList.css";
import type { Item as Product, Filters } from "@/api/new-list/api";
import ExculisiveContent from "./exculsiveContent";

const ITEMS_PER_PAGE = 50;

interface Pagination {
  current_page: number;
  total_pages: number;
  total_products: number;
  per_page: number;
}

export default function ListingsPage({
  metaTitle,
  metaDescription,
  initialData,
  page,
}: {
  metaTitle?: string;
  metaDescription?: string;
  initialData: any;
  page: number;
}) {
  const [filters, setFilters] = useState<Filters>({});
  const [msid, setMsid] = useState<string | null>(null);

  const [isMainLoading, setIsMainLoading] = useState(true);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);
  const [isPremiumLoading, setIsPremiumLoading] = useState(true);

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [exclusiveProducts, setExclusiveProducts] = useState<Product[]>([]);
  const [premiumProducts, setPremiumProducts] = useState<Product[]>([]);
  const [nonFeaturedProducts, setNonFeaturedProducts] = useState<Product[]>([]);
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);

  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [makes, setMakes] = useState<{ name: string; slug: string }[]>([]);
  const [models, setModels] = useState<{ name: string; slug: string }[]>([]);
  const [states, setStates] = useState<{ name: string; value: string }[]>([]);
  const [emptyProduct, setEmptyProduct] = useState(false);
  const mobileFiltersRef = useRef<HTMLDivElement>(null);

  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_pages: 1,
    total_products: 0,
    per_page: ITEMS_PER_PAGE,
  });

  // 🧩 Generate msid for session
  useEffect(() => {
    if (pagination.current_page > 1) {
      const newMsid = uuidv4();
      setMsid(newMsid);
      sessionStorage.setItem("msid", newMsid);
    } else {
      setMsid(null);
      sessionStorage.removeItem("msid");
    }
  }, [pagination.current_page]);

  // 🧠 Fetch all listings and filter metadata
  const loadAllData = useCallback(async () => {
    console.log("🚀 Loading listings data...");
    setIsMainLoading(true);
    setIsFeaturedLoading(true);
    setIsPremiumLoading(true);

    try {
      const productRes = await fetchProductListings(filters);
      const productData = productRes?.data ?? {};

      const featured = productData.featured_products ?? [];
      const exclusive = productData.exclusive_products ?? [];
      const premium = productData.premium_products ?? [];
      const nonFeatured = productData.products ?? [];

      setFeaturedProducts(featured);
      setExclusiveProducts(exclusive);
      setPremiumProducts(premium);
      setNonFeaturedProducts(nonFeatured);

      // Filters metadata
      const filterRes = await fetchListings(filters);
      const filterData = filterRes?.data ?? {};
      setCategories(filterData.all_categories ?? []);
      setMakes(filterData.make_options ?? []);
      setModels(filterData.model_options ?? []);
      setStates(filterData.states ?? []);

      // Pagination setup
      const totalPages = Math.ceil(nonFeatured.length / ITEMS_PER_PAGE);
      setPaginatedProducts(nonFeatured.slice(0, ITEMS_PER_PAGE));
      setPagination({
        current_page: 1,
        total_pages: totalPages,
        total_products: nonFeatured.length,
        per_page: ITEMS_PER_PAGE,
      });

      setEmptyProduct(nonFeatured.length === 0);
    } catch (err) {
      console.error("❌ Error fetching listings:", err);
      setEmptyProduct(true);
    } finally {
      setIsMainLoading(false);
      setIsFeaturedLoading(false);
      setIsPremiumLoading(false);
    }
  }, [filters]);

  // ✅ Unified Load Effect (SSR + Client Fallback)
  useEffect(() => {
    const runLoad = async () => {
      setIsMainLoading(true);
      setIsFeaturedLoading(true);
      setIsPremiumLoading(true);

      if (initialData?.data?.products?.length > 0) {
        // Use SSR/Initial data immediately
        const productData = initialData.data;
        setFeaturedProducts(productData.featured_products ?? []);
        setExclusiveProducts(productData.exclusive_products ?? []);
        setPremiumProducts(productData.premium_products ?? []);
        setNonFeaturedProducts(productData.products ?? []);

        const totalPages = Math.ceil(
          (productData.products?.length ?? 0) / ITEMS_PER_PAGE
        );
        setPaginatedProducts(productData.products?.slice(0, ITEMS_PER_PAGE) ?? []);
        setPagination({
          current_page: page || 1,
          total_pages: totalPages,
          total_products: productData.products?.length ?? 0,
          per_page: ITEMS_PER_PAGE,
        });
        setEmptyProduct(productData.products?.length === 0);
      } else {
        // Fallback to client fetch
        await loadAllData();
      }

      // After render, trigger a soft refresh for latest data
      setTimeout(() => {
        loadAllData();
      }, 1000);
    };

    runLoad();
  }, [initialData, loadAllData, page]);

  // ✅ Pagination logic
  const handleNextPage = useCallback(() => {
    if (pagination.current_page < pagination.total_pages) {
      const nextPage = pagination.current_page + 1;
      const start = (nextPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      setPaginatedProducts(nonFeaturedProducts.slice(start, end));
      setPagination((p) => ({ ...p, current_page: nextPage }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pagination, nonFeaturedProducts]);

  const handlePrevPage = useCallback(() => {
    if (pagination.current_page > 1) {
      const prevPage = pagination.current_page - 1;
      const start = (prevPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      setPaginatedProducts(nonFeaturedProducts.slice(start, end));
      setPagination((p) => ({ ...p, current_page: prevPage }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pagination, nonFeaturedProducts]);

  // ✅ Filters
  const handleFilterChange = (newFilters: any) => {
    const normalizedFilters: Record<string, string> = {};
    for (const [key, value] of Object.entries(newFilters)) {
      if (value !== undefined && value !== null) {
        normalizedFilters[key] = String(value);
      }
    }
    setFilters((prev) => ({ ...prev, ...normalizedFilters }));
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    loadAllData();
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
            <div className="text-sm text-gray-600 header">
              <Link href="/" className="hover:underline">
                Home
              </Link>{" "}
              &gt; <span className="font-medium text-black"> Listings</span>
            </div>

            <h1 className="page-title">Caravans for Sale</h1>

            <div className="row">
              {/* Sidebar */}
              <div className="col-lg-3">
                <div className="filter">
                  <Suspense fallback={<div>Loading filters...</div>}>
                    <CaravanFilter
                      categories={categories}
                      makes={makes}
                      models={models}
                      states={states}
                      onFilterChange={handleFilterChange}
                      currentFilters={filters}
                      setIsFeaturedLoading={setIsFeaturedLoading}
                      setIsPremiumLoading={setIsPremiumLoading}
                      setIsMainLoading={setIsMainLoading}
                    />
                  </Suspense>
                </div>
              </div>

              {/* Listings */}
              {isMainLoading || isFeaturedLoading || isPremiumLoading ? (
                <div className="col-lg-6">
                  <SkeletonListing count={8} />
                </div>
              ) : paginatedProducts.length > 0 ? (
                <Listing
                  products={paginatedProducts}
                  data={exclusiveProducts}
                  pagination={pagination}
                  onNext={handleNextPage}
                  onPrev={handlePrevPage}
                  onFilterChange={handleFilterChange}
                  currentFilters={filters}
                  preminumProducts={premiumProducts}
                  fetauredProducts={featuredProducts}
                  exculisiveProducts={exclusiveProducts}
                  isMainLoading={isMainLoading}
                  isFeaturedLoading={isFeaturedLoading}
                  isPremiumLoading={isPremiumLoading}
                />
              ) : emptyProduct ? (
                <ExculisiveContent
                  data={exclusiveProducts}
                  pagination={pagination}
                  onNext={handleNextPage}
                  onPrev={handlePrevPage}
                  isPremiumLoading={isPremiumLoading}
                />
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Filter Drawer */}
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
              states={states}
              onFilterChange={handleFilterChange}
              currentFilters={filters}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
