// src/app/listings-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchSearchkeywords } from "@/api/sitemapSearchKeyword/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

 export async function GET() {
  try {
    const response = await fetch(
      "https://admin.caravansforsale.com.au/wp-json/cfs/v1/search-keyword",
      { cache: "no-store" }
    );

    const json = await response.json();
    const searchItems = json?.data ?? [];

    const urls = searchItems
      .map((item) => {
        let finalUrl = "";

        if (item.url && item.url.trim() !== "") {
          finalUrl = item.url.trim();
        } else {
          let slug = item.name?.toLowerCase().replace(/\s+/g, "-").trim() || "";
          slug = slug.replace(/^\/+|\/+$/g, "");
          if (!slug.endsWith("-search")) slug = `${slug}-search`;
          finalUrl = `${SITE_URL}/listings/${slug}/`;
        }

        return `
        <url>
          <loc>${finalUrl}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
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
  } catch (err) {
    console.error("[SITEMAP ERROR]", err);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>`,
      { headers: { "Content-Type": "application/xml" }, status: 500 }
    );
  }
}

