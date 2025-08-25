 // src/app/blog/page/[page]/page.tsx
"use client";
export const dynamic = "force-dynamic";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchBlogs, type BlogPost, type BlogPageResult } from "@/api/blog/api";
import { formatPostDate } from "@/utils/date";
import { toSlug } from "@/utils/seo/slug";

// Build compact page list like [1, '…', 8, 9, 10, 11, 12, '…', 35]
function buildPageList(current: number, total: number, delta = 2) {
  const pages: (number | string)[] = [];
  const range: number[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  range.push(1);
  for (let i = left; i <= right; i++) range.push(i);
  if (total > 1) range.push(total);
  let last = 0;
  for (const p of range) {
    if (last && p - last > 1) pages.push("…");
    pages.push(p);
    last = p;
  }
  return pages;
}

export default function BlogPage() {
  const router = useRouter();
  const params = useParams<{ page?: string }>();
  const initialPage = Math.max(1, Number(params?.page || 1));

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // React to route segment changes (back/forward, manual URL input)
  useEffect(() => {
    const urlPage = Math.max(1, Number(params?.page || 1));
    setCurrentPage((prev) => (prev === urlPage ? prev : urlPage));
    if (params?.page === "1") router.replace("/blog/", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.page]);

  // Fetch for currentPage
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchBlogs(currentPage)
      .then((res: BlogPageResult) => {
        if (!mounted) return;
        setBlogPosts(res.items);
        setTotalPages(res.totalPages);
        if (res.currentPage !== currentPage) {
          // API corrected page bounds (e.g., > totalPages)
          router.replace(`/blog/page/${res.currentPage}/`, { scroll: false });
          setCurrentPage(res.currentPage);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setBlogPosts([]);
        setTotalPages(1);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [currentPage, router]);

  const pages = useMemo(
    () => buildPageList(currentPage, totalPages, 2),
    [currentPage, totalPages]
  );

  const getHref = (p: BlogPost) => {
    const slug = (p.slug ?? "").trim() || toSlug(p.title ?? "");
    return slug ? `/blog/${slug}/` : "#";
  };

 const prevUrl = currentPage <= 2 ? "/blog/" : `/blog/page/${currentPage - 1}/`;
  const nextUrl = `/blog/page/${Math.min(totalPages, currentPage + 1)}/`;

  return (
    <div className="blog-page style-5">
      <section className="all-news bg-light-gray blog-listing section-padding blog bg-transparent style-3">
        <div className="container">
          <div className="section-head mb-60 style-5">
            <h2>Valuable News, Reviews &amp; Advice From Caravan Marketplace</h2>
          </div>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              {loading && <div className="text-center py-5">Loading posts…</div>}

              {!loading && blogPosts.length === 0 && (
                <div className="text-center py-5">No posts found.</div>
              )}

              {!loading &&
                blogPosts.map((post, index) => {
                  const href = getHref(post);
                  return (
                    <div
                      key={`${post.id ?? index}-${currentPage}`}
                      className="card border-0 bg-transparent rounded-0 border-bottom brd-gray pb-30 mb-30"
                    >
                      <div className="row">
                        <div className="col-lg-5">
                          <div className="img img-cover">
                            <Link href={href}>
                              <Image
                                src={post.image}
                                alt={post.title}
                                width={1024}
                                height={683}
                                className="w-100 h-auto"
                              />
                            </Link>
                          </div>
                        </div>
                        <div className="col-lg-7">
                          <div className="card-body p-0">
                            <small className="d-block date text">
                              <Link href={href} className="op-8">
                                {formatPostDate(post.date)}
                              </Link>
                            </small>
                            <Link href={href} className="card-title mb-10">
                              {post.title}
                            </Link>
                            <p>{post.excerpt}</p>
                            <Link
                              href={href}
                              className="btn rounded-pill bg-blue4 fw-bold text-white mt-10"
                            >
                              <small> Read More </small>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <nav
                  className="pagination style-5 color-4 justify-content-center mt-20 d-flex align-items-center gap-2 flex-wrap"
                  aria-label="Blog pagination"
                >
                  {/* Prev */}
                  {currentPage > 1 ? (
                    <Link
                      href={prevUrl}
                      className="prev page-numbers px-3 py-1 border rounded"
                    >
                      « prev
                    </Link>
                  ) : (
                    <span className="prev page-numbers px-3 py-1 border rounded disabled opacity-50">
                      « prev
                    </span>
                  )}

                  {/* Numbered */}
                  {pages.map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-2">
                        …
                      </span>
                    ) : (
                      <Link
                        key={`page-${p}`}href={p === 1 ? "/blog/" : `/blog/page/${p}/`}
                        aria-current={p === currentPage ? "page" : undefined}
                        className={`page-numbers px-3 py-1 border rounded ${
                          p === currentPage ? "current fw-bold" : ""
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}

                  {/* Next */}
                  {currentPage < totalPages ? (
                    <Link
                      href={nextUrl}
                      className="next page-numbers px-3 py-1 border rounded"
                    >
                      next »
                    </Link>
                  ) : (
                    <span className="next page-numbers px-3 py-1 border rounded disabled opacity-50">
                      next »
                    </span>
                  )}
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
