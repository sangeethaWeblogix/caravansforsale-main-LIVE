import type { Metadata } from "next";
import StateHome from "../home";
import { parseDemoFilters } from "../urlUtils";
import { metaFromSlug } from "@/utils/seo/meta";
import { fetchBrowseSectionData } from "../fetchBrowseSectionData";
import "../../globals.css";

export const revalidate = 86400;

type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Canonical, robots, description, og:*, and twitter:* for /listings/<slug>/
// pages are injected as literal JSX in the root layout (src/app/layout.tsx)
// instead of here, to dodge the Next.js streaming bug where an async
// generateMetadata's tags can land after <head> closes — so deep slugs only
// return `title`. The bare /listings/ root is skipped by that root-layout
// JSX (see `isListingSlug` there), so it needs the full object here. Keep
// this pure computation (metaFromSlug only, no API calls) either way.
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const slugArr = slug ?? [];
  const meta = await metaFromSlug(slugArr, query);
  return slugArr.length === 0 ? meta : { title: meta.title };
}

export default async function LocationStateDemoPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const initialFilters = parseDemoFilters(slug ?? [], query);
  console.log("[listings/[[...slug]]/page.tsx] slug:", slug, "query:", query, "initialFilters:", initialFilters);

  const browseData = await fetchBrowseSectionData(initialFilters);

  return <StateHome initialFilters={initialFilters} browseData={browseData} />;
}
