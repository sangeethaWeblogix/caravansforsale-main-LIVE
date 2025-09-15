// src/app/product-details/[slug]/page.tsx
import type { Metadata } from "next";
import ClientLogger from "./product";
import { notFound } from "next/navigation";

type RouteParams = { slug: string };
type PageProps = { params: Promise<RouteParams> };

async function fetchProductDetail(slug: string) {
  const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE!;
  try {
    const res = await fetch(
      `${API_BASE}/product-detail-new/?slug=${encodeURIComponent(slug)}`,
      { cache: "no-store", headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("product fetch error:", error);
    return null;
  }
}

// ✅ SEO (no images)
export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchProductDetail(slug);

  if (!data || Object.keys(data).length === 0) {
    return {
      title: "Product Not Found - Caravans for Sale",
      description: "The product you are looking for does not exist.",
    };
  }

  const seo = data?.seo ?? data?.product?.seo ?? {};
  const title =
    seo.metatitle ||
    seo.meta_title ||
    data?.title ||
    data?.name ||
    "Product - Caravans for Sale";

  const description =
    seo.metadescription ||
    seo.meta_description ||
    data?.short_description ||
    "View caravan details.";

  return {
    title: { absolute: title },
    description,
    openGraph: { title, description },
    twitter: {
      card: "summary",
      title,
      description,
    },
    other: { "og:type": "product" },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchProductDetail(slug);

  // ❌ If no details or only image → show 404
  if (!data || Object.keys(data).length === 0 || !data.details) {
    notFound();
  }

  return (
    <div>
      <ClientLogger data={data} />
    </div>
  );
}
