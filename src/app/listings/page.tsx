  import React, { Suspense } from "react";
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
 
 export default async function MainListingsPage({
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
 
   const hasProducts =
     response?.data?.products && response.data.products.length > 0;
 
   return (
     <Suspense>
       {hasProducts ? (
         <Listing initialData={response} page={page} />
       ) : (
         <div className="flex flex-col items-center justify-center py-16 text-center text-gray-600">
           <img
             src="/no-results.svg"
             alt="No caravans found"
             width={180}
             height={180}                              
             className="mb-6 opacity-80"
           />
           <h2 className="text-2xl font-semibold mb-2">No caravans found</h2>
           <p className="max-w-md text-sm">
             Try adjusting your filters or explore a different region to see more
             listings.
           </p>
         </div>
         
       )}
     </Suspense>
   );
 }
 
 