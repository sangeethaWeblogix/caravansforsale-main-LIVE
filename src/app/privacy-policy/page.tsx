import { Metadata } from "next";
import Privacy from "./privacy";
import "./privacy.css";

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle =
    "Privacy Policy - caravansforsale.com.au - Caravan Marketplace";
  const metaDescription =
    "Learn about Caravan Marketplace's privacy policy on data collection, usage, security measures, and your rights regarding your information";

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
      title: metaTitle,
      description: metaDescription,
    },
    alternates: {
      canonical: "https://www.caravansforsale.com.au/privacy-policy/", // ✅ canonical link
    },
  };
}
export default function Home() {
  return <Privacy />;
}
