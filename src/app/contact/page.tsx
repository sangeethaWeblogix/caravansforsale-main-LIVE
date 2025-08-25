import Contacts from "./contacts";
import "./contact.css";
import { Metadata } from "next";
export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "Contact Off Road Caravans - offroadcaravans.com";
  const metaDescription =
    "Contact offroadcaravans.com Australia . Fill in our contact form if you have any questions related to buying an off road caravan & we will get back to you.";

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
  return <Contacts />;
}
