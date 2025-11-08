 export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProductList } from "@/api/productFullList/api"; // ✅ new
import { fetchProductListings } from "@/api/new-list/api"; // ✅ new-list (IDs only)
import "../../components/ListContent/newList.css";

type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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

  // ✅ Parse filters from slug (state, make, category, etc.)
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // ✅ Load all products once & cache globally
  let allProducts = globalThis.__caravanCache;
  if (!allProducts) {
    const allRes = await fetchProductList();
    allProducts = allRes?.data?.products ?? [];
    globalThis.__caravanCache = allProducts;
    console.log("🗂️ Cached full product list:", allProducts.length);
  }

  // ✅ Fetch new-list format (IDs only)
  const newListRes = await fetchProductListings(filters);
  if (!newListRes || newListRes.success === false) notFound();

  // Combine IDs from featured, non-featured, exclusive, etc.
  const featuredIds = newListRes.data?.featured_products?.map((p) => p.id) ?? [];
  const exclusiveIds = newListRes.data?.exclusive_products?.map((p) => p.id) ?? [];
  const nonFeaturedIds = newListRes.data?.products?.map((p) => p.id) ?? [];

  const mergedIds = [
    ...new Set([...featuredIds, ...exclusiveIds, ...nonFeaturedIds]),
  ];

  // ✅ Merge IDs with cached full product data
  const mergedProducts = mergedIds
    .map((id) => allProducts.find((p) => String(p.id) === String(id)))
    .filter(Boolean);

  // ✅ Paginate locally (50 per page)
  const pageParam = resolvedSearchParams.page;
  const page =
    typeof pageParam === "string"
      ? parseInt(pageParam, 10)
      : Array.isArray(pageParam)
      ? parseInt(pageParam[0] || "1", 10)
      : 1;

  const ITEMS_PER_PAGE = 50;
  const totalPages = Math.ceil(mergedProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = mergedProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // ✅ SEO Meta
  const metaTitle = `Caravans for Sale${
    filters.state ? ` in ${filters.state}` : ""
  }`;
  const metaDescription = `Browse ${mergedProducts.length} caravans${
    filters.state ? ` in ${filters.state}` : ""
  }. Find new and used caravans across Australia.`;

  // ✅ Send merged data directly to ListingsPage (no UI changes needed)
  return (
    <ListingsPage
      {...filters}
      initialData={{
        success: true,
        data: {
          products: paginatedProducts,
          featured_products: [], // can pass if needed
          exclusive_products: [],
          premium_products: [],
        },
      }}
      page={page}
      // totalPages={totalPages}
      metaTitle={metaTitle}
      metaDescription={metaDescription}
    />
  );
}
