import { Metadata } from "next";
import Statement from "./statement";
import "./statement.css";

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "Privacy Collection Statement";
  const metaDescription =
    "Caravan Marketplace ABN 92 009 784 881 (we, us or our) is committed to protecting the privacy of your personal information. You can access our full privacy policy on our website at&nbsp;https://www.caravansforsale.com.au. In the course of our business, we collect personal information from our current and prospective customers, manufacturers, dealers and prospective contractor, consultant, employees....";

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
  return <Statement />;
}
