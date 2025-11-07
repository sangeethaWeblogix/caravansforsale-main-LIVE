 import { NextResponse } from "next/server";
import { fetchProductList } from "@/api/productList/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

type Region = { value: string };
type State = { value: string; regions?: Region[] };
type Category = { slug: string; name: string };

interface ApiState {
  state?: string;
  value?: string;
  regions?: (string | { value: string })[];
  regions_list?: (string | { value: string })[];
}

export async function GET() {
  try {
    // Fetch categories + states
    const data = await fetchProductList();
    console.log("🧠 fetchProductList():", JSON.stringify(data, null, 2));

    // Extract categories
    const categories: Category[] =
      data?.data?.all_categories || data?.data?.categories || [];

    // Extract states + regions
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

    if (!categories.length) console.warn("⚠️ No categories found");
    if (!states.length) console.warn("⚠️ No states found");

    const urls: string[] = [];

    // ✅ 1. Category-only URLs
    for (const cat of categories) {
      urls.push(`
        <url>
          <loc>${SITE_URL}/listings/${cat.slug}-category/</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
        </url>`);
    }

    // ✅ 2. Category + State URLs
    for (const cat of categories) {
      for (const state of states) {
        const stateSlug = state.value?.toLowerCase().replace(/\s+/g, "-");
        urls.push(`
          <url>
            <loc>${SITE_URL}/listings/${cat.slug}-category/${stateSlug}-state/</loc>
            <lastmod>${new Date().toISOString()}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.7</priority>
          </url>`);
      }
    }

    // ✅ 3. Category + State + Region URLs
    for (const cat of categories) {
      for (const state of states) {
        const stateSlug = state.value?.toLowerCase().replace(/\s+/g, "-");
        const regions = state.regions ?? [];
        for (const region of regions) {
          const regionSlug = region.value?.toLowerCase().replace(/\s+/g, "-");
          urls.push(`
            <url>
              <loc>${SITE_URL}/listings/${cat.slug}-category/${stateSlug}-state/${regionSlug}-region/</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.6</priority>
            </url>`);
        }
      }
    }

    // ✅ Build sitemap XML
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
