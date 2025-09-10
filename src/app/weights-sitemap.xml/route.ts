// src/app/weights-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

const atm = [
  600, 800, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000,
  4500,
];

export async function GET() {
  let urls = "";

  // under
  atm.forEach((w) => {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/under-${w}-kg-atm</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`;
  });

  // between
  for (let i = 0; i < atm.length - 1; i++) {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/between-${atm[i]}-kg-and-${
      atm[i + 1]
    }-kg-atm</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`;
  }

  // over
  const last = atm[atm.length - 1];
  urls += `
  <url>
    <loc>${SITE_URL}/listings/over-${last}-kg-atm</loc>
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
