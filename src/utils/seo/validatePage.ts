// src/utils/seo/validatePage.ts
import { notFound } from "next/navigation";

/**
 * ✅ Strict URL query validation for listings
 * Works for: ?page=2&orderby=price_asc
 * 404s for: ?page=&, ?page=a&, ?page=2&, ?page=2* etc.
 */
export function getValidPage(param: unknown, fullQuery: string): number | null {
  if (!fullQuery) return 1;
  const query = fullQuery.trim();

  // 🚫 Reject malformed or suspicious patterns
  if (
    // Trailing junk
    /[&#%+*]+$/.test(query) ||
    // Ending with lone &
    /&$/.test(query) ||
    // Double special chars
    /&&/.test(query) ||
    /##/.test(query) ||
    // Invalid page assignments
    /page=$/.test(query) ||
    /page=&/.test(query) ||
    /page=\D/.test(query) || // page=letters or symbols
    /page=\d+\D/.test(query) || // page=2a, page=1b etc.
    /page=\d+&\D/.test(query) || // page=2&x
    // Symbols not allowed
    /[!*@$^(){}\[\]|<>]/.test(query) ||
    // Hash fragments (#) not allowed
    /#/.test(query)
  ) {
    return null;
  }

  // ✅ Default page 1 if no param
  if (param === undefined) return 1;

  // ✅ String param — must be numeric only
  if (typeof param === "string" && /^\d+$/.test(param)) {
    const num = parseInt(param, 10);
    return num > 0 ? num : null;
  }

  // ✅ Array param — use first valid value
  if (Array.isArray(param) && param[0] && /^\d+$/.test(param[0])) {
    const num = parseInt(param[0], 10);
    return num > 0 ? num : null;
  }

  return null;
}

export function ensureValidPage(param: unknown, fullQuery: string): number {
  const valid = getValidPage(param, fullQuery);
  if (!valid) notFound();
  return valid;
}
