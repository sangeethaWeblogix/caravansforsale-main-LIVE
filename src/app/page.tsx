import React from "react";
import Home from "./home";
import { Metadata } from "next";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "Caravans For Sale | New & Used Caravan Sales in Australia";
  const metaDescription =
    "Browse new & used caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.";

  const robots = "index, follow";

  return {
    title: metaTitle,
    description: metaDescription,
    robots: robots,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
    },
  };
}

const page = () => {
  return (
    <div>
      <Home />
    </div>
  );
};

export default page;
