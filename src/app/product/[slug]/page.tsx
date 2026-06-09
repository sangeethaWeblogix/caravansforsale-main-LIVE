 // app/product-details/[slug]/page.tsx
import { Metadata } from "next";
import ClientLogger from "./product";
import { redirect } from "next/navigation";
import './product.css?=30006'

export const revalidate = 3600;

type RouteParams = { slug: string };
type PageProps = { params: Promise<RouteParams> }; // ✅ params is a Promise

async function fetchProductDetail(slug: string) {
  const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE!;
  const API_KEY = process.env.CFS_API_KEY;
  try {
    const res = await fetch(
      `${API_BASE}/product-detail-new/?slug=${encodeURIComponent(slug)}`,
      {
        headers: {
          Accept: "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }),
        },
      }
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
       

   const imageUrlRaw = data?.data?.product_details?.image_url;
  const ogImage: string = Array.isArray(imageUrlRaw)
    ? imageUrlRaw.filter(Boolean)[0] ?? ""  // ✅ first image in array
    : typeof imageUrlRaw === "string"
    ? imageUrlRaw
    : "";

  
 
 console.log("ogggggoo", ogImage)
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