// app/product-details/[slug]/page.tsx
import ProductDetailDemo from "../../product-detail-demo/ProductDetailDemo";
import { redirect } from "next/navigation";
import './product.css?=30006'

export const dynamic = "force-dynamic";

// export async function generateStaticParams() {
//   const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
//   const API_KEY = process.env.CFS_API_KEY;
//   if (!API_BASE) return [];
//
//   const headers: Record<string, string> = {
//     Accept: "application/json",
//     ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
//   };
//
//   const fetchPage = async (page: number): Promise<string[]> => {
//     const res = await fetch(
//       `${API_BASE}/new_optimize_code?page=${page}&per_page=500`,
//       { headers, cache: "no-store" }
//     );
//     if (!res.ok) return [];
//     const data = await res.json();
//     const products: { slug?: string }[] = data?.data?.products ?? [];
//     return products.map((p) => p.slug ?? "").filter(Boolean);
//   };
//
//   // Page 1 — also tells us total_pages
//   const firstRes = await fetch(
//     `${API_BASE}/new_optimize_code?page=1&per_page=500`,
//     { headers, cache: "no-store" }
//   );
//   if (!firstRes.ok) return [];
//   const firstData = await firstRes.json();
//   const firstSlugs = (firstData?.data?.products ?? [])
//     .map((p: { slug?: string }) => p.slug ?? "")
//     .filter(Boolean) as string[];
//   const totalPages: number = firstData?.pagination?.total_pages ?? 1;
//
//   // Remaining pages — 10 at a time in parallel
//   const allSlugs = [...firstSlugs];
//   const BATCH = 10;
//   for (let i = 2; i <= totalPages; i += BATCH) {
//     const pages = Array.from(
//       { length: Math.min(BATCH, totalPages - i + 1) },
//       (_, j) => fetchPage(i + j)
//     );
//     const results = await Promise.all(pages);
//     allSlugs.push(...results.flat());
//   }
//
//   return allSlugs.map((slug) => ({ slug }));
// }

export const dynamicParams = true;

type RouteParams = { slug: string };
type PageProps = { params: Promise<RouteParams> };

const fetchProductDetail = async (slug: string) => {
  const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE!;
  const API_KEY = process.env.CFS_API_KEY;
  // try {
    const res = await fetch(
      `${API_BASE}/product-detail-new/?slug=${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
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
};


async function fetchSimilarProducts(productId: string | number, seed: number) {
  const API_KEY = process.env.CFS_API_KEY;
  try {
    const res = await fetch(
      `https://admin.caravansforsale.com.au/wp-json/cfs/v1/similar_products?product_id=${productId}&seed=${seed}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }),
        },
      }
    );
    if (!res.ok) return null;
    const raw = await res.text();
    const idx = raw.indexOf("{");
    const json = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
    return json?.sections ?? json?.data ?? json;
  } catch {
    return null;
  }
}

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

  const productId = pd.id ?? pd.product_id ?? data?.data?.id ?? data?.id ?? "";
  const seed = Math.ceil(Math.random() * 10);
  const similarData = productId ? await fetchSimilarProducts(productId, seed) : null;

  // Shuffle price section server-side (API doesn't shuffle it)
  if (similarData?.similar_by_price?.products?.length) {
    const arr = similarData.similar_by_price.products;
    let s = seed * 9301 + 49297;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  return (
    <main className="mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailDemo data={data} similarData={similarData} />
    </main>
  );
}