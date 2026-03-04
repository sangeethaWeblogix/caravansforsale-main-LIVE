import { NextResponse } from "next/server";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

const CONSUMER_KEY = "ck_73393ca56ac29867aa71c9beeba4714a49c4116b";
const CONSUMER_SECRET = "cs_b554ee636b76bf9968bbe181695a6fb2b4b180b1";

async function fetchProducts(page: number) {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString(
    "base64",
  );

  const res = await fetch(
    `https://www.admin.caravansforsale.com.au/wp-json/wc/v3/products?per_page=100&page=${page}&_fields=slug`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    },
  );

  if (!res.ok) throw new Error("Failed to fetch products");

  const data = await res.json();
  const totalPages = Number(res.headers.get("x-wp-totalpages"));
  return { items: data, totalPages };
}

export async function GET() {
  try {
    const firstPage = await fetchProducts(1);
    let allProducts = [...firstPage.items];

    if (firstPage.totalPages > 1) {
      for (let page = 2; page <= firstPage.totalPages; page++) {
        const nextPage = await fetchProducts(page);
        allProducts = [...allProducts, ...nextPage.items];
      }
    }

    const today = new Date().toISOString().split("T")[0];

    const urls = allProducts
      .map(
        (product: { slug: string }) => `
          <url>
            <loc>${SITE_URL}/product/${product.slug}/</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.7</priority>
          </url>`,
      )
      .join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls}
      </urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Sitemap error:", error);
    return new NextResponse("Failed to generate sitemap", { status: 500 });
  }
}
