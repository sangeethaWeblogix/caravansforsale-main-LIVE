// src/app/categories-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

export async function GET() {
  // call the product params API
  const res = await fetch(
    "https://www.admin.caravansforsale.com.au/wp-json/cfs/v1/params-product-list",
    { next: { revalidate: 3600 } } // revalidate every hour (optional)
  );

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  const data = await res.json();
  const categories = data?.data?.all_categories ?? [];

  const urls = categories
    .map(
      (cat: { slug: string }) => `
    <url>
      <loc>${SITE_URL}/${cat.slug}-category</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
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
