import type { Metadata } from "next";
import Home from "./home";
import "../globals.css";
import { fetchSleepBands } from "@/api/homeApi/sleep/api";

export const metadata: Metadata = {
  title: "Off Road Caravans Australia | New & Used Off Road Caravans for Sale",
  description:
    "Discover Australia's largest collection of off road caravans. Compare full off road, semi off road and hybrid caravans, browse live listings, reviews and expert buying guides.",
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

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY  = process.env.CFS_API_KEY;
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || "https://www.caravansforsale.com.au";

const wpHeaders = (): Record<string, string> => ({
  Accept: "application/json",
  ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
});

async function fetchOffRoadCount(): Promise<number> {
  try {
    const res = await fetch(
      `${APP_URL}/api/pool-listings/?category=off-road&per_page=1&page=1&orderby=default&seed=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return 0;
    const json = await res.json();
    return (
      json?.data?.counts?.total_count ??
      json?.counts?.total_count ??
      json?.data?.pagination?.total_products ??
      json?.pagination?.total_products ??
      0
    );
  } catch {
    return 0;
  }
}

async function fetchOffRoadBlogs(): Promise<any[]> {
  try {
    const res = await fetch(
      `${API_BASE}/blog?product_category=off-road&per_page=20&page=1`,
      { headers: wpHeaders(), next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    return json?.data?.latest_blog_posts?.items ?? json?.data?.posts ?? json?.posts ?? [];
  } catch { return []; }
}

async function fetchOffRoadPopularBlogs(seed: number): Promise<any[]> {
  try {
    const res = await fetch(
      `${API_BASE}/blog-shuffle?popular=off-road&seed=${seed}`,
      { headers: wpHeaders(), next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    return json?.data ?? json?.posts ?? json?.items ?? [];
  } catch { return []; }
}

async function fetchOffRoadBrandBlogs(seed: number): Promise<any[]> {
  try {
    const res = await fetch(
      `${API_BASE}/blog-shuffle?make=off-road&seed=${seed}`,
      { headers: wpHeaders(), next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    return json?.data ?? json?.posts ?? json?.items ?? [];
  } catch { return []; }
}

async function fetchOffRoadModelBlogs(seed: number): Promise<any[]> {
  try {
    const res = await fetch(
      `${API_BASE}/blog-shuffle?model=off-road&seed=${seed}`,
      { headers: wpHeaders(), next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    return json?.data ?? json?.posts ?? json?.items ?? [];
  } catch { return []; }
}

async function fetchOffRoadPrice(orderby: "price_asc" | "price_desc", condition?: string): Promise<number> {
  try {
    const params = new URLSearchParams({
      category: "off-road",
      orderby,
      per_page: "1",
      page: "1",
    });
    if (condition) params.set("condition", condition);
    const res = await fetch(`${API_BASE}/pool_test?${params.toString()}`, {
      headers: wpHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return 0;
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    const products: any[] = json?.data?.products ?? json?.products ?? [];
    const price = products[0]?.regular_price ?? products[0]?.sale_price ?? "";
    return parseInt(String(price).replace(/[^0-9]/g, ""), 10) || 0;
  } catch {
    return 0;
  }
}

export const revalidate = 86400;

const CANONICAL = "https://www.caravansforsale.com.au/off-road-caravans/";

const schemaJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": CANONICAL,
      "url": CANONICAL,
      "name": "Off Road Caravans Australia | New & Used Off Road Caravans for Sale",
      "description": "Discover Australia's largest collection of off road caravans. Compare full off road, semi off road and hybrid caravans, browse live listings, read expert reviews and explore detailed buying guides.",
      "inLanguage": "en-AU",
      "breadcrumb": { "@id": `${CANONICAL}#breadcrumb` },
      "isPartOf": { "@type": "WebSite", "url": "https://www.caravansforsale.com.au/" },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${CANONICAL}#breadcrumb`,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home",             "item": "https://www.caravansforsale.com.au/" },
        { "@type": "ListItem", "position": 2, "name": "Off Road Caravans", "item": CANONICAL },
      ],
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is an off road caravan?",
          "acceptedAnswer": { "@type": "Answer", "text": "An off road caravan is a caravan built to handle rough, unsealed tracks and remote terrain. They typically feature heavy-duty chassis, independent suspension, reinforced bodywork, larger water and battery capacity, and off-road tyres to handle Australia's outback and bush conditions." },
        },
        {
          "@type": "Question",
          "name": "What is the difference between semi off road and full off road caravans?",
          "acceptedAnswer": { "@type": "Answer", "text": "Semi off road caravans are built for light unsealed roads and easy bush tracks, with upgraded suspension and stronger construction. Full off road caravans are engineered for extreme terrain — think river crossings, rocky tracks and remote touring — with independent suspension, heavy-duty chassis and full off-grid capability." },
        },
        {
          "@type": "Question",
          "name": "Can off road caravans go off grid?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. Most off road caravans come with or can be fitted with solar panels, lithium batteries, large fresh water tanks and composting or cassette toilets, allowing extended stays in remote areas without external power or water hookups." },
        },
        {
          "@type": "Question",
          "name": "Do I need a special vehicle to tow an off road caravan?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. Off road caravans are heavier and wider than standard caravans. You'll need a high-capacity 4WD with a tow bar rated to the caravan's ATM. Always check the caravan's ATM and the tow vehicle's GVM and tow rating before purchasing." },
        },
        {
          "@type": "Question",
          "name": "Are off road caravans suitable for families?",
          "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. Many off road models come in family-friendly layouts with bunk beds, multiple sleeping berths, full kitchens and ensuites. Brands like Jayco, New Age and Trakmaster offer popular family off road models across a range of budgets." },
        },
        {
          "@type": "Question",
          "name": "What is the average price of an off road caravan in Australia?",
          "acceptedAnswer": { "@type": "Answer", "text": "Off road caravan prices in Australia typically range from around $40,000 for entry-level semi off road models to over $150,000 for premium full off road expedition caravans. The most popular mid-range models sit between $60,000 and $100,000." },
        },
      ],
    },
  ],
};

export default async function OffRoadCaravansDemoPage() {
  const seed = Math.floor(Math.random() * 7) + 1;

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
    offRoadCount,
    offRoadPriceMin,
    offRoadPriceMax,
    offRoadUsedPriceMin,
    offRoadUsedPriceMax,
    offRoadBlogs,
    offRoadPopularBlogs,
    offRoadBrandBlogs,
    offRoadModelBlogs,
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
    fetchOffRoadCount(),
    fetchOffRoadPrice("price_asc"),
    fetchOffRoadPrice("price_desc"),
    fetchOffRoadPrice("price_asc", "used"),
    fetchOffRoadPrice("price_desc", "used"),
    fetchOffRoadBlogs(),
    fetchOffRoadPopularBlogs(seed),
    fetchOffRoadBrandBlogs(seed),
    fetchOffRoadModelBlogs(seed),
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
      offRoadCount={offRoadCount}
      offRoadPriceMin={offRoadPriceMin}
      offRoadPriceMax={offRoadPriceMax}
      offRoadUsedPriceMin={offRoadUsedPriceMin}
      offRoadUsedPriceMax={offRoadUsedPriceMax}
      offRoadBlogs={offRoadBlogs}
      offRoadPopularBlogs={offRoadPopularBlogs}
      offRoadBrandBlogs={offRoadBrandBlogs}
      offRoadModelBlogs={offRoadModelBlogs}
    />
    </>
  );
}
