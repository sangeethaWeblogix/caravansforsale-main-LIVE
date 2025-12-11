 // src/app/makes-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

export async function GET() {
  try {
    const response = await fetch(
      "https://admin.caravansforsale.com.au/wp-json/cfs/v1/make_details"
    );

    const json = await response.json();
    const makes = json?.data?.make_options ?? [];

    const urls = makes
      .map((make: any) => {
        const makeSlug = make.slug?.trim() || "";

        const finalUrl = `${SITE_URL}/make/${makeSlug}/`;

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
    console.error("[MAKE-SITEMAP ERROR]", err);

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate make sitemap</error>`,
      {
        headers: { "Content-Type": "application/xml" },
        status: 500,
      }
    );
  }
}
