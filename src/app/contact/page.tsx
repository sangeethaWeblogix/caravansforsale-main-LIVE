import Contacts from "./contacts";
import "./contact.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Off Road Caravans - offroadcaravans.com",
  description:
    "Contact offroadcaravans.com Australia . Fill in our contact form if you have any questions related to buying an off road caravan & we will get back to you.",
  robots: "index, follow",
  openGraph: {
    title: "Contact Off Road Caravans - offroadcaravans.com",
    description:
      "Contact offroadcaravans.com Australia . Fill in our contact form if you have any questions related to buying an off road caravan & we will get back to you.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Off Road Caravans - offroadcaravans.com",
    description:
      "Contact offroadcaravans.com Australia . Fill in our contact form if you have any questions related to buying an off road caravan & we will get back to you.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/contact/",
  },
};
export default function Home() {
  return <Contacts />;
}
