import { metaFromSlug } from "@/utils/seo/metaFromSlug";
import { Metadata } from "next";
import { ReactNode } from "react";

type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Generate metadata (SEO)
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  // Await the params and searchParams
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  return metaFromSlug(resolvedParams.slug || [], resolvedSearchParams);
}

export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
