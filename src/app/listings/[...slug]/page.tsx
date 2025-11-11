export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { fetchListings } from "@/api/listings/api";
import { notFound } from "next/navigation";
import '../../components/ListContent/newList.css'

type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  return metaFromSlug(resolvedParams.slug || [], resolvedSearchParams);
}

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
  const { slug = [] } = resolvedParams;
  const slugJoined = slug.join("/");

  // ✅ Allow empty slug for root listings page
  if (
    slug.length > 0 &&
    (
      !Array.isArray(slug) ||
      slugJoined.match(/[^\w/-]/) ||
      slugJoined.includes("..") ||
      slugJoined.includes("//") ||
      slugJoined.includes("&") ||
      slugJoined.includes("?") ||
      slugJoined.includes("=")
    )
  ) {
    notFound();
  }

  // ❌ Reject gibberish slugs
  if (slug.length > 0) {
    const invalidSegment = slug.some((part) => {
      const lower = part.toLowerCase();
      const allowedPatterns = [
        /-state$/,
        /-category$/,
        /-condition$/,
        /-region$/,
        /-suburb$/,
        /-search$/,
        /-kg-atm$/,
        /-length-in-feet$/,
        /-people-sleeping-capacity$/,
        /^over-\d+$/,
        /^under-\d+$/,
        /^between-\d+-\d+$/,
        /^between-\d+-kg-\d+-kg-atm$/,
        /^between-\d+-\d+-length-in-feet$/,
        /^between-\d+-\d+-people-sleeping-capacity$/,
        /^\d{4}$/,
        /^\d{4}-caravans-range$/,
        /^([a-z0-9-]+)-\d{4}-suburb$/,
        /^([a-z0-9-]+)-suburb$/,
      ];
      const isAllowed = allowedPatterns.some((r) => r.test(lower));
      const looksGibberish =
        /^[0-9]+$/.test(lower) || /^[^a-z0-9-]+$/.test(lower);
      return looksGibberish && !isAllowed;
    });

    if (invalidSegment) notFound();

    const lastPart = slug[slug.length - 1];
    if (/^\d+$/.test(lastPart)) notFound();

    const suburbPinMatch = slug.find((part) =>
      /^([a-z0-9-]+)-(\d{4})$/.test(part)
    );
    const suburbPinIndex = suburbPinMatch ? slug.indexOf(suburbPinMatch) : -1;
    if (
      suburbPinIndex !== -1 &&
      slug[suburbPinIndex + 1]?.match(/^\d{1,6}$/)
    ) {
      notFound();
    }

    const hasInvalidSuburbWord = slug.some((part) => {
      if (/^[a-z0-9-]+-\d{4}-suburb$/i.test(part)) return false;
      if (/^[a-z0-9-]+-suburb$/i.test(part)) return false;
      return /(^|\b)(suburb|suburbs)\b$/i.test(part);
    });
    if (hasInvalidSuburbWord) notFound();
  }

  // 🚫 Block "page" or "feed" anywhere in slug or query
  const urlHasBlockedWord =
    slug.some((s) => /(page|feed)/i.test(s)) ||
    Object.keys(resolvedSearchParams).some((k) => /(page|feed)/i.test(k)) ||
    Object.values(resolvedSearchParams).some((v) =>
      Array.isArray(v)
        ? v.some((vv) => /(page|feed)/i.test(String(vv)))
        : /(page|feed)/i.test(String(v))
    );

  if (urlHasBlockedWord) notFound();

  // ✅ Parse filters
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // ✅ STRICT ORDER VALIDATION: Enforce exact segment order
  const segmentOrder = [
    'make',           // 1. Make (simple segment)
    'model',          // 2. Model (simple segment)  
    'condition',      // 3. Condition
    'category',       // 4. Category
    'state',          // 5. State
    'region',         // 6. Region
    'suburb',         // 7. Suburb
    'price',          // 8. Price
    'weight',         // 9. Weight (kg-atm)
    'length',         // 10. Length
    'sleeps',         // 11. Sleeps
    'year',           // 12. Year
    'search'          // 13. Search
  ];

  // Map each segment to its type and expected position
  const segmentAnalysis: Array<{ type: string, value: string, actualPosition: number, expectedPosition: number }> = [];

  slug.forEach((part, index) => {
    const lowerPart = part.toLowerCase();

    if (!part.includes('-') &&
      !part.endsWith('-state') &&
      !part.endsWith('-region') &&
      !part.endsWith('-suburb') &&
      !part.endsWith('-condition') &&
      !part.endsWith('-category') &&
      !part.endsWith('-search') &&
      !/^\d+$/.test(part) &&
      !part.includes('=')) {
      // This is a make or model segment (simple segment without dashes)
      const existingMake = segmentAnalysis.find(seg => seg.type === 'make');
      const existingModel = segmentAnalysis.find(seg => seg.type === 'model');

      if (!existingMake) {
        segmentAnalysis.push({
          type: 'make',
          value: part,
          actualPosition: index,
          expectedPosition: segmentOrder.indexOf('make')
        });
      } else if (!existingModel) {
        segmentAnalysis.push({
          type: 'model',
          value: part,
          actualPosition: index,
          expectedPosition: segmentOrder.indexOf('model')
        });
      }
    } else if (part.endsWith('-condition')) {
      segmentAnalysis.push({
        type: 'condition',
        value: part,
        actualPosition: index,
        expectedPosition: segmentOrder.indexOf('condition')
      });
    } else if (part.endsWith('-category')) {
      segmentAnalysis.push({
        type: 'category',
        value: part,
        actualPosition: index,
        expectedPosition: segmentOrder.indexOf('category')
      });
    } else if (part.endsWith('-state')) {
      segmentAnalysis.push({
        type: 'state',
        value: part,
        actualPosition: index,
        expectedPosition: segmentOrder.indexOf('state')
      });
    } else if (part.endsWith('-region')) {
      segmentAnalysis.push({
        type: 'region',
        value: part,
        actualPosition: index,
        expectedPosition: segmentOrder.indexOf('region')
      });
    } else if (part.endsWith('-suburb') || part.includes('-suburb')) {
      segmentAnalysis.push({
        type: 'suburb',
        value: part,
        actualPosition: index,
        expectedPosition: segmentOrder.indexOf('suburb')
      });
    } else if (part.includes('-kg-atm')) {
      segmentAnalysis.push({
        type: 'weight',
        value: part,
        actualPosition: index,
        expectedPosition: segmentOrder.indexOf('weight')
      });
    } else if (part.includes('-length-in-feet')) {
      segmentAnalysis.push({
        type: 'length',
        value: part,
        actualPosition: index,
        expectedPosition: segmentOrder.indexOf('length')
      });
    } else if (part.includes('-people-sleeping-capacity')) {
      segmentAnalysis.push({
        type: 'sleeps',
        value: part,
        actualPosition: index,
        expectedPosition: segmentOrder.indexOf('sleeps')
      });
    } else if (part.includes('-caravans-range')) {
      segmentAnalysis.push({
        type: 'year',
        value: part,
        actualPosition: index,
        expectedPosition: segmentOrder.indexOf('year')
      });
    } else if (part.endsWith('-search')) {
      segmentAnalysis.push({
        type: 'search',
        value: part,
        actualPosition: index,
        expectedPosition: segmentOrder.indexOf('search')
      });
    } else if (/^over-\d+$/.test(lowerPart) || /^under-\d+$/.test(lowerPart) || /^between-\d+-\d+$/.test(lowerPart)) {
      segmentAnalysis.push({
        type: 'price',
        value: part,
        actualPosition: index,
        expectedPosition: segmentOrder.indexOf('price')
      });
    }
  });

  // ✅ Validate strict order: segments must appear in correct sequence
  let hasInvalidOrder = false;

  // Sort segments by their actual position
  const sortedSegments = [...segmentAnalysis].sort((a, b) => a.actualPosition - b.actualPosition);

  // Duplicate validation  
  let duplicates = sortedSegments.filter((item, index, arr) => arr.findIndex(obj => obj.type === item.type) !== index);
  if (duplicates.length > 0) {
    notFound();
  }

  // Check if segments appear in the correct expected order
  for (let i = 0; i < sortedSegments.length; i++) {
    const currentSegment = sortedSegments[i];

    // Check if this segment's expected position is less than previous segments' expected positions
    for (let j = 0; j < i; j++) {
      const previousSegment = sortedSegments[j];
      if (currentSegment.expectedPosition < previousSegment.expectedPosition) {
        hasInvalidOrder = true;
        break;
      }
    }
    if (hasInvalidOrder) break;
  }

  // ❌ Trigger 404 for any wrong order
  if (hasInvalidOrder) {
    console.log('Invalid segment order detected:', sortedSegments);
    notFound();
  }

  // 🧩 Location Hierarchy Rule
  const hasState = !!filters.state;
  const hasRegion = !!filters.region;
  const hasSuburb = !!filters.suburb;

  const validLocationCombo =
    hasState ||
    (hasState && hasRegion) ||
    (hasState && hasRegion && hasSuburb);

  // ❌ Invalid if region/suburb exist without state
  if (!validLocationCombo && (hasRegion || hasSuburb)) {
    notFound();
  }

  // ✅ Convert page param safely
  const pageParam = resolvedSearchParams.page;
  const page =
    typeof pageParam === "string"
      ? parseInt(pageParam, 10)
      : Array.isArray(pageParam)
        ? parseInt(pageParam[0] || "1", 10)
        : undefined;

  // ✅ Fetch listings
  const response = await fetchListings({ ...filters, page });

  if (
    !response ||
    // response.success === false ||
    (response.message &&
      response.message.toLowerCase().includes("validation failed")) ||
    (Array.isArray(response.errors) &&
      response.errors.some((e) =>
        e.toLowerCase().includes("invalid make")
      ))
  ) {
    notFound();
  }

  return <ListingsPage {...filters} initialData={response} />;
}