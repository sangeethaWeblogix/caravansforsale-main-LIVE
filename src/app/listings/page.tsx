 export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../components/urlBuilder";
import { metaFromSlug } from "../../utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { fetchProductListings } from "@/api/new-list/api";
import { notFound } from "next/navigation";
import "../components/ListContent/newList.css";

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
  const slugJoined = slug.join("/");

  // ✅ Allow empty slug — this means root /listings
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

  // ✅ Parse filters (state, region, category etc.)
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // ✅ Handle page safely
  const pageParam = resolvedSearchParams.page;
  const page =
    typeof pageParam === "string"
      ? parseInt(pageParam, 10)
      : Array.isArray(pageParam)
      ? parseInt(pageParam[0] || "1", 10)
      : 1;

  // ✅ Fetch merged listing data
  let response;
  try {
    response = await fetchProductListings(filters);
  } catch (error) {
    console.error("❌ Error fetching listings:", error);
    notFound();
  }

  if (!response || response.success === false) {
    notFound();
  }

  // ✅ Dynamic meta title & description
  const metaTitle =
    response?.data?.products?.length > 0
      ? `${filters.category ? filters.category + " " : ""}Caravans for Sale${
          filters.state ? " in " + filters.state : ""
        }`
      : "Caravans for Sale | Find Your Perfect Caravan";

  const metaDescription =
    response?.data?.products?.length > 0
      ? `Explore ${response.data.products.length} caravans for sale${
          filters.state ? " in " + filters.state : ""
        }. Find new, used and premium caravans at great prices.`
      : "No caravans found for your selected filters. Try exploring other states or categories.";

  // ✅ Send data + meta to main ListingPage
  return (
    <ListingsPage
      {...filters}
      initialData={response}
      page={page}
      metaTitle={metaTitle}
      metaDescription={metaDescription}
    />
  );
}
