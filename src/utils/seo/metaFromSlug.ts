import { fetchListings } from "@/api/listings/api";
import { parseSlugToFilters } from "@/app/components/urlBuilder";
import type { Metadata } from "next";
import { buildCanonicalUrl } from "./buildCanonical";

export async function metaFromSlug(
  filters: string[] = [],
  searchParams: Record<string, string | string[] | undefined> = {}
): Promise<Metadata> {
  const parsed = parseSlugToFilters(filters, searchParams);

  const page = parsed.page ? Number(parsed.page) : 1;
  const finalFilters = { ...parsed, page };

  const res = await fetchListings(finalFilters);

  // ✅ Trim metatitle to remove unwanted spaces
  const rawTitle =
    res?.seo?.metatitle?.trim() ||
    "Caravans for Sale in Australia - Find Exclusive Deals";
  const title = rawTitle.trim();
  const description = (
    res?.seo?.metadescription || "Browse all available caravans."
  ).trim();
 
const rawIndex = String(res?.seo?.index ?? "").toLowerCase().trim();
  const robots =
    rawIndex === "noindex"
      ? { index: false, follow: false }
      : { index: true, follow: true };

  const canonical = buildCanonicalUrl(
    "https://www.caravansforsale.com.au/listings",
    filters,
    {}
  );

  const totalPages = res?.pagination?.total_pages ?? 1;

  const prev =
    page > 1
      ? buildCanonicalUrl(
          "https://www.caravansforsale.com.au/listings",
          filters,
          { page: page - 1 }
        )
      : undefined;

  const next =
    page < totalPages
      ? buildCanonicalUrl(
          "https://www.caravansforsale.com.au/listings",
          filters,
          { page: page + 1 }
        )
      : undefined;

  return {
    title: { absolute: title },
    description,
    robots,
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo",
    },
    alternates: {
      canonical,
      languages: {},
      media: {},
    },
    icons: {
      other: [
        ...(prev ? [{ rel: "prev", url: prev }] : []),
        ...(next ? [{ rel: "next", url: next }] : []),
      ],
    },
    openGraph: { title, description, url: canonical },
    twitter: { title, description },
  };
}
