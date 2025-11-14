 import React, { Suspense } from "react";
  import type { Metadata } from "next";
import { generateListingsMetadata } from "@/utils/seo/listingsMetadata";
 import "../components/ListContent/newList.css"
import  Listings from './main';
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
  
  return (
    <Listings searchParams={searchParams} />
  );
}
