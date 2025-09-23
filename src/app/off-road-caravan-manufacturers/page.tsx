import React from "react";
import Header from "./components/OffRoadCaravanHeader";
import Middle from "./components/OffRoadCaravanMiddle";
import FaqSection from "./components/FaqSection";
import Footer from "./components/OffRoadCaravanInfoFooter";
import "./offroad.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Off-Road Caravan Manufacturers in Australia: Top Brands &amp; Models",
  description:
    "Find the best off-road caravan manufacturers in Australia. Off road caravans built with the highest quality standards and offer serious value for money.",
  robots: "index, follow",
  openGraph: {
    title:
      "Off-Road Caravan Manufacturers in Australia: Top Brands &amp; Models",
    description:
      "Find the best off-road caravan manufacturers in Australia. Off road caravans built with the highest quality standards and offer serious value for money.",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Off-Road Caravan Manufacturers in Australia: Top Brands &amp; Models",
    description:
      "Find the best off-road caravan manufacturers in Australia. Off road caravans built with the highest quality standards and offer serious value for money.",
  },
  alternates: {
    canonical:
      "https://www.admin.caravansforsale.com.au/off-road-caravan-manufacturers/",
  },
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
  },
};
export default function Home() {
  return (
    <div>
      <Header />
      <Middle />
      <Footer />
      <FaqSection />
    </div>
  );
}
