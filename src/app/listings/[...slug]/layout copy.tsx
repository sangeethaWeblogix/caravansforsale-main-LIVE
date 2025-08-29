// src/app/listings/[...slug]/layout.tsx
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug = [] } = await params;

  const [
    categorySlug,
    makeSlug,
    from_price,
    to_price,
    minKg,
    maxKg,
    condition,
    sleeps,
    state,
    region,
    suburb,
    acustom_fromyears,
    acustom_toyears,
    from_length,
    to_length,
    model,
    postcode,
    orderby,
    atm,
    radius_kms,
    search,
  ] = slug;

  const filters: {
    page?: number;
    category?: string;
    make?: string;
    from_price?: string;
    to_price?: string;
    minKg?: string;
    maxKg?: string;
    condition?: string;
    sleeps?: string;
    state?: string;
    region?: string;
    suburb?: string;
    acustom_fromyears?: string;
    acustom_toyears?: string;
    from_length?: string;
    to_length?: string;
    model?: string;
    postcode?: string;
    orderby?: string;
    atm?: string;
    radius_kms?: number | string;
    search?: string;
    keyword?: string;
  } = {
    page: 1,
    category: categorySlug,
    make: makeSlug,
    from_price,
    to_price,
    minKg,
    maxKg,
    condition,
    sleeps,
    state,
    region,
    suburb,
    acustom_fromyears,
    acustom_toyears,
    from_length,
    to_length,
    model,
    postcode,
    orderby,
    atm,
    radius_kms,
    search,
  };
  const qs = new URLSearchParams();
  qs.append("page", String(filters.page ?? 1));
  if (filters.category) qs.append("category", filters.category);
  if (filters.radius_kms) qs.append("radius_kms", String(filters.radius_kms));
  if (filters.make) qs.append("make", filters.make);
  if (filters.orderby) qs.append("orderby", filters.orderby);
  if (filters.postcode) qs.append("pincode", filters.postcode);
  if (filters.state) qs.append("state", filters.state);
  if (filters.region) qs.append("region", filters.region);
  if (filters.suburb) qs.append("suburb", filters.suburb);
  if (filters.from_price) qs.append("from_price", `${filters.from_price}`);
  if (filters.to_price) qs.append("to_price", `${filters.to_price}`);
  if (filters.minKg) qs.append("from_atm", `${filters.minKg}kg`);
  if (filters.maxKg) qs.append("to_atm", `${filters.maxKg}kg`);
  if (filters.from_length) qs.append("from_length", `${filters.from_length}`);
  if (filters.to_length) qs.append("to_length", `${filters.to_length}`);
  if (filters.acustom_fromyears)
    qs.append("acustom_fromyears", filters.acustom_fromyears);
  if (filters.acustom_toyears)
    qs.append("acustom_toyears", filters.acustom_toyears);
  if (filters.model) qs.append("model", filters.model);
  if (filters.search) qs.append("search", filters.search);

  if (filters.condition)
    qs.append(
      "condition",
      filters.condition.toLowerCase().replace(/\s+/g, "-")
    );
  if (filters.sleeps) qs.append("sleep", filters.sleeps);

  const url = `https://www.admin.caravansforsale.com.au/wp-json/cfs/v1/new-list?${qs.toString()}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const statusInfo = `${res.status} ${res.statusText}`;
    // const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    if (!res.ok) throw new Error(`HTTP error: ${statusInfo}`);

    const parsed = /^\s*[{[]/.test(raw) ? JSON.parse(raw) : null;

    type SEO = {
      metatitle?: string;
      metadescription?: string;
      index?: "index" | "noindex";
    };

    let seo: SEO | null = null;
    if (parsed && typeof parsed === "object") {
      const parsedWithSeo = parsed as { seo?: SEO | { seo?: SEO } };

      const maybeSeo = parsedWithSeo.seo;
      if (maybeSeo && typeof maybeSeo === "object") {
        // if the API nests as seo.seo, unwrap it; else use seo directly
        if (maybeSeo && typeof maybeSeo === "object" && "seo" in maybeSeo) {
          const innerSeo = (maybeSeo as { seo?: SEO }).seo;
          seo = innerSeo ?? (maybeSeo as SEO);
        } else {
          seo = maybeSeo as SEO;
        }
      }
    }
    const rawIndex = (seo?.index ?? "").trim().toLowerCase(); // "", "index", "noindex"/"no-index"
    const normIndex = rawIndex === "no-index" ? "noindex" : rawIndex;

    // console.log("[SEO] api.index (raw):", seo?.index ?? "");
    // console.log("[SEO] index.normalized:", normIndex || "(empty)");

    // map to Next robots
    const robots =
      normIndex === "noindex"
        ? { index: false, follow: false } // → <meta name="robots" content="noindex, nofollow">
        : { index: true, follow: true }; // → <meta name="robots" content="index, follow">

    // console.log(
    //   "[SEO] robots tag:",
    //   robots.index ? "index, follow" : "noindex, nofollow"
    // );

    // // log metatitle after index
    // if (seo?.metatitle) console.log("[SEO] metatitle:", seo.metatitle);

    const title = seo?.metatitle || "Caravans for Sale";
    const description =
      seo?.metadescription || "Browse the latest caravans available for sale.";

    // ▶ map "index" / "no-index" to Next.js robots metadata

    return {
      title: { absolute: title },
      description,
      robots,
      openGraph: { title, description },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch (err) {
    console.error("[SEO] Failed to build metadata:", err);
    const title = "Caravans for Sale";
    const description = "Browse the latest caravans available for sale.";
    return {
      title: { absolute: title },
      description,
      keywords: "caravans, trailers, new caravans, used caravans",
      openGraph: {
        title,
        description,
        images: [{ url: "/default-image.jpg" }],
      },
      twitter: { card: "summary_large_image", title, description },
    };
  }
}

/* --------------------------------- Layout --------------------------------- */
export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
