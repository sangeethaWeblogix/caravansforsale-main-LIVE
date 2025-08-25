"use client";

import { useEffect, useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
//  import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./home.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Link from "next/link";
import Image from "next/image";
import FeaturedSection from "./featured";
import BlogSection from "./blogSection";
import PostRequirement from "./postRequirement";
import Manufactures from "./manufacture";
import SearchSection from "./searchSection";

/* --------------------------------- Page ---------------------------------- */
export default function ProductPage() {
  const [adIndex, setAdIndex] = useState<number>(0);

  const bannerSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    const storedIndex = Number.parseInt(
      window.localStorage.getItem("ad_index") || "0",
      10
    );
    setAdIndex(Number.isFinite(storedIndex) ? storedIndex : 0);

    const container = bannerSectionRef.current;
    if (container) {
      const items = container.querySelectorAll<HTMLElement>(".items");
      const safeIndex =
        items.length > 0 ? Math.min(storedIndex, items.length - 1) : 0;

      items.forEach((item, i) => {
        item.style.display = i === safeIndex ? "block" : "none";
      });

      const modulo = items.length || 4;
      const next = (safeIndex + 1) % modulo;
      window.localStorage.setItem("ad_index", String(next));
    }

    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "auto";
      }
    };
  }, []);

  // Handle banner ad rotation
  useEffect(() => {
    const storedIndex = Number.parseInt(
      localStorage.getItem("ad_index") || "0",
      10
    );
    setAdIndex(Number.isFinite(storedIndex) ? storedIndex : 0);

    const container = bannerSectionRef.current;
    if (container) {
      const items = container.querySelectorAll<HTMLElement>(".items");
      const safeIndex =
        items.length > 0 ? Math.min(storedIndex, items.length - 1) : 0;

      items.forEach((item, i) => {
        item.style.display = i === safeIndex ? "block" : "none";
      });

      // Increment for next load (wrap at items.length or 4 as fallback)
      const modulo = items.length || 4;
      const next = (safeIndex + 1) % modulo;
      localStorage.setItem("ad_index", String(next));
    }

    // Cleanup to restore scroll
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="home_top style-1">
        <SearchSection />
      </section>

      {/* Deal of the Month Section */}
      <section className="deal-of-month product-details section-padding">
        <FeaturedSection />
      </section>
      <section className="post-requirements product-details section-padding">
        <PostRequirement />
      </section>
      {/* Caravans by State Section */}
      <section className="caravans_by_state related-products services section-padding style-1">
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="section-head mb-40">
                <h2>Caravans For Sale by State</h2>
              </div>
            </div>
          </div>

          <div className="content">
            <div className="explore-state position-relative">
              <Swiper
                modules={[Navigation, Autoplay]}
                navigation={{
                  nextEl: ".swiper-button-next-state",
                  prevEl: ".swiper-button-prev-state",
                }}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 1, spaceBetween: 20 },
                  768: { slidesPerView: 2, spaceBetween: 20 },
                  1024: { slidesPerView: 3, spaceBetween: 25 },
                }}
                className="swiper-container"
              >
                {[
                  {
                    state: "Victoria",
                    cities: ["Melbourne", "Geelong", "Ballarat", "Bendigo"],
                    image: "/images/vic_map.svg",
                  },
                  {
                    state: "New South Wales",
                    cities: [
                      "Sydney",
                      "Newcastle",
                      "Central Coast",
                      "Illawarra",
                    ],
                    image: "/images/nsw_map.svg",
                  },
                  {
                    state: "Queensland",
                    cities: [
                      "Brisbane",
                      "Gold Coast",
                      "Sunshine Coast",
                      "Cairns",
                    ],
                    image: "/images/qld_map.svg",
                  },
                  {
                    state: "Western Australia",
                    cities: ["Perth", "Bunbury", "Geraldton", "Albany"],
                    image: "/images/wa_map.svg",
                  },
                  {
                    state: "South Australia",
                    cities: ["Adelaide", "Mount Gambier", "Whyalla"],
                    image: "/images/sa_map.svg",
                  },
                  {
                    state: "Tasmania",
                    cities: ["Hobart", "Launceston", "Devonport", "Burnie"],
                    image: "/images/tas_map.svg",
                  },
                ].map((state, index) => (
                  <SwiperSlide key={index}>
                    <div className="service-box">
                      <div className="sec_left">
                        <h5>{state.state}</h5>
                        <div className="info">
                          <div className="quick_linkss">
                            {state.cities.map((city, i) => (
                              <Link
                                key={i}
                                href={`/listings/${state.state
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}-state/${city
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}-region`}
                              >
                                {city}
                              </Link>
                            ))}
                            <Link
                              className="view_all"
                              href={`/listings/${state.state
                                .toLowerCase()
                                .replace(/\s+/g, "-")}-state/`}
                            >
                              View All <i className="bi bi-chevron-right" />
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="sec_right">
                        <span>
                          <Image
                            src={state.image}
                            alt={`${state.state} map`}
                            width={100}
                            height={100}
                          />
                        </span>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              <div className="swiper-button-next swiper-button-next-state" />
              <div className="swiper-button-prev swiper-button-prev-state" />
            </div>
          </div>

          <div className="banner_ads_ls" ref={bannerSectionRef}>
            {[
              { name: "masterpiece", mobile: "masterpiece-m" },
              { name: "orbit", mobile: "orbitillie-m" },
              { name: "redcenter", mobile: "redcenter-m" },
            ].map((banner, index) => (
              <div
                className="items"
                key={banner.name}
                style={{ display: index === adIndex ? "block" : "none" }}
              >
                <Link href="#" target="_blank">
                  <Image
                    className="hidden-xs"
                    src={`/images/banner_ad_top-${banner.name}.jpg`}
                    alt="banner"
                    width={0}
                    height={0}
                    unoptimized
                    style={{ width: "auto", height: "auto" }}
                  />
                  <Image
                    className="hidden-lg hidden-md hidden-sm"
                    src={`/images/banner_ad_top-${banner.mobile}.jpg`}
                    alt="banner mobile"
                    width={0}
                    height={0}
                    unoptimized
                    style={{ width: "auto", height: "auto" }}
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Caravans by Manufacturer Section */}
      <section className="caravans_by_manufacturer related-products section-padding">
        <Manufactures />
      </section>

      {/* Latest Blog Section */}
      <BlogSection />
      {/* Quick Links Section */}
      <section className="quick-link-home section-padding">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="ordered_list">
                <h2>Browse Caravan Listings</h2>
              </div>

              <div className="modern_links">
                <h3>Size</h3>
                <div className="al-ty-bd">
                  {[
                    12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
                    27, 28,
                  ].map((size, index) => (
                    <span key={index}>
                      <Link
                        href={`/listings/between-${size}-${size}-length-in-feet/`}
                      >
                        {size} ft
                      </Link>
                      {index !== 2 && " | "}
                    </span>
                  ))}
                </div>
              </div>

              <div className="modern_links">
                <h3>Weight</h3>
                <div className="al-ty-bd">
                  {[
                    1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000,
                  ].map((weight, index) => (
                    <span key={index}>
                      <Link href={`/listings/under-${weight}-kg-atm/`}>
                        Under {weight.toLocaleString()} Kg
                      </Link>
                      {index !== 2 && " | "}
                    </span>
                  ))}
                </div>
              </div>

              <div className="modern_links">
                <h3>Sleeping Capacity</h3>
                <div className="al-ty-bd">
                  {[2, 3, 4, 5, 6, 7].map((count, index) => (
                    <span key={index}>
                      <Link
                        href={`/listings/over-${count}-people-sleeping-capacity/`}
                      >
                        Sleeps {count}
                      </Link>
                      {index !== 1 && " | "}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
