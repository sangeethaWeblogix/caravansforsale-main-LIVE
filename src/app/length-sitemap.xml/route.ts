// src/app/length-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

const lengths = [
  12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
];

export async function GET() {
  let urls = "";

  // ✅ Under every value
  lengths.forEach((l) => {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/under-${l}-length-in-feet/</loc>
      <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.5</priority>
    </url>`;
  });

  // ✅ Over every value
  lengths.forEach((l) => {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/over-${l}-length-in-feet/</loc>
      <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.5</priority>
    </url>`;
  });

  // ✅ Between every possible pair (i < j)
  for (let i = 0; i < lengths.length; i++) {
    for (let j = i + 1; j < lengths.length; j++) {
      urls += `
      <url>
        <loc>${SITE_URL}//listings/between-${lengths[i]}-${
        lengths[j]
      }-length-in-feet/</loc>
        <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.5</priority>
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
