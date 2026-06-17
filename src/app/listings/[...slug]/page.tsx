// app/(listings)/[[...slug]]/page.tsx
import type { Metadata } from "next";
import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { getCachedListings } from "@/api/listings/api";
import { metaFromSlug } from "@/utils/seo/meta";
import { redirect, notFound } from "next/navigation";
import "../../components/ListContent/newList.css";
import "../listings.css";
import GonePage from "@/app/410/page";
// import { fetchMakeDetails } from "@/api/make-new/api";
import { fetchLinksData } from "@/api/link/api";
import { buildSlugFromFilters } from "@/app/components/slugBuilter";
import {
  buildStaticLinks,
  buildStaticLinkUrl,
  SECTION_TITLES,
} from "@/app/components/ListContent/StaticLinksUtils";
import { fetchProductList, fetchCategoryCounts, fetchMakeCounts, fetchModelCounts } from "@/api/productList/api";
import { calculateDistances } from "@/utils/postcodeCoords";
import { fetchBottomLinks } from "@/api/bottomLinks/api";
import type { BottomLinksData } from "@/api/bottomLinks/api";
import ApiErrorFallback from "@/app/components/ApiErrorFallback";
import { reportGitHubIssue } from "@/lib/reportGitHubIssue";
import { unstable_noStore } from "next/cache";

export const revalidate = 3600;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const [{ slug = [] }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  // Check product count — if 0, return noindex so page is de-listed from search engines.
  // When products return on the next ISR cycle, metadata reverts to indexable automatically.
  try {
    const filters = parseSlugToFilters(slug, resolvedSearchParams);
    const pageParam = resolvedSearchParams.page;
    let page = 1;
    if (pageParam) {
      const val = Array.isArray(pageParam) ? pageParam[0] : pageParam;
      const n = parseInt(val as string, 10);
      if (!isNaN(n) && n > 0) page = n;
    }
    const data = await getCachedListings({ ...filters, page });
    const hasProducts = (data?.data?.products?.length ?? 0) > 0;
    if (!hasProducts) {
      return {
        title: { absolute: "410 - Page Permanently Removed | Caravans For Sale" },
        robots: { index: false, follow: false },
      };
    }
  } catch {
    // On API error, fall through to normal metadata
  }

  const meta = await metaFromSlug(slug, {});
  const title =
    meta.title && typeof meta.title === "object" && "absolute" in meta.title
      ? (meta.title as { absolute: string }).absolute
      : "Caravans for Sale in Australia";
  return { title: { absolute: title } };
}

