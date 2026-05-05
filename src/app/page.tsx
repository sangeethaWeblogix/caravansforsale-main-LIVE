 import Home from "./home/home";
import "./globals.css";
import { Metadata } from "next";
import { fetchSleepBands } from "@/api/homeApi/sleep/api";
import { fetchRegion } from "@/api/homeApi/region/api";
import { fetchManufactures } from "@/api/homeApi/manufacture/api";
import { fetchPriceBasedCaravans } from "@/api/homeApi/price/api";
import { fetchAtmBasedCaravans } from "@/api/homeApi/weight/api";
import { fetchLengthBasedCaravans } from "@/api/homeApi/length/api";
import { fetchUsedCaravansList } from "@/api/homeApi/usedCaravanList/api";
import { fetchStateBasedCaravans } from "@/api/homeApi/state/api";
import { fetchRequirements } from "@/api/postRquirements/api";

 import { fetchHomePage, type HomeBlogPost } from "@/api/home/api";

  export const metadata: Metadata = {
    title: {
      default: "Caravans For Sale – Australia’s Marketplace for New & Used Caravans",
      template: "%s ",
    },
    description:
      "Browse new & used caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity",
    icons: { icon: "/favicon.ico" },
    robots: "index, follow",
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
    },
    alternates: {
      canonical: "https://www.caravansforsale.com.au",
    },
    
  
  };
 
  export default async function Page() {
   const [
     sleepBands,
     regionBands,
     manufactureBands,
     atmBands,
     lengthBands,
     priceBands,
     usedData,
     stateBands,
      requirements, 
            homeblog,
 
   ] = await Promise.all([
     fetchSleepBands(),
     fetchRegion(),
     fetchManufactures(),
     fetchAtmBasedCaravans(),
     fetchLengthBasedCaravans(),
     fetchPriceBasedCaravans(),
     fetchUsedCaravansList(),
     fetchStateBasedCaravans(),
         fetchRequirements(), // ← add
         fetchHomePage(),

   ]);
  console.log("blogPosts:", homeblog.latest_posts);

  
   return (
     <Home
       sleepBands={sleepBands}
       regionBands={regionBands}
       manufactureBands={manufactureBands}
       atmBands={atmBands}
       lengthBands={lengthBands}
       priceBands={priceBands}
       usedData={usedData}
       stateBands={stateBands}
       requirements={requirements}
      homeblog={homeblog?.latest_posts ?? []}

     />
   );
 }
