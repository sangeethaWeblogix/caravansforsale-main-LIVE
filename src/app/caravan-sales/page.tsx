import type { Metadata } from "next";
import Home from "./home";
import "../globals.css";
import { fetchSleepBands } from "@/api/homeApi/sleep/api";

export const metadata: Metadata = {
  title: "Caravan Sales Australia | New & Used Caravans for Sale",
  description:
    "Find the best caravan sales across Australia. Browse thousands of new and used caravans from trusted dealers and private sellers. Compare prices, types, and locations to find your perfect caravan.",
};
import { fetchRegion } from "@/api/homeApi/region/api";
import { fetchManufactures } from "@/api/homeApi/manufacture/api";
import { fetchPriceBasedCaravans } from "@/api/homeApi/price/api";
import { fetchAtmBasedCaravans } from "@/api/homeApi/weight/api";
import { fetchLengthBasedCaravans } from "@/api/homeApi/length/api";
import { fetchUsedCaravansList } from "@/api/homeApi/usedCaravanList/api";
import { fetchStateBasedCaravans } from "@/api/homeApi/state/api";
import { fetchRequirements } from "@/api/postRquirements/api";
import { fetchHomePage } from "@/api/home/api";

export const revalidate = 86400;

const CANONICAL = "https://www.caravansforsale.com.au/caravan-sales/";

const schemaJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": CANONICAL,
      "url": CANONICAL,
      "name": "Caravan Sales Australia | New & Used Caravans for Sale",
      "description": "Find the best caravan sales across Australia. Browse thousands of new and used caravans from trusted dealers and private sellers.",
      "inLanguage": "en-AU",
      "breadcrumb": { "@id": `${CANONICAL}#breadcrumb` },
      "isPartOf": { "@type": "WebSite", "url": "https://www.caravansforsale.com.au/" },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${CANONICAL}#breadcrumb`,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home",          "item": "https://www.caravansforsale.com.au/" },
        { "@type": "ListItem", "position": 2, "name": "Caravan Sales", "item": CANONICAL },
      ],
    },
  ],
};

export default async function OffRoadCaravansDemoPage() {
  const [
    sleepBands,
    regionBands,
    manufactureBands,
    atmBands,
    lengthBands,
    priceBands,
    usedData,
    stateBands,
    requirements,
    homeblog,
  ] = await Promise.all([
    fetchSleepBands(),
    fetchRegion(),
    fetchManufactures(),
    fetchAtmBasedCaravans(),
    fetchLengthBasedCaravans(),
    fetchPriceBasedCaravans(),
    fetchUsedCaravansList(),
    fetchStateBasedCaravans(),
    fetchRequirements(),
    fetchHomePage(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />
      <Home
      sleepBands={sleepBands}
      regionBands={regionBands}
      manufactureBands={manufactureBands}
      atmBands={atmBands}
      lengthBands={lengthBands}
      priceBands={priceBands}
      usedData={usedData}
      stateBands={stateBands}
      requirements={requirements}
      homeblog={homeblog?.latest_posts ?? []}
    />
    </>
  );
}
