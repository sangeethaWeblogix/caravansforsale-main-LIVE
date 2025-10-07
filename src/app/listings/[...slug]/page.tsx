export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { fetchListings } from "@/api/listings/api";
import { ensureValidPage } from "@/utils/seo/validatePage";
import { notFound } from "next/navigation";

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

  // ✅ Slug validation
  if (
    !slug ||
    !Array.isArray(slug) ||
    slug.length === 0 ||
    slug.join("").match(/[^\w-]/) ||
    /[&*%$#@!=<>?,]/.test(slug.join("")) ||
    slug.join("").includes("..") ||
    slug.join("").includes("//")
  ) {
    notFound();
  }

  // ✅ Build query and validate page
  const fullQuery = Object.entries(resolvedSearchParams)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
    .join("&");

  const page = ensureValidPage(resolvedSearchParams.page, fullQuery);
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  const response = await fetchListings({ ...filters, page });
  if (
    !response ||
    response.success === false ||
    !response.data ||
    !Array.isArray(response.data.products) ||
    response.data.products.length === 0
  ) {
    notFound();
  }

  return <ListingsPage {...filters} page={page} initialData={response} />;
}
