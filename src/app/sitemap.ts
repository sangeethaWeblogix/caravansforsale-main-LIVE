 // src/app/sitemap.ts
import { NextResponse } from "next/server";

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

  const sitemaps = [
    "general-sitemap.xml",
    "search-sitemap.xml",
    "blogs-sitemap.xml",
    "makes-sitemap.xml",
    "locations-sitemap.xml",
  ];

  // Automatically set today's date in YYYY-MM-DD format
  const lastModified = new Date().toISOString().split("T")[0];

  // Generate XML string
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (file) => `
  <sitemap>
    <loc>${siteUrl}/${file}</loc>
    <lastmod>${lastModified}</lastmod>
  </sitemap>`
  )
  .join("")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
