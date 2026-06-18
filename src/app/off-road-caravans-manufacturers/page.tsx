import Header from "./components/OffRoadCaravanHeader";
import Middle from "./components/OffRoadCaravanMiddle";
import FaqSection from "./components/FaqSection";
import Footer from "./components/OffRoadCaravanInfoFooter";
import "./offroad.css?=1";
import { Metadata } from "next";

const metaTitle = "Top Off-Road Caravan Manufacturers in Australia: Best Brands 2024";
const metaDescription =
  "Discover Australia's leading off-road caravan manufacturers. Compare top brands known for rugged build quality, innovative design, and outback-ready performance.";

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  robots: "index, follow",
  alternates: {
    canonical: "https://www.caravansforsale.com.au/off-road-caravans-manufacturers/",
  },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: "https://www.caravansforsale.com.au/off-road-caravans-manufacturers/",
  },
  twitter: {
    card: "summary_large_image",
    title: metaTitle,
    description: metaDescription,
  },
};

export default function Home() {
  return (
    <div>
      <Header />
      <Middle />
      <Footer />
      <FaqSection />
    </div>
  );
}
