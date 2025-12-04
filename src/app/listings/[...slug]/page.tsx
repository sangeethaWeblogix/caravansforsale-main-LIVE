 // app/(listings)/[[...slug]]/page.tsx

export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/meta";
import type { Metadata } from "next";
import { fetchListings } from "@/api/listings/api";
import { redirect } from "next/navigation";
import "../../components/ListContent/newList.css";
import { fetchMakeDetails } from "@/api/make-new/api";
 import "../listings.css"
// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type SegmentType =
  | "make"
  | "model"
  | "condition"
  | "category"
  | "state"
  | "region"
  | "suburb"
  | "price"
  | "weight"
  | "length"
  | "sleeps"
  | "year"
  | "search";

const FLEXIBLE_TYPES: SegmentType[] = ["price", "year", "search"];
const STRICT_ORDER: SegmentType[] = [
  "make",
  "model",
  "condition",
  "category",
  "state",
  "region",
  "suburb",
  "weight",
  "length",
  "sleeps",
];

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const [p, sp] = await Promise.all([params, searchParams]);
  return metaFromSlug(p.slug || [], sp);
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default async function Listings({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const slug = resolvedParams.slug || [];
  const slugString = slug.join("/");

  // ───── Basic security & sanity checks ─────
  // if (
  //   slug.length > 0 &&
  //   (/[^\w/-]/.test(slugString) ||
  //     slugString.includes("..") ||
  //     slugString.includes("//") ||
  //     slugString.includes("&") ||
  //     slugString.includes("?") ||
  //     slugString.includes("="))
  // ) {
  //   redirect("/404");
  // }
   

  

// ───── Block any "acustom" usage ─────
 


  // Block page/feed keywords
  const hasBlockedWord =
    slug.some((s) => /(page|feed|years)/i.test(s)) ||
    Object.keys(resolvedSearchParams).some((k) => /(page|feed|years)/i.test(k)) ||
    Object.values(resolvedSearchParams).some((v) =>
      Array.isArray(v)
        ? v.some((vv) => /(page|feed|years)/i.test(String(vv)))
        : /(page|feed|years)/i.test(String(v))
    );

  if (hasBlockedWord) redirect("/404");

  // Reject gibberish / pin-code spam
  const hasGibberish = slug.some((part) => {
    const lower = part.toLowerCase();
    const isPureNumber = /^[0-9]{5,}$/.test(lower);
    const isWeirdSymbols = /^[^a-z0-9-]+$/.test(lower);
    const allowed = [

      /^over-\d+$/,
      /^under-\d+$/,
      /^between-\d+-\d+$/,
      /\d{4}(-caravans-range)?$/,
      /-state$/,
      /-region$/,
      /-suburb$/,
      /-condition$/,
      /-category$/,
      /-search$/,
      /-kg-atm$/,
      /-length-in-feet$/,
      /-people-sleeping-capacity$/,
    ].some((r) => r.test(lower));
    return (isPureNumber || isWeirdSymbols) && !allowed;
  });

  if (hasGibberish) redirect("/404");

  // ───── Parse filters (needed for location rules) ─────
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // ───── Location hierarchy validation ─────
  const hasState = !!filters.state;
  const hasRegion = !!filters.region;

  const hasSuburb = !!filters.suburb;

  if ((hasRegion || hasSuburb) && !hasState) redirect("/404");
  if (hasSuburb && !hasRegion) redirect("/404");

  // ───── Segment type detection + order validation ─────
  const seenTypes = new Set<SegmentType>();
  let lastStrictIndex = -1;

  // ← Fixed: removed unused `index`
  for (const part of slug) {
    const lower = part.toLowerCase();
    let detectedType: SegmentType | null = null;

    // Price
    if (/^(over|under)-\d+$/.test(lower) || /^between-\d+-\d+$/.test(lower)) {
      detectedType = "price";
    }
    // Other typed segments
    else if (lower.includes("-kg-atm")) detectedType = "weight";
    else if (lower.includes("-length-in-feet")) detectedType = "length";
    else if (lower.includes("-people-sleeping-capacity")) detectedType = "sleeps";
    else if (/\d{4}(-caravans-range)?$/.test(lower)) detectedType = "year";
    else if (lower.endsWith("-search")) detectedType = "search";
    else if (lower.endsWith("-condition")) detectedType = "condition";
    else if (lower.endsWith("-category")) detectedType = "category";
    else if (lower.endsWith("-state")) detectedType = "state";
    else if (lower.endsWith("-region")) detectedType = "region";
    else if (lower.includes("-suburb")) detectedType = "suburb";
    // Make / Model (simple alphanumeric segments)
    else if (/^[a-z0-9]+$/.test(part)) {
      if (!seenTypes.has("make")) detectedType = "make";
      else if (!seenTypes.has("model")) detectedType = "model";
    }

    if (detectedType) {
      // Duplicate type → 404
      if (seenTypes.has(detectedType)) redirect("/404");
      seenTypes.add(detectedType);

      // Enforce strict order for non-flexible types
      if (!FLEXIBLE_TYPES.includes(detectedType)) {
        const currentStrictIndex = STRICT_ORDER.indexOf(detectedType);
        if (currentStrictIndex !== -1 && currentStrictIndex < lastStrictIndex) {
          redirect("/404"); // Out of order
        }
        lastStrictIndex = Math.max(lastStrictIndex, currentStrictIndex);
      }
    }
  }

  

//   // ───── Validate Make & Model against API ─────
//   const makeDetails = await fetchMakeDetails();

//   const validMakes = new Set(makeDetails.map((m) => m.slug.toLowerCase()));
//   const validModelsByMake = new Map<string, Set<string>>();
//   makeDetails.forEach((make) => {
//     validModelsByMake.set(
//       make.slug.toLowerCase(),
//       new Set(make.models.map((m) => m.slug.toLowerCase()))
//     );
//   });

//   const simpleSegments = slug.filter((s) => /^[a-z0-9]+$/.test(s));
//   const makeSlug = simpleSegments[0]?.toLowerCase();
//   const modelSlug = simpleSegments[1]?.toLowerCase();

//   if (makeSlug && !validMakes.has(makeSlug)) {
//     console.log("Invalid make:", makeSlug);
//     redirect("/404");
//   }

//  if (makeSlug && modelSlug) {
//   const models = validModelsByMake.get(makeSlug) || new Set();

//   const normalize = (str: string) =>
//     str.toLowerCase().replace(/[^a-z0-9]/g, "");

//   const normalizedUserModel = normalize(modelSlug);

//   const isValid = [...models].some((model) => {
//     const normalizedBackend = normalize(model);
//     return normalizedBackend.startsWith(normalizedUserModel);
//   });

//   if (!isValid) {

//     console.log(
//       `❌ Model mismatch → user:${modelSlug}, cleaned:${normalizedUserModel}`
//     );
//     redirect("/404");
//   }
// }
// ───── Validate Make & Model against API ─────
const makeDetails = await fetchMakeDetails();

const validMakes = new Set(makeDetails.map((m) => m.slug.toLowerCase()));
const validModelsByMake = new Map<string, string[]>();

makeDetails.forEach((make) => {
  validModelsByMake.set(
    make.slug.toLowerCase(),
    make.models.map((m) => m.slug.toLowerCase())
  );
});

const simpleSegments = slug.filter((s) => /^[a-z0-9-]+$/.test(s));
const makeSlug = simpleSegments[0]?.toLowerCase();
const modelSlug = simpleSegments[1]?.toLowerCase();

// --- Validate Make ---
if (makeSlug && !validMakes.has(makeSlug)) {
  console.log("❌ Invalid Make:", makeSlug);
  redirect("/404");
}

// --- Validate Model based on Make rules ---
 // --- Validate Make & Model ---
if (makeSlug && modelSlug) {
  const backendModels = validModelsByMake.get(makeSlug) ?? [];

  const clean = (v: string) => v.toLowerCase().replace(/[^a-z0-9+]/g, "");

  const cleanedUser = clean(modelSlug);

  let isValid = false;

  for (const backend of backendModels) {
    const cleanedBackend = clean(backend);

    // RULE: User slug must CONTAIN backend model slug
    if (cleanedUser.includes(cleanedBackend)) {
      isValid = true;
      break;
    }
  }

  if (!isValid) {
    console.log(`❌ Model mismatch → make:${makeSlug}, user:${modelSlug}`);
    redirect("/404");
  }
}



  // ───── Page param ─────
  let page = 1;
  const pageParam = resolvedSearchParams.page;
  if (pageParam) {
    const val = Array.isArray(pageParam) ? pageParam[0] : pageParam;
    const n = parseInt(val as string, 10);
    if (!isNaN(n) && n > 0) page = n;
  }

  // ───── Fetch listings ─────
  const response = await fetchListings({ ...filters, page });

  // ───── Render ─────
  return <ListingsPage {...filters} initialData={response} />;
}