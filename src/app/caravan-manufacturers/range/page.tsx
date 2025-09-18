import Header from "./Header";
// import  CaravanInfo  from "./CaravanInfo";
import FaqSection from "./FaqSection";
import "./comman.css";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "Experience Ultimate Off-Road Thrills with Everest Calibra";
  const metaDescription =
    "Explore rugged terrains with the Everest Calibra 20.6F, your perfect off-road companion for thrilling adventures and unmatched comfort on the trail.";

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
      <FaqSection />
    </div>
  );
}
