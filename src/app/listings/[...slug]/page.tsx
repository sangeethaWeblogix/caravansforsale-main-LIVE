export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { fetchListings } from "@/api/listings/api";
import { ensureValidPage } from "@/utils/seo/validatePage";
import { redirect } from "next/navigation"; // ✅ only redirect, no notFound()

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

  // ✅ Validate slug — if broken or invalid → redirect to /listings
  // if (
  //   !slug ||
  //   !Array.isArray(slug) ||
  //   slug.length === 0 ||
  //   slug.join("").match(/[^\w-]/) ||
  //   /[&*%$#@!=<>?,]/.test(slug.join("")) ||
  //   slug.join("").includes("..") ||
  //   slug.join("").includes("//")
  // ) {
  //   redirect("/404Page");
  // }

  // ✅ Build query and validate page
  const fullQuery = Object.entries(resolvedSearchParams)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
    .join("&");

  const page = ensureValidPage(resolvedSearchParams.page, fullQuery);
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // ✅ Fetch listings
  const response = await fetchListings({ ...filters, page });

  // ✅ If API fails or products are empty → redirect to /listings
  // if (
  //   !response ||
  //   response.success === false ||
  //   !response.data ||
  //   !Array.isArray(response.data.products) ||
  //   response.data.products.length === 0
  // ) {
  //   redirect("/404Page");
  // }

  // ✅ Otherwise render as usual
  return <ListingsPage {...filters} page={page} initialData={response} />;
}
