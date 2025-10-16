// src/app/weights-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

const atm = [
  600, 800, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000,
  4500,
];

export async function GET() {
  let urls = "";

  // ✅ Under every value
  atm.forEach((w) => {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/under-${w}-kg-atm/</loc>
      <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`;
  });

  // ✅ Over every value
  atm.forEach((w) => {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/over-${w}-kg-atm/</loc>
      <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`;
  });

  // ✅ Between every possible pair (i < j)
  for (let i = 0; i < atm.length; i++) {
    for (let j = i + 1; j < atm.length; j++) {
      urls += `
      <url>
        <loc>${SITE_URL}/listings/between-${atm[i]}-kg-${atm[j]}-kg-atm/</loc>
        <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
      </url>`;
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  return new NextResponse(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
