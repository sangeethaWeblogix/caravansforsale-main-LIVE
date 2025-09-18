export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { fetchListings } from "@/api/listings/api";
import { notFound } from "next/navigation";
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
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const { slug = [] } = resolvedParams;
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // 🚫 validate `page`
  let page = 1;
  if (resolvedSearchParams.page) {
    const raw =
      typeof resolvedSearchParams.page === "string"
        ? resolvedSearchParams.page
        : Array.isArray(resolvedSearchParams.page)
        ? resolvedSearchParams.page[0]
        : "";

    // only digits allowed
    if (!/^[0-9]+$/.test(raw)) {
      notFound();
    }

    page = Number(raw);

    if (!Number.isInteger(page) || page < 1) {
      notFound();
    }
  }

  // 🚫 block extra params besides "page"
  const keys = Object.keys(resolvedSearchParams);
  if (keys.length > 1 || (keys.length === 1 && keys[0] !== "page")) {
    notFound();
  }

  const response = await fetchListings({
    ...filters,
    page,
  });

  return <ListingsPage {...filters} page={page} initialData={response} />;
}
