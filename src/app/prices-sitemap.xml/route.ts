// src/app/prices-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

const price = [
  10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 125000,
  150000, 175000, 200000, 225000, 250000, 275000, 300000,
];

export async function GET() {
  let urls = "";

  // ✅ Generate "under" ranges
  price.forEach((p) => {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/under-${p}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`;
  });

  // ✅ Generate "between" ranges
  for (let i = 0; i < price.length - 1; i++) {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/between-${price[i]}-and-${price[i + 1]}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`;
  }

  // ✅ Generate "over" last range
  const lastPrice = price[price.length - 1];
  urls += `
  <url>
    <loc>${SITE_URL}/listings/over-${lastPrice}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  return new NextResponse(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
