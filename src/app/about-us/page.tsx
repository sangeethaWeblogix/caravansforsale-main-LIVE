import { Metadata } from "next";
import About from "./about";
import "./about.css";

export const metadata: Metadata = {
  title: "About Caravan Marketplace - Your Trusted Caravan Resource",
  description:
    "Caravan Marketplace is your go-to platform for finding the perfect caravan from the right manufacturer or dealer @ the right price.",
  robots: "index, follow",
  openGraph: {
    title: "About Caravan Marketplace - Your Trusted Caravan Resource",
    description:
      "Caravan Marketplace is your go-to platform for finding the perfect caravan from the right manufacturer or dealer @ the right price.",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Caravan Marketplace - Your Trusted Caravan Resource",
    description:
      "Caravan Marketplace is your go-to platform for finding the perfect caravan from the right manufacturer or dealer @ the right price.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/about-us/",
  },
};

export default function Home() {
  return <About />;
}
