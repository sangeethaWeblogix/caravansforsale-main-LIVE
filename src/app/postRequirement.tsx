"use client";
import React, { useEffect, useState, useRef  } from "react";
import { fetchRequirements, Requirement } from "@/api/postRquirements/api";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const PostRequirement = () => {
  const [items, setItems] = useState<Requirement[]>([]);
  const swiperRef = useRef(null);

  useEffect(() => {
    // Ensure autoplay starts after mount
    if (swiperRef.current) {
      swiperRef.current.autoplay.start();
    }
  }, []);

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

  return (
    <div>
      <div className="container">
        <div className="post_bgs">
          <div className="row align-items-center ">
            <div className="col-lg-6">
              <div className="home-post_head">
                <h2>
                  <span>Find Your Ideal Caravan</span><br></br>– Post Your Requirements
                </h2>
                <p>
                  Tell us what you&apos;re looking for and we&apos;ll match you with
                  the right caravan for sale, from trusted dealers at a fair price.
                  Make sure your budget and expectations are realistic to help us
                  deliver the best possible outcome. See some examples of what other
                  caravan buyers are looking for.
                </p>
              </div>



              <div className="final_post_btn">
                <Link href="/caravan-enquiry-form/" className="btn">
                  Post Your Requirements
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="home-post__items info top_cta_container">
                <div className="top_cta bg-white">

                  {/* Swiper Slider */}
                  <Swiper
                    modules={[Autoplay, Pagination]}
                    spaceBetween={20}
                    slidesPerView={1}
                    pagination={{ clickable: true }}
                    autoplay={{
                      delay: 3000,
                      disableOnInteraction: false,
                    }}
                    loop={true}
                    breakpoints={{
                      768: { slidesPerView: 1 },
                      1024: { slidesPerView: 1 },
                    }}
                    onSwiper={(swiper) => (swiperRef.current = swiper)}
                    onMouseEnter={() => swiperRef.current?.autoplay.stop()}
                    onMouseLeave={() => swiperRef.current?.autoplay.start()}
                    className="homepost-swiper"
                  >
                    {items.map((item, index) => (
                      <SwiperSlide key={index}>
                        <div className="post_flip">
                          <div className="home-post__item">
                            <div className="fet_feild">
                              <div className="type pst_table">
                                <span className="slugn">Type</span>
                                <Link href={`/listings/${item.type.toLowerCase()}-category/`}>
                                  {item.type}
                                </Link>
                              </div>

                              <div className="condition pst_table">
                                <span className="slugn">Condition</span>
                                <Link
                                  href={`/listings/${item.condition.toLowerCase()}-condition/`}
                                >
                                  {item.condition}
                                </Link>
                              </div>

                              <div className="status pst_table">
                                <span className="slugn">Status</span>
                                {" "}
                                {item.active === "1" ? "Active" : "Inactive"}
                              </div>

                              <div className="location pst_table">
                                <span className="slugn">Location</span>
                                {item.location}
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
                  </Swiper>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostRequirement;
