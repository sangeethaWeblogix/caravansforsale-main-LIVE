// src/app/listings-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchListings } from "@/api/listings/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

export async function GET() {
  const firstPage = await fetchListings({ page: 1 });
  let allItems = firstPage.data?.products ?? [];

  if (firstPage.pagination && firstPage.pagination.total_pages > 1) {
    for (let page = 2; page <= firstPage.pagination.total_pages; page++) {
      const nextPage = await fetchListings({ page });
      allItems = [...allItems, ...(nextPage.data?.products ?? [])];
    }
  }

  const urls = allItems
    .map(
      (item) => `
    <url>
      <loc>${SITE_URL}/listing/${item.slug}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
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
