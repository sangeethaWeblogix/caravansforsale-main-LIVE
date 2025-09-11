// src/app/states-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchListings } from "@/api/listings/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

export async function GET() {
  const data = await fetchListings({ page: 1 });
  const states = data.data?.states ?? [];

  const urls = states
    .map(
      (state) => `
    <url>
      <loc>${SITE_URL}/${state.value}-state</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`
    )
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  return new NextResponse(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
