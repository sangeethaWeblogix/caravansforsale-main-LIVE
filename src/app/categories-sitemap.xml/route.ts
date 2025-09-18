// src/app/listings-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchProductList } from "@/api/productList/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

type Category = { slug: string; name: string };

export async function GET() {
  const data = await fetchProductList();
  const categories: Category[] = data?.data?.all_categories ?? [];

  const today = new Date().toISOString().split("T")[0];

  const urls = categories
    .map(
      (cat) => `
      <url>
        <loc>${SITE_URL}/listings/${cat.slug}-category/</loc>
        <lastmod>${today}</lastmod>
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
