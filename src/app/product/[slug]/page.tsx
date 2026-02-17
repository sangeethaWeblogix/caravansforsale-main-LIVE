 // app/product-details/[slug]/page.tsx
import { Metadata } from "next";
import ClientLogger from "./product";
import { redirect } from "next/navigation";
import './product.css'

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

 export async function generateMetadata({
   params,
 }: {
   params: Promise<RouteParams>;
 }): Promise<Metadata> {
   const { slug } = await params;
   const data = await fetchProductDetail(slug);
   const sku =  data?.product?.sku || "";
         const base = `https://caravansforsale.imagestack.net/800x600/${sku}/${slug}`;
         const ogImage = `${base}main1.avif`;
 
 console.log("image", ogImage)
   if (!data || Object.keys(data).length === 0) {
     return {
       title: "Product Not Found - Caravans for Sale",
       description: "",
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
   const canonicalUrl = `https://www.caravansforsale.com.au/product/${slug}/`;
   const robots = "index, follow";
  console.log("og", ogImage)
 
   return {
     title: { absolute: title },
     robots,
     verification: {
       google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ Google site verification
     },
     description,
       openGraph: {
       title,
       description,
       type: "website",
       url: canonicalUrl,
        siteName: "https://www.caravansforsale.com.au/", 
       images: [
         {
           url: ogImage,
           width: 800,
           height: 600,
           alt: title,
         },
       ],
       locale: "en-AU",
     },
     twitter: {
       card: "summary",
       title,
       description,
     },
     alternates: {
       canonical: canonicalUrl, // ✅ canonical link
     },
 
     other: { "og:type": "product" },
   };
 }

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params; // ✅ no await
  const data = await fetchProductDetail(slug);

  // ❌ If no product → 404 page
  if (!data || Object.keys(data).length === 0) {
    redirect("/404");
  }

  return (
    <main className="mx-auto">
      <ClientLogger data={data} />
    </main>
    
  );
}