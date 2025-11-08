 const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export interface Filters {
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
}

export interface ApiData {
  all_categories?: { name: string; slug: string }[];
  make_options?: { name: string; slug: string }[];
  model_options?: { name: string; slug: string }[];
  states?: { value: string; name: string }[];
}

export interface ApiResponse {
  success?: boolean;
  data?: ApiData;
  message?: string;
  errors?: string[];
}

/** Normalize "+", spaces for search/keyword */
const normalizeQuery = (s?: string) =>
  (s ?? "").replace(/\+/g, " ").trim().replace(/\s+/g, " ");

export const fetchListings = async (
  filters: Filters = {}
): Promise<ApiResponse> => {
  const params = new URLSearchParams();
  if (filters.category) params.append("category", filters.category);
  if (filters.slug) params.append("category", filters.slug);
  if (filters.make) params.append("make", filters.make);
  if (filters.state) params.append("state", filters.state);
  if (filters.region) params.append("region", filters.region);
  if (filters.suburb) params.append("suburb", filters.suburb);
  if (filters.pincode) params.append("pincode", filters.pincode);

  const s = normalizeQuery(filters.search);
  if (s) params.append("search", s);

  const res = await fetch(`${API_BASE}/product-list?${params}`);
  console.log("[Filter Meta API] GET", res.url);

  if (!res.ok) throw new Error(`API failed: ${res.status}`);

  const json = await res.json();

  return {
    success: json.success,
    data: {
      all_categories: json.data?.all_categories ?? [],
      make_options: json.data?.make_options ?? [],
      model_options: json.data?.model_options ?? [],
      states: json.data?.states ?? [],
    },
  };
};
