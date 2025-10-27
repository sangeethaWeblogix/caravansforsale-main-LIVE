export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { fetchListings } from "@/api/listings/api";
import { ensureValidPage } from "@/utils/seo/validatePage";
import { notFound, redirect } from "next/navigation";

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
  const lastPart = slug[slug.length - 1];
  if (/^\d{1,6}$/.test(lastPart)) {
    notFound();
  }

  // 3️⃣ Suburb + pincode check
  const suburbPinMatch = slug.find((part) =>
    /^([a-z0-9-]+)-(\d{4})$/.test(part)
  );
  const suburbPinIndex = suburbPinMatch ? slug.indexOf(suburbPinMatch) : -1;

  if (
    suburbPinIndex !== -1 &&
    slug[suburbPinIndex + 1]?.match(/^\d{1,6}$/) // only block pure numeric after suburb-pin
  ) {
    notFound();
  }

  // 4️⃣ Maximum depth
  if (slug.length > 5) {
    notFound();
  }

  // 5️⃣ Parse slug into filters
  const filters = parseSlugToFilters(slug, resolvedSearchParams);
  if (!filters || Object.keys(filters).length === 0) {
    notFound();
  }

  // 6️⃣ Determine current page
  const fullQuery = Object.entries(resolvedSearchParams)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
    .join("&");

  const page = ensureValidPage(resolvedSearchParams.page, fullQuery);

  // 🚀 7️⃣ Type-safe extract page param
  const pageParam = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page;

  // 🚀 8️⃣ Enhanced redirect: remove ?page=1 but keep other filters
  if (pageParam === "1") {
    const params = new URLSearchParams();

    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (key !== "page" && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.append(key, value);
        }
      }
    });

    const cleanQuery = params.toString();
    const cleanPath = `/listings/${slug.join("/")}${
      cleanQuery ? `?${cleanQuery}` : ""
    }`;

    redirect(cleanPath); // 🔁 308 permanent redirect
  }

  // 9️⃣ Fetch data
  const response = await fetchListings({ ...filters, page });

  if (!response?.data?.products?.length) notFound();

  return <ListingsPage {...filters} page={page} initialData={response} />;
}
