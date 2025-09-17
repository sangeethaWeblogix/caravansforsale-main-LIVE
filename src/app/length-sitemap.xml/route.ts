// src/app/length-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

const length = [
  12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
];

export async function GET() {
  let urls = "";

  // under
  length.forEach((l) => {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/under-${l}-ft-length</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`;
  });

  // between
  for (let i = 0; i < length.length - 1; i++) {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/between-${length[i]}-ft-and-${
      length[i + 1]
    }-ft-length</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`;
  }

  // over
  const lastLength = length[length.length - 1];
  urls += `
  <url>
    <loc>${SITE_URL}/listings/over-${lastLength}-ft-length</loc>
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
