import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Home Demo | CaravansForSale.com.au",
  robots: "noindex, nofollow",
  alternates: {
    canonical: "https://www.caravansforsale.com.au/home-demo/",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
