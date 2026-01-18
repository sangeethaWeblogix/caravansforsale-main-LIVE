 import Home from "./home/home";
import "./globals.css";
import { Metadata } from "next";
import { Suspense } from "react";
import Loading from "./loading";
 
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
 export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Home />
    </Suspense>
  );
}
