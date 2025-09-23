// src/app/general-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

// Static URLs (you can extend this later with categories, states, regions)
const staticUrls = [
  "",
  "caravan-manufacturers",
  "off-road-caravans-manufacturers",
  "listings",
  "blog",
  "terms-conditions",
  "privacy-policy",
  "privacy-collection-statement",
  "about-us",
  "contact",
];

export async function GET() {
  const urls = staticUrls
    .map((path) => {
      return `
        <url>
          <loc>${SITE_URL}/${path}</loc>
          <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    })
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
