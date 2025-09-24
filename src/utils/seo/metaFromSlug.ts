import { fetchListings } from "@/api/listings/api";
import { parseSlugToFilters } from "@/app/components/urlBuilder";
import type { Metadata } from "next";

export async function metaFromSlug(
  filters: string[] = [],
  searchParams: Record<string, string | string[] | undefined> = {}
): Promise<Metadata> {
  const parsed = parseSlugToFilters(filters, searchParams);

  // ✅ page as number
  const finalFilters = {
    ...parsed,
    page: parsed.page ? Number(parsed.page) : 1,
  };

  // ✅ build querystring
  // const qs = buildQuery(finalFilters);
  // const url = `https://www.caravansforsale.com.au/wp-json/cfs/v1/new-list?${qs.toString()}`;

  // ✅ option 1: if fetchListings accepts full URL
  // const res = await fetchListings(url);

  // ✅ option 2: if fetchListings expects filters object (more likely)
  const res = await fetchListings(finalFilters);

  const title = res?.seo?.metatitle || " ";
  const description =
    res?.seo?.metadescription || "Browse all available caravans.";
  const rawIndex = (res?.seo?.index ?? "").toLowerCase().trim();

  const robots =
    rawIndex === "noindex"
      ? { index: false, follow: false }
      : { index: true, follow: true };

  return {
    title,
    description,
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ Google site verification
    },
    robots,
    openGraph: { title, description, images: [{ url: "/favicon.ico" }] },
    twitter: {
      title,
      description,
      images: ["/favicon.ico"],
    },
  };
}
