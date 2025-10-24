// src/api/products/fetchAllProducts.ts
const API_BASE = "https://www.admin.caravansforsale.com.au/wp-json/wc/v3";
const CONSUMER_KEY = "ck_73393ca56ac29867aa71c9beeba4714a49c4116b";
const CONSUMER_SECRET = "cs_b554ee636b76bf9968bbe181695a6fb2b4b180b1";

export interface Product {
  id: number;
  name: string;
  slug: string;
  price?: string;
  images?: { src: string }[];
}

interface ProductPage {
  data: Product[];
  totalPages: number;
}

async function fetchProductPage(page: number): Promise<ProductPage> {
  const url = `${API_BASE}/products?per_page=100&page=${page}&_fields=id,name,slug,price,images&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;

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

export async function fetchProductsBatch(
  startPage: number,
  endPage: number
): Promise<Product[]> {
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  // console.log(`🌀 Fetching pages ${startPage} to ${endPage} in parallel...`);

  const results = await Promise.allSettled(pageNumbers.map(fetchProductPage));

  // ✅ Correctly typed filter
  const fulfilledResults = results.filter(
    (r): r is PromiseFulfilledResult<ProductPage> => r.status === "fulfilled"
  );

  // ✅ Flatten only the data part
  const allProducts = fulfilledResults.flatMap((r) => r.value.data);

  // console.log(
  //   `✅ Loaded ${allProducts.length} products from pages ${startPage}-${endPage}`
  // );

  return allProducts;
}

// 👇 Fetch first 10 pages
export async function fetchFirst10Pages(): Promise<Product[]> {
  return await fetchProductsBatch(1, 10);
}

// 👇 Fetch next 10 (like 11–20)
export async function fetchNext10Pages(
  currentBatch: number
): Promise<Product[]> {
  const start = currentBatch * 10 + 1;
  const end = start + 9;
  return await fetchProductsBatch(start, end);
}
