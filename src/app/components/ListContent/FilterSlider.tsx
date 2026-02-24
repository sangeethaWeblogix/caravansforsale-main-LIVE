 "use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

// ✅ ChipItem type define பண்ணு
interface ChipItem {
  label: string;
  url: string;
  group: string;
}

// ✅ items type மாத்து - string[] → ChipItem[]
const FilterSlider = ({ items }: { items: ChipItem[] }) => {

  if (!items || items.length === 0) return null;

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
          {items.map((chip, index) => (
            <SwiperSlide key={index} style={{ width: "auto" }}>
              {/* ✅ chip.url directly use பண்ணு - API URL */}
              <Link href={chip.url} className="tag">
                {/* ✅ label capitalize பண்ணு */}
                {chip.label
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default FilterSlider;