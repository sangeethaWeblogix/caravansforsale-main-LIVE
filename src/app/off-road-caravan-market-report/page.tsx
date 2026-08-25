import type { Metadata } from "next";
import Home from "./home";
import "../globals.css";

export const metadata: Metadata = {
  title: "Australian Off Road Caravan Market Report 2026 | Prices & Data",
  description:
    "Explore 2026 Australian off road caravan market data, including new and used asking prices, listings by state, popular sizes, ATM, sleeps and brands.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.caravansforsale.com.au/off-road-caravan-market-report/" },
};

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY  = process.env.CFS_API_KEY;

const wpHeaders = (): Record<string, string> => ({
  Accept: "application/json",
  ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
});

async function safeJson(url: string): Promise<any> {
  try {
    const res = await fetch(url, { headers: wpHeaders(), next: { revalidate: 0 } });
    if (!res.ok) return null;
    const raw = await res.text();
    const start = raw.indexOf("{");
    return JSON.parse(start <= 0 ? raw : raw.substring(start));
  } catch { return null; }
}

export type SnapshotData = {
  total_count: number;
  new_count: number;
  used_count: number;
  new_price_median: number;
  used_price_median: number;
  median_price: number;
  common_length: string;
  median_atm: number;
  common_sleeps: number;
  snapshot_date: string;
};

export type StateRow     = { state: string; count: number; share: number; median_price: number };
export type LengthRow    = { range: string; count: number; share: number; median_price: number };
export type AtmRow       = { range: string; count: number; share: number; median_price: number };
export type SleepsRow    = { berths: string; count: number; share: number; median_price: number };
export type BrandRow     = { brand: string; count: number; share: number; median_price: number; median_atm: number };
export type TrendPoint   = { label: string; total: number; new_count: number; used_count: number };

export type MarketReportData = {
  snapshot:   SnapshotData;
  states:     StateRow[];
  lengths:    LengthRow[];
  atms:       AtmRow[];
  sleeps:     SleepsRow[];
  brands:     BrandRow[];
  trend:      TrendPoint[];
};

async function fetchSnapshot(): Promise<SnapshotData> {
  const empty: SnapshotData = {
    total_count: 0, new_count: 0, used_count: 0,
    new_price_median: 0, used_price_median: 0, median_price: 0,
    common_length: "", median_atm: 0, common_sleeps: 0, snapshot_date: "",
  };
  const j = await safeJson(`${API_BASE}/market_snapshot?category=off-road`);
  if (!j?.success) return empty;
  return {
    total_count:       j.total_count        ?? 0,
    new_count:         j.new_count          ?? 0,
    used_count:        j.used_count         ?? 0,
    new_price_median:  j.new_price_median   ?? j.new_median_price  ?? 0,
    used_price_median: j.used_price_median  ?? j.used_median_price ?? 0,
    median_price:      j.median_price       ?? j.all_median_price  ?? j.price_median ?? 0,
    common_length:     j.common_length      ?? j.most_common_length ?? "",
    median_atm:        j.median_atm         ?? 0,
    common_sleeps:     j.common_sleeps      ?? j.most_common_sleeps ?? 0,
    snapshot_date:     j.snapshot_date      ?? j.data_date          ?? "",
  };
}

async function fetchStates(): Promise<StateRow[]> {
  const j = await safeJson(`${API_BASE}/off-road-state-caravans-list`);
  const raw: any[] = j?.states ?? [];
  return raw.map(s => ({
    state:        s.state       ?? s.name        ?? "",
    count:        s.count       ?? s.listings    ?? 0,
    share:        s.share       ?? s.percentage  ?? 0,
    median_price: s.median_price ?? s.price      ?? 0,
  }));
}

