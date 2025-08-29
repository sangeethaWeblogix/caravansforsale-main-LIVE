export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";

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
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

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
  const sp = resolvedSearchParams;

  const filters = parseSlugToFilters(slug, sp);

  const paged = Array.isArray(sp?.paged) ? sp.paged[0] : sp?.paged ?? "1";

  return <ListingsPage {...filters} page={paged} />;
}
