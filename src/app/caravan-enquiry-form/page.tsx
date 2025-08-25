import { Metadata } from "next";
import Enquiry from "./enquiry";
import "./enquiry.css";
export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "Caravan Enquiry Form | Exclusive Caravan Deals & Offers";
  const metaDescription =
    "Fill out our caravan enquiry form to receive exclusive offers from select quality caravan manufacturers. Get the best caravan deals sent directly to you.";

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
export default function Home() {
  return <Enquiry />;
}
