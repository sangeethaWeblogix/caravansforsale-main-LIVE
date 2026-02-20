"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

const FilterSlider = ({ items }) => {

  // Example slug generator (optional but useful)
  const getSlug = (text) =>
    text.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="filter-row">
      <div className="slider-wrapper">
        <Swiper
          modules={[Navigation]}
          spaceBetween={10}
          slidesPerView="auto"
          navigation
          className="filter-swiper"
        >
          {items.map((item, index) => (
            <SwiperSlide key={index} style={{ width: "auto" }}>
              <Link href={`/filter/${getSlug(item)}`} className="tag">
                {item}
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default FilterSlider;