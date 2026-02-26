"use client";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { fetchProductList } from "@/api/productList/api"; // ✅ FilterModal-ல் உள்ளதே

import "swiper/css";
import "swiper/css/navigation";

interface CategoryCount {
  name: string;
  slug: string;
  count: number;
}

interface StateOption {
  value: string;
  name: string;
  regions?: {
    name: string;
    value: string;
  }[];
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
  // ✅ stateOptions prop optional பண்ணு — self fetch பண்ணும்
  stateOptions?: StateOption[];
  onCategorySelect: (slug: string | null) => void;
  onLocationSelect: (state: string | null, region: string | null) => void;
  onOpenModal?: (section?: string) => void;
}

const FilterSlider = ({
  currentFilters,
  categoryCounts,
  isCategoryCountLoading,
  stateOptions: propStateOptions = [], // prop வந்தா use பண்ணு
  onCategorySelect,
  onLocationSelect,
  onOpenModal,
}: FilterSliderProps) => {
  // ✅ Self fetch — FilterModal மாதிரியே
  const [states, setStates] = useState<StateOption[]>(propStateOptions);

  useEffect(() => {
    // prop-ல் data இருந்தா fetch வேண்டாம்
    if (propStateOptions.length > 0) {
      setStates(propStateOptions);
      return;
    }

    // ✅ prop empty-யா இருந்தா தன்னா fetch பண்ணு
    const load = async () => {
      try {
        const res = await fetchProductList();
        setStates(res?.data?.states || []);
        console.log(
          "🔥 FilterSlider fetched states:",
          res?.data?.states?.length,
        );
      } catch (e) {
        console.error("FilterSlider states fetch error:", e);
      }
    };

    load();
  }, [propStateOptions.length]);

  // ── modal state ──
  const [openModal, setOpenModal] = useState<"type" | "location" | null>(null);
  const [tempCategory, setTempCategory] = useState<string | null>(null);
  const [tempState, setTempState] = useState<string | null>(null);
  const [tempRegion, setTempRegion] = useState<string | null>(null);

  const handleTypeOpen = () => {
    setTempCategory(currentFilters.category ?? null);
    setOpenModal("type");
  };
  const handleTypeSearch = () => {
    onCategorySelect(tempCategory);
    setOpenModal(null);
  };
  const handleTypeClear = () => {
    setTempCategory(null);
    onCategorySelect(null);
    setOpenModal(null);
  };

  const handleLocationOpen = () => {
    // ✅ currentFilters.state-ஐ states list-ல் match பண்ணி canonical name எடு
    const matchedState = states.find(
      (s) =>
        s.name.toLowerCase() === (currentFilters.state ?? "").toLowerCase() ||
        s.value.toLowerCase() === (currentFilters.state ?? "").toLowerCase(),
    );
    const matchedRegion = matchedState?.regions?.find(
      (r) =>
        r.name.toLowerCase() === (currentFilters.region ?? "").toLowerCase() ||
        r.value.toLowerCase() === (currentFilters.region ?? "").toLowerCase(),
    );

    console.log("🔥 matched state:", matchedState?.name);
    console.log("🔥 matched region:", matchedRegion?.name);

    setTempState(matchedState?.name ?? currentFilters.state ?? null);
    setTempRegion(matchedRegion?.name ?? currentFilters.region ?? null);
    setOpenModal("location");
  };
  const handleLocationSearch = () => {
    console.log("🔥 temp tempState:", tempState);
    console.log("🔥 temp tempRegion:", tempRegion);
    console.log("🔥 temp currentFilters.state:", currentFilters.state);
    console.log("🔥 temp currentFilters.region:", currentFilters.region);
    const normalize = (s: string | null) =>
      s ? s.toLowerCase().replace(/-/g, " ").trim() : "";

    const prevState = currentFilters.state ?? null;
    // ✅ normalize compare — case mismatch தவிர்க்கணும்
    const stateChanged = normalize(tempState) !== normalize(prevState);

    console.log("🔥 search — tempState:", tempState, "tempRegion:", tempRegion);
    console.log("🔥 stateChanged:", stateChanged);

    if (tempState === null && tempRegion === null) {
      onLocationSelect(null, null);
    } else if (stateChanged) {
      // ✅ State மாறினா region reset
      onLocationSelect(tempState, null);
    } else {
      // ✅ Same state — region மட்டும் pass
      onLocationSelect(tempState, tempRegion);
    }
    setOpenModal(null);
  };
  const handleLocationClear = () => {
    setTempState(null);
    setTempRegion(null);
    onLocationSelect(null, null);
    setOpenModal(null);
  };

  // ✅ states state use பண்ணு (prop இல்ல)
  const filteredRegions =
    states.find((s) => s.name.toLowerCase() === tempState?.toLowerCase())
      ?.regions ?? [];

  const hasTypeChange = tempCategory !== (currentFilters.category ?? null);
  const hasLocationChange =
    tempState !== (currentFilters.state ?? null) ||
    tempRegion !== (currentFilters.region ?? null);

  const closeBtn = (
    <button className="filter-close" onClick={() => setOpenModal(null)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 64 64"
      >
        <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
      </svg>
    </button>
  );

  return (
    <>
      <div className="filter-row">
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
                className={`tag ${currentFilters.category ? "active" : ""}`}
                onClick={handleTypeOpen}
              >
                Caravan Type
                {currentFilters.category && (
                  <span className="active_filter">
                    <i className="bi bi-circle-fill"></i>
                  </span>
                )}
              </button>
            </SwiperSlide>

            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.state ? "active" : ""}`}
                onClick={handleLocationOpen}
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

            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.from_price || currentFilters.to_price ? "active" : ""}`}
                onClick={() => onOpenModal?.("price")}
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

      {/* Caravan Type Modal */}
      {openModal === "type" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Caravan Type</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <ul className="category-list">
                {isCategoryCountLoading ? (
                  <li style={{ padding: "12px 0", color: "#888" }}>Loading…</li>
                ) : (
                  categoryCounts.map((cat) => (
                    <li key={cat.slug} className="category-item">
                      <label className="category-checkbox-row checkbox">
                        <div className="d-flex align-items-center">
                          <input
                            className="checkbox__trigger visuallyhidden"
                            type="checkbox"
                            checked={tempCategory === cat.slug}
                            onChange={() =>
                              setTempCategory(
                                tempCategory === cat.slug ? null : cat.slug,
                              )
                            }
                          />
                          <span className="checkbox__symbol">
                            <svg
                              aria-hidden="true"
                              className="icon-checkbox"
                              width="28px"
                              height="28px"
                              viewBox="0 0 28 28"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M4 14l8 7L24 7"></path>
                            </svg>
                          </span>
                          <span className="category-name">{cat.name}</span>
                        </div>
                        <span className="category-count">({cat.count})</span>
                      </label>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleTypeClear}
                style={{
                  opacity: tempCategory ? 1 : 0.4,
                  cursor: tempCategory ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${hasTypeChange ? "active" : ""}`}
                onClick={handleTypeSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {openModal === "location" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Location</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>State</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempState || ""}
                      onChange={(e) => {
                        const newState = e.target.value || null;
                        // ✅ value மாறாம இருந்தா ignore பண்ணு
                        if (newState === tempState) return;
                        setTempState(newState);
                        setTempRegion(null);
                      }}
                    >
                      <option value="">Any</option>
                      {/* ✅ states (self-fetched) use பண்ணு */}
                      {states.map((s, i) => (
                        <option key={i} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {tempState && filteredRegions.length > 0 && (
                  <div className="col-lg-6">
                    <div className="location-item">
                      <label>Region</label>
                      <select
                        className="cfs-select-input form-select"
                        value={tempRegion || ""}
                        onChange={(e) => setTempRegion(e.target.value || null)}
                      >
                        <option value="">Any</option>
                        {filteredRegions.map((r, i) => (
                          <option key={i} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleLocationClear}
                style={{
                  opacity: tempState ? 1 : 0.4,
                  cursor: tempState ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${hasLocationChange ? "active" : ""}`}
                onClick={handleLocationSearch}
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
