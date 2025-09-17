// src/app/sleeps-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

const sleep = [1, 2, 3, 4, 5, 6, 7];

export async function GET() {
  let urls = "";

  sleep.forEach((s) => {
    // exact match
    urls += `
    <url>
      <loc>${SITE_URL}/listings/${s}-people-sleeping-capacity</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>`;

    // over
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;
  console.log("Generated sleeps sitemap URLs:", urls);
  return new NextResponse(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
