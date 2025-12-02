 import React, { ReactNode } from "react";
  import type { Metadata } from "next";
import { generateListingsMetadata } from "@/utils/seo/listingsMetadata";
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
 