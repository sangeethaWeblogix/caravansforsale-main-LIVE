"use client";
import { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { fetchProductList } from "@/api/productList/api";

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
  model?: string;
  state?: string;
  region?: string;
  suburb?: string;
  pincode?: string;
  from_price?: string | number;
  to_price?: string | number;
  minKg?: string | number;
  maxKg?: string | number;
  condition?: string;
  from_length?: string | number;
  to_length?: string | number;
  from_sleep?: string | number;
  to_sleep?: string | number;
  acustom_fromyears?: string | number;
  acustom_toyears?: string | number;
  search?: string;
  keyword?: string;
  [key: string]: any;
}

interface FilterSliderProps {
  currentFilters: Filters;
  categoryCounts: CategoryCount[];
  isCategoryCountLoading?: boolean;
  stateOptions?: StateOption[];
  onCategorySelect: (slug: string | null) => void;
  onMakeSelect?: (make: string | null, model: string | null) => void;
  onLocationSelect: (state: string | null, region: string | null) => void;
  onOpenModal?: (section?: string) => void;
  onPriceSelect?: (from: number | null, to: number | null) => void;
  onAtmSelect?: (min: number | null, max: number | null) => void;
}

// ── FilterModal-போல் buildCountParams helper ──
const buildMakeCountParams = (filters: Filters): URLSearchParams => {
  const params = new URLSearchParams();

  // make & model exclude பண்ணு (make count-க்கு)
  if (filters.category) params.set("category", filters.category);
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.state) params.set("state", filters.state.toLowerCase());
  if (filters.region) params.set("region", filters.region);
  if (filters.suburb) params.set("suburb", filters.suburb);
  if (filters.pincode) params.set("pincode", filters.pincode);
  if (filters.from_price) params.set("from_price", String(filters.from_price));
  if (filters.to_price) params.set("to_price", String(filters.to_price));
  if (filters.minKg) params.set("from_atm", String(filters.minKg));
  if (filters.maxKg) params.set("to_atm", String(filters.maxKg));
  if (filters.acustom_fromyears)
    params.set("acustom_fromyears", String(filters.acustom_fromyears));
  if (filters.acustom_toyears)
    params.set("acustom_toyears", String(filters.acustom_toyears));
  if (filters.from_length)
    params.set("from_length", String(filters.from_length));
  if (filters.to_length) params.set("to_length", String(filters.to_length));
  if (filters.from_sleep) params.set("from_sleep", String(filters.from_sleep));
  if (filters.to_sleep) params.set("to_sleep", String(filters.to_sleep));
  if (filters.search) params.set("search", filters.search);
  if (filters.keyword) params.set("keyword", filters.keyword);

  params.set("group_by", "make");
  return params;
};

