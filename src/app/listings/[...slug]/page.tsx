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

  // 1️⃣ Basic path sanity check
  if (
    !slug ||
    !Array.isArray(slug) ||
    slug.length === 0 ||
    slugJoined.match(/[^\w/-]/) || // only letters, numbers, dash, slash allowed
    slugJoined.includes("..") ||
    slugJoined.includes("//") ||
    slugJoined.includes("&") ||
    slugJoined.includes("?") ||
    slugJoined.includes("=")
  ) {
    notFound();
  }

  // 2️⃣ Detect invalid final numeric segment
  const lastPart = slug[slug.length - 1];
  if (/^\d{1,6}$/.test(lastPart)) {
    notFound();
  }

  // 3️⃣ Suburb + postcode rule (e.g., "jacana-3047")
  const suburbPinMatch = slug.find((part) =>
    /^([a-z0-9-]+)-(\d{4})$/.test(part)
  );
  const suburbPinIndex = suburbPinMatch ? slug.indexOf(suburbPinMatch) : -1;

  if (
    suburbPinIndex !== -1 &&
    slug[suburbPinIndex + 1]?.match(/^\d{1,6}$/) // suburb-postcode followed by pure number
  ) {
    notFound();
  }

  // 4️⃣ Maximum path depth (state, suburb, price, length, atm, sleeps, etc.)
  if (slug.length > 8) {
    notFound();
  }

  // 5️⃣ Validate known top-level categories (only single if used alone)
  const singleCategoryRoutes = [
    "off-road-category",
    "used-category",
    "new-category",
    "pop-top-category",
    "hybrid-category",
    "motorhome-category",
    "camper-category",
  ];

  if (slug.length > 1 && singleCategoryRoutes.includes(slug[0])) {
    notFound();
  }

  // 6️⃣ Parse slug to filter structure
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // 🚫 Reject clear gibberish or numeric segments (except valid filters)
  const invalidPatterns = [
    /^[a-z0-9]{1,4}$/, // short random text like "dfg2"
    /^\d+$/, // only numbers
  ];

  const allowedFilterPrefixes = [
    "under-",
    "over-",
    "atm-",
    "sleeps-",
    "length",
    "width",
    "weight",
    "price",
  ];

  const looksInvalid = slug.some((part) => {
    const isAllowedFilter = allowedFilterPrefixes.some((prefix) =>
      part.startsWith(prefix)
    );
    return !isAllowedFilter && invalidPatterns.some((r) => r.test(part));
  });

  if (!filters || Object.keys(filters).length === 0 || looksInvalid) {
    notFound();
  }

  // 7️⃣ Validate pagination
  const fullQuery = Object.entries(resolvedSearchParams)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
    .join("&");
  const page = ensureValidPage(resolvedSearchParams.page, fullQuery);

  // 8️⃣ Clean up ?page=1
  const pageParam = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page;

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

    redirect(cleanPath);
  }

  // 9️⃣ Fetch listings
  const response = await fetchListings({ ...filters, page });

  // 🚫 Show 404 if no valid results

  // ✅ Render listings page
  return <ListingsPage {...filters} page={page} initialData={response} />;
}
