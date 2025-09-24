export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { fetchListings } from "@/api/listings/api";
import { notFound } from "next/navigation";

// Types
type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// SEO metadata
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

// Page
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

  // ✅ Try parsing filters
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // ✅ Validation: if nothing useful parsed → 404
  if (!filters || Object.keys(filters).length === 0) {
    // allow empty slug (root listings)
    if (slug.length === 0) {
      // fine → /listings
    } else if (slug.length === 1 && slug[0] === "active") {
      // fine → /listings/active
    } else {
      return notFound();
    }
  }

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

  return <ListingsPage {...filters} page={page} initialData={response} />;
}
