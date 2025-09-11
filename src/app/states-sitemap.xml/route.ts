// src/app/states-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchListings } from "@/api/listings/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

// simple slugify function
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-") // spaces -> dashes
    .replace(/&/g, "and") // & -> and
    .replace(/[^\w\-]+/g, "") // remove invalid chars
    .replace(/\-\-+/g, "-") // multiple dashes -> one
    .trim();
}

export async function GET() {
  const data = await fetchListings({ page: 1 });
  const states = data.data?.states ?? [];

  const urls = states
    .map((state) => {
      const stateSlug = slugify(state.value);
      return `
        <url>
          <loc>${SITE_URL}/listings/${stateSlug}-state</loc>
          <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>`;
    })
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  return new NextResponse(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
