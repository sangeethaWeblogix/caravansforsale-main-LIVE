// src/app/states-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchProductList } from "@/api/productList/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

// Simple slugify
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/&/g, "and")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .trim();
}

export async function GET() {
  const data = await fetchProductList();
  console.log("dataaaa", data);
  const states = data?.states ?? [];

  const urls = states
    .map((state: any) => {
      const stateSlug = slugify(state.value);
      return `
        <url>
          <loc>${SITE_URL}/listings/${stateSlug}-state/</loc>
          <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
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