function normalizeSlug(v: string = "") {
  return decodeURIComponent(v)
    .replace(/\s+/g, "+") // convert spaces back to +
    .trim()
    .toLowerCase();
}
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

  // ───── Block any "acustom" usage ─────

  // Validate REAL make/model from API
  // ───── Validate MAKE & MODEL using API data ─────
  // helper: check if slug is a typed value (category, state, year, price, etc)
  function isTypedFilter(slug: string) {
    // 🔧 FIX: Add null/undefined check

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
  // const makesData = await fetchMakeDetails();

  // if (slug.length >= 1 && !isTypedFilter(slug[0])) {
  //   const makeSlug = normalizeSlug(slug[0]);

  //   const matchedMake = makesData.find(
  //     (m) => normalizeSlug(m.slug) === makeSlug,
  //   );

  //   if (!matchedMake) redirect("/404");

  //   if (slug.length >= 2 && !isTypedFilter(slug[1])) {
  //     const modelSlug = normalizeSlug(slug[1]);

  //     const matchedModel = matchedMake.models?.some(
  //       (mod) => normalizeSlug(mod.slug) === modelSlug,
  //     );

  //     if (!matchedModel) redirect("/404");
  //   }
  // }

  // Block page/feed keywords
  // 🚫 Fully block "page" or "feed" in URL
  const forbiddenPattern = /(page|feed)/i;

  if (
    slug.some((s) => forbiddenPattern.test(s)) ||
    Object.keys(resolvedSearchParams).some((k) => forbiddenPattern.test(k)) ||
    Object.values(resolvedSearchParams).some((v) =>
      forbiddenPattern.test(String(v)),
    )
  ) {
    return <GonePage />;
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

  if (hasGibberish) return <GonePage />;

  // ───── Parse filters (needed for location rules) ─────
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // ───── Canonical URL redirect — wrong slug order → 301 to correct order ─────
  const canonicalPath = buildSlugFromFilters(filters);
  const incomingPath = `/listings/${slug.join("/")}`;
  const normalize = (p: string) => p.replace(/\/$/, "").toLowerCase();
  if (normalize(canonicalPath) !== normalize(incomingPath)) {
    return <GonePage />;
  }

  // ───── Location hierarchy validation ─────
  const hasState = !!filters.state;
  const hasRegion = !!filters.region;

  const hasSuburb = !!filters.suburb;

  if ((hasRegion || hasSuburb) && !hasState) return <GonePage />;
  if (hasSuburb && !hasRegion) return <GonePage />;

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
    else if (lower.includes("-people-sleeping-capacity"))
      detectedType = "sleeps";
    else if (/\d{4}(-caravans-range)?$/.test(lower)) detectedType = "year";
    else if (lower.endsWith("-search")) detectedType = "search";
    else if (lower.endsWith("-condition")) detectedType = "condition";
    else if (lower.endsWith("-category")) detectedType = "category";
    else if (lower.endsWith("-state")) detectedType = "state";
    else if (lower.endsWith("-region")) detectedType = "region";
    else if (lower.includes("-suburb")) detectedType = "suburb";
    // Make / Model (simple alphanumeric segments)
    else if (
      /^[a-z]+[0-9]+$/.test(lower) || // string + number
      /^[a-z]+[0-9]+\+$/.test(lower) // string + number + +
    ) {
      if (!seenTypes.has("make")) detectedType = "make";
      else if (!seenTypes.has("model")) detectedType = "model";
    } else if (
      /^[0-9]+$/.test(lower) ||
      /^[0-9]+\+$/.test(lower) ||
      /^[a-z]+\+$/.test(lower) ||
      /^[0-9]+[a-z]/.test(lower) // number-first + letter (e.g. 58d, 123abc)
    ) {
      return <GonePage />; // block bad patterns
    }

    if (detectedType) {
      if (seenTypes.has(detectedType)) return <GonePage />;
      seenTypes.add(detectedType);

      // Enforce strict order for non-flexible types
      if (!FLEXIBLE_TYPES.includes(detectedType)) {
        const currentStrictIndex = STRICT_ORDER.indexOf(detectedType);
        if (currentStrictIndex !== -1 && currentStrictIndex < lastStrictIndex) {
          return <GonePage />; // Out of order
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

  // ───── Resolve model slug (URL has s-c-o-t-a but API needs s.c.o.t.a) ─────
  let apiFilters = filters;
  if (filters.model && filters.make) {
    const modelCounts = await fetchModelCounts(filters.make);
    const matched = modelCounts.find(
      (m) =>
        m.slug === filters.model ||
        m.slug.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") === filters.model
    );
    if (matched) apiFilters = { ...filters, model: matched.slug };
  }

  // ───── Fetch all data in parallel ─────
  let response: Awaited<ReturnType<typeof getCachedListings>>;
  let linksData: Awaited<ReturnType<typeof fetchLinksData>>;
  let productListRes: Awaited<ReturnType<typeof fetchProductList>>;
  let initialCategoryCounts: Awaited<ReturnType<typeof fetchCategoryCounts>>;
  let initialMakeCounts: Awaited<ReturnType<typeof fetchMakeCounts>>;
  let bottomLinksData: BottomLinksData | null = null;
  const _t = Date.now();
  try {
    [response, linksData, productListRes, initialCategoryCounts, initialMakeCounts, bottomLinksData] = await Promise.all([
      getCachedListings({ ...apiFilters, page }).then(r => { console.log(`[PERF] getCachedListings: ${Date.now()-_t}ms`); return r; }),
      fetchLinksData(apiFilters).then(r => { console.log(`[PERF] fetchLinksData: ${Date.now()-_t}ms`); return r; }),
      fetchProductList().then(r => { console.log(`[PERF] fetchProductList: ${Date.now()-_t}ms`); return r; }),
      fetchCategoryCounts().then(r => { console.log(`[PERF] fetchCategoryCounts: ${Date.now()-_t}ms`); return r; }),
      fetchMakeCounts().then(r => { console.log(`[PERF] fetchMakeCounts: ${Date.now()-_t}ms`); return r; }),
      fetchBottomLinks(apiFilters).then(r => { console.log(`[PERF] fetchBottomLinks: ${Date.now()-_t}ms`); return r; }),
    ]);
    console.log(`[PERF] total Promise.all: ${Date.now()-_t}ms`);
  } catch (err) {
    // Prevent ISR from caching this error response — next request will retry fresh
    unstable_noStore();
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("400") || msg.includes("404")) {
      redirect("/404");
    }
    const isBackend =
      msg.startsWith("API no response") ||
      msg.startsWith("Backend server error") ||
      msg.startsWith("Missing or invalid API key") ||
      msg.startsWith("API endpoint not found") ||
      msg.startsWith("Invalid API response") ||
      msg.startsWith("API failed:");
    const errorSource = isBackend ? "BACKEND" : "FRONTEND";
    console.error(`[${errorSource} ERROR] Slug listings page failed:`, msg);
    reportGitHubIssue({
      errorSource,
      errorType: msg,
      message: `Slug listings page failed: ${msg}`,
    }).catch(() => {});
    return (
      <ApiErrorFallback
        title="Unable to load listings"
        message="We couldn't load this page. Please try again."
        showRetry={true}
        errorSource={errorSource}
      />
    );
  }

  // ───── Empty results → render 410 inline (URL unchanged, noindex already set in generateMetadata) ─────
  if (!response?.data || !Array.isArray(response.data.products) || response.data.products.length === 0) {
    return <GonePage />;
  }

  // ───── JSON-LD Schema ─────
  const BASE_URL = "https://www.caravansforsale.com.au";
  const pageUrl = `${BASE_URL}/listings/${slug.join("/")}/`;
  const pageTitle = response?.seo_v2?.h1 || response?.seo_v2?.meta_title || "Caravans for Sale";
  const totalProducts = response?.pagination?.total_products ?? 0;

  const breadcrumbItems = [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Caravans for Sale", url: `${BASE_URL}/listings/` },
    ...slug.map((segment, i) => ({
      name: segment
        .replace(/-category$/, "")
        .replace(/-state$/, "")
        .replace(/-region$/, "")
        .replace(/-suburb$/, "")
        .replace(/-condition$/, "")
        .replace(/-search$/, "")
        .replace(/-kg-atm$/, "")
        .replace(/-length-in-feet$/, "")
        .replace(/-people-sleeping-capacity$/, "")
        .replace(/[-+]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      url: `${BASE_URL}/listings/${slug.slice(0, i + 1).join("/")}/`,
    })),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": pageUrl,
        "name": pageTitle,
        "url": pageUrl,
        "inLanguage": "en-AU",
        ...(totalProducts > 0 && { "numberOfItems": totalProducts }),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems.map((item, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": item.name,
          "item": item.url,
        })),
      },
    ],
  };

  // ───── Render ─────
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ✅ SSR Links — server component = appears in View Page Source */}
      {/* {linksData && (
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
        {(["states", "categories", "regions",] as const).map((sectionKey) => {
          const items = linksData[sectionKey];
          if (!items || items.length === 0) return null;

          const titles: Record<string, string> = {
            categories: "Browse by Type",
            states: "Browse by State",
            regions: "Browse by Region",
            // makes: "Browse by Make",
            // models: "Browse by Model",
            // conditions: "Browse by Condition",
            // prices: "Browse by Price",
            // atm_ranges: "Browse by ATM",
            // length_ranges: "Browse by Length",
            // sleep_ranges: "Browse by Sleep",
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
                        {item.name.includes(" ") 
  ? item.name.replace(/\b\w/g, (c: string) => c.toUpperCase())
  : item.name.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
}
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
     */}

      <ListingsPage
          {...apiFilters}
          initialData={response}
          linksData={linksData}
          productListData={productListRes}
          initialCategoryCounts={initialCategoryCounts}
          initialMakeCounts={initialMakeCounts}
          initialBottomLinksData={bottomLinksData}
          initialDistances={await (async () => {
            if (!filters.suburb || !filters.pincode) return {};
            const allItems = [
              ...(response.data?.products ?? []),
              ...(response.data?.exclusive_products ?? []),
              ...(response.data?.featured_products ?? []),
              ...(response.data?.premium_products ?? []),
            ];
            const pincodes = allItems
              .map((p: any) => p.pincode)
              .filter((p: any): p is string => typeof p === "string" && /^\d{4}$/.test(p));
            return calculateDistances(filters.pincode as string, pincodes);
          })()}
        />
    </>
  );
}
