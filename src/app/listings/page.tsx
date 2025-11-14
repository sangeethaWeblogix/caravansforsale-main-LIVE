 import React from "react";
import Listing from "../components/ListContent/Listings";
import { fetchListings } from "@/api/listings/api";
import type { Metadata } from "next";
import { generateListingsMetadata } from "@/utils/seo/listingsMetadata";
import { ensureValidPage } from "@/utils/seo/validatePage";
import { redirect } from "next/navigation";
import "../components/ListContent/newList.css"

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

  const response = await fetchListings({ page });

  // ✅ only show 404 on API error, not on empty list
  if (!response || response.success === false) {
    redirect("/404");
  }

  

  return (
    <div>
    
        <Listing initialData={response} page={page} />
      
    </div>
  );
}
