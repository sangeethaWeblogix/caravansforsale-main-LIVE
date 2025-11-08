 const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export type Filters = {
  category?: string;
  make?: string;
  from_price?: string;
  to_price?: string;
  minKg?: string;
  maxKg?: string;
  condition?: string;
  sleeps?: string;
  state?: string;
  region?: string;
  suburb?: string;
  acustom_fromyears?: string | number;
  acustom_toyears?: string | number;
  from_length?: string;
  to_length?: string;
  model?: string;
  pincode?: string;
  orderby?: string;
  slug?: string;
  radius_kms?: string;
  search?: string;
  keyword?: string;
  from_sleep?: string | number;
  to_sleep?: string | number;
  msid?: string | null;
};

export type Item = {
  id: number;
  name: string;
  length: string;
  kg: string;
  regular_price: string;
  sale_price?: string;
  price_difference?: string;
  image: string;
  link: string;
  condition: string;
  location?: string;
  categories?: string[];
  people?: string;
  make?: string;
  slug?: string;
  description?: string;
  sku?: string;
};

export interface ApiData {
  products?: Item[];
  exclusive_products?: Item[];
  featured_products?: Item[];
  premium_products?: Item[];
}

export interface ApiResponse {
  success?: boolean;
  data?: ApiData;
  message?: string;
}

/** Normalize "+", spaces for search/keyword */
const normalizeQuery = (s?: string) =>
  (s ?? "").replace(/\+/g, " ").trim().replace(/\s+/g, " ");

export const fetchProductListings = async (
  filters: Filters = {}
): Promise<ApiResponse> => {
  const params = new URLSearchParams();

  if (filters.category) params.append("category", filters.category);
  if (filters.slug) params.append("category", filters.slug);
  if (filters.make) params.append("make", filters.make);
  if (filters.pincode) params.append("pincode", filters.pincode);
  if (filters.state) params.append("state", filters.state);
  if (filters.region) params.append("region", filters.region);
  if (filters.suburb) params.append("suburb", filters.suburb);
  if (filters.from_price) params.append("from_price", `${filters.from_price}`);
  if (filters.to_price) params.append("to_price", `${filters.to_price}`);
  if (filters.minKg) params.append("from_atm", `${filters.minKg}kg`);
  if (filters.maxKg) params.append("to_atm", `${filters.maxKg}kg`);
  if (filters.from_length) params.append("from_length", `${filters.from_length}`);
  if (filters.to_length) params.append("to_length", `${filters.to_length}`);
  if (filters.acustom_fromyears)
    params.append("acustom_fromyears", `${filters.acustom_fromyears}`);
  if (filters.acustom_toyears)
    params.append("acustom_toyears", `${filters.acustom_toyears}`);
  if (filters.condition)
    params.append(
      "condition",
      filters.condition.toLowerCase().replace(/\s+/g, "-")
    );
  if (filters.sleeps) params.append("sleep", filters.sleeps);
  if (filters.orderby) params.append("orderby", filters.orderby);
  if (filters.radius_kms) params.append("radius_kms", filters.radius_kms);
  if (filters.from_sleep) params.append("from_sleep", `${filters.from_sleep}`);
  if (filters.to_sleep) params.append("to_sleep", `${filters.to_sleep}`);

  const s = normalizeQuery(filters.search);
  if (s) params.append("search", s);

  // 🟡 Log Filters
  console.log("🔍 [fetchProductListings] Filters used:", Object.fromEntries(params));

  // Step 1️⃣: Fetch product ID groups
  const listRes = await fetch(`${API_BASE}/list_new_format?${params}`);
  console.log("🌐 [list_new_format API] Request URL:", listRes.url);

  if (!listRes.ok) {
    console.error(`❌ List format API failed: ${listRes.status}`);
    throw new Error(`List format API failed: ${listRes.status}`);
  }

  const listJson = await listRes.json();
  console.log("✅ [list_new_format API] Response:", listJson);

  const output = listJson.output || {};

  const featuredIds: string[] = Array.isArray(output["featured"])
    ? output["featured"]
    : [];

  const nonFeaturedIds: string[] = output["non-featured"]
    ? (Object.values(output["non-featured"]) as string[])
    : [];

  const exclusiveIds: string[] = Array.isArray(output["excl-product"])
    ? output["excl-product"]
    : [];

  console.log(
    "🧩 ID Summary → Featured:",
    featuredIds.length,
    "| Non-Featured:",
    nonFeaturedIds.length,
    "| Exclusive:",
    exclusiveIds.length
  );

  // Step 2️⃣: Fetch all product details
  const allRes = await fetch(`${API_BASE}/all_product_list?batch=1&batch_size=6000`);
  console.log("🌐 [all_product_list API] Request URL:", allRes.url);

  if (!allRes.ok) {
    console.error(`❌ Product list API failed: ${allRes.status}`);
    throw new Error(`Product list API failed: ${allRes.status}`);
  }

  const allJson = await allRes.json();
  console.log("✅ [all_product_list API] Total Products:", allJson?.data?.length || 0);

  const allProducts: Item[] = Array.isArray(allJson.data)
    ? allJson.data.map((p: any) => ({
        id: Number(p.id),
        name: p.name ?? "Unknown Caravan",
        regular_price: p.regular_price ?? "0",
        sale_price: p.sale_price ?? "0",
        price_difference: p.price_difference ?? "",
        image:
          p.image && p.image.trim() !== ""
            ? p.image
            : "/images/placeholder.jpg",
        condition: p.condition ?? "N/A",
        length: p.length ?? "",
        kg: p.kg ?? "",
        location: p.location ?? "",
        categories: p.categories ?? [],
        people: p.people ?? "",
        link: p.link ?? "",
        make: p.make ?? "N/A",
        slug: p.slug && p.slug.trim() !== "" ? p.slug : String(p.id),
        description: p.description ?? "",
        sku: p.sku ?? "",
      }))
    : [];

  // 🧾 Log sample data for quick inspection
  console.log("🔎 Sample of first 5 products:");
  console.table(
    allProducts.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.name,
      make: p.make,
      condition: p.condition,
      price: p.regular_price,
      sale_price: p.sale_price,
      slug: p.slug,
      image: p.image,
    }))
  );

  // Step 3️⃣: Match and merge IDs with full product data
  const findById = (id: string | number) =>
    allProducts.find((p) => p.id === Number(id));

  const featuredProducts = featuredIds
    .map((id) => findById(id))
    .filter(Boolean) as Item[];

  const products = nonFeaturedIds
    .map((id) => findById(id))
    .filter(Boolean) as Item[];

  const exclusiveProducts = exclusiveIds
    .map((id) => findById(id))
    .filter(Boolean) as Item[];

  console.log(
    "🧾 [Merged Data] Counts → Featured:",
    featuredProducts.length,
    "| Products:",
    products.length,
    "| Exclusive:",
    exclusiveProducts.length
  );

  // Step 4️⃣: Return merged structured data
  const response = {
    success: true,
    data: {
      featured_products: featuredProducts,
      products,
      exclusive_products: exclusiveProducts,
      premium_products: [],
    },
  };

  console.log("🚀 [fetchProductListings] Final API Response Summary:", {
    featured: featuredProducts.length,
    products: products.length,
    exclusive: exclusiveProducts.length,
  });

  return response;
};
