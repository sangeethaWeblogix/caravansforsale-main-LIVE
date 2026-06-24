  import React, { Suspense } from "react";
import Listing from "../components/ListContent/Listings";
import { getCachedListings } from "@/api/listings/api";
import type { Metadata } from "next";
import { ensureValidPage } from "@/utils/seo/validatePage";
import { notFound } from "next/navigation";
import ApiErrorFallback from "../components/ApiErrorFallback";
import { fetchProductList, fetchCategoryCounts, fetchMakeCounts } from "@/api/productList/api";
import { fetchBottomLinks } from "@/api/bottomLinks/api";
import type { BottomLinksData } from "@/api/bottomLinks/api";
import { reportGitHubIssue } from "@/lib/reportGitHubIssue";
import { unstable_noStore } from "next/cache";

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
    images: [
      {
        url: "https://www.caravansforsale.com.au/images/cfs-logo.png",
        width: 800,
        height: 600,
        alt: "Caravans for Sale Australia",
      },
    ],
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

  const page = ensureValidPage(resolvedSearchParams.page, fullQuery);

  let response;
  let productListRes;
  let initialCategoryCounts;
  let initialMakeCounts;
  let bottomLinksData: BottomLinksData | null = null;
  try {
    [response, productListRes, initialCategoryCounts, initialMakeCounts, bottomLinksData] = await Promise.all([
      getCachedListings({ page }),
      fetchProductList(),
      fetchCategoryCounts(),
      fetchMakeCounts(),
      fetchBottomLinks({}),
    ]);
  } catch (error) {
    unstable_noStore(); // prevent ISR from caching this error response
    const msg = error instanceof Error ? error.message : String(error);
    const isBackend =
      msg.startsWith("API no response") ||
      msg.startsWith("Backend server error") ||
      msg.startsWith("Missing or invalid API key") ||
      msg.startsWith("API endpoint not found") ||
      msg.startsWith("Invalid API response") ||
      msg.startsWith("API failed:");
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

  return (
    <>
      <Suspense fallback={null}>
        <Listing initialData={response} page={page} productListData={productListRes} initialCategoryCounts={initialCategoryCounts} initialMakeCounts={initialMakeCounts} initialBottomLinksData={bottomLinksData} />
      </Suspense>
    </>
  );
}