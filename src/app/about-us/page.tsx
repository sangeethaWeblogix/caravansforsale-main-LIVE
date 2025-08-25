import { Metadata } from "next";
import About from "./about";
import "./about.css";

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "About Caravan Marketplace - Your Trusted Caravan Resource";
  const metaDescription =
    "Caravan Marketplace is your go-to platform for finding the perfect caravan from the right manufacturer or dealer @ the right price.";

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
  return <About />;
}
