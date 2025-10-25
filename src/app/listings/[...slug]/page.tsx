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

  const slugJoined = slug.join("/");

  // 1️⃣ Basic safety checks
  if (
    !slug ||
    !Array.isArray(slug) ||
    slug.length === 0 ||
    slugJoined.match(/[^\w/-]/) || // allow only letters, numbers, -, /
    slugJoined.includes("..") ||
    slugJoined.includes("//") ||
    slugJoined.includes("&") ||
    slugJoined.includes("?") ||
    slugJoined.includes("=")
  ) {
    notFound();
  }

  // 2️⃣ Detect invalid "extra number" at the end of the URL
  // Example: /listings/.../55 or /listings/.../123/
  const lastPart = slug[slug.length - 1];

  // Match pure numbers (1–5 digits typical)
  if (/^\d{1,6}$/.test(lastPart)) {
    notFound(); // 🚫 Invalid extra numeric path
  }

  // 3️⃣ Suburb + pincode check — ensure nothing comes after
  const suburbPinMatch = slug.find((part) =>
    /^([a-z0-9-]+)-(\d{4})$/.test(part)
  );
  const suburbPinIndex = suburbPinMatch ? slug.indexOf(suburbPinMatch) : -1;

  if (suburbPinIndex !== -1 && suburbPinIndex < slug.length - 1) {
    notFound(); // 🚫 Example: /windsor-2756/55 → invalid
  }

  // 4️⃣ Maximum segments allowed — prevent overly deep paths
  if (slug.length > 5) {
    notFound();
  }
  // ✅ 4️⃣ Parse slug into filters
  const filters = parseSlugToFilters(slug, resolvedSearchParams);
  if (!filters || Object.keys(filters).length === 0) {
    notFound();
  }

  // ✅ 5️⃣ Build query
  const fullQuery = Object.entries(resolvedSearchParams)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
    .join("&");

  const page = ensureValidPage(resolvedSearchParams.page, fullQuery);

  // ✅ 6️⃣ Fetch listings
  const response = await fetchListings({ ...filters, page });

  // ✅ 7️⃣ Optional: show 404 if no data
  // if (!response?.data?.products?.length) {
  //   notFound();
  // }

  return <ListingsPage {...filters} page={page} initialData={response} />;
}
