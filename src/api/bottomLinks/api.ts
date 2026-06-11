const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export interface BottomLinksItem {
  count: number;
  label: string;
  permalink: string;
}

export interface BottomLinksSection {
  label: string;
  items: BottomLinksItem[];
}

export interface BottomLinksData {
  heading: string;
  sections: Record<string, BottomLinksSection>;
}

interface Filters {
  make?: string;
  model?: string;
  state?: string;
  region?: string;
  suburb?: string;
  category?: string;
  minKg?: string | number;
  maxKg?: string | number;
  from_length?: string | number;
  to_length?: string | number;
  from_sleep?: string | number;
  to_sleep?: string | number;
  from_price?: string | number;
  to_price?: string | number;
}

export function getBottomLinksParams(filters: Filters): URLSearchParams {
  const hasMake    = !!filters.make;
  const hasModel   = !!filters.model;
  const hasState   = !!filters.state;
  const hasRegion  = !!filters.region;
  const hasSuburb  = !!filters.suburb;
  const hasCat     = !!filters.category;
  const hasWeight  = !!(filters.minKg || filters.maxKg);
  const hasLength  = !!(filters.from_length || filters.to_length);
  const hasSleep   = !!(filters.from_sleep || filters.to_sleep);
  const hasPrice   = !!(filters.from_price || filters.to_price);

  if (hasSuburb) return new URLSearchParams();

  const dims = [hasMake, hasModel, hasState, hasRegion, hasCat, hasWeight, hasLength, hasSleep, hasPrice].filter(Boolean).length;
  const p = new URLSearchParams();

  if (hasMake && hasModel && dims === 2) {
    p.set("page_type", "model"); p.set("make", filters.make!); p.set("model", filters.model!);
    return p;
  }
  if (hasMake && dims === 1) {
    p.set("page_type", "make"); p.set("make", filters.make!);
    return p;
  }
  if (hasCat && hasState && hasRegion && dims === 3) {
    p.set("page_type", "category_region"); p.set("category", filters.category!); p.set("state", filters.state!); p.set("region", filters.region!);
    return p;
  }
  if (hasCat && hasState && !hasRegion && dims === 2) {
    p.set("page_type", "category_state"); p.set("category", filters.category!); p.set("state", filters.state!);
    return p;
  }
  if (hasCat && dims === 1) {
    p.set("page_type", "category"); p.set("category", filters.category!);
    return p;
  }
  if (hasState && hasRegion && dims === 2) {
    p.set("page_type", "region"); p.set("state", filters.state!); p.set("region", filters.region!);
    return p;
  }
  if (hasState && dims === 1) {
    p.set("page_type", "state"); p.set("state", filters.state!);
    return p;
  }
  if (hasWeight && dims === 1) {
    p.set("page_type", "weight");
    const min = filters.minKg ? String(filters.minKg) : "";
    const max = filters.maxKg ? String(filters.maxKg) : "";
    if (min && max) { p.set("atm_type", "between"); p.set("min_kg", min); p.set("max_kg", max); }
    else if (min)   { p.set("atm_type", "over");    p.set("min_kg", min); }
    else            { p.set("atm_type", "under");   p.set("max_kg", max); }
    return p;
  }
  if (hasLength && dims === 1) {
    p.set("page_type", "length");
    const min = filters.from_length ? String(filters.from_length) : "";
    const max = filters.to_length   ? String(filters.to_length)   : "";
    if (min && max) { p.set("length_type", "between"); p.set("min_length", min); p.set("max_length", max); }
    else if (min)   { p.set("length_type", "over");    p.set("min_length", min); }
    else            { p.set("length_type", "under");   p.set("max_length", max); }
    return p;
  }
  if (hasSleep && dims === 1) {
    p.set("page_type", "sleep");
    const min = filters.from_sleep ? String(filters.from_sleep) : "";
    const max = filters.to_sleep   ? String(filters.to_sleep)   : "";
    if (min && max) { p.set("sleep_type", "between"); p.set("min_sleep", min); p.set("max_sleep", max); }
    else if (min)   { p.set("sleep_type", "over");    p.set("min_sleep", min); }
    else            { p.set("sleep_type", "under");   p.set("max_sleep", max); }
    return p;
  }
  if (hasPrice && dims === 1) {
    p.set("page_type", "price");
    const min = filters.from_price ? String(filters.from_price) : "";
    const max = filters.to_price   ? String(filters.to_price)   : "";
    if (min && max) { p.set("price_type", "between"); p.set("min_price", min); p.set("max_price", max); }
    else if (min)   { p.set("price_type", "over");    p.set("min_price", min); }
    else            { p.set("price_type", "under");   p.set("max_price", max); }
    return p;
  }

  return new URLSearchParams();
}

export async function fetchBottomLinks(filters: Filters): Promise<BottomLinksData | null> {
  if (!API_BASE) return null;
  const params = getBottomLinksParams(filters);
  try {
    const res = await fetch(
      `${API_BASE}/listing-internal-links?${params.toString()}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
