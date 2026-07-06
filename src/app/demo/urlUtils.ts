import { parseSlugToFilters } from "@/app/components/urlBuilder";
import { buildSlugFromFilters } from "@/app/components/slugBuilter";
import type { FilterState } from "./StateFilterBar";

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
