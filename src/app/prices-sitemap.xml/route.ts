// src/app/prices-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

// Predefined ranges
const ranges = [
  { from: 0, to: 10000 },
  { from: 10000, to: 20000 },
  { from: 20000, to: 50000 },
  { from: 50000, to: 100000 },
  { from: 100000, to: 200000 },
  { from: 200000, to: 500000 },
];

export async function GET() {
  const urls = ranges
    .map(
      (r) => `
    <url>
      <loc>${SITE_URL}/price/${r.from}-${r.to}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.5</priority>
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
