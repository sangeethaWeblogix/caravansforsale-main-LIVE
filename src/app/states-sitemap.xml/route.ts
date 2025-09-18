import { NextResponse } from "next/server";
import { fetchProductList } from "@/api/productList/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

type Region = { value: string };
type State = { value: string; regions?: Region[] };

export async function GET() {
  const data = await fetchProductList();
  const states: State[] = data?.data?.states ?? [];

  const urls = states.flatMap((state) => {
    const stateSlug = state.value;

    // 1. Add state-level URL
    const stateUrl = `
      <url>
        <loc>${SITE_URL}/listings/${stateSlug}-state/</loc>
        <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
      </url>`;

    return [stateUrl];
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("")}
  </urlset>`;

  return new NextResponse(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
