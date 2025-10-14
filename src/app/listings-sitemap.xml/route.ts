// src/app/products-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://caravansforsale.com.au";

const API_BASE = "https://www.admin.caravansforsale.com.au/wp-json/wc/v3";
const CONSUMER_KEY = "ck_73393ca56ac29867aa71c9beeba4714a49c4116b";
const CONSUMER_SECRET = "cs_b554ee636b76bf9968bbe181695a6fb2b4b180b1";

interface Product {
  slug: string;
  date_modified?: string;
}

interface ProductPageResult {
  data: Product[];
  totalPages: number;
}

// ✅ 1. Fetch single WooCommerce product page
async function fetchProductPage(page: number): Promise<ProductPageResult> {
  const url = `${API_BASE}/products?status=publish&per_page=100&page=${page}&_fields=slug,date_modified&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Failed to fetch page ${page}: ${res.status}`);

  const data: Product[] = await res.json();
  const totalPages = Number(res.headers.get("X-WP-TotalPages")) || 1;
  return { data, totalPages };
}

// ✅ 2. Route Handler for sitemap
export async function GET() {
  try {
    // Fetch first page to get total page count
    const firstPage = await fetchProductPage(1);
    const totalPages = firstPage.totalPages;

    // Fetch remaining pages in parallel (2 → totalPages)
    const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

    // 👇 Give Promise.allSettled an explicit type so TS doesn’t infer `never`
    const restResults = await Promise.allSettled<ProductPageResult>(
      pageNumbers.map((page) => fetchProductPage(page))
    );

    // ✅ Safely filter fulfilled results
    const fulfilledResults = restResults.filter(
      (r): r is PromiseFulfilledResult<ProductPageResult> =>
        r.status === "fulfilled"
    );

    // ✅ Combine all data
    const allProducts = [
      ...firstPage.data,
      ...fulfilledResults.flatMap((r) => r.value.data),
    ];

    console.log(`✅ Total products fetched: ${allProducts.length}`);

    // ✅ Build XML sitemap
    const urls = allProducts
      .filter((p) => p.slug)
      .map(
        (p) => `
      <url>
        <loc>${SITE_URL}/product/${p.slug}/</loc>
         <lastmod>${new Date().toISOString()}</lastmod>
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
  } catch (err) {
    console.error("❌ Error generating product sitemap:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
