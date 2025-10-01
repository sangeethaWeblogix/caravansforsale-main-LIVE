// src/app/listings/page.tsx
import React, { Suspense } from "react";
import Listing from "../components/ListContent/Listings";
import { fetchListings } from "@/api/listings/api";
import type { Metadata } from "next";
import { generateListingsMetadata } from "@/utils/seo/listingsMetadata";
import { notFound } from "next/navigation";

export const revalidate = 60;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getValidPage(param: unknown): number | null {
  // No param = default to page 1
  if (param === undefined) return 1;

  // String param, must be a positive integer
  if (typeof param === "string" && /^\d+$/.test(param)) {
    const num = parseInt(param, 10);
    return num > 0 ? num : null;
  }

  // Array param, take the first element
  if (Array.isArray(param) && param.length > 0 && /^\d+$/.test(param[0])) {
    const num = parseInt(param[0], 10);
    return num > 0 ? num : null;
  }

  // Anything else = invalid
  return null;
}

// ✅ Metadata generator (searchParams is sync here)
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  return generateListingsMetadata(searchParams ? await searchParams : {});
}

// ✅ Page component (searchParams may be async in Next 15)
export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  // const page =
  //   typeof resolvedSearchParams.page === "string"
  //     ? parseInt(resolvedSearchParams.page, 10)
  //     : Array.isArray(resolvedSearchParams.page)
  //     ? parseInt(resolvedSearchParams.page[0], 10)
  //     : 1;
  const page = getValidPage(resolvedSearchParams.page);
  if (!page) {
    notFound();
  }
  const initialData = await fetchListings({ page });

  return (
    <Suspense>
      <Listing initialData={initialData} page={page} />
    </Suspense>
  );
}
