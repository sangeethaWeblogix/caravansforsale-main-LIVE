"use client";
import Image from "next/image";
import { notFound } from "next/navigation";
import FaqSection from "./FaqSection";
import RelatedNews from "./RelatedNews";
import "./details.css";
import { useEffect, useState } from "react";
import { formatPostDate } from "@/utils/date";

type BlogDetail = {
  id: number;
  slug: string;
  title: string;
  date: string;
  banner_image?: string;
  image?: string;
  toc?: string; // HTML
  content?: string; // HTML
};
type FaqItem = {
  heading: string;
  content: string;
};

type RelatedBlog = {
  id: number;
  title: string;
  excerpt: string;
  link: string;
  image?: string;
  imageAlt?: string;
  slug?: string;
};

type BlogDetailResponse = {
  data?: {
    blog_detail?: BlogDetail;
    faq?: FaqItem[];
    related_blogs?: RelatedBlog[];
  };
  seo?: { metatitle?: string; metadescription?: string; index?: string };
};
export default function BlogDetailsPage({
  data,
}: {
  data: BlogDetailResponse;
}) {
  const [tocItems, setTocItems] = useState<Element[]>([]);

  // ✅ Run DOMParser only on client
  const post = data?.data?.blog_detail;
  // console.log("dataaa", post);
  useEffect(() => {
    if (post?.toc) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(post.toc, "text/html");
      const items = Array.from(doc.querySelectorAll("li"));
      setTocItems(items);
    }
  }, [post?.toc]);
  // put this near the top of the file (outside the component)
  const decodeEntities = (s = "") =>
    s
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
        String.fromCharCode(parseInt(h, 16))
      );

  const stripHtml = (s?: string) =>
    (s ?? "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const cleanTitle = (s?: string) => decodeEntities(stripHtml(s));
  const plainTitle = cleanTitle(data?.data?.blog_detail?.title);

  if (!post) {
    notFound();
  }
  const [showFullToc, setShowFullToc] = useState(false);

  return (
    <div className="blog-page style-5 color-4">
      <section className="all-news section-padding pt-50 blog bg-transparent single_blog style-3">
        <div className="container">
          <div className="blog-details-slider mb-30">
            <div className="content-card">
              <div className="img">
                <div className="desktop_image hidden-xs">
                  <Image
                    src={post.banner_image || ""}
                    alt="Desktop Banner"
                    width={0}
                    height={0}
                    className="w-full h-auto"
                    unoptimized
                  />
                </div>
                <div className="mobile_image hidden-lg hidden-md hidden-sm">
                  <Image
                    src={post.image || ""}
                    width={1024}
                    height={683}
                    alt="Mobile Banner"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-9">
              <div className="d-flex small align-items-center justify-content-between mt-10">
                <div className="l_side d-flex align-items-center">
                  <i className="bi bi-clock me-1"></i>

                  <span>{formatPostDate(post.date)}</span>
                </div>
              </div>

              <h1 className="mb-20 mt-10 color-000">{plainTitle}</h1>
              <div className="blog-content-info">
                <div
                  id="ez-toc-container"
                  className="ez-toc-v2_0_69_1 counter-hierarchy ez-toc-counter ez-toc-custom ez-toc-container-direction"
                >
                  <div className="ez-toc-title-container">
                    <p className="ez-toc-title ez-toc-toggle">
                      Table of Contents
                    </p>
                  </div>
                  <div className="toc-container">
                    {tocItems.length > 0 ? (
                      <div className="toc-content">
                        <nav>
                          <ul className="ez-toc-list ez-toc-list-level-1 ">
                            {(showFullToc
                              ? tocItems
                              : tocItems.slice(0, 4)
                            ).map((item, index) => (
                              <li
                                key={index}
                                className="ez-toc-page-1 ez-toc-heading-level-2"
                                dangerouslySetInnerHTML={{
                                  __html: item.innerHTML,
                                }}
                              />
                            ))}
                          </ul>
                        </nav>
                        {tocItems.length > 4 && (
                          <button
                            className="mt-2 text-blue-600 underline more_less"
                            onClick={() => setShowFullToc((prev) => !prev)}
                          >
                            {showFullToc ? (
                              <>
                                Show Less{" "}
                                <i className="bi bi-chevron-up ml-1"></i>
                              </>
                            ) : (
                              <>
                                Show More{" "}
                                <i className="bi bi-chevron-down ml-1"></i>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p>No TOC available</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="blog-content-info toc_hide_details">
                {" "}
                {/* Content goes here: Use dangerouslySetInnerHTML if content is static and trusted */}
                {/* Or convert entire content into JSX/MDX if editable */}
                <div
                  dangerouslySetInnerHTML={{
                    __html: post.content || "<p>No content available</p>",
                  }}
                />
              </div>
            </div>

            <div className="col-lg-3 rightbar-stick">
              <div className="theiaStickySidebar"></div>
            </div>
          </div>
        </div>
      </section>
      <FaqSection data={data?.data?.faq || []} />
      <RelatedNews blogs={data?.data?.related_blogs || []} />
    </div>
  );
}
