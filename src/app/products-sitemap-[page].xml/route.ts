// src/app/products-sitemap-[page].xml/route.ts
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

async function fetchProductPage(page: number): Promise<ProductPageResult> {
  const url = `${API_BASE}/products?per_page=100&page=${page}&_fields=slug,date_modified&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch page ${page}`);
  const data: Product[] = await res.json();
  const totalPages = Number(res.headers.get("X-WP-TotalPages")) || 1;
  return { data, totalPages };
}

export async function GET(
  _req: Request,
  { params }: { params: { page: string } }
) {
  try {
    const sitemapNum = Number(params.page);
    if (isNaN(sitemapNum) || sitemapNum < 1)
      return new NextResponse("Invalid sitemap number", { status: 400 });

    // 10,000 products per sitemap file
    const perFile = 10000;
    const perPage = 100; // from API
    const pagesPerSitemap = perFile / perPage;
    const startPage = (sitemapNum - 1) * pagesPerSitemap + 1;
    const endPage = startPage + pagesPerSitemap - 1;

    console.log(`🌀 Fetching product pages ${startPage}-${endPage}`);

    const pageNumbers = Array.from(
      { length: pagesPerSitemap },
      (_, i) => startPage + i
    );

    const results = await Promise.allSettled<ProductPageResult>(
      pageNumbers.map((p) => fetchProductPage(p))
    );

    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<ProductPageResult> =>
        r.status === "fulfilled"
    );

    const products = fulfilled.flatMap((r) => r.value.data);

    const urls = products
      .filter((p) => p.slug)
      .map(
        (p) => `
        <url>
          <loc>${SITE_URL}/product/${p.slug}</loc>
          <lastmod>${new Date(
            p.date_modified || Date.now()
          ).toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
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
  } catch (err) {
    console.error("❌ Error generating split sitemap:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
