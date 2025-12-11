 // src/app/conditions-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

export async function GET() {
  const currentYear = new Date().getFullYear();

  // ✅ explicitly type the array as number[]
  const years: number[] = [];
  for (let year = currentYear; year >= 2004; year--) {
    years.push(year);
  }

  let urls = "";

  years.forEach((year) => {
    urls += `
    <url>
      <loc>${SITE_URL}/listings/${year}-caravans-range/</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.5</priority>
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
