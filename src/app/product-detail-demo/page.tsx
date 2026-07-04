import { cache } from "react";
import type { Metadata } from "next";
import ProductDetailDemo from "./ProductDetailDemo";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

export const revalidate = 3600;

const DEMO_SLUG = "2025-retreat-caravans-daydream-29ft6-off-road";

const fetchProduct = cache(async () => {
  const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE!;
  const API_KEY  = process.env.CFS_API_KEY;
  try {
    const res = await fetch(
      `${API_BASE}/product-detail-new/?slug=${encodeURIComponent(DEMO_SLUG)}`,
      {
        next: { revalidate: 3600 },
        headers: {
          Accept: "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }),
        },
      }
    );
    if (!res.ok) return null;
    const raw = await res.text();
    const idx = raw.indexOf('{"');
    return JSON.parse(idx > 0 ? raw.substring(idx) : raw);
  } catch {
    return null;
  }
});

async function fetchMakeListings(make: string) {
  const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE!;
  const API_KEY  = process.env.CFS_API_KEY;
  try {
    // make slug: "Retreat Caravans" → "retreat-caravans"
    const makeSlug = make.trim().toLowerCase().replace(/\s+/g, "-");
    const params = new URLSearchParams({ make: makeSlug, page: "1" });
    const res = await fetch(
      `${API_BASE}/new_optimize_code?${params.toString()}`,
      {
        next: { revalidate: 3600 },
        headers: {
          Accept: "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }),
        },
      }
    );
    console.log("[demo] fetchMakeListings status:", res.status, "| make:", makeSlug);
    if (!res.ok) return [];
    const raw = await res.text();
    const idx = raw.indexOf('{"');
    const json = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
    const products = json?.data?.products ?? [];
    console.log("[demo] make listings count:", products.length);
    return products as {
      id: number;
      name: string;
      slug?: string;
      image: string;
      image_url?: string[];
      regular_price: string;
      sale_price?: string;
      location?: string;
    }[];
  } catch (e) {
    console.error("[demo] fetchMakeListings error:", e);
    return [];
  }
}

export default async function ProductDetailDemoPage() {
  const data = await fetchProduct();

  const attrs: { label?: string; value?: string; url?: string }[] =
    data?.data?.product_details?.attribute_urls ?? [];
  const makeAttr = attrs.find((a) => (a.label ?? "").toLowerCase() === "make");
  const make = makeAttr?.value ?? "";
  // Extract slug from attribute URL (e.g. "/listings/retreat/" → "retreat")
  // instead of slugifying display name ("Retreat Caravans" → wrong "retreat-caravans")
  const makeSlug = makeAttr?.url
    ? makeAttr.url.split("/").filter(Boolean).pop() ?? ""
    : make.trim().toLowerCase().replace(/\s+/g, "-");

  const makeListings = makeSlug ? await fetchMakeListings(makeSlug) : [];

  return (
    <main>
      <ProductDetailDemo data={data} makeListings={makeListings} />
    </main>
  );
}
