// src/app/listings/page.tsx
import React, { Suspense } from "react";
import Listing from "../components/ListContent/Listings"; // Adjust path if needed
import { fetchListings } from "@/api/listings/api";
import { Metadata } from "next";

// ✅ Server-side metadata generation
export async function generateMetadata(): Promise<Metadata> {
  try {
    const response = await fetchListings({});
    const metaTitle = response?.seo?.metatitle || "Caravan Listings";
    const metaDescription =
      response?.seo?.metadescription ||
      "Browse all available caravans across Australia.";

    console.log("Generating metadata for Listings page:", metaTitle);

    return {
      title: { absolute: metaTitle }, // ✅ force override
      description: metaDescription,
      alternates: {
        canonical: "https://www.caravansforsale.com.au/listings/",
      },
      verification: {
        google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo",
      },
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        images: [
          {
            url: "/favicon.ico",
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
  } catch (err) {
    console.error("Metadata fetch failed:", err);
    return {
      title: { absolute: "Caravan Listings" },
      description: "Browse all available caravans across Australia.",
    };
  }
}

// ✅ Page component
export default async function ListingsPage() {
  const initialData = await fetchListings({});

  return (
    <Suspense>
      <Listing initialData={initialData} />
    </Suspense>
  );
}
