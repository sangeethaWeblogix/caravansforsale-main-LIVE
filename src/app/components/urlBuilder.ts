// utils/parseFilters.ts

export interface Filters {
  category?: string;
  condition?: string;
  state?: string;
  region?: string;
  suburb?: string;
  pincode?: string;
  from_price?: string;
  to_price?: string;
  minKg?: string;
  maxKg?: string;
  from_length?: string;
  to_length?: string;
  sleeps?: string;
  make?: string;
  model?: string;
  orderby?: string;
  radius_kms?: string;
  page?: string;
  acustom_fromyears?: number | string;
  acustom_toyears?: number | string;
  search?: string;
  keyword?: string; // parsed -> canonicalized to `search`
}

/**
 * Parse path segments & query params into a Filters object.
 * @param slugParts Array of path segments (already decoded if possible)
 * @param query Optional query params object (e.g. from req.query or searchParams)
 */
export function parseSlugToFilters(
  slugParts: string[],
  query?: Record<string, string | string[] | undefined>
): Filters {
  const filters: Filters = {};

  const conditionMap: Record<string, string> = {
    new: "New",
    used: "Used",
    "near-new": "Near New",
  };

  function toNumber(val: string | string[] | undefined): number | undefined {
    if (!val) return undefined;
    const str = Array.isArray(val) ? val[0] : val;
    const num = Number(str);
    return isNaN(num) ? undefined : num;
  }

  const hasReservedSuffix = (s: string) =>
    /-(category|condition|state|region|suburb|keyword)$/.test(s) ||
    /-(kg-atm|length-in-feet|people-sleeping-capacity)$/.test(s) ||
    /^over-\d+/.test(s) ||
    /^under-\d+/.test(s) ||
    /^between-/.test(s) ||
    /^\d{4}$/.test(s) ||
    s.includes("=");

  // --- SLUG PARSING ---
  slugParts.forEach((_part) => {
    const decoded = decodeURIComponent(_part);
    const part = decoded.split("?")[0];
    if (!part) return;

    if (part.endsWith("-category")) {
      filters.category = part.replace("-category", "");
      return;
    }

    if (part.endsWith("-condition")) {
      const slug = part.replace("-condition", "").toLowerCase();
      filters.condition = conditionMap[slug] || slug;
      return;
    }

    if (part.endsWith("-state")) {
      filters.state = part
        .replace("-state", "")
        .replace(/-/g, " ")
        .toLowerCase();
      return;
    }

    if (part.endsWith("-region")) {
      filters.region = part
        .replace("-region", "")
        .replace(/-/g, " ")
        .toLowerCase();
      return;
    }

    if (part.endsWith("-suburb")) {
      filters.suburb = part
        .replace("-suburb", "")
        .replace(/-/g, " ")
        .toLowerCase();
      return;
    }

    if (/^\d{4}$/.test(part)) {
      filters.pincode = part;
      return;
    }

    // ATM
    if (part.includes("-kg-atm")) {
      const canon = part.match(/^between-(\d+)-(\d+)-kg-atm$/);
      if (canon) {
        filters.minKg = canon[1];
        filters.maxKg = canon[2];
        return;
      }
      const legacy = part.match(/^between-(\d+)-kg-(\d+)-kg-atm$/);
      if (legacy) {
        filters.minKg = legacy[1];
        filters.maxKg = legacy[2];
        return;
      }
      const over = part.match(/^over-(\d+)-kg-atm$/);
      if (over) {
        filters.minKg = over[1];
        return;
      }
      const under = part.match(/^under-(\d+)-kg-atm$/);
      if (under) {
        filters.maxKg = under[1];
        return;
      }
    }

    // Length
    if (part.includes("length-in-feet")) {
      const between = part.match(/^between-(\d+)-(\d+)-length-in-feet$/);
      if (between) {
        filters.from_length = between[1];
        filters.to_length = between[2];
        return;
      }
      const over = part.match(/^over-(\d+)-length-in-feet$/);
      if (over) {
        filters.from_length = over[1];
        return;
      }
      const under = part.match(/^under-(\d+)-length-in-feet$/);
      if (under) {
        filters.to_length = under[1];
        return;
      }
    }

    // Sleeps
    if (part.includes("-people-sleeping-capacity")) {
      const between = part.match(
        /^between-(\d+)-and-(\d+)-people-sleeping-capacity$/
      );
      if (between) {
        filters.sleeps = `${between[1]}-people`;
        return;
      }
      const raw = part.replace("-people-sleeping-capacity", "");
      const cleaned = raw.replace(/^over-/, "").replace(/^under-/, "");
      if (!isNaN(Number(cleaned))) {
        filters.sleeps = `${cleaned}-people`;
        return;
      }
    }

    // Price
    if (/^over-\d+$/.test(part)) {
      filters.from_price = part.replace("over-", "");
      return;
    }
    if (/^under-\d+$/.test(part)) {
      filters.to_price = part.replace("under-", "");
      return;
    }
    if (/^between-\d+-\d+$/.test(part)) {
      const match = part.match(/between-(\d+)-(\d+)/);
      if (match) {
        filters.from_price = match[1];
        filters.to_price = match[2];
      }
      return;
    }

    // Search + fallback
    if (part.startsWith("search=")) {
      filters.search = decodeURIComponent(part.replace("search=", ""));
      return;
    }
    if (part.startsWith("radius_kms=")) {
      const radiusVal = part.replace("radius_kms=", "");
      if (!isNaN(Number(radiusVal))) {
        filters.radius_kms = radiusVal;
        return;
      }
    }

    // make / model fallback
    if (
      !hasReservedSuffix(part) &&
      !part.includes("=") &&
      isNaN(Number(part)) &&
      !filters.search
    ) {
      if (!filters.make) {
        filters.make = part;
        return;
      }
      if (!filters.model) {
        filters.model = part;
        return;
      }
    }
  });

  // If suburb present, ignore region
  if (filters.suburb) {
    filters.region = undefined;
  }

  // ---- QUERY STRING SUPPORT ----
  if (query) {
    const getScalar = (v: string | string[] | undefined): string | undefined =>
      Array.isArray(v) ? v[0] : v;

    const setIfValid = <K extends keyof Filters>(
      key: K,
      value: string | number | undefined
    ) => {
      if (value !== undefined && value !== "") {
        filters[key] = value as any;
      }
    };

    setIfValid("radius_kms", getScalar(query.radius_kms));
    setIfValid("acustom_fromyears", toNumber(query.acustom_fromyears));
    setIfValid("acustom_toyears", toNumber(query.acustom_toyears));
    setIfValid("page", getScalar(query.page));
    setIfValid("orderby", getScalar(query.orderby));
    setIfValid("search", getScalar(query.search));

    if (!filters.search) {
      setIfValid("search", getScalar(query.keyword));
    }
  }

  console.log("parseSlugToFilters", filters.acustom_fromyears);
  console.log("parseSlugTo", filters);

  return filters;
}
