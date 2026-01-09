 export const dynamic = "force-dynamic";

import { Metadata } from "next";
import "./details.css";
import { ReactNode } from "react";
import Thankyou from './ThankYouClient '
type RouteParams = { slug: string };

async function fetchBlogDetail(slug: string) {
  try {
    const res = await fetch(
      `https://admin.caravansforsale.com.au/wp-json/cfs/v1/blog-detail-new/?slug=${encodeURIComponent(slug)}`,
      { cache: "no-store", headers: { Accept: "application/json" } }
    );

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;

    if (slug.startsWith("thank-you-")) {
    return {
      title: "Thank You",
      description: "Thank you for submitting your form.",
    };
  }
  const data = await fetchBlogDetail(slug);
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

 
function safeJsonLdString(json: object) {
  return JSON.stringify(json, null, 2).replace(/</g, "\\u003c");
}


export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<RouteParams>;
}) {
     const { slug } = await params;


  /** 🛑 STOP BLOG FETCH FOR THANK-YOU PAGES **/
  if (slug.startsWith("thank-you-")) {
    return <div>
      <Thankyou  />
    </div>;
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
   datePublished: post.date
      ? new Date(post.date).toISOString()
      : new Date().toISOString(),
    dateModified: post.date
      ? new Date(post.date).toISOString()
      : new Date().toISOString(),
  };

  return (
    <>
      {/* JSON-LD FOR BLOG ONLY */}
     <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLdString(jsonLd),
        }}
      />
 <div>{children}</div>    </>
  );
}
