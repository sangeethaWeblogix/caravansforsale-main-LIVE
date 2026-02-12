  // app/(listings)/[[...slug]]/page.tsx
function normalizeSlug(v: string = "") {
  return decodeURIComponent(v)
    .replace(/\s+/g, "+")     // convert spaces back to +
    .trim()
    .toLowerCase();
}

 
export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "@/utils/seo/meta";
import type { Metadata } from "next";
import { fetchListings } from "@/api/listings/api";
import { redirect } from "next/navigation";
import "../../components/ListContent/newList.css";
  import "../listings.css"
import { fetchMakeDetails } from "@/api/make-new/api";
import { fetchLinksData } from "@/api/link/api";
import { buildSlugFromFilters } from "@/app/components/slugBuilter";


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
  // const slugString = slug.join("/");

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
 

  // Validate REAL make/model from API
 // ───── Validate MAKE & MODEL using API data ─────
 // helper: check if slug is a typed value (category, state, year, price, etc)
function isTypedFilter(slug: string) {
  // 🔧 FIX: Add null/undefined check
  if (!slug || typeof slug !== 'string') return false;
  
  return (
    slug.endsWith("-category") ||
    slug.endsWith("-condition") ||
    slug.endsWith("-state") ||
    slug.endsWith("-region") ||
    slug.includes("-suburb") ||
    slug.includes("-kg-atm") ||
    slug.includes("-length-in-feet") ||
    slug.includes("-people-sleeping-capacity") ||
    slug.endsWith("-search") ||
    /^over-\d+$/.test(slug) ||
    /^under-\d+$/.test(slug) ||
    /^between-\d+-\d+$/.test(slug) ||
    /\d{4}(-caravans-range)?$/.test(slug)
  );
}

// ───── Validate MAKE & MODEL only if NOT typed filter ─────
const makesData = await fetchMakeDetails();

if (slug.length >= 1 && !isTypedFilter(slug[0])) {
  const makeSlug = normalizeSlug(slug[0]);

  const matchedMake = makesData.find(
    (m) => normalizeSlug(m.slug) === makeSlug
  );

  if (!matchedMake) redirect("/404");

  if (slug.length >= 2 && !isTypedFilter(slug[1])) {
    const modelSlug = normalizeSlug(slug[1]);

    const matchedModel = matchedMake.models?.some(
      (mod) => normalizeSlug(mod.slug) === modelSlug
    );

    if (!matchedModel) redirect("/404");
  }
}




  
  // Block page/feed keywords
 // 🚫 Fully block "page" or "feed" in URL
const forbiddenPattern = /(page|feed)/i;

if (
  slug.some((s) => s && typeof s === 'string' && forbiddenPattern.test(s)) ||  // 🔧 FIX #1: Add null check for s
  Object.keys(resolvedSearchParams).some((k) => forbiddenPattern.test(k)) ||
  Object.values(resolvedSearchParams).some((v) =>
    forbiddenPattern.test(String(v))
  )
) {
  redirect("/404");
}


 
  // Reject gibberish / pin-code spam
  const hasGibberish = slug.some((part) => {
    // 🔧 FIX #2: Add null/undefined check for part
     
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
    // 🔧 FIX #3: Add null/undefined check for part
     
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
  else if (
  /^[a-z]+[0-9]+$/.test(lower) ||        // string + number
  /^[a-z]+[0-9]+\+$/.test(lower)         // string + number + +
) {
  if (!seenTypes.has("make")) detectedType = "make";
  else if (!seenTypes.has("model")) detectedType = "model";
} else if (/^[0-9]+$/.test(lower) || /^[0-9]+\+$/.test(lower) || /^[a-z]+\+$/.test(lower)) {
  redirect("/404"); // block bad patterns: only numbers, number+, or string+ without number
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
const linksData = await fetchLinksData(filters);

function buildSSRLinkUrl(
  type: string,
  item: { slug: string },
  currentFilters: Record<string, any>
): string {
  const linkFilters = { ...currentFilters };

  // Remove page from filters
  delete linkFilters.page;

  switch (type) {
    case "states":
      linkFilters.state = item.slug.replace(/-/g, " ");
      delete linkFilters.region;
      delete linkFilters.suburb;
      delete linkFilters.pincode;
      break;
    case "regions":
      linkFilters.region = item.slug.replace(/-/g, " ");
      delete linkFilters.suburb;
      delete linkFilters.pincode;
      break;
    case "categories":
      linkFilters.category = item.slug;
      break;
    case "makes":
      linkFilters.make = item.slug;
      delete linkFilters.model;
      break;
    case "models":
      linkFilters.model = item.slug;
      break;
    case "conditions":
      linkFilters.condition = item.slug;
      break;
  }

  const slugPath = buildSlugFromFilters(linkFilters);
  return slugPath.endsWith("/") ? slugPath : `${slugPath}/`;
}
  // ───── Render ─────
return (
  <>
    {/* ✅ SSR Links — server component = appears in View Page Source */}
    {linksData && (
      <div
        className="cfs-ssr-links-wrapper"
        id="ssr-links"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        {(["states", "categories", "makes", "conditions", "regions", "models"] as const).map((sectionKey) => {
          const items = linksData[sectionKey];
          if (!items || items.length === 0) return null;

          const titles: Record<string, string> = {
            categories: "Browse by Category",
            states: "Browse by State",
            regions: "Browse by Region",
            makes: "Browse by Make",
            models: "Browse by Model",
            conditions: "Browse by Condition",
          };

          return (
            <div key={sectionKey}>
              <h5>{titles[sectionKey] || sectionKey}</h5>
              <ul>
                {items.map((item: any) => {
                  const linkUrl = buildSSRLinkUrl(sectionKey, item, filters);
                  return (
                    <li key={item.slug}>
                      <a href={linkUrl} target=" " >
                        {item.name
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    )}
    

    <ListingsPage {...filters} initialData={response} linksData={linksData} />
  </>
);
}
