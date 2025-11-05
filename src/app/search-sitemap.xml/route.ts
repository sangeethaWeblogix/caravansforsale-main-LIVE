// src/app/listings-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchSearchkeywords } from "@/api/sitemapSearchKeyword/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

export async function GET() {
  try {
    const searchItems = await fetchSearchkeywords();
    const today = new Date().toISOString().split("T")[0];

    const urls = searchItems
      .map((item) => {
        let finalUrl = "";

        if (item.url && item.url.trim() !== "") {
          // ✅ use API-provided URL directly
          finalUrl = item.url.trim();
        } else {
          // ✅ fallback to generated slug
          let slug = item.name?.toLowerCase().replace(/\s+/g, "-").trim() || "";

          // remove leading/trailing slashes
          slug = slug.replace(/^\/+|\/+$/g, "");

          // ensure "-search" suffix
          if (!slug.endsWith("-search")) slug = `${slug}-search`;

          finalUrl = `${SITE_URL}/listings/${slug}/`;
        }

        return `
        <url>
          <loc>${finalUrl}</loc>
          <lastmod>${today}</lastmod>
          <changefreq>Daily</changefreq>
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
