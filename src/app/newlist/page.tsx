  import React, { Suspense } from "react";
 import Listing from "../components/ListContent/Listings";
 import { fetchListings } from "@/api/listings/testapi";
 import type { Metadata } from "next";
  import { ensureValidPage } from "@/utils/seo/validatePage";
 import { redirect } from "next/navigation";
 import "../components/ListContent/newList.css"
 import "./listings.css"
 
 export const revalidate = 60;
  
   export const metadata: Metadata = {
   title: "Caravans For Sale in Australia - Find Exclusive Deals",
     description:
       "Browse new & used caravans for sale across Australia. Compare off-road, hybrid, pop-top & luxury models by price, size, weight and sleeping capacity.",
   robots: "noindex, nofollow",
   openGraph: {
      title: "Caravans For Sale in Australia - Find Exclusive Deals",
     description:
       "Browse new & used caravans for sale across Australia. Compare off-road, hybrid, pop-top & luxury models by price, size, weight and sleeping capacity.",
   },
   twitter: {
     card: "summary_large_image",
     title: "Caravans For Sale in Australia - Find Exclusive Deals",
     description:
       "Browse new & used caravans for sale across Australia. Compare off-road, hybrid, pop-top & luxury models by price, size, weight and sleeping capacity.",
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
 