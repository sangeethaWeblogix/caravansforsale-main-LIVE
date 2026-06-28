// app/product-details/[slug]/page.tsx
import { cache } from "react";
import ClientLogger from "./product";
import { redirect } from "next/navigation";
import './product.css?=30006'

export const revalidate = 3600;

export async function generateStaticParams() {
  const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
  const API_KEY = process.env.CFS_API_KEY;
  if (!API_BASE) return [];

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
  };

  const fetchPage = async (page: number): Promise<string[]> => {
    // try {
      const res = await fetch(
        `${API_BASE}/new_optimize_code?page=${page}&per_page=500`,
        { headers, cache: "no-store" }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const products: { slug?: string }[] = data?.data?.products ?? [];
      return products.map((p) => p.slug ?? "").filter(Boolean);
    // } catch {
    //   return [];
    // }
  };

  // Page 1 — also tells us total_pages
  const firstRes = await fetch(
    `${API_BASE}/new_optimize_code?page=1&per_page=500`,
    { headers, cache: "no-store" }
  );
  if (!firstRes.ok) return [];
  const firstData = await firstRes.json();
  const firstSlugs = (firstData?.data?.products ?? [])
    .map((p: { slug?: string }) => p.slug ?? "")
    .filter(Boolean) as string[];
  const totalPages: number = firstData?.pagination?.total_pages ?? 1;

  // Remaining pages — 10 at a time in parallel
  const allSlugs = [...firstSlugs];
  const BATCH = 10;
  for (let i = 2; i <= totalPages; i += BATCH) {
    const pages = Array.from(
      { length: Math.min(BATCH, totalPages - i + 1) },
      (_, j) => fetchPage(i + j)
    );
    const results = await Promise.all(pages);
    allSlugs.push(...results.flat());
  }

  return allSlugs.map((slug) => ({ slug }));
}

export const dynamicParams = true;

type RouteParams = { slug: string };
type PageProps = { params: Promise<RouteParams> };

const fetchProductDetail = cache(async (slug: string) => {
  const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE!;
  const API_KEY = process.env.CFS_API_KEY;
  // try {
    const res = await fetch(
      `${API_BASE}/product-detail-new/?slug=${encodeURIComponent(slug)}`,
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
    // try {
      return JSON.parse(idx > 0 ? raw.substring(idx) : raw);
    // } catch {
    //   return null;
    // }
  // } catch (error) {
  //   console.error("product fetch error:", error);
  //   return null;
  // }
});


export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchProductDetail(slug);

  if (!data || Object.keys(data).length === 0) {
    redirect("/404");
  }

  const pd = data?.data?.product_details ?? {};
  const seo = data?.seo ?? data?.product?.seo ?? {};
  const pdName = seo.metatitle || seo.meta_title || pd.name || data?.name || "";
  const pdDesc = seo.metadescription || seo.meta_description || pd.short_description || data?.short_description || "";
  const canonicalUrl = `https://www.caravansforsale.com.au/product/${slug}/`;

  const rawImages = pd.image_url ?? pd.images ?? [];
  const images: string[] = (Array.isArray(rawImages) ? rawImages : [rawImages]).filter(Boolean);

  const rawPrice = pd.sale_price || pd.regular_price || pd.price;
  const priceStr = rawPrice ? String(rawPrice).replace(/[^0-9.]/g, "") : null;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pdName,
    ...(pdDesc && { description: pdDesc }),
    ...(images.length > 0 && { image: images }),
    ...(pd.make && { brand: { "@type": "Brand", name: pd.make } }),
    ...(pd.condition && {
      itemCondition:
        String(pd.condition).toLowerCase() === "new"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
    }),
    offers: {
      "@type": "Offer",
      priceCurrency: "AUD",
      ...(priceStr && { price: priceStr }),
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
      seller: { "@type": "Organization", name: "Caravans For Sale" },
    },
  };

  return (
    <main className="mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClientLogger data={data} />
    </main>
  );
}