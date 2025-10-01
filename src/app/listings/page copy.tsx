// src/app/listings/page.tsx
import React, { Suspense } from "react";
import Listing from "../components/ListContent/Listings";
import { fetchListings } from "@/api/listings/api";
import type { Metadata } from "next";

export const revalidate = 60;
// type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// ✅ Metadata generator with canonical + prev + next
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const page =
    typeof searchParams?.page === "string"
      ? parseInt(searchParams.page, 10)
      : Array.isArray(searchParams?.page)
      ? parseInt(searchParams.page[0], 10)
      : 1;

  // Fetch listing data (for pagination info)
  const response = await fetchListings({ page });
  const totalPages = response?.pagination?.total_pages ?? 1;

  const baseUrl = "https://www.caravansforsale.com.au/listings";

  // ✅ canonical
  const canonical = page > 1 ? `${baseUrl}/?page=${page}` : `${baseUrl}/`;

  // ✅ prev / next
  const prev =
    page > 1
      ? page === 2
        ? `${baseUrl}/`
        : `${baseUrl}/?page=${page - 1}`
      : null;
  const next = page < totalPages ? `${baseUrl}/?page=${page + 1}` : null;

  const metaTitle = "Caravans For Sale in Australia.";
  const metaDescription =
    "Browse new & used caravans for sale across Australia. Compare off-road, hybrid, pop-top & luxury models by price, size, weight and sleeping capacity.";

  return {
    title: { absolute: metaTitle },
    description: metaDescription,
    metadataBase: new URL("https://www.caravansforsale.com.au"), // ✅ fixes OG/Twitter base warning
    alternates: {
      canonical,
      types: {
        ...(prev ? { "application/prev": prev } : {}),
        ...(next ? { "application/next": next } : {}),
      },
    },
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo",
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonical,
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
    // 👇 safest way to inject prev/next
  };
}

// ✅ Page component
export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  const page =
    typeof resolvedSearchParams.page === "string"
      ? parseInt(resolvedSearchParams.page, 10)
      : Array.isArray(resolvedSearchParams.page)
      ? parseInt(resolvedSearchParams.page[0], 10)
      : 1;

  const initialData = await fetchListings({ page });

  return (
    <Suspense>
      <Listing initialData={initialData} page={page} />
    </Suspense>
  );
}
