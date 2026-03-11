import React, { ReactNode } from "react";
import "../components/ListContent/newList.css";
import "./listings.css";
import "../components/ListContent/newList.css";
import { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Caravans for Sale in Australia | New & Used Caravans",
  description:
    "Browse caravans for sale across Australia. Compare new and used caravans including off road, hybrid, family and pop top caravans from dealers and private sellers.",
  robots: "index, follow",
  openGraph: {
    title: "Caravans for Sale in Australia | New & Used Caravans",
    description:
      "Browse caravans for sale across Australia. Compare new and used caravans including off road, hybrid, family and pop top caravans from dealers and private sellers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caravans for Sale in Australia | New & Used Caravans",
    description:
      "Browse caravans for sale across Australia. Compare new and used caravans including off road, hybrid, family and pop top caravans from dealers and private sellers.",
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
