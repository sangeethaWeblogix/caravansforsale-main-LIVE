export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/new-list/listing";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { fetchListings } from "@/api/listings/api";
import { ensureValidPage } from "@/utils/seo/validatePage";
import { validateFilters } from "@/utils/validateFilters"; // 👈 added
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

  // --- 1️⃣ Basic slug sanitization ---
  const slugJoined = slug.join("");
  if (
    !slug ||
    !Array.isArray(slug) ||
    slug.length === 0 ||
    slugJoined.match(/[^\w-]/) ||
    /[&*%$#@!=<>?,]/.test(slugJoined) ||
    slugJoined.includes("..") ||
    slugJoined.includes("//")
  ) {
    notFound();
  }

  // --- 2️⃣ Parse filters ---
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // --- 3️⃣ Build query for ensureValidPage ---
  const fullQuery = Object.entries(resolvedSearchParams)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
    .join("&");

  const page = ensureValidPage(resolvedSearchParams.page, fullQuery);

  // --- 4️⃣ Validate canonical URL structure ---
  const isValid = validateFilters(filters);
  if (!isValid) {
    // 👇 If URL pattern or filter combination is invalid
    return notFound();
  }

  // --- 5️⃣ Fetch listings ---
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
