// src/app/product-details/[slug]/page.tsx
import type { Metadata } from "next";
import ClientLogger from "./product";

type RouteParams = { slug: string };
type PageProps = { params: Promise<RouteParams> };

async function fetchProductDetail(slug: string) {
  const res = await fetch(
    `https://www.api.caravansforsale.com.au/wp-json/cfs/v1/product-detail/${encodeURIComponent(
      slug
    )}`,
    { cache: "no-store", headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error("Failed to load product detail");
  return res.json();
}

// ✅ SEO from product.seo (NO images)
export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchProductDetail(slug);

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
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary", // no image card
      title,
      description,
    },
    other: {
      "og:type": "product",
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchProductDetail(slug);

  return (
    <div>
      <ClientLogger data={data} />
    </div>
  );
}