async function fetchMarketReport(): Promise<Partial<MarketReportData>> {
  const j = await safeJson(`${API_BASE}/market_report?category=off-road`);
  if (!j) return {};
  const mapRows = (arr: any[], keyMap: (r: any) => any) =>
    Array.isArray(arr) ? arr.map(keyMap) : [];

  return {
    lengths: mapRows(j.by_length ?? j.lengths ?? [], r => ({
      range:        r.range        ?? r.label       ?? "",
      count:        r.count        ?? r.listings    ?? 0,
      share:        r.share        ?? r.percentage  ?? 0,
      median_price: r.median_price ?? r.price       ?? 0,
    })),
    atms: mapRows(j.by_atm ?? j.atms ?? [], r => ({
      range:        r.range        ?? r.label       ?? "",
      count:        r.count        ?? r.listings    ?? 0,
      share:        r.share        ?? r.percentage  ?? 0,
      median_price: r.median_price ?? r.price       ?? 0,
    })),
    sleeps: mapRows(j.by_sleeps ?? j.sleeps ?? j.sleeping_capacity ?? [], r => ({
      berths:       r.berths       ?? r.label       ?? "",
      count:        r.count        ?? r.listings    ?? 0,
      share:        r.share        ?? r.percentage  ?? 0,
      median_price: r.median_price ?? r.price       ?? 0,
    })),
    brands: mapRows(j.brands ?? j.top_brands ?? [], r => ({
      brand:        r.brand        ?? r.make        ?? "",
      count:        r.count        ?? r.listings    ?? 0,
      share:        r.share        ?? r.percentage  ?? 0,
      median_price: r.median_price ?? r.price       ?? 0,
      median_atm:   r.median_atm   ?? r.atm         ?? 0,
    })),
    trend: mapRows(j.trend ?? j.history ?? [], r => ({
      label:     r.label     ?? r.month ?? "",
      total:     r.total     ?? 0,
      new_count: r.new_count ?? r.new   ?? 0,
      used_count:r.used_count?? r.used  ?? 0,
    })),
  };
}

async function fetchBrands(): Promise<BrandRow[]> {
  const j = await safeJson(`${API_BASE}/category-makes-count?category=off-road`);
  const makes: any[] = j?.makes ?? [];
  const total = makes.reduce((s, m) => s + (m.count ?? 0), 0);
  return makes
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 10)
    .map(m => ({
      brand:        m.make         ?? "",
      count:        m.count        ?? 0,
      share:        total > 0 ? Math.round((m.count / total) * 1000) / 10 : 0,
      median_price: m.median_price ?? 0,
      median_atm:   m.median_atm   ?? 0,
    }));
}

export const revalidate = 0;

const CANONICAL = "https://www.caravansforsale.com.au/off-road-caravan-market-report/";

const schemaJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": CANONICAL,
      "url": CANONICAL,
      "headline": "Australian Off Road Caravan Market Report 2026",
      "description": "Analysis of active off road caravan advertisements on CaravansForSale.com.au covering prices, supply, sizes, weights, brands and location data across Australia.",
      "inLanguage": "en-AU",
      "publisher": { "@type": "Organization", "name": "CaravansForSale.com.au", "url": "https://www.caravansforsale.com.au/" },
      "breadcrumb": { "@id": `${CANONICAL}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${CANONICAL}#breadcrumb`,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home",              "item": "https://www.caravansforsale.com.au/" },
        { "@type": "ListItem", "position": 2, "name": "Off Road Caravans", "item": "https://www.caravansforsale.com.au/off-road-caravans/" },
        { "@type": "ListItem", "position": 3, "name": "Market Report",     "item": CANONICAL },
      ],
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "How much does an off road caravan cost in Australia?",         "acceptedAnswer": { "@type": "Answer", "text": "The current median advertised asking price for off road caravans on CaravansForSale.com.au varies by condition. New caravans typically carry a higher median than used caravans. Check the live market data on this page for current figures." } },
        { "@type": "Question", "name": "Which state has the most off road caravans for sale?",         "acceptedAnswer": { "@type": "Answer", "text": "Victoria typically has the largest number of off road caravans advertised on CaravansForSale.com.au, followed by New South Wales and Queensland." } },
        { "@type": "Question", "name": "What is the most common off road caravan size?",               "acceptedAnswer": { "@type": "Answer", "text": "The 18–20ft range is consistently one of the most common size categories advertised across Australian off road caravan listings." } },
        { "@type": "Question", "name": "Are the prices in this report actual sale prices?",             "acceptedAnswer": { "@type": "Answer", "text": "No. All prices shown are advertised asking prices from active marketplace listings. The final amount paid may differ from the advertised price." } },
        { "@type": "Question", "name": "What is ATM and why does it matter for off road caravans?",    "acceptedAnswer": { "@type": "Answer", "text": "ATM means Aggregate Trailer Mass — the maximum allowable laden weight of the caravan as specified by the manufacturer. It is a key figure when determining whether a tow vehicle is rated to tow a specific caravan." } },
      ],
    },
  ],
};

export default async function OffRoadMarketReportPage() {
  const [snapshot, states, marketReport, fallbackBrands] = await Promise.all([
    fetchSnapshot(),
    fetchStates(),
    fetchMarketReport(),
    fetchBrands(),
  ]);

  const data: MarketReportData = {
    snapshot,
    states,
    lengths: marketReport.lengths ?? [],
    atms:    marketReport.atms    ?? [],
    sleeps:  marketReport.sleeps  ?? [],
    brands:  (marketReport.brands && marketReport.brands.length > 0) ? marketReport.brands : fallbackBrands,
    trend:   marketReport.trend   ?? [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />
      <Home data={data} />
    </>
  );
}
