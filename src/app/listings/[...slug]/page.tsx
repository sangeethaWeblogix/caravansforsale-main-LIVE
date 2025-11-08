 export const dynamic = "force-dynamic"; // ✅ Always render fresh (disable static cache)

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "@/app/components/urlBuilder";
import { metaFromSlug } from "@/utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProductList } from "@/api/productFullList/api";
import { fetchProductListings } from "@/api/new-list/api";
import "@/app/components/ListContent/newList.css";

/** Route parameter & query definitions */
type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** 🔹 Dynamic SEO Metadata */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  return metaFromSlug(resolvedParams.slug || [], resolvedSearchParams);
}

/** 🔹 Main Page Component (Server Component) */
export default async function Listings({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const { slug = [] } = resolvedParams;

  // ✅ Validate slug to avoid malformed routes
  const slugJoined = slug.join("/");
  if (
    slug.length > 0 &&
    (
      !Array.isArray(slug) ||
      slugJoined.match(/[^\w/-]/) ||
      slugJoined.includes("..") ||
      slugJoined.includes("//") ||
      slugJoined.includes("&") ||
      slugJoined.includes("?") ||
      slugJoined.includes("=")
    )
  ) {
    notFound();
  }

  // ✅ Convert slug → filters (category, state, make, etc.)
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // ✅ Get page number from query (default: 1)
  const pageParam = resolvedSearchParams.page;
  const page =
    typeof pageParam === "string"
      ? parseInt(pageParam, 10)
      : Array.isArray(pageParam)
      ? parseInt(pageParam[0] || "1", 10)
      : 1;

  // ✅ Load full product list once (cache globally across requests)
  let allProducts = globalThis.__caravanCache;
  if (!allProducts) {
    try {
      const allRes = await fetchProductList();
      allProducts = allRes?.data?.products ?? [];
      globalThis.__caravanCache = allProducts;
      console.log(`🗂️ Cached ${allProducts.length} total products in memory`);
    } catch (error) {
      console.error("❌ Failed to load full product list:", error);
      allProducts = [];
    }
  }

  // ✅ Fetch filtered product ID groups
  let newListRes;
  try {
    newListRes = await fetchProductListings(filters);
  } catch (error) {
    console.error("❌ new-list API failed:", error);
    notFound();
  }

  if (!newListRes || newListRes.success === false) {
    notFound();
  }

  // ✅ Extract IDs by category (featured / exclusive / normal)
  const featuredIds = newListRes.data?.featured_products?.map((p) => p.id) ?? [];
  const exclusiveIds =
    newListRes.data?.exclusive_products?.map((p) => p.id) ?? [];
  const nonFeaturedIds = newListRes.data?.products?.map((p) => p.id) ?? [];

  const mergedIds = [...new Set([...featuredIds, ...exclusiveIds, ...nonFeaturedIds])];

  // ✅ Merge IDs with cached full product list
  const mergedProducts = mergedIds
    .map((id) => allProducts.find((p) => String(p.id) === String(id)))
    .filter(Boolean);

  // ✅ Pagination
  const ITEMS_PER_PAGE = 50;
  const totalPages = Math.max(1, Math.ceil(mergedProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = mergedProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // ✅ SEO Meta generation
  const metaTitle =
    mergedProducts.length > 0
      ? `${filters.category ? filters.category + " " : ""}Caravans for Sale${
          filters.state ? " in " + filters.state : ""
        }`
      : "Caravans for Sale | Find Your Perfect Caravan";

  const metaDescription =
    mergedProducts.length > 0
      ? `Explore ${mergedProducts.length} caravans for sale${
          filters.state ? " in " + filters.state : ""
        }. Find new, used and premium caravans at great prices.`
      : "No caravans found for your selected filters. Try browsing other states or makes.";

  // ✅ Return hydrated client page (ListingsPage is 'use client')
  return (
    <ListingsPage
      {...filters}
      initialData={{
        success: true,
        data: {
          products: paginatedProducts,
          featured_products: mergedProducts.filter((p) =>
            featuredIds.includes(String(p.id))
          ),
          exclusive_products: mergedProducts.filter((p) =>
            exclusiveIds.includes(String(p.id))
          ),
          premium_products: [],
        },
      }}
      page={page}
      metaTitle={metaTitle}
      metaDescription={metaDescription}
    />
  );
}
