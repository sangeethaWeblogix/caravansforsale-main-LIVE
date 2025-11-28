 import React, { ReactNode, Suspense } from "react";
import Listing from "../components/ListContent/Listings";
import { fetchListings } from "@/api/listings/api";
import type { Metadata } from "next";
import { generateListingsMetadata } from "@/utils/seo/listingsMetadata";
import { ensureValidPage } from "@/utils/seo/validatePage";
import { redirect } from "next/navigation";
import "../components/ListContent/newList.css"
import "./listings.css"

export const revalidate = 60;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  return generateListingsMetadata(searchParams ? await searchParams : {});
}

  export default function Layout({ children }: { children: ReactNode }) {
   return <div>{children}</div>;
 }
 