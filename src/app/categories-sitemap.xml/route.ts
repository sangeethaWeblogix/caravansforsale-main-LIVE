// src/app/listings-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchProductList } from "@/api/productList/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

type Category = { slug: string; name: string };

export async function GET() {
  try {
    const data = await fetchProductList();
    // console.log(
    //   "✅ fetchProductList() response:",
    //   JSON.stringify(data, null, 2)
    // );

    const categories: Category[] =
      data?.data?.all_categories || data?.data?.categories || [];

    const today = new Date().toISOString().split("T")[0];

    if (!categories.length) {
      console.warn("⚠️ No categories found for sitemap");
    }

    const urls = categories
      .map(
        (cat) => `
        <url>
          <loc>${SITE_URL}/listings/${cat.slug}-category/</loc>
          <lastmod>${today}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.7</priority>
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
  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
    return new NextResponse("Sitemap generation failed", { status: 500 });
  }
}
