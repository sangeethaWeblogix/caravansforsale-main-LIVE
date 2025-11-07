 export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { fetchListings } from "@/api/listings/api";
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

  // ✅ Allow empty slug for root listings page
  if (
    slug.length > 0 &&
    (
      !Array.isArray(slug) ||
      slugJoined.match(/[^\w/-]/) ||
      slugJoined.includes("..") ||
      slugJoined.includes("//") ||
      slugJoined.includes("&") ||
      slugJoined.includes("?") ||
      slugJoined.includes("=")
    )
  ) {
    notFound();
  }

  // ❌ Reject gibberish slugs
  if (slug.length > 0) {
    const invalidSegment = slug.some((part) => {
      const lower = part.toLowerCase();
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
        /^([a-z0-9-]+)-\d{4}$/,
      ];
      const isAllowed = allowedPatterns.some((r) => r.test(lower));
      const looksGibberish =
        /^[0-9]+$/.test(lower) || /^[^a-z0-9-]+$/.test(lower);
      return looksGibberish && !isAllowed;
    });

    if (invalidSegment) notFound();

    const lastPart = slug[slug.length - 1];
    if (/^\d+$/.test(lastPart)) notFound();

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

    const hasInvalidSuburbWord = slug.some((part) => {
      if (/^[a-z0-9-]+-\d{4}-suburb$/i.test(part)) return false;
      if (/^[a-z0-9-]+-suburb$/i.test(part)) return false;
      return /(^|\b)(suburb|suburbs)\b$/i.test(part);
    });
    if (hasInvalidSuburbWord) notFound();
  }

  // 🚫 NEW RULE: If slug or search params contain "page" or "feed" → 404
  const urlHasBlockedWord =
    slug.some((s) => /(page|feed)/i.test(s)) ||
    Object.keys(resolvedSearchParams).some((k) => /(page|feed)/i.test(k)) ||
    Object.values(resolvedSearchParams).some((v) =>
      Array.isArray(v)
        ? v.some((vv) => /(page|feed)/i.test(String(vv)))
        : /(page|feed)/i.test(String(v))
    );

  if (urlHasBlockedWord) {
    notFound();
  }
const filters = parseSlugToFilters(slug, resolvedSearchParams);

const pageParam = resolvedSearchParams.page;
const page =
  typeof pageParam === "string" ? parseInt(pageParam, 10) :
  Array.isArray(pageParam) ? parseInt(pageParam[0] || "1", 10) :
  undefined;

// Then include it in the call
const response = await fetchListings({ ...filters, page });
  if (
    !response ||
    response.success === false ||
    (response.message &&
      response.message.toLowerCase().includes("validation failed")) ||
    (Array.isArray(response.errors) &&
      response.errors.some((e) =>
        e.toLowerCase().includes("invalid make")
      ))
  ) {
    notFound();
  }

  return <ListingsPage {...filters} initialData={response} />;
}
