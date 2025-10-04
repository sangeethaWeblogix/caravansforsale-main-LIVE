import Contacts from "./contacts";
import "./contact.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Caravans For Sale | Australia’s Caravan Marketplace",
  description:
    "Have a question about caravans in Australia? Contact Caravans For Sale for support, inquiries, or help finding your next caravan today.",
  robots: "index, follow",
  openGraph: {
    title: "Contact Caravans For Sale | Australia’s Caravan Marketplace",
    description:
      "Have a question about caravans in Australia? Contact Caravans For Sale for support, inquiries, or help finding your next caravan today.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Caravans For Sale | Australia’s Caravan Marketplace",
    description:
      "Have a question about caravans in Australia? Contact Caravans For Sale for support, inquiries, or help finding your next caravan today.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/contact/",
  },
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ add here
  },
};
export default function Home() {
  return <Contacts />;
}
