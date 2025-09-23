import { Metadata } from "next";
import Enquiry from "./enquiry";
import "./enquiry.css";

export const metadata: Metadata = {
  title: "Caravan Enquiry Form | Exclusive Caravan Deals & Offers",
  description:
    "Fill out our caravan enquiry form to receive exclusive offers from select quality caravan manufacturers. Get the best caravan deals sent directly to you.",
  robots: "index, follow",
  openGraph: {
    title: "Caravan Enquiry Form | Exclusive Caravan Deals & Offers",
    description:
      "Fill out our caravan enquiry form to receive exclusive offers from select quality caravan manufacturers. Get the best caravan deals sent directly to you.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caravan Enquiry Form | Exclusive Caravan Deals & Offers",
    description:
      "Fill out our caravan enquiry form to receive exclusive offers from select quality caravan manufacturers. Get the best caravan deals sent directly to you.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/caravan-enquiry-form/",
  },
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
  },
};
export default function Home() {
  return <Enquiry />;
}
