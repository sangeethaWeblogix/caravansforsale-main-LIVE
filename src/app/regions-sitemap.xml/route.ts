// src/app/regions-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

// ✅ Type definitions for API response
interface Suburb {
  value: string;
  name: string;
}

interface Region {
  value: string;
  name: string;
  suburbs?: Suburb[];
}

interface State {
  value: string;
  name: string;
  regions?: Region[];
}

interface ParamsApiResponse {
  states: State[];
}

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
  // ✅ Fetch from params-product-list
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_CFS_API_BASE}/wp-json/cfs/v1/params-product-list`
  );

  const data: ParamsApiResponse = await res.json();
  const states = data.states ?? [];

  const urls = states.flatMap((state) => {
    const stateSlug = slugify(state.value);

    return (state.regions ?? []).map(
      (region) => `
        <url>
          <loc>${SITE_URL}/listings/${stateSlug}-state/${slugify(
        region.value
      )}-region/</loc>
          <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>`
    );
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("")}
  </urlset>`;

  return new NextResponse(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
