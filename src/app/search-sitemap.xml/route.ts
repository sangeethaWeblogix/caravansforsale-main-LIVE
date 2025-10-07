// src/app/listings-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchHomeSearchList } from "@/api/homeSearch/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

export async function GET() {
  try {
    const searchItems = await fetchHomeSearchList();
    const today = new Date().toISOString().split("T")[0];

    // ✅ Build URL entries using /listings/<slug>-search/
    const urls = searchItems
      .map((item) => {
        // derive slug
        let slug =
          item.url?.trim() ||
          item.name?.toLowerCase().replace(/\s+/g, "-").trim() ||
          "";

        // remove leading/trailing slashes if any
        slug = slug.replace(/^\/+|\/+$/g, "");

        // ✅ ensure URL ends with "-search/"
        if (!slug.endsWith("-search")) {
          slug = slug.endsWith("/") ? slug.slice(0, -1) : slug;
          slug = `${slug}-search`;
        }

        const finalUrl = `${SITE_URL}/listings/${slug}/`;

        return `
        <url>
          <loc>${finalUrl}</loc>
          <lastmod>${today}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.6</priority>
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
