"use client";
import React, { useEffect, useState } from "react";
import { fetchRequirements, Requirement } from "@/api/postRquirements/api";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules"; // ✅ import autoplay
import "swiper/css";
import "swiper/css/pagination"; // ✅ import pagination styles

const PostRequirement = () => {
  const [items, setItems] = useState<Requirement[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchRequirements();
        setItems(data);
      } catch (err) {
        console.error("Failed to fetch requirements:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <div className="container">
        <div className="post_bgs">
          <div className="home-post_head">
            <h2>
              <span>Find Your Ideal Caravan</span> – Post Your Requirements
            </h2>
            <p>
              Tell us what you&apos;re looking for and we&apos;ll match you with
              the right caravan for sale, from trusted dealers at a fair price.
              Make sure your budget and expectations are realistic to help us
              deliver the best possible outcome. See some examples of what other
              caravan buyers are looking for.
            </p>
          </div>

          <div className="home-post__items info top_cta_container">
            <div className="top_cta bg-white">
              {/* ✅ Table header for desktop */}
              {!isMobile && (
                <div className="home_post_middle hidden-xs hidden-sm">
                  <div className="type">Type</div>
                  <div className="condition">Condition</div>
                  <div className="requirements">Requirements</div>
                  <div className="status">Status</div>
                  <div className="location">Location</div>
                  <div className="budget">Budget</div>
                </div>
              )}

              {/* ✅ Mobile view → slider with pagination */}
              {isMobile ? (
                <Swiper
                  spaceBetween={0}
                  slidesPerView={1}
                  pagination={{ clickable: true }}
                  autoplay={{
                    delay: 6000, // ⏱ every 3 seconds
                    disableOnInteraction: false, // keep autoplay after swipe
                  }}
                  modules={[Pagination, Autoplay]}
                >
                  {items.map((item, index) => (
                    <SwiperSlide key={index}>
                      <div className="post_flip">
                        <div className="home-post__item d-flex">
                          <div className="type">
                            <span className="m_label">Type : </span>
                            <Link
                              href={`/listings/${item.type.toLowerCase()}-category/`}
                            >
                              {item.type}
                            </Link>
                          </div>

                          <div className="condition">
                            <span className="m_label">Condition : </span>
                            <Link
                              href={`/listings/${item.condition.toLowerCase()}-condition/`}
                            >
                              {item.condition}
                            </Link>
                          </div>

                          <div className="requirements">
                            <span className="m_label">Requirements : </span>
                            {item.requirements}
                          </div>

                          <div className="status">
                            <span className="m_label">Status : </span>
                            <i className="fa fa-check" />{" "}
                            {item.active === "1" ? "Active" : "Inactive"}
                          </div>

                          <div className="location">
                            <span className="m_label">Location : </span>
                            {item.location}
                          </div>

                          <div className="budget">
                            <span className="m_label">Budget : </span>
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
                </Swiper>
              ) : (
                /* ✅ Desktop normal list */
                items.map((item, index) => (
                  <div className="post_flip" key={index}>
                    <div className="home-post__item d-flex">
                      <div className="type">
                        <Link
                          href={`/listings/${item.type.toLowerCase()}-category/`}
                        >
                          {item.type}
                        </Link>
                      </div>
                      <div className="condition">
                        <Link
                          href={`/listings/${item.condition.toLowerCase()}-condition/`}
                        >
                          {item.condition}
                        </Link>
                      </div>
                      <div className="requirements">{item.requirements}</div>
                      <div className="status">
                        <i className="fa fa-check" />{" "}
                        {item.active === "1" ? "Active" : "Inactive"}
                      </div>
                      <div className="location">{item.location}</div>
                      <div className="budget">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 0,
                        }).format(Number(item.budget))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="final_post_btn">
            <Link href="/caravan-enquiry-form/" className="btn">
              Post Your Requirements
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostRequirement;
