import type { Metadata } from "next";
import Script from "next/script";
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
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Blog fetch error:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchBlogDetail(slug);

  const seo = data?.seo ?? {};
  const title =
    seo.metatitle || data?.data?.blog_detail?.title || "Caravans for Sale Blog";
  const description =
    seo.metadescription ||
    data?.data?.blog_detail?.short_description ||
    "Read more on Caravans for Sale.";

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.caravansforsale.com.au/${slug}/`,
    },
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
  };
}

function safeJsonLdString(json: object) {
  return JSON.stringify(json).replace(/</g, "\\u003c");
}

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const data = await fetchBlogDetail(slug);
  if (!data) return <div>{children}</div>;

  // ✅ Dynamic fields
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
      url: canonical,
    },
    headline: title,
    description: description,
    image: [bannerImage],
    author: {
      "@type": "Person",
      name: post.author || "Caravans for Sale",
      url: canonical,
    },
    publisher: {
      "@type": "Organization",
      name: "Caravans for Sale",
      logo: {
        "@type": "ImageObject",
        url: "https://www.caravansforsale.com.au/images/cfs-logo-black.svg",
      },
      favicon: "https://www.caravansforsale.com.au/favicon.ico",
    },
    datePublished: post.date || new Date().toISOString(),
    dateModified: post.date || new Date().toISOString(),
  };

  return (
    <>
      <Script
        id="blog-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: safeJsonLdString(jsonLd),
        }}
      />
      <div>{children}</div>
    </>
  );
}
