// utils/slugBuilter.ts
import { toSlug } from "../../utils/seo/slug";
import { Filters } from "../components/ListContent/Listings";

const conditionToSlug: Record<string, string> = {
  "near new": "near-new",
  "near-new": "near-new",
  new: "new",
  used: "used",
};

const asNum = (v?: string | number) =>
  typeof v === "number" ? v : v && v.trim() ? Number(v) : undefined;

export function buildSlugFromFilters(f: Filters): string {
  const segments: string[] = [];
  // const DEFAULT_RADIUS = 50;
  // 1) Make / Model
  if (f.make) segments.push(toSlug(f.make));
  if (f.model) segments.push(toSlug(f.model));

  // 2) Condition (display -> slug)
  if (f.condition) {
    const slug =
      conditionToSlug[f.condition.toLowerCase()] || toSlug(f.condition);
    segments.push(`${slug}-condition`);
  }

  // 3) Category
  if (f.category) segments.push(`${toSlug(f.category)}-category`);

  // 4) Location
  const state = f.state ? toSlug(f.state) : undefined;
  const region = f.region ? toSlug(f.region) : undefined;
  const suburb = f.suburb ? toSlug(f.suburb) : undefined;
  const pin = f.pincode?.trim();

  if (state) {
    segments.push(`${state}-state`);

    // ✅ Region (only if suburb not provided)
    if (region && !suburb) {
      segments.push(`${region}-region`);
    }

    // ✅ Suburb + Pincode (optional)
  //   if (suburb) {
  //     if (pin) segments.push(`${suburb}-${pin}`);
  //     else segments.push(`${suburb}-suburb`);
  //   }
  // }
   if (suburb) {
    // ✅ If suburb has pincode
    if (pin) {
      segments.push(`${suburb}-${pin}-suburb`);
    } else {
      segments.push(`${suburb}-suburb`);
    }
  }
}

  // 5) Price
  const fromPrice = asNum(f.from_price);
  const toPrice = asNum(f.to_price);
  if (fromPrice && toPrice) segments.push(`between-${fromPrice}-${toPrice}`);
  else if (fromPrice) segments.push(`over-${fromPrice}`);
  else if (toPrice) segments.push(`under-${toPrice}`);

  // 6) ATM (kg)
  const minKg = asNum(f.minKg);
  const maxKg = asNum(f.maxKg);
  if (minKg !== undefined && maxKg !== undefined) {
    segments.push(`between-${minKg}-kg-${maxKg}-kg-atm`);
  } else if (minKg !== undefined) {
    segments.push(`over-${minKg}-kg-atm`);
  } else if (maxKg !== undefined) {
    segments.push(`under-${maxKg}-kg-atm`);
  }
  // 7) Length (feet)
  const fromLen = asNum(f.from_length);
  const toLen = asNum(f.to_length);
  if (fromLen && toLen)
    segments.push(`between-${fromLen}-${toLen}-length-in-feet`);
  else if (fromLen) segments.push(`over-${fromLen}-length-in-feet`);
  else if (toLen) segments.push(`under-${toLen}-length-in-feet`);

  // 8) Sleeps (single-value)
  // if (f.sleeps) {
  //   const n = String(f.sleeps).replace("-people", "");
  //   if (!isNaN(Number(n))) segments.push(`${n}-people-sleeping-capacity`);
  // }
  // 8) Sleeps (range-based)
  const fromSleep = asNum(f.from_sleep);
  const toSleep = asNum(f.to_sleep);
  

  if (fromSleep && toSleep) {
    segments.push(`between-${fromSleep}-${toSleep}-people-sleeping-capacity`);
  } else if (fromSleep) {
    segments.push(`over-${fromSleep}-people-sleeping-capacity`);
  } else if (toSleep) {
    segments.push(`under-${toSleep}-people-sleeping-capacity`);
  }


  const fromYear = asNum(f.acustom_fromyears);
const toYear = asNum(f.acustom_toyears);

if (fromYear !== undefined && toYear !== undefined) {
  if (fromYear === toYear) {
    segments.push(`${fromYear}-caravans-range`);
  } else {
    // two different years → ignore or skip adding year slug
    // just don’t add anything or fallback
  }
} else if (fromYear !== undefined) {
  segments.push(`${fromYear}-caravans-range`);
} else if (toYear !== undefined) {
  segments.push(`${toYear}-caravans-range`);
}
  const query = new URLSearchParams();

  // Add radius_kms to query only if it's number greater than default
  // if (typeof f.radius_kms === "number" && f.radius_kms > DEFAULT_RADIUS) {
  //   query.set("radius_kms", String(f.radius_kms));
  // }
  // 9) Search (APPEND at the end — never replace other segments)
  if (f.search) {
    // Normalize for SEO URL: spaces → hyphen, remove junk
    const slug = f.search
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-") // replace spaces/symbols with "-"
      .replace(/^-+|-+$/g, "");

    segments.push(`${slug}-search`);
  }
  //  const path = `/listings/${segments.join("/")}`;
  //  const urlWithQuery = query.toString() ? `${path}?${query.toString()}` : path;
  //  if (!urlWithQuery.endsWith("/") && !urlWithQuery.includes("?")) {
  //    return `${urlWithQuery}/`;
  //  }
  //  return urlWithQuery;
  const path =
    segments.length > 0 ? `/listings/${segments.join("/")}` : "/listings";
  const urlWithQuery = query.toString() ? `${path}?${query.toString()}` : path;

  return urlWithQuery;
}
