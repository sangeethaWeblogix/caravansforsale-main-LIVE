import Header from "./Header";
import Middle from "./Middle";
import FaqSection from "./FaqSection";
import "./comman.css";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle =
    "Top 10 Caravan Manufacturers in Australia: Best Brands of 2024";
  const metaDescription =
    "See how top Australian caravan manufacturers excel with the best in innovative designs, quality construction, cost efficiency, and expert craftsmanship.";

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
  return (
    <div>
      <Header />
      <Middle />
      <FaqSection />
    </div>
  );
}
