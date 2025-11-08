 export const dynamic = "force-dynamic"; // always render fresh
export const revalidate = 1800; // optional cache revalidation (30 min)

import ListingsPage from "@/app/components/ListContent/Listings";
import { metaFromSlug } from "@/utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProductList } from "@/api/productFullList/api";
import { fetchProductListings } from "@/api/new-list/api";
import "@/app/components/ListContent/newList.css";

/** 
 * This handles the root /listings page (no slug).
 * Behaves the same as /listings/[...slug], but with default filters.
 */

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** 🔹 SEO Meta for root listings */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  return metaFromSlug([], resolvedSearchParams);
}

/** 🔹 Main /listings Page (Server Component) */
export default async function Listings({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;

  // ✅ Default empty filters for the root page
  const filters: Record<string, string | string[] | undefined> = {
    category: resolvedSearchParams.category || "",
    make: resolvedSearchParams.make || "",
    state: resolvedSearchParams.state || "",
    region: resolvedSearchParams.region || "",
    suburb: resolvedSearchParams.suburb || "",
    from_price: resolvedSearchParams.from_price || "",
    to_price: resolvedSearchParams.to_price || "",
    sleeps: resolvedSearchParams.sleeps || "",
    acustom_fromyears: resolvedSearchParams.acustom_fromyears || "",
    acustom_toyears: resolvedSearchParams.acustom_toyears || "",
  };

  // ✅ Parse pagination
  const pageParam = resolvedSearchParams.page;
  const page =
    typeof pageParam === "string"
      ? parseInt(pageParam, 10)
      : Array.isArray(pageParam)
      ? parseInt(pageParam[0] || "1", 10)
      : 1;

  // ✅ Cache full product list in memory
  let allProducts = globalThis.__caravanCache;
  if (!allProducts) {
    try {
      const allRes = await fetchProductList();
      allProducts = allRes?.data?.products ?? [];
      globalThis.__caravanCache = allProducts;
      console.log(`🗂️ Cached ${allProducts.length} products globally`);
    } catch (error) {
      console.error("❌ Error fetching full product list:", error);
      allProducts = [];
    }
  }

  // ✅ Fetch ID-based listings (filtered)
  let newListRes;
  try {
    newListRes = await fetchProductListings(filters);
  } catch (error) {
    console.error("❌ Error fetching filtered listings:", error);
    notFound();
  }

  if (!newListRes || newListRes.success === false) {
    notFound();
  }

  // ✅ Extract ID sets
  const featuredIds = newListRes.data?.featured_products?.map((p) => p.id) ?? [];
  const exclusiveIds =
    newListRes.data?.exclusive_products?.map((p) => p.id) ?? [];
  const nonFeaturedIds = newListRes.data?.products?.map((p) => p.id) ?? [];

  const mergedIds = [...new Set([...featuredIds, ...exclusiveIds, ...nonFeaturedIds])];

  // ✅ Merge IDs → full cached product data
  const mergedProducts = mergedIds
    .map((id) => allProducts.find((p) => String(p.id) === String(id)))
    .filter(Boolean);

  // ✅ Pagination logic
  const ITEMS_PER_PAGE = 50;
  const totalPages = Math.max(1, Math.ceil(mergedProducts.length / ITEMS_PER_PAGE));

  const paginatedProducts = mergedProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // ✅ SEO meta title and description
  const metaTitle = "Caravans for Sale in Australia";
  const metaDescription = `Browse ${mergedProducts.length} new and used caravans across Australia. Filter by make, model, or location to find your perfect caravan.`;

  // ✅ Render hydrated client component
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
