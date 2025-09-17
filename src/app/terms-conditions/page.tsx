import { Metadata } from "next";
import Terms from "./terms";
import "./terms.css";
export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "Terms and Conditions of Use - Caravan Marketplace";
  const metaDescription =
    "Read the Terms and Conditions of Use for Caravan Marketplace. Learn about user responsibilities, content usage, and legal guidelines.";

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
      canonical: "https://www.caravansforsale.com.au/terms-conditions/", // ✅ canonical link
    },
  };
}
export default function Home() {
  return <Terms />;
}
