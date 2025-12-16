 import { Metadata } from "next";
import { ReactNode } from "react";



 export const metadata: Metadata = {
   title: {
     default: "Off-Road Caravan Manufacturers in Australia: Top Brands &amp; Models",
     template: "%s ",
   },
   description:
     "Find the best off-road caravan manufacturers in Australia. Off road caravans built with the highest quality standards and offer serious value for money.",
   icons: { icon: "/favicon.ico" },
   robots: "index, follow",
   verification: {
     google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
   },
   alternates: {
    canonical:    "https://www.admin.caravansforsale.com.au/off-road-caravan-manufacturers/",

   },
   
   openGraph: {
      url: "https://www.admin.caravansforsale.com.au/off-road-caravan-manufacturers/",
     title: "Off-Road Caravan Manufacturers in Australia: Top Brands & Models",
     description:
       "Find the best off-road caravan manufacturers in Australia. Off road caravans built with the highest quality standards and offer serious value for money.",
     
   },
 };
 
   export default function Layout({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
  }
