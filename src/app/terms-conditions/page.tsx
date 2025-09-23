import { Metadata } from "next";
import Terms from "./terms";
import "./terms.css";

export const metadata: Metadata = {
  title: "Terms and Conditions of Use - Caravan Marketplace",
  description:
    "Read the Terms and Conditions of Use for Caravan Marketplace. Learn about user responsibilities, content usage, and legal guidelines.",
  robots: "index, follow",
  openGraph: {
    title: "Terms and Conditions of Use - Caravan Marketplace",
    description:
      "Read the Terms and Conditions of Use for Caravan Marketplace. Learn about user responsibilities, content usage, and legal guidelines.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms and Conditions of Use - Caravan Marketplace",
    description:
      "Read the Terms and Conditions of Use for Caravan Marketplace. Learn about user responsibilities, content usage, and legal guidelines.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/terms-conditions/",
  },
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
  },
};
export default function Home() {
  return <Terms />;
}
