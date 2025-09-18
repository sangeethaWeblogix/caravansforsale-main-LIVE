// src/app/listings-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchListings } from "@/api/listings/api";

export async function GET() {
  const firstPage = await fetchListings({ page: 1 });
  let allItems = firstPage.data?.products ?? [];

  if (firstPage.pagination && firstPage.pagination.total_pages > 1) {
    for (let page = 2; page <= firstPage.pagination.total_pages; page++) {
      const nextPage = await fetchListings({ page });
      allItems = [...allItems, ...(nextPage.data?.products ?? [])];
    }
  }

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const urls = allItems
    .map(
      (item) => `
    <url>
      <loc>product/${item.slug}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.6</priority>
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
