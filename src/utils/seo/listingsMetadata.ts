// src/lib/listings-metadata.ts
import { fetchListings } from "@/api/listings/api";
import type { Metadata } from "next";

export async function generateListingsMetadata(
  searchParams: Record<string, string | string[] | undefined>
): Promise<Metadata> {
  const page =
    typeof searchParams?.page === "string"
      ? parseInt(searchParams.page, 10)
      : Array.isArray(searchParams?.page)
      ? parseInt(searchParams.page[0], 10)
      : 1;

  const response = await fetchListings({ page });
  const totalPages = response?.pagination?.total_pages ?? 1;

  const baseUrl = "https://www.caravansforsale.com.au/listings";
  const canonical = page > 1 ? `${baseUrl}/?page=${page}` : `${baseUrl}/`;
  const prev =
    page > 1
      ? page === 2
        ? `${baseUrl}/`
        : `${baseUrl}/?page=${page - 1}`
      : null;
  const next = page < totalPages ? `${baseUrl}/?page=${page + 1}` : null;

  const metaTitle =
    response?.seo?.metatitle ||
    "Caravans For Sale in Australia -Find Exclusive Deals";
  const metaDescription =
    response?.seo?.metadescription ||
    "Browse new & used caravans for sale across Australia. Compare off-road, hybrid, pop-top & luxury models by price, size, weight and sleeping capacity.";

  return {
    title: { absolute: metaTitle },
    description: metaDescription,
    metadataBase: new URL("https://www.caravansforsale.com.au"),
    alternates: {
      canonical,
      types: {
        ...(prev ? { "application/prev": prev } : {}),
        ...(next ? { "application/next": next } : {}),
      },
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
  };
}
