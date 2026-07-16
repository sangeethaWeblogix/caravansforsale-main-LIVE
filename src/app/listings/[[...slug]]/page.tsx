import type { Metadata } from "next";
import StateHome from "../home";
import { parseDemoFilters } from "../urlUtils";
import { metaFromSlug } from "@/utils/seo/meta";
import { fetchBrowseSectionData } from "../fetchBrowseSectionData";
import { fetchInitialPool } from "../fetchInitialPool";
import "../../globals.css";

export const revalidate = 86400;

type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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

  const [browseData, initialPool] = await Promise.all([
    fetchBrowseSectionData(initialFilters),
    fetchInitialPool(initialFilters),
  ]);

  return <StateHome initialFilters={initialFilters} browseData={browseData} initialPool={initialPool} />;
}
