// src/app/regions-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchProductList } from "@/api/productList/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

export async function GET() {
  const data = await fetchProductList();
  const states = data?.data?.states ?? []; // <-- FIXED here

  const urls = states.flatMap((state: any) => {
    const stateSlug = state.value;

    return (state.regions ?? []).map(
      (region: any) => `
        <url>
          <loc>${SITE_URL}/listings/${stateSlug}-state/${
        region.value
      }-region/</loc>
          <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
          <changefreq>weekly</changefreq>
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
}
