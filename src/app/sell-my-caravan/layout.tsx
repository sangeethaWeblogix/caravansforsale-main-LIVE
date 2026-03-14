 import { Metadata } from "next";
import { ReactNode } from "react";



 export const metadata: Metadata = {
   title: {
     default: "Sell Your Caravan for $35 Until Sold | CaravansForSale.com.au",
     template: "%s ",
   },
   description:
     "Sell your caravan on CaravansForSale.com.au for just $35 until sold. No subscriptions, no commissions, and connect directly with caravan buyers across Australia.",
   icons: { icon: "/favicon.ico" },
   robots: "index, follow",
   verification: {
     google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
   },
   alternates: {
    canonical: "https://www.caravansforsale.com.au/dealer-advertising/",
   },
   
 
 };
 
   export default function Layout({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
  }
