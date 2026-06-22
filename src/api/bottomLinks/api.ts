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
  condition?: string;
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
  if (filters.suburb) return new URLSearchParams();

  const hasMake   = !!filters.make;
  const hasModel  = !!filters.model;
  const hasState  = !!filters.state;
  const hasRegion = !!filters.region;
  const hasCat    = !!filters.category;
  const hasCond   = !!filters.condition;
  const hasWeight = !!(filters.minKg || filters.maxKg);
  const hasLength = !!(filters.from_length || filters.to_length);
  const hasSleep  = !!(filters.from_sleep || filters.to_sleep);
  const hasPrice  = !!(filters.from_price || filters.to_price);

  const dims = [hasMake, hasModel, hasState, hasRegion, hasCat, hasCond, hasWeight, hasLength, hasSleep, hasPrice].filter(Boolean).length;
  const p = new URLSearchParams();

  if (hasMake && hasModel && dims === 2) {
    p.set("make", filters.make!); p.set("model", filters.model!); return p;
  }
  if (hasMake && dims === 1) {
    p.set("make", filters.make!); return p;
  }
  if (hasCat && hasState && hasRegion && dims === 3) {
    p.set("category", filters.category!); p.set("state", filters.state!); p.set("region", filters.region!); return p;
  }
  if (hasCat && hasState && dims === 2) {
    p.set("category", filters.category!); p.set("state", filters.state!); return p;
  }
  if (hasCat && dims === 1) {
    p.set("category", filters.category!); return p;
  }
  if (hasState && hasRegion && dims === 2) {
    p.set("state", filters.state!); p.set("region", filters.region!); return p;
  }
  if (hasState && dims === 1) {
    p.set("state", filters.state!); return p;
  }
  if (hasWeight && dims === 1) {
    if (filters.minKg) p.set("from_atm", String(filters.minKg));
    if (filters.maxKg) p.set("to_atm",   String(filters.maxKg));
    return p;
  }
  if (hasLength && dims === 1) {
    if (filters.from_length) p.set("from_length", String(filters.from_length));
    if (filters.to_length)   p.set("to_length",   String(filters.to_length));
    return p;
  }
  if (hasSleep && dims === 1) {
    if (filters.from_sleep) p.set("from_sleep", String(filters.from_sleep));
    if (filters.to_sleep)   p.set("to_sleep",   String(filters.to_sleep));
    return p;
  }
  if (hasPrice && dims === 1) {
    if (filters.from_price) p.set("from_price", String(filters.from_price));
    if (filters.to_price)   p.set("to_price",   String(filters.to_price));
    return p;
  }

  return new URLSearchParams();
}

function hasAnyFilter(filters: Filters): boolean {
  return !!(
    filters.make || filters.model || filters.category || filters.condition ||
    filters.state || filters.region || filters.suburb ||
    filters.minKg || filters.maxKg ||
    filters.from_length || filters.to_length ||
    filters.from_sleep || filters.to_sleep ||
    filters.from_price || filters.to_price ||
    (filters as any).search || (filters as any).keyword ||
    (filters as any).acustom_fromyears || (filters as any).acustom_toyears
  );
}

export async function fetchBottomLinks(filters: Filters): Promise<BottomLinksData | null> {
  if (!API_BASE) return null;
  const params = getBottomLinksParams(filters);
  // If params are empty but filters are active, it's an unsupported combo — hide section
  if (params.toString() === "" && hasAnyFilter(filters)) return null;
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
