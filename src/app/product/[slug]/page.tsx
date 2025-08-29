// app/product-details/[slug]/page.tsx
import ClientLogger from "./product";

type RouteParams = { slug: string };
type PageProps = { params: Promise<RouteParams> }; // ✅ params is a Promise

async function fetchProductDetail(slug: string) {
  const res = await fetch(
    `https://www.caravansforsale.com.au/wp-json/cfs/v1/product-detail/${encodeURIComponent(
      slug
    )}`,
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
