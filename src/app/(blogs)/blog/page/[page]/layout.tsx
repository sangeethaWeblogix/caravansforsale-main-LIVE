import Blogs from "./page";
import "../../../blog/blog.css";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "Latest News, Reviews & Advice";
  const metaDescription =
    "Latest news, in-depth reviews, and expert advice on the latest in the caravan market. Stay informed and make smarter decisions.";

  const robots = "index, follow";

  return {
    title: metaTitle,
    description: metaDescription,
    robots: robots,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
    },
  };
}
export const revalidate = 60; // ISR: refresh every 60s

export default async function BlogPage() {
  // Your Blogs component should fetch page=1 by default
  return <Blogs />;
}
