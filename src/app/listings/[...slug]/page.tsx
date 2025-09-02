export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { fetchListings } from "@/api/listings/api";

// Types for params/searchParams
type Params = { slug?: string[] };
type SearchParams = Record<string, string | string[] | undefined>;

// Generate metadata (SEO)
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  return metaFromSlug(params.slug || [], searchParams);
}

// Main Listings page
export default async function Listings({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug = [] } = params;

  const filters = parseSlugToFilters(slug, searchParams);

  // ✅ Always use "page", not "paged"
  const page =
    typeof searchParams.page === "string"
      ? parseInt(searchParams.page, 10)
      : Array.isArray(searchParams.page)
      ? parseInt(searchParams.page[0], 10)
      : 1;

  const response = await fetchListings({
    ...filters,
    page,
  });

  return <ListingsPage {...filters} page={page} initialData={response} />;
}
