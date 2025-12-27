 import React, { ReactNode } from "react";
  import "../components/ListContent/newList.css"
import "./listings.css"
import { Metadata } from "next";

export const revalidate = 60;
 
 export const metadata: Metadata = {
  title: "Caravans For Sale in Australia - Find Exclusive Deals",
    description:
      "Browse new & used caravans for sale across Australia. Compare off-road, hybrid, pop-top & luxury models by price, size, weight and sleeping capacity.",
  // robots: "index, follow",
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

  export default function Layout({ children }: { children: ReactNode }) {
   return <div>{children}</div>;
 }
 