 "use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Swiper-ஐ dynamic import பண்ணி SSR avoid பண்ணணும் (important for production)
const SwiperComponent = dynamic(() => import("swiper/react").then(mod => mod.Swiper), { ssr: false });
const SwiperSlide = dynamic(() => import("swiper/react").then(mod => mod.SwiperSlide), { ssr: false });

import { Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import { fetchRequirements, Requirement } from "@/api/postRquirements/api";

const PostRequirement = () => {
  const [items, setItems] = useState<Requirement[]>([]);
  const swiperRef = useRef<SwiperType | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // hydration fix

    (async () => {
      try {
        const data = await fetchRequirements();
        setItems(data);
      } catch (err) {
        console.error("Failed to fetch requirements:", err);
      }
    })();
  }, []);

  // Autoplay safely start (ஒரே ஒரு முறை மட்டும்!)
  useEffect(() => {
    if (!swiperRef.current || items.length === 0) return;

    const timer = setTimeout(() => {
      swiperRef.current?.autoplay?.start();
    }, 500);

    return () => clearTimeout(timer);
  }, [items]);

  const handleMouseEnter = () => swiperRef.current?.autoplay?.stop();
  const handleMouseLeave = () => swiperRef.current?.autoplay?.start();

  // If not client yet, show loading or empty
  if (!isClient) return null;

  return (
    <div className="container">
      <div className="post_bgs">
        <div className="row align-items-center">
          {/* LEFT SIDE */}
          <div className="col-lg-6">
            <div className="home-post_head">
              <h2>
                <span>Find Your Ideal Caravan</span>
                <br />– Post Your Requirements
              </h2>
              <p>
                Tell us what you&apos;re looking for and we&apos;ll match you with the right caravan...
              </p>
            </div>
            <div className="final_post_btn">
              <Link href="/caravan-enquiry-form/" className="btn">
                Post Your Requirements
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE - SWIPER */}
          <div className="col-lg-6">
            <div
              className="home-post__items info top_cta_container"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="top_cta bg-white">
                {items.length > 0 ? (
                  <SwiperComponent
                    modules={[Autoplay, Pagination]}
                    spaceBetween={20}
                    slidesPerView={1}
                    loop={true}
                    speed={800}
                    autoplay={{
                      delay: 4000,
                      disableOnInteraction: false, // இது important - swipe பண்ணாலும் autoplay stop ஆகாது
                      pauseOnMouseEnter: true,
                    }}
                    pagination={{ 
                      clickable: true,
                      dynamicBullets: true 
                    }}
                    breakpoints={{
                      768: { slidesPerView: 1 },
                      1024: { slidesPerView: 1 },
                    }}
                    onSwiper={(swiper) => {
                      swiperRef.current = swiper;
                    }}
                    className="homepost-swiper"
                    allowTouchMove={true} // இதை explicit-ஆ கொடுக்கணும் production-ல
                  >
                    {items.map((item, index) => (
                      <SwiperSlide key={item.id || index}>
                        <div className="post_flip">
                          <div className="home-post__item">
                            <div className="fet_feild">
                              <div className="type pst_table">
                                <span className="slugn">Type</span> {item.type}
                              </div>
                              <div className="condition pst_table">
                                <span className="slugn">Condition</span> {item.condition}
                              </div>
                              <div className="status pst_table">
                                <span className="slugn">Status</span>{" "}
                                {item.active === "1" ? "Active" : "Inactive"}
                              </div>
                              <div className="location pst_table">
                                <span className="slugn">Location</span> {item.location}
                              </div>
                            </div>

                            <div className="requirements">{item.requirements}</div>

                            <div className="budget">
                              <span className="slugn">Budget</span>
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 0,
                              }).format(Number(item.budget))}
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                  </SwiperComponent>
                ) : (
                  <div className="text-center py-5">Loading requirements...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default PostRequirement;