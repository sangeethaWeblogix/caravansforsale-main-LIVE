import { parseSlugToFilters } from "@/app/components/urlBuilder";
import { buildSlugFromFilters } from "@/app/components/slugBuilter";
import type { FilterState } from "./StateFilterBar";

const ORDERBY = "default";

/** Builds a pool-listings query string — shared by the client grids (home.tsx)
 * and the server-side generateMetadata fetch (page.tsx) so both hit the exact
 * same filter/lock combination and get back the exact same seo_v2. */
export function buildApiUrl(base: string, filters: FilterState, seed: number, lockCondition?: string): string {
  const params = new URLSearchParams();
  params.set("orderby", ORDERBY);
  params.set("seed", String(seed));
  if (filters.state)              params.set("state",              filters.state);
  if (filters.category)           params.set("category",          filters.category);
  if (filters.make)               params.set("make",               filters.make);
  if (filters.model)              params.set("model",              filters.model);
  if (filters.region)             params.set("region",             filters.region);
  if (filters.suburb)             params.set("suburb",             filters.suburb);
  if (filters.pincode)            params.set("pincode",            filters.pincode);
  if (filters.from_price)         params.set("from_price",         String(filters.from_price));
  if (filters.to_price)           params.set("to_price",           String(filters.to_price));
  if (filters.minKg)              params.set("from_atm",           String(filters.minKg));
  if (filters.maxKg)              params.set("to_atm",             String(filters.maxKg));
  if (filters.from_sleep)         params.set("from_sleep",         String(filters.from_sleep));
  if (filters.to_sleep)           params.set("to_sleep",           String(filters.to_sleep));
  if (filters.acustom_fromyears)  params.set("acustom_fromyears",  String(filters.acustom_fromyears));
  if (filters.acustom_toyears)    params.set("acustom_toyears",    String(filters.acustom_toyears));
  if (filters.from_length)        params.set("from_length",        String(filters.from_length));
  if (filters.to_length)          params.set("to_length",          String(filters.to_length));
  if (filters.keyword)            params.set("keyword",            filters.keyword);
  if (!lockCondition && filters.condition) params.set("condition", filters.condition);
  if (lockCondition) params.set("condition", lockCondition);
  return `${base}&${params.toString()}`;
}

/** demo's FilterState uses `keyword`; the shared slug builder/parser uses `search`. */
export function buildDemoSlug(filters: FilterState): string {
  const { keyword, ...rest } = filters;
  const shared = { ...rest, search: keyword || undefined };
  return buildSlugFromFilters(shared).replace(/^\/listings/, "/demo");
}

export function parseDemoFilters(
  slugParts: string[],
  query: Record<string, string | string[] | undefined>
): FilterState {
  const { search, condition, ...rest } = parseSlugToFilters(slugParts, query);
  const filters: FilterState = { ...rest };
  if (search) filters.keyword = search;
  if (condition) filters.condition = condition.toLowerCase();
  return filters;
}
