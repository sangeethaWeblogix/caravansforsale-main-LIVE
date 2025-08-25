// src/api/featuredHome/api.ts
export type FeaturedItem = {
  id?: number | string;
  title?: string;
  slug?: string;
  link?: string; // product permalink
  image?: string; // main/hero image
  location?: string;
  regular_price?: string | number;
  sale_price?: string | number;
  price_difference?: string;
  attributes?: Record<string, string>;
  sleeps?: string;
  length?: string;
  condition?: string;
};

type FeaturedResponse = FeaturedItem[] | { data?: FeaturedItem[] };

const BASE =
  process.env.NEXT_PUBLIC_CFS_API_BASE?.replace(/\/$/, "") ??
  "https://.caravansforsale.com.au/wp-json/cfs/v1";

export async function fetchFeaturedHomeCat(
  category: string
): Promise<FeaturedItem[]> {
  const url = `${BASE}/featured_home_cat/${encodeURIComponent(category)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`featured(${category}) → ${res.status}`);
  const json = (await res.json()) as FeaturedResponse;
  const arr = Array.isArray(json) ? json : json?.data;
  return (arr ?? []).filter(Boolean);
}
