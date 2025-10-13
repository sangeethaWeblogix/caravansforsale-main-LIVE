// src/app/products-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

const API_BASE = "https://www.admin.caravansforsale.com.au/wp-json/wc/v3";
const CONSUMER_KEY = "ck_73393ca56ac29867aa71c9beeba4714a49c4116b";
const CONSUMER_SECRET = "cs_b554ee636b76bf9968bbe181695a6fb2b4b180b1";

// Simple helper to get total pages
async function fetchTotalPages() {
  const url = `${API_BASE}/products?per_page=100&page=1&_fields=id&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch total pages`);
  const totalPages = Number(res.headers.get("X-WP-TotalPages")) || 1;
  const totalProducts = Number(res.headers.get("X-WP-Total")) || 0;
  return { totalPages, totalProducts };
}

export async function GET() {
  try {
    const { totalProducts } = await fetchTotalPages();
    const perFile = 10000; // 💡 10k URLs per sitemap file
    const totalFiles = Math.ceil(totalProducts / perFile);

    const sitemaps = Array.from({ length: totalFiles }, (_, i) => i + 1)
      .map(
        (num) => `
      <sitemap>
        <loc>${SITE_URL}/products-sitemap-${num}.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </sitemap>`
      )
      .join("");

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${sitemaps}
      </sitemapindex>`;

    return new NextResponse(sitemapIndex, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch (err) {
    console.error("❌ Error generating sitemap index:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
