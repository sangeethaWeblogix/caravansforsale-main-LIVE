"use client";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

interface CategoryCount {
  name: string;
  slug: string;
  count: number;
}

interface Filters {
  category?: string;
  make?: string;
  state?: string;
  region?: string;
  from_price?: string | number;
  to_price?: string | number;
  [key: string]: any;
}

interface FilterSliderProps {
  currentFilters: Filters;
  categoryCounts: CategoryCount[];
  isCategoryCountLoading?: boolean;
  onOpenModal: (section?: string) => void;
  onCategorySelect: (slug: string | null) => void;
}

const FilterSlider = ({
  currentFilters,
  categoryCounts,
  isCategoryCountLoading,
  onOpenModal,
  onCategorySelect,
}: FilterSliderProps) => {
  const [openModal, setOpenModal] = useState<"type" | null>(null);
  // ✅ temp state — modal close ஆகாம value store பண்ணு
  const [tempCategory, setTempCategory] = useState<string | null>(null);

  const handleOpen = () => {
    // modal open ஆகும்போது currentFilters sync பண்ணு
    setTempCategory(currentFilters.category ?? null);
    setOpenModal("type");
  };

  const handleSearch = () => {
    // ✅ Search click → API call + modal close
    console.log("FilterSlider handleSearch — tempCategory:", tempCategory);
    onCategorySelect(tempCategory);
    setOpenModal(null);
  };

  const handleClear = () => {
    // ✅ Clear → temp reset + API call + modal close
    setTempCategory(null);
    onCategorySelect(null);
    setOpenModal(null);
  };

  const hasChange = tempCategory !== (currentFilters.category ?? null);

  return (
    <>
      {/* ✅ Slider */}
      <div className="filter-row">
        <div className="slider-wrapper">
          <Swiper
            modules={[Navigation]}
            spaceBetween={10}
            slidesPerView="auto"
            navigation
            className="filter-swiper"
          >
            {/* Caravan Type */}
            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.category ? "active" : ""}`}
                onClick={handleOpen}
              >
                Caravan Type
                {currentFilters.category && (
                  <span className="active_filter">
                    <i className="bi bi-circle-fill"></i>
                  </span>
                )}
              </button>
            </SwiperSlide>

            {/* Location */}
            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.state ? "active" : ""}`}
                onClick={() => onOpenModal()}
              >
                {currentFilters.state ? (
                  <>
                    <small className="selected_label">State: </small>
                    {currentFilters.state}
                    {currentFilters.region && (
                      <>
                        , <small className="selected_label">Region: </small>
                        {currentFilters.region}
                      </>
                    )}
                    <span className="active_filter">
                      <i className="bi bi-circle-fill"></i>
                    </span>
                  </>
                ) : (
                  "Location"
                )}
              </button>
            </SwiperSlide>

            {/* Price */}
            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.from_price || currentFilters.to_price ? "active" : ""}`}
                onClick={() => onOpenModal()}
              >
                Price
                {(currentFilters.from_price || currentFilters.to_price) && (
                  <span className="active_filter">
                    <i className="bi bi-circle-fill"></i>
                  </span>
                )}
              </button>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>

      {/* ✅ Modal Overlay */}
      {openModal === "type" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            {/* Header */}
            <div className="filter-header">
              <h3>Caravan Type</h3>
              <button
                className="filter-close"
                onClick={() => setOpenModal(null)} // ✅ X → just close, no apply
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
              <div className="filter-item">
                <ul className="category-list">
                  {isCategoryCountLoading ? (
                    <li
                      className="category-item"
                      style={{ padding: "12px 0", color: "#888" }}
                    >
                      Loading…
                    </li>
                  ) : (
                    categoryCounts.map((cat) => (
                      <li key={cat.slug} className="category-item">
                        <label className="category-checkbox-row checkbox">
                          <div className="d-flex align-items-center">
                            <input
                              className="checkbox__trigger visuallyhidden"
                              type="checkbox"
                              checked={tempCategory === cat.slug} // ✅ temp state use
                              onChange={() => {
                                // ✅ toggle — modal close ஆகாது
                                setTempCategory(
                                  tempCategory === cat.slug ? null : cat.slug,
                                );
                              }}
                            />
                            <span className="checkbox__symbol">
                              <svg
                                aria-hidden="true"
                                className="icon-checkbox"
                                width="28px"
                                height="28px"
                                viewBox="0 0 28 28"
                                version="1"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M4 14l8 7L24 7"></path>
                              </svg>
                            </span>
                            <span className="category-name">{cat.name}</span>
                          </div>
                          <div>
                            <span className="category-count">
                              ({cat.count})
                            </span>
                          </div>
                        </label>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleClear}
                style={{
                  opacity: tempCategory ? 1 : 0.4,
                  cursor: tempCategory ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${hasChange ? "active" : ""}`}
                onClick={handleSearch} // ✅ Search → apply + close
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterSlider;
