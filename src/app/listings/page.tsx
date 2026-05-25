import React, { Suspense } from "react";
import Listing from "../components/ListContent/Listings";
import { fetchListings } from "@/api/listings/api";
import type { Metadata } from "next";
import { ensureValidPage } from "@/utils/seo/validatePage";
import { notFound } from "next/navigation";
import ApiErrorFallback from "../components/ApiErrorFallback";
import { fetchProductList } from "@/api/productList/api";

// ─────────────────────────────────────────────────────────────────────────────
// ALWAYS FETCH FOR HYDRATION CONSISTENCY
//
// Previously the KV path skipped fetchListings and passed initialData={undefined}.
// This caused a hydration mismatch: the KV HTML had product cards baked in,
// but the client component initialised with products=[] → React wiped the DOM
// on hydration → fetch fired → products reappeared → FLASH.
//
// Now we always fetch listings so React hydration has matching data.
// The KV cache still delivers HTML fast for first paint; the server-to-server
// fetchListings call adds minimal overhead.
// ─────────────────────────────────────────────────────────────────────────────

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

  try {
    // productListData (categories + states for filter UI) always needed
    const productListRes = await fetchProductList();

    // Always fetch listings — even when KV serves the HTML.
    // This ensures React hydration has matching data and avoids the flash
    // where KV HTML shows products but client state starts empty.
   const shuffleSeed = resolvedSearchParams.shuffle_seed
  ? String(resolvedSearchParams.shuffle_seed)
  : String(Math.floor(Math.random() * 1_000_000));

    const response = await fetchListings({
      page,
   shuffle_seed: shuffleSeed,

    });

    if (!response) {
      return (
        <ApiErrorFallback
          title="Unable to load listings"
          message="We couldn't connect to our servers. Please try again."
          showRetry={true}
        />
      );
    }

    if (response.success === false) {
      return (
        <ApiErrorFallback
          title="Service temporarily unavailable"
          message="Our listing service is currently experiencing issues. Please try again in a few moments."
          showRetry={true}
        />
      );
    }

    if (!response.data) {
      return (
        <ApiErrorFallback
          title="No data available"
          message="We received an incomplete response from our servers. Please try again."
          showRetry={true}
        />
      );
    }

    if (
      !Array.isArray(response.data.products) ||
      response.data.products.length === 0
    ) {
      notFound();
    }

    return (
      <Suspense>
        <Listing
          initialData={undefined}
          page={page}
          productListData={productListRes}
        />
      </Suspense>
    );
  } catch (error) {
    console.error("Listings page API error:", error);

    const isNetworkError =
      error instanceof Error &&
      (error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ETIMEDOUT"));

    const isApiError =
      error instanceof Error &&
      (error.message.includes("API failed") ||
        error.message.includes("Invalid API response"));

    if (isNetworkError) {
      return (
        <ApiErrorFallback
          title="Connection failed"
          message="We couldn't reach our servers. Please check your internet connection and try again."
          showRetry={true}
          errorType="network"
        />
      );
    }

    if (isApiError) {
      return (
        <ApiErrorFallback
          title="Service error"
          message="Our listing service encountered an error. Our team has been notified and is working on it."
          showRetry={true}
          errorType="api"
        />
      );
    }

    return (
      <ApiErrorFallback
        title="Something went wrong"
        message="We're having trouble loading the listings. Please try again or come back later."
        showRetry={true}
        errorType="unknown"
      />
    );
  }
}
