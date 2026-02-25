"use client";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import CaravanTypeFilter from "./CaravanTypeFilter";
import LocationFilter from "./LocationFilter";
import PriceFilter from "./PriceFilter";

import "swiper/css";
import "swiper/css/navigation";

const FilterSlider = () => {
  const [openModal, setOpenModal] = useState(null);

  return (
    <>
      {/* ✅ Slider */}
      <div className="filter-row ">
        <div className="slider-wrapper">
          <Swiper
            modules={[Navigation]}
            spaceBetween={10}
            slidesPerView="auto"
            navigation
            className="filter-swiper"
          >
            <SwiperSlide style={{ width: "auto" }}>
              <button
                className="tag"
                onClick={() => setOpenModal("type")}
              >
                Caravan Type
              </button>
            </SwiperSlide>

            <SwiperSlide style={{ width: "auto" }}>
              <button
                className="tag"
                onClick={() => setOpenModal("location")}
              >
                <small className="selected_label">State :</small> Victoria, <small className="selected_label">Region :</small> Melbourne <span className="active_filter"><i className="bi bi-circle-fill"></i></span>
              </button>
            </SwiperSlide>
            <SwiperSlide style={{ width: "auto" }}>
              <button
                className="tag"
                onClick={() => setOpenModal("price")}
              >
                Price <span className="active_filter"><i className="bi bi-circle-fill"></i></span>
              </button>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>

      {/* ✅ Modal Overlay */}
      {openModal && (
        <div className="filter-overlay">
          <div className="filter-modal">
            
            {/* Header */}
            <div className="filter-header">
              <h3>
                {openModal === "type" && "Caravan Type"}
                {openModal === "location" && "Location"}
                {openModal === "price" && "Price"}
              </h3>

              <button
                className="filter-close"
                onClick={() => setOpenModal(null)}
              >
                <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="100"
              height="100"
              viewBox="0 0 64 64"
            >
              <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
            </svg>
              </button>
            </div>

            {/* Body */}
            <div className="filter-body">
              {openModal === "type" && <CaravanTypeFilter />}
              {openModal === "location" && <LocationFilter />}
              {openModal === "price" && <PriceFilter />}
            </div>

            {/* Footer */}
            <div className="filter-footer">
              <button className="clear">Clear filters</button>
              <button className="search">Search</button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default FilterSlider;