import { fetchListings } from "@/api/listings/api";
import { parseSlugToFilters } from "@/app/components/urlBuilder";
import type { Metadata } from "next";
import { buildCanonicalUrl } from "./buildCanonical";

export async function metaFromSlug(
  filters: string[] = [],
  searchParams: Record<string, string | string[] | undefined> = {}
): Promise<Metadata> {
  const parsed = parseSlugToFilters(filters, searchParams);

  // ✅ normalize page
  const page = parsed.page ? Number(parsed.page) : 1;
  const finalFilters = { ...parsed, page };

  // ✅ fetch SEO data
  const res = await fetchListings(finalFilters);

  const title = res?.seo?.metatitle || "Caravans for Sale";
  const description =
    res?.seo?.metadescription || "Browse all available caravans.";
  const rawIndex = (res?.seo?.index ?? "").toLowerCase().trim();

  const robots =
    rawIndex === "noindex"
      ? { index: false, follow: false }
      : { index: true, follow: true };

  // ✅ canonical
  const canonical = buildCanonicalUrl(
    "https://www.caravansforsale.com.au/listings",
    filters,
    { page }
  );

  // ✅ prev/next
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
    title,
    description,
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo",
    },
    robots,
    alternates: {
      canonical,
    },
    openGraph: { title, description, url: canonical },
    twitter: { title, description },
    other: {
      ...(prev ? { "link:prev": `<${prev}>; rel="prev"` } : {}),
      ...(next ? { "link:next": `<${next}>; rel="next"` } : {}),
    },
  };
}
