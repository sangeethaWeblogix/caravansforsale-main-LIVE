import { fetchListings } from "@/api/listings/testapi";
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
 
   const robots = "noindex, nofollow";
    
  const canonical = buildCanonicalUrl(
    "https://www.caravansforsale.com.au/listings",
    filters,
    {}
  );

 
   

  
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
   
    openGraph: { title, description, url: canonical },
    twitter: { title, description },
  };
}
