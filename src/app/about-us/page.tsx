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
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
  },
};

export default function Home() {
  return <About />;
}
