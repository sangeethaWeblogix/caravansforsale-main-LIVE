// src/app/prices-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

const prices = [
  10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 125000,
  150000, 175000, 200000, 225000, 250000, 275000, 300000,
];

export async function GET() {
  let urls = "";

  // ✅ Under every value
  prices.forEach((p) => {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/under-${p}/</loc>
      <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.7</priority>
    </url>`;
  });

  // ✅ Over every value
  prices.forEach((p) => {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/over-${p}/</loc>
      <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.7</priority>
    </url>`;
  });

  // ✅ Between every possible pair (i < j)
  for (let i = 0; i < prices.length; i++) {
    for (let j = i + 1; j < prices.length; j++) {
      urls += `
      <url>
        <loc>${SITE_URL}/listings/between-${prices[i]}-${prices[j]}/</loc>
        <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
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
