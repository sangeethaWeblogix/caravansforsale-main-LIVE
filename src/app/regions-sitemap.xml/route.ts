import { NextResponse } from "next/server";
import { fetchProductList } from "@/api/productList/api";

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
    const data = await fetchProductList();
    console.log("🧠 fetchProductList():", JSON.stringify(data, null, 2));

    let states: State[] = [];

    if (data?.data?.states) {
      states = data.data.states as State[];
    } else if (data?.data?.all_states) {
      states = (data.data.all_states as ApiState[]).map((s) => ({
        value: s.state || s.value || "",
        regions: (
          (s.regions || s.regions_list || []) as (string | { value: string })[]
        ).map((r) =>
          typeof r === "string" ? { value: r } : { value: r.value }
        ),
      }));
    }

    if (!states.length) {
      console.warn("⚠️ No states found in product list data");
    }


    
    const urls = states.flatMap((state) => {
      const stateSlug = state.value;
      const regions = state.regions ?? [];

      if (!regions.length) {
        console.warn(`⚠️ No regions for state: ${stateSlug}`);
      }

      return regions.map(
        (region) => `
          <url>
            <loc>${SITE_URL}/listings/${stateSlug}-state/${region.value}-region/</loc>
           <lastmod>${new Date().toISOString()}</lastmod>

            <changefreq>daily</changefreq>
            <priority>0.7</priority>
          </url>`
      );
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls.join("")}
      </urlset>`;

    return new NextResponse(sitemap, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch (err) {
    console.error("❌ Error generating sitemap:", err);
    return new NextResponse("Sitemap generation failed", { status: 500 });
  }
}
