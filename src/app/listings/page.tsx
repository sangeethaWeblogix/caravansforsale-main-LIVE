// src/app/listings/page.tsx
import React, { Suspense } from "react";
import Listing from "../components/ListContent/Listings"; // Adjust path as needed
import { fetchListings } from "@/api/listings/api";
import { Metadata } from "next";
export const revalidate = 60;
// ✅ Server-side metadata generation
export async function generateMetadata(): Promise<Metadata> {
  const imageUrl = "/favicon.ico"; // ✅ public/ is auto-mapped

  const response = await fetchListings({});

  const metaTitle = response?.seo?.metatitle || "";
  const metaDescription =
    response?.seo?.metadescription ||
    "Browse all available caravans across Australia.";

  return {
    title: { absolute: metaTitle }, // ✅ Prevents global "| Caravan" suffix
    description: metaDescription,
    alternates: {
      canonical: "https://www.caravansforsale.com.au/listings/",
    },
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ add here
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Caravan Listings",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
    },
  };
}

// ✅ No props here — App Router handles metadata separately
export default async function ListingsPage() {
  const initialData = await fetchListings({});
  return (
    <Suspense>
      <Listing initialData={initialData} />
    </Suspense>
  );
}
