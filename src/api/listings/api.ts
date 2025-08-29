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
  is_exclusive?: boolean;
}

/** Minimal item shape needed here (no `any`) */
type Item = {
  id?: number | string;
  slug?: string;
  link?: string;
  is_exclusive?: boolean; // boolean & optional
  // other fields may exist but aren't needed for list-building
};
export interface ApiSEO {
  metadescription?: string;
  metatitle?: string;
  metaimage?: string;
  index?: string; // "index" | "noindex" | etc.
}

export interface ApiPagination {
  current_page: number;
  total_pages: number;
  total_items?: number;
  per_page: number;
  total_products: number;
}

// This mirrors what Listings.tsx actually reads:
export interface ApiData {
  products?: Item[]; // or your full Product shape if you prefer
  exclusive_products?: Item[];
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

export const fetchListings = async (
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
  } = filters;

  const params = new URLSearchParams();
  params.append("page", page.toString());
  if (category) params.append("category", category);
  if (radius_kms) params.append("radius_kms", radius_kms);
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
    params.append("acustom_fromyears", `${filters.acustom_fromyears}`);
  if (acustom_toyears)
    params.append("acustom_toyears", `${filters.acustom_toyears}`);

  if (filters.model) params.append("model", filters.model);
  if (condition)
    params.append("condition", condition.toLowerCase().replace(/\s+/g, "-"));
  if (filters.sleeps) params.append("sleep", filters.sleeps);
  if (orderby) params.append("orderby", orderby);

  const s = normalizeQuery(search);
  if (s) params.append("search", s);

  const res = await fetch(`${API_BASE}/new-list?${params.toString()}`);
  if (!res.ok) throw new Error("API failed");
  const raw = await res.text(); // read body only once

  let json: ApiResponse;
  try {
    json = JSON.parse(raw) as ApiResponse;
  } catch {
    console.error("API did not return valid JSON. Response:", raw);
    throw new Error("Invalid API response: " + raw);
  }
  const all: Item[] = json?.data?.products ?? [];
  const exFromApi: Item[] = json?.data?.exclusive_products ?? [];

  const keyOf = (x: Item): string => String(x?.id ?? x?.slug ?? x?.link ?? "");

  // Build exclusive id set (API list + items already flagged as exclusive)
  const exIdSet = new Set<string>(exFromApi.map(keyOf));
  all.forEach((p) => {
    if (p.is_exclusive === true) exIdSet.add(keyOf(p));
  });

  // Exclusive pool (unique, keep API order; add flagged-only items if missing)
  const exMap = new Map<string, Item>();
  exFromApi.forEach((p) => exMap.set(keyOf(p), p));
  all.forEach((p) => {
    const k2 = keyOf(p);
    if (exIdSet.has(k2) && !exMap.has(k2)) exMap.set(k2, p);
  });
  const exclusivePool: Item[] = Array.from(exMap.values());

  // ✅ FIX: If no normal products, and user didn't ask for exclusives, show nothing
  if (!all.length && exclusivePool.length) {
    if (filters.is_exclusive === true) {
      return {
        ...json,
        data: {
          ...json.data,
          products: exclusivePool.map((p) => ({ ...p, is_exclusive: true })),
          exclusive_products: exclusivePool,
        },
      };
    } else {
      // User didn't ask for exclusive, and there are no normals → return nothing
      return {
        ...json,
        data: {
          ...json.data,
          products: [],
          exclusive_products: [],
        },
      };
    }
  }

  // Normals = products minus exclusives (exclusives won't count inside 12)
  const normals: Item[] = all.filter((p) => !exIdSet.has(keyOf(p)));

  // Pattern: 2N - E - 2N - E - 8N  (12 normals + up to 2 exclusives)
  const NORMAL_TARGET = 12;
  const pattern: (number | "E")[] = [2, "E", 2, "E", 8];

  const arranged: Item[] = [];
  let ni = 0,
    ei = 0,
    nAdded = 0;

  for (const slot of pattern) {
    if (slot === "E") {
      if (ei < exclusivePool.length) arranged.push(exclusivePool[ei++]);
    } else {
      for (
        let i = 0;
        i < slot && nAdded < NORMAL_TARGET && ni < normals.length;
        i++
      ) {
        arranged.push(normals[ni++]);
        nAdded++;
      }
    }
  }

  // Top up with more normals to reach 12, if few exclusives
  while (nAdded < NORMAL_TARGET && ni < normals.length) {
    arranged.push(normals[ni++]);
    nAdded++;
  }

  // Final de-dupe and exclusive flag tagging
  const seen = new Set<string>();
  const arrangedUnique: Item[] = arranged
    .filter((p) => {
      const k3 = keyOf(p);
      if (seen.has(k3)) return false;
      seen.add(k3);
      return true;
    })
    .map((p) => {
      const exclusive = exIdSet.has(keyOf(p));
      if (exclusive) return { ...p, is_exclusive: true };
      const { ...rest } = p;
      return rest;
    });

  return {
    ...json,
    data: {
      ...json.data,
      products: arrangedUnique,
      exclusive_products: json.data?.exclusive_products ?? [],
    },
  };
};
