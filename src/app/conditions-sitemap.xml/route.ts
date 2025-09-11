// src/app/conditions-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

// ✅ only these three
const conditions = ["new", "used", "near-new"];

export async function GET() {
  let urls = "";

  conditions.forEach((c) => {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/${c}-condition</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  return new NextResponse(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
