import type { Metadata } from "next";
import DeatilsPage from "./details";
import RelatedNews from "./RelatedNews";
import FaqSection from "./FaqSection";
import "./details.css";
import { Card, CardContent, Typography, Button } from "@mui/material";
import Link from "next/link";
import TickIcon from "../../../public/images/tick.jpg";
import Image from "next/image";
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
      <div
        style={{
          minHeight: "80vh", // keeps space between header and footer
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Card
          sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: 5,
            maxWidth: 500,
            textAlign: "center",
          }}
        >
          <CardContent>
            <div
              style={{
                width: 80,
                height: 80,
                margin: "0 auto 20px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src={TickIcon}
                alt="Success"
                width={40}
                height={40}
                style={{ objectFit: "contain" }}
              />
            </div>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Thank you for submitting your information with{" "}
              <span style={{ color: "#000" }}>caravansforsale.com.au</span>.
            </Typography>

            <Typography variant="body1" color="text.secondary" gutterBottom>
              Your caravan dealer will contact you as soon as possible.
            </Typography>

            <Link href="/" style={{ textDecoration: "none" }}>
              <Button
                variant="contained"
                sx={{
                  mt: 3,
                  backgroundColor: "orange", // Set background to orange
                  color: "white", // Make text white
                  "&:hover": {
                    backgroundColor: "#e69500", // Darker orange on hover
                  },
                }}
              >
                Go back
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
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
