import { Metadata } from "next";
import Privacy from "./privacy";
import "./privacy.css";

export const metadata: Metadata = {
  title: "Privacy Policy - caravansforsale.com.au - Caravan Marketplace",
  description:
    "Learn about Caravan Marketplace's privacy policy on data collection, usage, security measures, and your rights regarding your information.",
  robots: "index, follow",
  openGraph: {
    title: "Privacy Policy - caravansforsale.com.au - Caravan Marketplace",
    description:
      "Learn about Caravan Marketplace's privacy policy on data collection, usage, security measures, and your rights regarding your information.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy - caravansforsale.com.au - Caravan Marketplace",
    description:
      "Learn about Caravan Marketplace's privacy policy on data collection, usage, security measures, and your rights regarding your information.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/privacy-policy/",
  },
};
export default function Home() {
  return <Privacy />;
}
