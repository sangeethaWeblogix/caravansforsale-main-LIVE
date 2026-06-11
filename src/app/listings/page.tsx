  import React, { Suspense } from "react";
import Listing from "../components/ListContent/Listings";
import { getCachedListings } from "@/api/listings/api";
import type { Metadata } from "next";
import { ensureValidPage } from "@/utils/seo/validatePage";
import { notFound } from "next/navigation";
import ApiErrorFallback from "../components/ApiErrorFallback";
import { fetchProductList, fetchCategoryCounts, fetchMakeCounts } from "@/api/productList/api";
import { reportGitHubIssue } from "@/lib/reportGitHubIssue";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Caravans for Sale in Australia",
  description:
    "Browse new & used caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.",
  robots: "index, follow",
  openGraph: {
    title: "Caravans for Sale in Australia",
    description:
        "Browse caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caravans for Sale in Australia",
    description:
       "Browse new & used caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/listings",
  },
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ add here
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
    // If searchParams resolution fails, use empty object
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

  let response;
  let productListRes;
  let initialCategoryCounts;
  let initialMakeCounts;
  try {
    [response, productListRes, initialCategoryCounts, initialMakeCounts] = await Promise.all([
      getCachedListings({ page }),
      fetchProductList(),
      fetchCategoryCounts(),
      fetchMakeCounts(),
    ]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const isBackend =
      msg.startsWith("Request timeout") ||
      msg.startsWith("API failed:") ||
      msg.startsWith("Invalid API response");
    const errorSource = isBackend ? "BACKEND" : "FRONTEND";
    console.error(`[${errorSource} ERROR] Listings page failed:`, msg);
    reportGitHubIssue({
      errorSource,
      errorType: msg,
      message: `Listings page failed: ${msg}`,
      pageUrl: "/listings",
    }).catch(() => {});
    return (
      <ApiErrorFallback
        title="Unable to load listings"
        message="We couldn't load this page. Please try again."
        showRetry={true}
        errorSource={errorSource}
      />
    );
  }

  if (!response || !response.data) {
    return (
      <ApiErrorFallback
        title="Unable to load listings"
        message="We couldn't connect to our servers. Please try again."
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

  const BASE_URL = "https://www.caravansforsale.com.au";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${BASE_URL}/listings/`,
        "name": response?.seo_v2?.h1 || "Caravans for Sale in Australia",
        "url": `${BASE_URL}/listings/`,
        "inLanguage": "en-AU",
        ...(response?.pagination?.total_products && { "numberOfItems": response.pagination.total_products }),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${BASE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Caravans for Sale", "item": `${BASE_URL}/listings/` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense>
        <Listing initialData={response} page={page} productListData={productListRes} initialCategoryCounts={initialCategoryCounts} initialMakeCounts={initialMakeCounts} />
      </Suspense>
    </>
  );
}