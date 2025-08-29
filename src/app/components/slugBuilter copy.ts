import { Filters } from "../components/ListContent/Listings";

export const buildSlugFromFilters = (
  filters: Filters,
  page?: number
): string => {
  const slugify = (v: string | null | undefined) =>
    v?.toLowerCase().trim().replace(/\s+/g, "-") || "";
  const toQueryPlus = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[+\-]+/g, " ")
      .replace(/\s+/g, "+");

  // encode while preserving '+'
  const encKeepPlus = (s: string) =>
    encodeURIComponent(s).replace(/%20/g, "+").replace(/%2B/gi, "+");
  const DEFAULT_RADIUS = 50;
  const parts: string[] = [];

  // make/model/category/condition
  if (filters.make) parts.push(filters.make);
  if (filters.model && filters.model !== filters.make)
    parts.push(filters.model);
  if (filters.condition)
    parts.push(`${filters.condition.toLowerCase()}-condition`);
  if (filters.category) parts.push(`${filters.category}-category`);

  // location segments
  if (filters.suburb) {
    parts.push(`${filters.suburb.replace(/\s+/g, "-")}-suburb`);
    if (filters.state) parts.push(`${slugify(filters.state)}-state`);
    if (filters.pincode) parts.push(String(filters.pincode));
  } else if (filters.state) {
    parts.push(`${slugify(filters.state)}-state`);
    if (filters.region) parts.push(`${slugify(filters.region)}-region`);
  }

  // length
  if (filters.from_length && filters.to_length) {
    parts.push(
      `between-${filters.from_length}-${filters.to_length}-length-in-feet`
    );
  } else if (filters.from_length) {
    parts.push(`over-${filters.from_length}-length-in-feet`);
  } else if (filters.to_length) {
    parts.push(`under-${filters.to_length}-length-in-feet`);
  }

  // sleeps
  if (filters.sleeps) {
    parts.push(
      `over-${filters.sleeps.replace("-people", "")}-people-sleeping-capacity`
    );
  }

  // price
  if (filters.from_price && filters.to_price) {
    parts.push(`between-${filters.from_price}-${filters.to_price}`);
  } else if (filters.from_price) {
    parts.push(`over-${filters.from_price}`);
  } else if (filters.to_price) {
    parts.push(`under-${filters.to_price}`);
  }

  // weight (ATM)
  if (filters.minKg && filters.maxKg) {
    parts.push(`between-${filters.minKg}-kg-${filters.maxKg}-kg-atm`);
  } else if (filters.minKg) {
    parts.push(`over-${filters.minKg}-kg-atm`);
  } else if (filters.maxKg) {
    parts.push(`under-${filters.maxKg}-kg-atm`);
  }

  // query params (shared)
  const q = new URLSearchParams();
  // if (filters.acustom_fromyears)
  //   q.set("acustom_fromyears", String(filters.acustom_fromyears));
  // if (filters.acustom_toyears)
  //   q.set("acustom_toyears", String(filters.acustom_toyears));
  if (
    typeof filters.radius_kms === "number" &&
    filters.radius_kms > DEFAULT_RADIUS
  ) {
    q.set("radius_kms", String(filters.radius_kms));
  }
  const pageNum = Number(page);
  if (pageNum > 1) q.set("page", String(pageNum));
  // Special cases: keyword / search segment (encode RHS only)
  // const encodeRhsKeepPlus = (raw: string) =>
  //   encodeURIComponent(raw.trim().replace(/\s+/g, "+")).replace(/%2B/gi, "+"); // turn encoded '+' back to '+'
  // if (filters.keyword?.trim()) {
  //   const rhs = encodeRhsKeepPlus(filters.keyword);
  //   const path = `/listings/search=${rhs}/`;
  //   const qs = q.toString();
  //   return qs ? `${path}?${qs}` : path;
  // }

  // if (filters.search?.trim()) {
  //   const rhs = encodeRhsKeepPlus(filters.search);
  //   const path = `/listings/search=${rhs}/`;
  //   const qs = q.toString();
  //   return qs ? `${path}?${qs}` : path;
  // }
  if (filters.keyword?.trim()) {
    const rhs = encKeepPlus(toQueryPlus(String(filters.keyword)));
    const path = `/listings/search=${rhs}/`;
    const qs = q.toString();
    return qs ? `${path}?${qs}` : path;
  }
  if (filters.search?.trim()) {
    const rhs = encKeepPlus(toQueryPlus(String(filters.search)));
    const path = `/listings/search=${rhs}/`;
    const qs = q.toString();
    return qs ? `${path}?${qs}` : path;
  }
  // Base path (avoid double slash if no parts)
  const segs = parts.filter(Boolean).join("/");
  const base = segs ? `/listings/${segs}/` : `/listings/`;
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
};
