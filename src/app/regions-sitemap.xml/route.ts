// src/app/regions-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchListings } from "@/api/listings/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

// Simple slugify for clean URLs
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-") // spaces → dashes
    .replace(/&/g, "and")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .trim();
}

export async function GET() {
  const data = await fetchListings({ page: 1 });
  const states = data.data?.states ?? [];

  const urls: string[] = [];

  states.forEach((state: any) => {
    const stateSlug = slugify(state.value);

    state.regions?.forEach((region: any) => {
      const regionSlug = slugify(region.value);

      urls.push(`
        <url>
          <loc>${SITE_URL}/listings/${stateSlug}-state/${regionSlug}-region/</loc>
          <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>
      `);
    });
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("")}
  </urlset>`;

  return new NextResponse(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
