import type { Metadata } from "next";
import "./details.css";

import { ReactNode } from "react";

type RouteParams = { slug: string };

async function fetchBlogDetail(slug: string) {
  try {
    const res = await fetch(
      `https://www.admin.caravansforsale.com.au/wp-json/cfs/v1/blog-detail/${encodeURIComponent(
        slug
      )}`,
      { cache: "no-store", headers: { Accept: "application/json" } }
    );

    if (!res.ok) {
      return null; // ❌ Don't throw error, return null
    }

    return res.json();
  } catch (error) {
    console.error("Blog fetch error:", error);
    return null; // ❌ Return null on fetch failure
  }
}
// ✅ SEO from product.seo (NO images)
export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug.startsWith("thank-you-")) {
    return {
      title: "Thank You",
      description: "Your enquiry was submitted successfully.",
      robots: "noindex, nofollow",
      alternates: {
        canonical: `https://www.caravansforsale.com.au/${slug}/`,
      },
    };
  }
  const data = await fetchBlogDetail(slug);

  const seo = data?.seo ?? data?.product?.seo ?? {};
  const title =
    seo.metatitle ||
    seo.meta_title ||
    data?.title ||
    data?.name ||
    "Product - Caravans for Sale";

  const description =
    seo.metadescription ||
    seo.meta_description ||
    data?.short_description ||
    "View caravan details.";
  const robots = "index, follow";
  const canonicalUrl = `https://www.caravansforsale.com.au/${slug}/`;

  return {
    title,
    description,
    robots,
    alternates: {
      canonical: canonicalUrl, // ✅ canonical link
    },
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary", // no image card
      title,
      description,
    },
    other: {
      "og:type": "blog",
    },
  };
}

export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
