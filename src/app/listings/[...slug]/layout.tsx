// src/app/listings/[...slug]/layout.tsx
import { metaFromSlug } from "@/utils/seo/metaFromSlug";
import type { Metadata } from "next";
import { ReactNode } from "react";

/* ---------------------------------- Types --------------------------------- */

// type SlugParams = { slug?: string[] };
// type MaybePromise<T> = T | Promise<T>;

// type SeoShape = {
//   metatitle?: string;
//   metadescription?: string;
// };

/* ------------------------------ Helper: parse ----------------------------- */

// function isRecord(v: unknown): v is Record<string, unknown> {
//   return typeof v === "object" && v !== null;
// }

// function getString(v: unknown): string | undefined {
//   return typeof v === "string" ? v : undefined;
// }

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

/* --------------------------------- Layout --------------------------------- */
export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
