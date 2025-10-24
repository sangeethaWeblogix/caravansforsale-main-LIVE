import type { Metadata } from "next";
import "./details.css";
import { ReactNode } from "react";

type RouteParams = { slug: string };

async function fetchBlogDetail(slug: string) {
  try {
    const res = await fetch(
      `https://www.admin.caravansforsale.com.au/wp-json/cfs/v1/blog-detail-new/?slug=${encodeURIComponent(
        slug
      )}`,
      { cache: "no-store", headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Blog fetch error:", error);
    return null;
  }
}

// ✅ SEO Metadata (title, description only)
export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchBlogDetail(slug);
  // Format date to "Month DD, YYYY"
  // function formatDate(dateStr?: string) {
  //   const date = new Date(dateStr || Date.now());
  //   return date.toLocaleDateString("en-US", {
  //     year: "numeric",
  //     month: "long",
  //     day: "numeric",
  //   });
  // }

  const seo = data?.seo ?? {};
  const post = data?.data?.blog_detail || {};

  const title = seo.metatitle || post.title || "Caravans for Sale Blog";

  const description =
    seo.metadescription ||
    post.short_description ||
    "Read more on Caravans for Sale.";

  const canonical = `https://www.caravansforsale.com.au/${slug}/`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ✅ Safe JSON encode for script tag
function safeJsonLdString(json: object) {
  return JSON.stringify(json, null, 2).replace(/</g, "\\u003c");
}

// ✅ Layout (renders schema script in <head> SSR)
export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const data = await fetchBlogDetail(slug);
  const post = data?.data?.blog_detail || {};
  const seo = data?.seo || {};

  const canonical = `https://www.caravansforsale.com.au/${slug}/`;

  const title = seo.metatitle || post.title || "Caravans for Sale Blog";

  const description =
    seo.metadescription ||
    post.short_description ||
    "Read more on Caravans for Sale.";

  const bannerImage =
    post.banner_image ||
    post.image ||
    "https://www.caravansforsale.com.au/load.svg";

  // ✅ Build JSON-LD Schema (SSR output)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    headline: title,
    description: description,
    image: bannerImage,
    author: {
      "@type": "Person",
      name: "Tom",
      url: `https://www.caravansforsale.com.au/author/tom/`,
    },
    publisher: {
      "@type": "Organization",
      name: "Caravans for Sale",
      logo: {
        "@type": "ImageObject",
        url: "https://www.caravansforsale.com.au/images/cfs-logo-black.svg",
      },
    },
    datePublished: post.date || new Date().toISOString(),
    dateModified: post.date || new Date().toISOString(),
  };

  return (
    <>
      {/* ✅ JSON-LD structured data in head (will be moved by Next.js) */}
      <script
        type="applicahion/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLdString(jsonLd),
        }}
      />
      <div>{children}</div>
    </>
  );
}
