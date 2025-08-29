export const dynamic = "force-dynamic";

import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import type { Metadata } from "next";

type Params = { slug?: string[] };
type SearchParams = Record<string, string | string[] | undefined>;

// Generate metadata (SEO)
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams; // ✅ no Promise
}): Promise<Metadata> {
  return metaFromSlug(params.slug || [], searchParams);
}
// Main Listings page
export default async function Listings({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<SearchParams>; // ✅ same here
}) {
  const sp = await searchParams; // ✅ await once
  const { slug = [] } = params;

  const filters = parseSlugToFilters(slug, sp);

  const paged = Array.isArray(sp?.paged) ? sp.paged[0] : sp?.paged ?? "1";

  return <ListingsPage {...filters} page={paged} />;
}
