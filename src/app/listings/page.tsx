// src/app/listings/page.tsx
import React, { Suspense } from "react";
import Listing from "../components/ListContent/Listings";
import { fetchListings } from "@/api/listings/api";
import type { Metadata } from "next";
import { generateListingsMetadata } from "@/utils/seo/listingsMetadata";

export const revalidate = 60;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
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
