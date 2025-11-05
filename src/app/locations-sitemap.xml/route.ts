 import { NextResponse } from "next/server";

const API_URL = "https://admin.caravansforsale.com.au/wp-json/cfs/v1/location-search-all";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

export async function GET() {
  const res = await fetch(API_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

  const data = await res.json();
  const items = data?.pincode_location_region_state || [];

  // Build proper URLs
  const urls = items.map((item) => {
    const uri = item?.uri || "";
    if (!uri) return null;

    // Example: "broadmeadows-suburb/melbourne-region/victoria-state/3047"
    const parts = uri.split("/");

    const suburbPart = parts.find((p) => p.includes("-suburb")) || "";
    const regionPart = parts.find((p) => p.includes("-region")) || "";
    const statePart = parts.find((p) => p.includes("-state")) || "";
    const postcode = parts[parts.length - 1] || "";

    // Remove "-suburb" suffix for better placement
    const suburbClean = suburbPart.replace("-suburb", "");

    return `${SITE_URL}/listings/${statePart}/${regionPart}/${suburbClean}-${postcode}-suburb/`;
  }).filter(Boolean);

  // Build sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
      .map(
        (loc) => `
      <url>
        <loc>${loc}</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
      </url>`
      )
      .join("")}
  </urlset>`;

  return new NextResponse(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
