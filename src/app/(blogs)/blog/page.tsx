import Blogs from "./page/[page]/page";
import "./blog.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Latest News, Reviews & Advice", template: "%s " },
  description:
    "Latest news, in-depth reviews, and expert advice on the latest in the caravan market. Stay informed and make smarter decisions.",
  icons: { icon: "/favicon.ico" },
  robots: "index, follow",
  alternates: {
    canonical: "https://www.caravansforsale.com.au/blog/",

   },
};

 export const revalidate = 3600; // ISR: refresh every 60s

export default async function BlogPage() {
  // Your Blogs component should fetch page=1 by default
  return <Blogs />;
}
