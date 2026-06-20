// export const dynamic = "force-dynamic"
;


import Header from "./Header";
import CaravanList from "./CaravanList";
import "./comman.css";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle =
    "Full List of Top Quality Caravan Manufacturers in Australia";
  const metaDescription =
    "Discover a diverse range of top-tier caravan manufacturers specializing in off-road, compact poptops, touring models, luxury editions & innovative hybrids.";

  return {
    title: metaTitle,
    description: metaDescription,
    robots: "index, follow",
    alternates: {
      canonical: "https://www.caravansforsale.com.au/caravan-manufacturers/all/",
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: "https://www.caravansforsale.com.au/caravan-manufacturers/all/",
      images: [
        {
          url: "https://www.caravansforsale.com.au/images/cfs-logo.png",
          width: 800,
          height: 600,
          alt: "Caravan Manufacturers Australia",
        },
      ],
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
      {/* <CaravanList /> */}
    </div>
  );
}
