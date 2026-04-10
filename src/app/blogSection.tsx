"use client";

 import Image from "next/image";
// import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import {  type HomeBlogPost } from "@/api/home/api";
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

interface Props {
  blogPosts : HomeBlogPost[];
}

export default function HomeLatestBlogs({ blogPosts  }: Props) {
   const posts = (blogPosts ?? []).filter(
    (p): p is BlogPost => !!p && !!p.id && !!p.title && !!p.slug
  ); 
  const getHref = (p: BlogPost) => {
    const slug = p.slug?.trim() || toSlug(p.title || "post");
    return `/${slug}/`;
  };
    const loading = posts.length === 0;


  return (
    <section className="related-products latest_blog section-padding blog style-8">
      <div className="container">
        <div className="title">
          <div className="tpof_tab">
            <h3>Latest Blogs</h3>
            <div className="viewall_bttn">
              <a href="/blog/">
                <i className="bi bi-chevron-right" />
              </a>
            </div>
          </div>
        </div>
      
        <div className="content">
          <Swiper
                modules={[Navigation]}
                navigation={{
                  nextEl: ".blog-manu-next",
                  prevEl: ".blog-manu-prev",
                }}
                //autoplay={{ delay: 3000 }}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
              >
          {loading ? (
            <div className="row">
              {[...Array(3)].map((_, i) => (
                <BlogCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="blog-content">
              
                {posts.map((post) => {
                  const href = getHref(post);
                  return (
                    <SwiperSlide key={post.id}>
                      <div className="side-posts">
                        <div className="item">
                     <a href={href} >
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
                              
                                {post.title}
                           
                            </h4>
                            <div className="date-author">
                             
                                {formatPostDate(post.date ?? "")}
                             
                            </div>
                          </div>
                                                                          </a>

                        </div>
                      </div>
                    </SwiperSlide>

                  );
                })}
                {!blogPosts.length && (
                  <div className="col-12 py-3 text-muted">No posts found.</div>

                )}
              
            </div>
          )}
          </Swiper>
        
                {/* Arrows */}
                <div className="swiper-button-next blog-manu-next" />
                <div className="swiper-button-prev blog-manu-prev" />
        </div>

        

      </div>
    </section>
  );
}
