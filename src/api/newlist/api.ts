const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

interface Filters {
  page?: number;
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
}

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
};

export interface ApiSEO {
  metadescription?: string;
  metatitle?: string;
  metaimage?: string;
  index?: string;
}

export interface ApiPagination {
  current_page: number;
  total_pages: number;
  total_products: number;
  per_page: number;
}

export interface ApiData {
  products?: Item[];
  exclusive_products?: Item[];
  featured_products?: Item[];
  premium_products?: Item[];
  all_categories?: { name: string; slug: string }[];
  make_options?: { name: string; slug: string }[];
  model_options?: { name: string; slug: string }[];
  states?: { value: string; name: string }[];
}

export type ApiResponse = {
  success?: boolean;
  title?: string;
  seo?: ApiSEO;
  pagination?: ApiPagination;
  data?: ApiData;
};

/** Normalize "+", spaces for search/keyword */
const normalizeQuery = (s?: string) =>
  (s ?? "").replace(/\+/g, " ").trim().replace(/\s+/g, " ");

export const fetchNewListings = async (
  filters: Filters = {}
): Promise<ApiResponse> => {
  const {
    page = 1,
    category,
    make,
    from_price,
    to_price,
    minKg,
    maxKg,
    from_length,
    to_length,
    condition,
    state,
    region,
    suburb,
    pincode,
    orderby,
    slug,
    radius_kms,
    search,
    acustom_fromyears,
    acustom_toyears,
    from_sleep,
    to_sleep,
  } = filters;

  const params = new URLSearchParams();
  params.append("page", page.toString());
  if (category) params.append("category", category);
  if (slug) params.append("category", slug);
  if (make) params.append("make", make);
  if (pincode) params.append("pincode", pincode);
  if (state) params.append("state", state);
  if (region) params.append("region", region);
  if (suburb) params.append("suburb", suburb);
  if (from_price) params.append("from_price", `${from_price}`);
  if (to_price) params.append("to_price", `${to_price}`);
  if (minKg) params.append("from_atm", `${minKg}kg`);
  if (maxKg) params.append("to_atm", `${maxKg}kg`);
  if (from_length) params.append("from_length", `${from_length}`);
  if (to_length) params.append("to_length", `${to_length}`);
  if (acustom_fromyears)
    params.append("acustom_fromyears", `${acustom_fromyears}`);
  if (acustom_toyears) params.append("acustom_toyears", `${acustom_toyears}`);
  if (condition)
    params.append("condition", condition.toLowerCase().replace(/\s+/g, "-"));
  if (filters.sleeps) params.append("sleep", filters.sleeps);
  if (orderby) params.append("orderby", orderby);
  if (radius_kms) params.append("radius_kms", radius_kms);
  if (from_sleep) params.append("from_sleep", `${from_sleep}`);
  if (to_sleep) params.append("to_sleep", `${to_sleep}`);

  const s = normalizeQuery(search);
  if (s) params.append("search", s);

  const res = await fetch(`${API_BASE}/product-list?${params}`);
  if (!res.ok) {
    const errText = await res.text();
    console.error("API Error:", res.status, errText);
    throw new Error(`API failed: ${res.status}`);
  }

  const raw = await res.text();
  let json: ApiResponse;
  try {
    json = JSON.parse(raw);
  } catch {
    console.error("Invalid JSON response:", raw);
    throw new Error("Invalid API response");
  }

  // ✅ Return all useful sections from API
  return {
    success: json.success,
    title: json.title,
    seo: json.seo,
    pagination: json.pagination,
    data: {
      products: json.data?.products ?? [],
      exclusive_products: json.data?.exclusive_products ?? [],
      featured_products: json.data?.featured_products ?? [],
      premium_products: json.data?.premium_products ?? [],
      make_options: json.data?.make_options ?? [],
      model_options: json.data?.model_options ?? [],
      all_categories: json.data?.all_categories ?? [],
      states: json.data?.states ?? [],
    },
  };
};