const FilterSlider = ({
  currentFilters,
  categoryCounts,
  isCategoryCountLoading,
  stateOptions: propStateOptions = [],
  onCategorySelect,
  onLocationSelect,
  onOpenModal,
  onPriceSelect,
  onAtmSelect,
  onMakeSelect,
}: FilterSliderProps) => {
  const [states, setStates] = useState<StateOption[]>(propStateOptions);

  useEffect(() => {
    if (propStateOptions.length > 0) {
      setStates(propStateOptions);
      return;
    }
    const load = async () => {
      try {
        const res = await fetchProductList();
        setStates(res?.data?.states || []);
      } catch (e) {
        console.error("FilterSlider states fetch error:", e);
      }
    };
    load();
  }, [propStateOptions.length]);

  const priceOptions = [
    10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000,
    125000, 150000, 175000, 200000, 225000, 250000, 275000, 300000,
  ];
  const atmOptions = [
    600, 800, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000,
    4500,
  ];

  // ── Make & Model states ──
  const [makes, setMakes] = useState<
    { name: string; slug: string; models?: { name: string; slug: string }[] }[]
  >([]);
  const [makeCounts, setMakeCounts] = useState<
    { name: string; slug: string; count: number }[]
  >([]);
  const [tempMake, setTempMake] = useState<string | null>(null);
  const [tempModel, setTempModel] = useState<string | null>(null);
  const [makeSearch, setMakeSearch] = useState("");
  const [makeLoading, setMakeLoading] = useState(false);

  // ── 1. modelCounts state add பண்ணு (makeCounts state-க்கு கீழே) ──
  const [modelCounts, setModelCounts] = useState<
    { name: string; slug: string; count: number }[]
  >([]);

  const [modelCountLoading, setModelCountLoading] = useState(false);

  const didFetchMakeRef = useRef(false);
  useEffect(() => {
    if (didFetchMakeRef.current) return;
    didFetchMakeRef.current = true;
    setMakeLoading(true);
    import("@/api/make-new/api")
      .then(({ fetchMakeDetails }) => fetchMakeDetails())
      .then((list) => setMakes(list || []))
      .catch(console.error)
      .finally(() => setMakeLoading(false));
  }, []);

  useEffect(() => {
    if (!tempMake) {
      setModelCounts([]);
      return;
    }

    const controller = new AbortController();
    setModelCountLoading(true);

    const params = buildMakeCountParams(currentFilters);
    // make set பண்ணு, model exclude பண்ணு
    params.set("make", tempMake);
    params.set("group_by", "model");
    params.delete("group_by"); // முதல்ல delete
    params.set("group_by", "model"); // model group_by set

    fetch(
      `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${params.toString()}`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((json) => {
        if (!controller.signal.aborted) {
          setModelCounts(json.data || []);
          setModelCountLoading(false);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          console.error(e);
          setModelCountLoading(false);
        }
      });

    return () => controller.abort();
  }, [tempMake]); // tempMake மாறும்போது மட்டும்

  const availableModels = makes.find((m) => m.slug === tempMake)?.models ?? [];

  const filteredMakes = makeSearch
    ? makeCounts.filter((m) =>
        m.name.toLowerCase().includes(makeSearch.toLowerCase()),
      )
    : makeCounts;

  // ── FIXED: FilterModal-போல் full filter params use பண்ணி make count fetch ──
  useEffect(() => {
    const controller = new AbortController();

    const params = buildMakeCountParams(currentFilters);

    fetch(
      `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${params.toString()}`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((json) => {
        if (!controller.signal.aborted) {
          setMakeCounts(json.data || []);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });

    return () => controller.abort();
  }, [
    // ── FilterModal-போல் ALL relevant filters watch பண்ணு ──
    currentFilters.category,
    currentFilters.condition,
    currentFilters.state,
    currentFilters.region,
    currentFilters.suburb,
    currentFilters.pincode,
    currentFilters.from_price,
    currentFilters.to_price,
    currentFilters.minKg,
    currentFilters.maxKg,
    currentFilters.acustom_fromyears,
    currentFilters.acustom_toyears,
    currentFilters.from_length,
    currentFilters.to_length,
    currentFilters.from_sleep,
    currentFilters.to_sleep,
    currentFilters.search,
    currentFilters.keyword,
  ]);

  // ── Make & Model handlers ──
  const handleMakeOpen = () => {
    setTempMake(currentFilters.make ?? null);
    setTempModel(currentFilters.model ?? null);
    setMakeSearch("");
    setOpenModal("make");
  };
  const handleMakeSearch = () => {
    onMakeSelect?.(tempMake, tempModel);
    setOpenModal(null);
  };
  const handleMakeClear = () => {
    setTempMake(null);
    setTempModel(null);
    onMakeSelect?.(null, null);
    setOpenModal(null);
  };

  // ── Price & ATM temp states ──
  const [tempPriceFrom, setTempPriceFrom] = useState<number | null>(null);
  const [tempPriceTo, setTempPriceTo] = useState<number | null>(null);
  const [tempAtmFrom, setTempAtmFrom] = useState<number | null>(null);
  const [tempAtmTo, setTempAtmTo] = useState<number | null>(null);

  const [openModal, setOpenModal] = useState<
    "type" | "location" | "price" | "atm" | "make" | null
  >(null);

  // ── Price handlers ──
  const handlePriceOpen = () => {
    setTempPriceFrom(
      currentFilters.from_price ? Number(currentFilters.from_price) : null,
    );
    setTempPriceTo(
      currentFilters.to_price ? Number(currentFilters.to_price) : null,
    );
    setOpenModal("price");
  };
  const handlePriceSearch = () => {
    onPriceSelect?.(tempPriceFrom, tempPriceTo);
    setOpenModal(null);
  };
  const handlePriceClear = () => {
    setTempPriceFrom(null);
    setTempPriceTo(null);
    onPriceSelect?.(null, null);
    setOpenModal(null);
  };

  // ── ATM handlers ──
  const handleAtmOpen = () => {
    setTempAtmFrom(currentFilters.minKg ? Number(currentFilters.minKg) : null);
    setTempAtmTo(currentFilters.maxKg ? Number(currentFilters.maxKg) : null);
    setOpenModal("atm");
  };
  const handleAtmSearch = () => {
    onAtmSelect?.(tempAtmFrom, tempAtmTo);
    setOpenModal(null);
  };
  const handleAtmClear = () => {
    setTempAtmFrom(null);
    setTempAtmTo(null);
    onAtmSelect?.(null, null);
    setOpenModal(null);
  };

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
    setTempState(matchedState?.name ?? currentFilters.state ?? null);
    setTempRegion(matchedRegion?.name ?? currentFilters.region ?? null);
    setOpenModal("location");
  };
  const handleLocationSearch = () => {
    const normalize = (s: string | null) =>
      s ? s.toLowerCase().replace(/-/g, " ").trim() : "";
    const prevState = currentFilters.state ?? null;
    const stateChanged = normalize(tempState) !== normalize(prevState);

    if (tempState === null && tempRegion === null) {
      onLocationSelect(null, null);
    } else if (stateChanged) {
      onLocationSelect(tempState, null);
    } else {
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
                {currentFilters.category ? (
                  <>
                    <small className="selected_label">Type: </small>
                    {categoryCounts.find(
                      (c) => c.slug === currentFilters.category,
                    )?.name ?? currentFilters.category}
                    <span className="active_filter">
                      <i className="bi bi-circle-fill"></i>
                    </span>
                  </>
                ) : (
                  "Caravan Type"
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
                className={`tag ${currentFilters.make ? "active" : ""}`}
                onClick={handleMakeOpen}
              >
                {currentFilters.make ? (
                  <>
                    <small className="selected_label">Make: </small>
                    {makeCounts.find((m) => m.slug === currentFilters.make)
                      ?.name ?? currentFilters.make}
                    {currentFilters.model && (
                      <>
                        , <small className="selected_label">Model: </small>
                        {currentFilters.model}
                      </>
                    )}
                    <span className="active_filter">
                      <i className="bi bi-circle-fill"></i>
                    </span>
                  </>
                ) : (
                  "Make"
                )}
              </button>
            </SwiperSlide>

            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.from_price || currentFilters.to_price ? "active" : ""}`}
                onClick={handlePriceOpen}
              >
                {currentFilters.from_price || currentFilters.to_price ? (
                  <>
                    <small className="selected_label">Price: </small>
                    {currentFilters.from_price && currentFilters.to_price
                      ? `${Number(currentFilters.from_price).toLocaleString()} – ${Number(currentFilters.to_price).toLocaleString()}`
                      : currentFilters.from_price
                        ? `From ${Number(currentFilters.from_price).toLocaleString()}`
                        : `Up to ${Number(currentFilters.to_price).toLocaleString()}`}
                    <span className="active_filter">
                      <i className="bi bi-circle-fill"></i>
                    </span>
                  </>
                ) : (
                  "Price"
                )}
              </button>
            </SwiperSlide>

            <SwiperSlide style={{ width: "auto" }}>
              <button
                className={`tag ${currentFilters.minKg || currentFilters.maxKg ? "active" : ""}`}
                onClick={handleAtmOpen}
              >
                {currentFilters.minKg || currentFilters.maxKg ? (
                  <>
                    <small className="selected_label">ATM: </small>
                    {currentFilters.minKg && currentFilters.maxKg
                      ? `${Number(currentFilters.minKg).toLocaleString()} kg – ${Number(currentFilters.maxKg).toLocaleString()} kg`
                      : currentFilters.minKg
                        ? `From ${Number(currentFilters.minKg).toLocaleString()} kg`
                        : `Up to ${Number(currentFilters.maxKg).toLocaleString()} kg`}
                    <span className="active_filter">
                      <i className="bi bi-circle-fill"></i>
                    </span>
                  </>
                ) : (
                  "ATM"
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
              <ul
                className="category-list"
                style={{ listStyle: "none", padding: 0, margin: 0 }}
              >
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
                        if (newState === tempState) return;
                        setTempState(newState);
                        setTempRegion(null);
                      }}
                    >
                      <option value="">Any</option>
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

      {/* Make & Model Modal */}
      {openModal === "make" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Make & Model</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Make</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempMake ?? ""}
                      onChange={(e) => {
                        setTempMake(e.target.value || null);
                        setTempModel(null);
                      }}
                    >
                      <option value="">Any</option>
                      {makeLoading ? (
                        <option disabled>Loading...</option>
                      ) : (
                        filteredMakes.map((m) => (
                          <option key={m.slug} value={m.slug}>
                            {m.name} ({m.count})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
                {tempMake && (
                  <div className="col-lg-6">
                    <div className="location-item">
                      <label>Model</label>
                      <select
                        className="cfs-select-input form-select"
                        value={tempModel ?? ""}
                        onChange={(e) => setTempModel(e.target.value || null)}
                      >
                        <option value="">Any</option>
                        {modelCountLoading ? (
                          <option disabled>Loading...</option>
                        ) : (
                          modelCounts.map((mod) => (
                            <option key={mod.slug} value={mod.slug}>
                              {mod.name || mod.slug} ({mod.count})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleMakeClear}
                style={{
                  opacity: tempMake ? 1 : 0.4,
                  cursor: tempMake ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempMake ? "active" : ""}`}
                onClick={handleMakeSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Modal */}
      {openModal === "price" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Price</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempPriceFrom ?? ""}
                      onChange={(e) =>
                        setTempPriceFrom(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Any</option>
                      {priceOptions.map((v) => (
                        <option key={v} value={v}>
                          ${v.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempPriceTo ?? ""}
                      onChange={(e) =>
                        setTempPriceTo(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Any</option>
                      {priceOptions
                        .filter((v) => !tempPriceFrom || v > tempPriceFrom)
                        .map((v) => (
                          <option key={v} value={v}>
                            ${v.toLocaleString()}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handlePriceClear}
                style={{
                  opacity: tempPriceFrom || tempPriceTo ? 1 : 0.4,
                  cursor:
                    tempPriceFrom || tempPriceTo ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempPriceFrom || tempPriceTo ? "active" : ""}`}
                onClick={handlePriceSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATM Modal */}
      {openModal === "atm" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>ATM</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempAtmFrom ?? ""}
                      onChange={(e) =>
                        setTempAtmFrom(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Any</option>
                      {atmOptions.map((v) => (
                        <option key={v} value={v}>
                          {v} kg
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempAtmTo ?? ""}
                      onChange={(e) =>
                        setTempAtmTo(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Any</option>
                      {atmOptions
                        .filter((v) => !tempAtmFrom || v > tempAtmFrom)
                        .map((v) => (
                          <option key={v} value={v}>
                            {v} kg
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleAtmClear}
                style={{
                  opacity: tempAtmFrom || tempAtmTo ? 1 : 0.4,
                  cursor: tempAtmFrom || tempAtmTo ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempAtmFrom || tempAtmTo ? "active" : ""}`}
                onClick={handleAtmSearch}
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
