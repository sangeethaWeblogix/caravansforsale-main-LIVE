import type { Metadata } from "next";
import DeatilsPage from "./details";
import RelatedNews from "./RelatedNews";
import FaqSection from "./FaqSection";
import "./details.css";
import { Card } from "@mui/material";
import Thankyou from "./ThankYou";
type RouteParams = { slug: string };
type PageProps = { params: Promise<RouteParams> };

async function fetchBlogDetail(slug: string) {
  const res = await fetch(
    `https://www.admin.caravansforsale.com.au/wp-json/cfs/v1/blog-detail/${encodeURIComponent(
      slug
    )}`,
    { cache: "no-store", headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error("Failed to load blog detail");
  return res.json();
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

  return {
    title,
    description,
    robots,
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

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  if (slug.startsWith("thank-you-")) {
    return (
      <Card>
        <Thankyou />
        {/* <CardContent className="container text-center py-10">
          <h1>
            🎉 Thank You for submiting your information with
            caravansforsale.com.au!
          </h1>
          <Typography>Your enquiry has been submitted successfully.</Typography>
          <p> Your caravan dealer will contact you as soon as possible </p>
        </CardContent> */}
      </Card>
    );
  }
  const data = await fetchBlogDetail(slug);

  console.log("dataaaaa", data);

  const hasRelatedBlogs =
    Array.isArray(data?.data?.related_blogs) &&
    data.data.related_blogs.length > 0;
  console.log("dataaaaahasRelatedBlogs", hasRelatedBlogs);

  // FAQ check
  const hasFaqs =
    Array.isArray(data?.messages?.faq) && data.messages.faq.length > 0;

  return (
    <div>
      <DeatilsPage data={data} />

      {/* ✅ Pass only the FAQ array */}
      {hasFaqs && <FaqSection faqs={data.messages.faq} />}

      {/* ✅ Pass only the related blogs array */}
      {hasRelatedBlogs && <RelatedNews blogs={data.data.related_blogs} />}
    </div>
  );
}
