"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchHomePage, type HomeBlogPost } from "@/api/home/api";
import { formatPostDate } from "@/utils/date";
import { toSlug } from "@/utils/seo/slug";
import BlogCardSkeleton from "./components/homeBlogSkelton";

interface BlogPost extends HomeBlogPost {
  // ensure fields you use are present
  id: number;
  title: string;
  image: string;
  slug: string;
  date?: string;
  excerpt?: string;
  link?: string;
}

export default function HomeLatestBlogs() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    fetchHomePage()
      .then(({ latest_posts }) => {
        if (!mounted) return;
        // keep only posts that have essentials
        const items = (latest_posts ?? []).filter(
          (p): p is BlogPost => !!p && !!p.id && !!p.title && !!p.slug
        );
        setBlogPosts(items);
      })
      .catch((err) => {
        console.error("[home_page] latest_posts error:", err);
        setBlogPosts([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const getHref = (p: BlogPost) => {
    const slug = p.slug?.trim() || toSlug(p.title || "post");
    return `/blog/${slug}/`;
  };

  return (
    <section className="related-products latest_blog section-padding blog style-8">
      <div className="container">
        <div className="title">
          <div className="tpof_tab">
            <h3>Latest News, Reviews &amp; Advice</h3>
            <div className="viewall_bttn">
              <Link href="/blog/">
                <i className="bi bi-chevron-right" />
              </Link>
            </div>
          </div>
        </div>

        <div className="content">
          {loading ? (
            <div className="row">
              {[...Array(3)].map((_, i) => (
                <BlogCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="blog-content">
              <div className="row">
                {blogPosts.map((post) => {
                  const href = getHref(post);
                  return (
                    <div className="col-lg-4" key={post.id}>
                      <div className="side-posts">
                        <div className="item">
                          <div className="img img-cover">
                            {post.image && (
                              <Image
                                src={post.image}
                                alt={post.title}
                                width={300}
                                height={200}
                                unoptimized
                                priority
                              />
                            )}
                          </div>
                          <div className="info">
                            <h4 className="title">
                              <Link href={href} scroll>
                                {post.title}
                              </Link>
                            </h4>
                            <div className="date-author">
                              <Link href={href} scroll className="date">
                                {formatPostDate(post.date ?? "")}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!blogPosts.length && (
                  <div className="col-12 py-3 text-muted">No posts found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
