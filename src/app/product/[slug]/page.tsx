// app/product-details/[slug]/page.tsx
import ClientLogger from "./product";
import { notFound } from "next/navigation";

type RouteParams = { slug: string };
type PageProps = { params: Promise<RouteParams> }; // ✅ params is a Promise

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

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params; // ✅ no await
  const data = await fetchProductDetail(slug);

  // ❌ If no product → 404 page
  if (!data || Object.keys(data).length === 0) {
    notFound();
  }

  return (
    <main className="container mx-auto">
      <ClientLogger data={data} />
    </main>
  );
}
