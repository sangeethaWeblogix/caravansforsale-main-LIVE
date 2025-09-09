"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import Link from "next/link";

type BlogPost = {
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  link: string;
};

const blogPosts: BlogPost[] = [
  {
    title: "Best Off Road Caravans 2025: What’s New, Tough, and Worth Your Money",
    excerpt:
      "The demand for off-road caravans is soaring as adventurers seek rugged, reliable, and comfortable homes on wheels...",
    image:
      "https://www.admin.caravansforsale.com.au/wp-content/uploads/2025/06/2-768x512.jpg",
    imageAlt: "Best Off Road Caravans 2025",
    link: "https://www.caravansforsale.com.au/best-off-road-caravans-2025/",
  },
  {
    title: "Best Pop-Top Caravans with Shower & Toilet in Australia for 2025",
    excerpt:
      "Pop-top caravans with a shower and toilet offer the perfect blend of convenience and comfort for travellers...",
    image:
      "https://www.admin.caravansforsale.com.au/wp-content/uploads/2025/06/A-Comprehensive-Guide-to-Pop-Top-Caravans-with-Shower-Toilet_Mobile--768x512.jpg",
    imageAlt: "Best Pop-Top Caravans with Shower & Toilet",
    link: "https://www.caravansforsale.com.au/pop-top-caravans-with-shower-and-toilet/",
  },
  {
    title: "Best Caravans for Couples in Australia: A Complete Guide for 2025",
    excerpt:
      "Finding the best caravans for couples means balancing comfort, space, and adventure-ready features...",
    image:
      "https://www.admin.caravansforsale.com.au/wp-content/uploads/2025/06/Best-Caravans-for-Couples-in-Australia-A-Complete-Guide-for-2025_mobile1-768x512.jpg",
    imageAlt: "Best Caravans for Couples",
    link: "https://www.caravansforsale.com.au/best-caravans-for-couples-australia/",
  },
  {
    title: "Best Off Road Caravans 2025: What’s New, Tough, and Worth Your Money",
    excerpt:
      "The demand for off-road caravans is soaring as adventurers seek rugged, reliable, and comfortable homes on wheels...",
    image:
      "https://www.admin.caravansforsale.com.au/wp-content/uploads/2025/06/2-768x512.jpg",
    imageAlt: "Best Off Road Caravans 2025",
    link: "https://www.caravansforsale.com.au/best-off-road-caravans-2025/",
  },
  {
    title: "Best Pop-Top Caravans with Shower & Toilet in Australia for 2025",
    excerpt:
      "Pop-top caravans with a shower and toilet offer the perfect blend of convenience and comfort for travellers...",
    image:
      "https://www.admin.caravansforsale.com.au/wp-content/uploads/2025/06/A-Comprehensive-Guide-to-Pop-Top-Caravans-with-Shower-Toilet_Mobile--768x512.jpg",
    imageAlt: "Best Pop-Top Caravans with Shower & Toilet",
    link: "https://www.caravansforsale.com.au/pop-top-caravans-with-shower-and-toilet/",
  },
  {
    title: "Best Caravans for Couples in Australia: A Complete Guide for 2025",
    excerpt:
      "Finding the best caravans for couples means balancing comfort, space, and adventure-ready features...",
    image:
      "https://www.admin.caravansforsale.com.au/wp-content/uploads/2025/06/Best-Caravans-for-Couples-in-Australia-A-Complete-Guide-for-2025_mobile1-768x512.jpg",
    imageAlt: "Best Caravans for Couples",
    link: "https://www.caravansforsale.com.au/best-caravans-for-couples-australia/",
  },
  // ➝ Add more blog posts here
];

export default function LatestBlog() {
  return (
    <div
      className="related-products latest_blog section-padding"
      style={{ position: "relative", zIndex: 0, background: "#f1f1f1" }}
    >
      <div className="container">
        {/* Title */}
        <div className="title">
          <div className="tpof_tab flex items-center justify-between">
            <h3 className="text-xl font-bold">
              Alternatives to Semi Off Road Caravans
            </h3>
            <div className="viewall_bttn">
              <Link href="https://www.caravansforsale.com.au/blog/">
                <i className="bi bi-chevron-right"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* Swiper Slider */}
        <div className="related-products-slider position-relative mt-6">
          <Swiper
            modules={[Navigation]}
            navigation={{
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            }}
            spaceBetween={24}
            slidesPerView={4}
            breakpoints={{
              320: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 4 },
            }}
          >
            {blogPosts.map((post, index) => (
              <SwiperSlide key={index}>
                <Link href={post.link}>
                  <div className="product-card">
                    <div className="img">
                      <Image
                        src={post.image}
                        alt={post.imageAlt}
                        fill
                        className=""
                      />
                    </div>
                    <div className="product_de">
                      <div className="info">
                        <h5 className="title">
                          {post.title}
                        </h5>
                        <p>{post.excerpt}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation buttons */}
          <div className="swiper-button-next"></div>
          <div className="swiper-button-prev"></div>
        </div>
      </div>
    </div>
  );
}
