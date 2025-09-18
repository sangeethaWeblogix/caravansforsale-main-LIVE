import Blogs from "./page";
import "../../../blog/blog.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latest News, Reviews & Advice",
  description:
    "Latest news, in-depth reviews, and expert advice on the latest in the caravan market. Stay informed and make smarter decisions.",
  robots: "index, follow",
  openGraph: {
    title: "Latest News, Reviews & Advice",
    description:
      "Latest news, in-depth reviews, and expert advice on the latest in the caravan market. Stay informed and make smarter decisions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Latest News, Reviews & Advice",
    description:
      "Latest news, in-depth reviews, and expert advice on the latest in the caravan market. Stay informed and make smarter decisions.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/blog/",
  },
};
export const revalidate = 60; // ISR: refresh every 60s

export default async function BlogPage() {
  // Your Blogs component should fetch page=1 by default
  return <Blogs />;
}
