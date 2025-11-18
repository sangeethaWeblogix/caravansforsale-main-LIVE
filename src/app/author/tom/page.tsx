export const dynamic = "force-dynamic";

import Author from "./author";
import "./author.css";
import { Metadata } from "next";
export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "";
  const metaDescription = "";

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
  return <Author />;
}
