// app/product-details/[slug]/page.tsx
import ClientLogger from "./product";

type RouteParams = { slug: string };
type PageProps = { params: Promise<RouteParams> }; // ✅ params is a Promise

async function fetchProductDetail(slug: string) {
  const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE!;

  const res = await fetch(
    `${API_BASE}/product-detail-new/?slug=${encodeURIComponent(slug)}`,
    { cache: "no-store", headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error("Failed to load product detail");
  return res.json(); // <- type this if you have a response interface
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params; // ✅ must await
  const data = await fetchProductDetail(slug);
  // console.log("pdata", data);
  return (
    <main className="container mx-auto">
      <ClientLogger data={data} />
    </main>
  );
}
