export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { fetchListings } from "@/api/listings/api";
// import { fetchListings } from "@/api/listings/api";

// Define types for the async params
type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Generate metadata (SEO)
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  // Await the params and searchParams
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  return metaFromSlug(resolvedParams.slug || [], resolvedSearchParams);
}

// Main Listings page
export default async function Listings({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  // Await both params and searchParams
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const { slug = [] } = resolvedParams;

  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // ✅ Always use "page", not "paged"
  const page =
    typeof resolvedSearchParams.page === "string"
      ? parseInt(resolvedSearchParams.page, 10)
      : Array.isArray(resolvedSearchParams.page)
      ? parseInt(resolvedSearchParams.page[0], 10)
      : 1;

  const response = await fetchListings({
    ...filters,
    page,
  });
  // return <ListingsPage {...filters} page={page} />;

  return <ListingsPage {...filters} page={page} initialData={response} />;
}
