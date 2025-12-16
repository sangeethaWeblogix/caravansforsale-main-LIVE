 import { Metadata } from "next";
import { ReactNode } from "react";



 export const metadata: Metadata = {
   title: {
     default: "Terms and Conditions of Use - Caravan Marketplace",
     template: "%s ",
   },
   description:
     "Read the Terms and Conditions of Use for Caravan Marketplace. Learn about user responsibilities, content usage, and legal guidelines.",
   icons: { icon: "/favicon.ico" },
   robots: "index, follow",
   verification: {
     google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
   },
   alternates: {
    canonical: "https://www.caravansforsale.com.au/terms-conditions/",

   },
   
   openGraph: {
      url: "https://www.caravansforsale.com.au/terms-conditions/",
     title: "Terms and Conditions of Use - Caravan Marketplace",
       description:
     "Read the Terms and Conditions of Use for Caravan Marketplace. Learn about user responsibilities, content usage, and legal guidelines.",
     
   },
 };
 
   export default function Layout({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
  }
