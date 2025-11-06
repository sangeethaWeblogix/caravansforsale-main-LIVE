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

  // ✅ Allow empty slug for root listings page
  if (
    slug.length > 0 &&
    (
      !Array.isArray(slug) ||
      slugJoined.match(/[^\w/-]/) || // only letters, numbers, dash, slash allowed
      slugJoined.includes("..") ||
      slugJoined.includes("//") ||
      slugJoined.includes("&") ||
      slugJoined.includes("?") ||
      slugJoined.includes("=")
    )
  ) {
    notFound();
  }

  // ✅ Only reject truly invalid gibberish, not normal words like "avan"
  if (slug.length > 0) {
    const invalidSegment = slug.some((part) => {
      const lower = part.toLowerCase();

      // Allowed patterns (filters, suburb-postcode, etc.)
      const allowedPatterns = [
        /-state$/,
        /-category$/,
        /^under-\d+$/,
        /^over-\d+$/,
        /^atm-\d+$/,
        /^sleeps-\d+$/,
        /^length-\d+$/,
        /^width-\d+$/,
        /^weight-\d+$/,
        /^price-\d+$/,
        /^([a-z0-9-]+)-\d{4}$/, // suburb-postcode like "jacana-3047"
      ];

      const isAllowed = allowedPatterns.some((r) => r.test(lower));

      // ❌ Reject only if it’s pure numeric or nonsense symbols
      const looksGibberish =
        /^[0-9]+$/.test(lower) || /^[^a-z0-9-]+$/.test(lower);

      return looksGibberish && !isAllowed;
    });

    if (invalidSegment) notFound();

    // Reject final numeric-only segment like /listings/123/
    const lastPart = slug[slug.length - 1];
    if (/^\d+$/.test(lastPart)) notFound();

    // Suburb + postcode rule safety
    const suburbPinMatch = slug.find((part) =>
      /^([a-z0-9-]+)-(\d{4})$/.test(part)
    );
    const suburbPinIndex = suburbPinMatch ? slug.indexOf(suburbPinMatch) : -1;
    if (
      suburbPinIndex !== -1 &&
      slug[suburbPinIndex + 1]?.match(/^\d{1,6}$/)
    ) {
      notFound();
    }

    // Block just "suburb" or "suburbs"
    const hasInvalidSuburbWord = slug.some((part) => {
      if (/^[a-z0-9-]+-\d{4}-suburb$/i.test(part)) return false;
      if (/^[a-z0-9-]+-suburb$/i.test(part)) return false;
      return /(^|\b)(suburb|suburbs)\b$/i.test(part);
    });
    if (hasInvalidSuburbWord) notFound();
  }

  // 6️⃣ Parse slug into filters
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // If filters are empty, that’s okay — we still render listings (like brand-only pages)
  // Don’t block here anymore

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
        if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
        else params.append(key, value);
      }
    });
    const cleanQuery = params.toString();
    const cleanPath = `/listings/${slug.join("/")}${
      cleanQuery ? `?${cleanQuery}` : ""
    }`;
    redirect(cleanPath);
  }

  // 9️⃣ Fetch listings data
  const response = await fetchListings({ ...filters, page });

  // ✅ Always render listings page even if data empty
  return <ListingsPage {...filters} page={page} initialData={response} />;
}
