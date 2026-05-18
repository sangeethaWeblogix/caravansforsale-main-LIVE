 import React, { Suspense } from "react";
import Listing from "../components/ListContent/Listings";
import { fetchListings } from "@/api/listings/api";
import type { Metadata } from "next";
import { ensureValidPage } from "@/utils/seo/validatePage";
import { notFound } from "next/navigation";
import { fetchProductList } from "@/api/productList/api";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Caravans for Sale in Australia | New & Used Caravans",
  description:
    "Browse caravans for sale across Australia. Compare new and used caravans including off road, hybrid, family and pop top caravans from dealers and private sellers.",
  robots: "index, follow",
  openGraph: {
    title: "Caravans for Sale in Australia | New & Used Caravans",
    description:
      "Browse caravans for sale across Australia. Compare new and used caravans including off road, hybrid, family and pop top caravans from dealers and private sellers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caravans for Sale in Australia | New & Used Caravans",
    description:
      "Browse caravans for sale across Australia. Compare new and used caravans including off road, hybrid, family and pop top caravans from dealers and private sellers.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/listings",
  },
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo",
  },
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let resolvedSearchParams: Record<string, string | string[] | undefined>;

  try {
    resolvedSearchParams = await searchParams;
  } catch {
    resolvedSearchParams = {};
  }

  const fullQuery = Object.entries(resolvedSearchParams)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : (v ?? "")}`)
    .join("&");

  let page: number;
  try {
    page = ensureValidPage(resolvedSearchParams.page, fullQuery);
  } catch {
    page = 1;
  }

  // ✅ Single fetch, both APIs parallel — no double call, no ApiErrorFallback
  // If anything throws, error.tsx catches it automatically
  const [listingsRes, productListRes] = await Promise.all([
    fetchListings({ page }),
    fetchProductList(),
  ]);

  if (
    !listingsRes?.data ||
    !Array.isArray(listingsRes.data.products) ||
    listingsRes.data.products.length === 0
  ) {
    notFound();
  }

  return (
    <Suspense>
      <Listing
        initialData={listingsRes}
        page={page}
        productListData={productListRes}
      />
    </Suspense>
  );
}