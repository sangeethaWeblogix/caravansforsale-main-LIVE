"use client";

 import Image from "next/image";
// import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { useState, useEffect } from "react";
import { formatPostDate } from "@/utils/date";
import { toSlug } from "@/utils/seo/slug";
import BlogCardSkeleton from "./components/homeBlogSkelton";

interface BlogPost {
  id: number;
  title: string;
  image: string;
  slug: string;
  date?: string;
  excerpt?: string;
  link?: string;
}

export default function HomeLatestBlogs() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/home-blogs")
      .then(r => r.ok ? r.json() : [])
      .then((items: BlogPost[]) => {
        setPosts(items.filter(p => !!p?.id && !!p?.title && !!p?.slug));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const getHref = (p: BlogPost) => {
    const slug = p.slug?.trim() || toSlug(p.title || "post");
    return `/${slug}/`;
  };
  const loading = !loaded;


  return (
    <section className="related-products latest_blog section-padding blog style-8">
      <div className="container">
        <div className="title">
          <div className="tpof_tab">
            <h2 className="hd-section-title">Latest Caravans for Sale Blogs & Advice</h2>
            <div className="viewall_bttn">
              <a href="/blog/">
                <i className="bi bi-chevron-right" />
              </a>
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
            <div className="position-relative">
              <Swiper
                modules={[Navigation]}
                navigation={{
                  nextEl: ".blog-manu-next",
                  prevEl: ".blog-manu-prev",
                }}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
              >
                {posts.map((post) => {
                  const href = getHref(post);
                  return (
                    <SwiperSlide key={post.id}>
                      <a href={href} className="blog-card">
                        <div className="blog-card__img">
                          {post.image && (
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              style={{ objectFit: "cover" }}
                              sizes="(max-width: 768px) 100vw, 33vw"
                              priority
                            />
                          )}
                        </div>
                        <div className="blog-card__info">
                          <h3 className="blog-card__title">{post.title}</h3>
                          <div className="blog-card__date">
                            {formatPostDate(post.date ?? "")}
                          </div>
                        </div>
                      </a>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
              <div className="swiper-button-next blog-manu-next" />
              <div className="swiper-button-prev blog-manu-prev" />
            </div>
          )}
        </div>

        

      </div>
    </section>
  );
}
