import type { Metadata } from "next";
import Home from "./home/home";
import "./globals.css";
 export const metadata: Metadata = {
  title: "Caravans For Sale – #1 Marketplace for New & Used Caravan Deals",
  description:
    "Browse new & used caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.",
  robots: "index, follow",
  openGraph: {
   title: "Caravans For Sale – #1 Marketplace for New & Used Caravan Deals",
  description:
    "Browse new & used caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.",
  },
  twitter: {
    card: "summary_large_image",
     title: "Caravans For Sale – #1 Marketplace for New & Used Caravan Deals",
  description:
    "Browse new & used caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au",
  },
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ add here
  },
};

const Page = () => (
  <div>
    <Home />
    
  </div>
);

export default Page;
