 export const dynamic = "force-dynamic";

import "./details.css";
import { ReactNode } from "react";

type RouteParams = { slug: string };

async function fetchBlogDetail(slug: string) {
  try {
    const res = await fetch(
      `https://www.admin.caravansforsale.com.au/wp-json/cfs/v1/blog-detail-new/?slug=${encodeURIComponent(slug)}`,
      { cache: "no-store", headers: { Accept: "application/json" } }
    );

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: RouteParams;
}) {
  const { slug } = params;

  /** 🛑 STOP BLOG FETCH FOR THANK-YOU PAGES **/
  if (slug.startsWith("thank-you-")) {
    return <>{children}</>;
  }

  /** ✅ SAFE BLOG FETCH FOR NORMAL PAGES **/
  const data = await fetchBlogDetail(slug);

  const post = data?.data?.blog_detail ?? {};
  const seo = data?.seo ?? {};

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
    },
    headline: title,
    description: description,
    image: bannerImage,
    author: {
      "@type": "Person",
      name: "Tom",
    },
    publisher: {
      "@type": "Organization",
      name: "Caravans for Sale",
    },
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
  };

  return (
    <>
      {/* JSON-LD FOR BLOG ONLY */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {children}
    </>
  );
}
