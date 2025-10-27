import React, { Suspense } from "react";
import Listing from "../components/new-list/listing";
import { fetchNewListings } from "@/api/newlist/api";
import type { Metadata } from "next";
import { generateListingsMetadata } from "@/utils/seo/listingsMetadata";
import { ensureValidPage } from "@/utils/seo/validatePage";
import { notFound } from "next/navigation";

export const revalidate = 60;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  return generateListingsMetadata(searchParams ? await searchParams : {});
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  const fullQuery = Object.entries(resolvedSearchParams)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v ?? ""}`)
    .join("&");

  const page = ensureValidPage(resolvedSearchParams.page, fullQuery);

  const response = await fetchNewListings({ page });
  if (
    !response ||
    response.success === false ||
    !response.data ||
    !Array.isArray(response.data.products) ||
    response.data.products.length === 0
  ) {
    notFound();
  }

  return (
    <Suspense>
      <Listing initialData={response} page={page} />
    </Suspense>
  );
}
