 import { NextResponse } from "next/server";
import { fetchProductList } from "@/api/productList/api";

const API_URL =
  "https://admin.caravansforsale.com.au/wp-json/cfs/v1/location-search-all";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

type Region = { value: string };
type State = { value: string; regions?: Region[] };

interface ApiState {
  state?: string;
  value?: string;
  regions?: (string | { value: string })[];
  regions_list?: (string | { value: string })[];
}

export async function GET() {
  try {
    // ------------------------------------------------------------
    // 🟦 1. FETCH STATE + REGION FROM PRODUCT LIST API
    // ------------------------------------------------------------
    const prod = await fetchProductList();
    let states: State[] = [];

    if (prod?.data?.states) {
      states = prod.data.states as State[];
    } else if (prod?.data?.all_states) {
      // normalize
      states = (prod.data.all_states as ApiState[]).map((s) => ({
        value: s.state || s.value || "",
        regions: (
          (s.regions || s.regions_list || []) as (string | { value: string })[]
        ).map((r) =>
          typeof r === "string" ? { value: r } : { value: r.value }
        ),
      }));
    }

    // ------------------------------------------------------------
    // 🟩 2. FETCH SUBURB LEVEL (STATE + REGION + SUBURB)
    // ------------------------------------------------------------
    const res = await fetch(API_URL, { cache: "no-store" });
    const locData = await res.json();

    const suburbItems = locData?.pincode_location_region_state || [];

    // ------------------------------------------------------------
    // 🟧 BUILD 1: STATE URLs
    // ------------------------------------------------------------
    const stateUrls = states.map(
      (s) => `
      <url>
        <loc>${SITE_URL}/listings/${s.value}-state/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.5</priority>
      </url>`
    );

    // ------------------------------------------------------------
    // 🟨 BUILD 2: STATE + REGION URLs
    // ------------------------------------------------------------
    const regionUrls = states.flatMap((s) =>
      (s.regions ?? []).map(
        (r) => `
        <url>
          <loc>${SITE_URL}/listings/${s.value}-state/${r.value}-region/</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.5</priority>
        </url>`
      )
    );

    // ------------------------------------------------------------
    // 🟥 BUILD 3: STATE + REGION + SUBURB (+ POSTCODE)
    // ------------------------------------------------------------
    const suburbUrls = suburbItems
      .map((item: any) => {
        const uri = item?.uri || "";
        if (!uri) return null;

        const parts = uri.split("/");

        const suburbPart = parts.find((p) => p.includes("-suburb")) || "";
        const regionPart = parts.find((p) => p.includes("-region")) || "";
        const statePart = parts.find((p) => p.includes("-state")) || "";
        const postcode = parts[parts.length - 1] || "";

        const suburbClean = suburbPart.replace("-suburb", "");

        return `
        <url>
          <loc>${SITE_URL}/listings/${statePart}/${regionPart}/${suburbClean}-${postcode}-suburb/</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.5</priority>
        </url>`;
      })
      .filter(Boolean);

    // ------------------------------------------------------------
    // 🧩 COMBINE ALL LEVELS
    // ------------------------------------------------------------
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${stateUrls.join("")}
${regionUrls.join("")}
${suburbUrls.join("")}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch (err) {
    console.error("❌ Sitemap generation error:", err);
    return new NextResponse("Failed to generate sitemap", { status: 500 });
  }
}
