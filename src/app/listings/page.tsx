// src/app/listings/page.tsx
import React, { Suspense } from "react";
import Listing from "../components/ListContent/Listings"; // Adjust path as needed
import { fetchListings } from "@/api/listings/api";
import { Metadata } from "next";

// ✅ Server-side metadata generation
export async function generateMetadata(): Promise<Metadata> {
  const imageUrl = "/favicon.ico"; // ✅ public/ is auto-mapped

  const response = await fetchListings({});

  const metaTitle = response?.seo?.metatitle || "Caravan Listings";
  const metaDescription =
    response?.seo?.metadescription ||
    "Browse all available caravans across Australia.";

  return {
    title: { absolute: metaTitle }, // ✅ Prevents global "| Caravan" suffix
    description: metaDescription,
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
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Caravan Listings",
        },
      ],
    },
  };
}

// ✅ No props here — App Router handles metadata separately
export default function ListingsPage() {
  return (
    <Suspense fallback={<div>Loading listings...</div>}>
      <Listing />
    </Suspense>
  );
}
