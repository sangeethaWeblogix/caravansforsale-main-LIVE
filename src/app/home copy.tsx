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

type CategoryItem = {
  name: string;
  link: string;
  image: string;
  alt: string;
};

const categories: CategoryItem[] = [
  {
    name: "Off Road",
    link: "/listings/off-road-category/",
    image: "/images/off-road.webp",
    alt: "off-road",
  },
  {
    name: "Hybrid",
    link: "/listings/hybrid-category/",
    image: "/images/hybrid.webp",
    alt: "hybrid",
  },
  {
    name: "Pop Top",
    link: "/listings/pop-top-category/",
    image: "/images/pop-top.webp",
    alt: "pop-top",
  },
  {
    name: "Luxury",
    link: "/listings/luxury-category/",
    image: "/images/luxury.webp",
    alt: "luxury",
  },
  {
    name: "Family",
    link: "/listings/family-category/",
    image: "/images/family.webp",
    alt: "family",
  },
  {
    name: "Touring",
    link: "/listings/touring-category/",
    image: "/images/touring.webp",
    alt: "touring",
  },
];

const suggestions: string[] = [
  "caravans for sale",
  "jayco crosstrak for sale",
  "lotus caravans for sale",
  "off road caravans for sale",
  "top 10 caravan manufacturers australia",
];

/* --------------------------------- Page ---------------------------------- */
export default function ProductPage() {
  const [isSuggestionBoxOpen, setIsSuggestionBoxOpen] =
    useState<boolean>(false);
  const [adIndex, setAdIndex] = useState<number>(0);

  const bannerSectionRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const searchLocationho = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // prefer currentTarget for typed value
    console.log(e.currentTarget.value);
  };

  // const search_by_header = (): void => {
  //   console.log("Search button clicked");
  // };

  const showSuggestions = (): void => {
    setIsSuggestionBoxOpen(true);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  };

  const closeSuggestions = (): void => {
    setIsSuggestionBoxOpen(false);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "auto";
    }
  };

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

  const handleSuggestionClick = (keyword: string): void => {
    if (searchInputRef.current) {
      searchInputRef.current.value = keyword;
      searchInputRef.current.focus();
    }
    closeSuggestions();
  };

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
        <div className="container">
          <div className="row align-items-center justify-content-center">
            <div className="col-lg-12">
              <div className="section-head text-center">
                <h1 className="divide-orange">
                  Browse New & Used Caravans For Sale
                </h1>
                <p>
                  CFS is dedicated to revolutionising your caravan buying
                  experience.
                </p>

                <div
                  className="overlay_search"
                  id="overlay_search"
                  style={{ display: isSuggestionBoxOpen ? "block" : "none" }}
                  onClick={closeSuggestions}
                />

                <div className="search-container">
                  <div className="search-wrapper">
                    <i className="bi bi-search search-icon" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="search-box"
                      placeholder="Search by caravans..."
                      id="searchInput"
                      autoComplete="off"
                      onKeyUp={searchLocationho}
                      onFocus={showSuggestions}
                      onClick={showSuggestions}
                    />
                    <div
                      className="close-btn"
                      id="closeBtn"
                      style={{
                        display: isSuggestionBoxOpen ? "block" : "none",
                      }}
                      onClick={closeSuggestions}
                      role="button"
                      aria-label="Close suggestions"
                    >
                      <i className="bi bi-x-lg" />
                    </div>
                  </div>

                  <div
                    className="suggestions"
                    id="suggestionBox"
                    style={{ display: isSuggestionBoxOpen ? "block" : "none" }}
                  >
                    <h4>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 500 500"
                      >
                        <path d="M487.9 254.7c-1.3.8-1.2 2.4-1.8 3.6a20 20 0 0 1-21 11.3c-8.2-1-15-7.5-16.4-16a40 40 0 0 1-.5-6.9v-61.3c0-1.6.5-3.4-.7-5.3l-4 3.8-147.8 147.8c-6.3 6.3-13.4 9.3-22.2 6.6a24 24 0 0 1-9.5-6.5q-40-39.9-79.7-79.9c-2.8-2.9-4.2-3-7.1-.1L47.5 381.6c-6.3 6.3-13.4 8.9-21.9 6.1a19.6 19.6 0 0 1-8.6-31.5q1.5-1.8 3.2-3.3l144.2-144.2c11-11 21.6-11 32.6 0l79.5 79.5c2.3 2.3 3.6 3.1 6.5.3l133.9-134.1c.8-.8 2-1.5 2.2-2.9-1.5-1-3.3-.5-4.9-.5q-32.2.1-64.6-.1c-13.6-.1-22.6-11.4-19.7-24.3a19 19 0 0 1 18.3-15q14-.2 27.9-.1l91.5-.2c10.4 0 16.7 6 20.3 15.3z" />
                      </svg>
                      Suggested searches
                    </h4>
                    <ul id="suggestionList">
                      {suggestions.map((keyword, index) => (
                        <li
                          key={index}
                          onClick={() => handleSuggestionClick(keyword)}
                          style={{ cursor: "pointer" }}
                        >
                          {keyword}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="row justify-content-center">
                  <div className="col-lg-3 col-4">
                    <Link
                      href="/listings/new-condition/"
                      className="btn btn-primary"
                    >
                      New
                    </Link>
                  </div>
                  <div className="col-lg-3 col-4">
                    <Link
                      href="/listings/used-condition/"
                      className="btn btn-primary"
                    >
                      Used
                    </Link>
                  </div>
                  <div className="col-lg-3 col-4">
                    <Link href="/listings/" className="btn btn-primary">
                      All
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deal of the Month Section */}
      <section className="deal-of-month product-details section-padding">
        <div className="container">
          <div className="inside_col">
            <div className="header_posistion">
              <h2>
                Find Exclusive{" "}
                <Image
                  className="deal_icon hidden-xs"
                  src="/images/deal_icons.svg"
                  alt="deal icon"
                  width={30}
                  height={30}
                />{" "}
                Deals Only @ CFS
              </h2>
            </div>

            <ul className="nav nav-pills" id="pills-tab" role="tablist">
              {categories.map((cat, index) => (
                <li className="nav-item" role="presentation" key={cat.alt}>
                  <button
                    className={`nav-link ${index === 0 ? "active" : ""}`}
                    id={`pills-${cat.alt}-tab`}
                    data-bs-toggle="pill"
                    data-bs-target={`#pills-${cat.alt}`}
                    type="button"
                    role="tab"
                    aria-controls={`pills-${cat.alt}`}
                    aria-selected={index === 0}
                  >
                    <span>{cat.name}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="tab-content" id="pills-tabContent">
              {categories.map((cat, index) => (
                <div
                  className={`tab-pane fade ${
                    index === 0 ? "show active" : ""
                  }`}
                  id={`pills-${cat.alt}`}
                  role="tabpanel"
                  aria-labelledby={`pills-${cat.alt}-tab`}
                  key={cat.alt}
                >
                  <div className="content-info text-center pb-0">
                    <div className="product_data">
                      <div className="row">
                        <div className="col-md-6 left_design order-lg-2">
                          <div className="img_b">
                            <Image
                              src="https://www.caravansforsale.com.au/wp-content/uploads/2024/10/19-6-coronet-rv-2024-ultimate-new-off-road-caravan-3-27-maini.jpg"
                              className="attachment-full size-full wp-post-image"
                              alt="caravan"
                              width={0}
                              height={0}
                              unoptimized
                              style={{ width: "auto", height: "auto" }}
                            />
                          </div>
                        </div>

                        <div className="col-md-6 right_design order-lg-1">
                          <div className="deal_info">
                            <div className="dd-title">
                              <div className="metc1">
                                <h3 className="title">
                                  2024 Coronet RV Ultimate 19’6 Semi Off Road 2
                                  Berth – Rear Door
                                </h3>
                              </div>
                              <div className="caravan_type">
                                <span>{cat.name}</span>
                                <span>Location - Victoria</span>
                              </div>
                              <div className="metc2">
                                <h5 className="slog">
                                  $78,999 <s>$79,999</s>
                                </h5>
                                <p className="card-price">
                                  <span>SAVE</span>$1,000
                                </p>
                              </div>
                            </div>

                            <div className="d_feature">
                              <ul>
                                <li>New</li>
                                <li>22ft</li>
                                <li>2 People</li>
                              </ul>
                            </div>

                            <div className="sub_bttn">
                              <Link className="btn" href={cat.link}>
                                VIEW THIS DEAL
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="other_items">
                    <div className="related-products">
                      <h3>Featured {cat.name} Caravans For Sale</h3>
                      <div className="featured-deals position-relative">
                        <Swiper
                          modules={[Navigation, Autoplay]}
                          navigation={{
                            nextEl: `.swiper-button-next-${cat.alt}`,
                            prevEl: `.swiper-button-prev-${cat.alt}`,
                          }}
                          autoplay={{
                            delay: 3000,
                            disableOnInteraction: false,
                          }}
                          spaceBetween={20}
                          slidesPerView={1}
                          breakpoints={{
                            640: { slidesPerView: 1, spaceBetween: 20 },
                            768: { slidesPerView: 2, spaceBetween: 20 },
                            1024: { slidesPerView: 3, spaceBetween: 20 },
                          }}
                          className="swiper-container"
                        >
                          {Array.from({ length: 10 }).map((_, i) => (
                            <SwiperSlide key={i}>
                              <Link href="https://www.caravansforsale.com.au/product/2024-red-centre-tanami-plus-208-extreme-off-road-with-ensuite/">
                                <div className="product-card">
                                  <div className="img">
                                    <Image
                                      src="https://www.caravansforsale.com.au/wp-content/uploads/2025/04/2024-red-centre-tanami-plus-208-extreme-off-road-with-ensuite-main-1.jpg"
                                      alt="caravan"
                                      width={300}
                                      height={200}
                                    />
                                  </div>
                                  <div className="product_de">
                                    <div className="info">
                                      <h6 className="category">
                                        <i className="fa fa-map-marker-alt" />
                                        <span>New South Wales</span>
                                      </h6>
                                      <h3 className="title">
                                        2024 Red Centre Tanami Plus 20&apos;8
                                        Extreme Off Road with Ensuite
                                      </h3>
                                    </div>
                                    <div className="price">
                                      <div className="metc2">
                                        <h5 className="slog">
                                          $78,999 <s>$79,999</s>
                                        </h5>
                                        <p className="card-price">
                                          <span>SAVE</span>$1,000
                                        </p>
                                      </div>
                                    </div>
                                    <ul className="vehicleDetailsWithIcons simple">
                                      <li>
                                        <span className="attribute3">New</span>
                                      </li>
                                      <li>
                                        <span className="attribute3">
                                          3 people
                                        </span>
                                      </li>
                                    </ul>
                                    <span className="btn">VIEW THIS DEAL</span>
                                  </div>
                                </div>
                              </Link>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                        <div
                          className={`swiper-button-next swiper-button-next-${cat.alt}`}
                        />
                        <div
                          className={`swiper-button-prev swiper-button-prev-${cat.alt}`}
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-end">
                      <Link className="floating_links" href={cat.link}>
                        See All <i className="bi bi-chevron-right" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
                    cities: ["Adelaide", "Mount Gambier", "Whyalla", ""],
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
                        <h5>
                          <Link
                            href={`/listings/${state.state
                              .toLowerCase()
                              .replace(/\s+/g, "-")}-state/`}
                          >
                            {state.state}
                          </Link>
                        </h5>
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
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="section-head mb-40">
                <h2>
                  High-Quality Caravans for Sale – Without the Big Brand Price
                  Tag
                </h2>
                <p>
                  Discover some of the best caravan manufacturers you may not
                  have heard of — offering superior craftsmanship, smart floor
                  plans, and unbeatable pricing for the quality.
                </p>
              </div>
            </div>
          </div>

          <div className="range-home position-relative">
            <Swiper
              modules={[Navigation, Autoplay]}
              navigation={{
                nextEl: ".swiper-button-next-manufacturer",
                prevEl: ".swiper-button-prev-manufacturer",
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
                  name: "Lotus Caravans",
                  image:
                    "https://www.caravansforsale.com.au/wp-content/uploads/2025/01/Lotus.png",
                  description:
                    "Lotus Caravans has been the standard for quality, innovation and durability in the Australian caravan industry...",
                  types: ["Off Road", "Semi Off Road"],
                  link: "/listings/lotus/",
                },
                {
                  name: "JB Caravans",
                  image:
                    "https://www.caravansforsale.com.au/wp-content/uploads/2025/01/JB-caravans.png",
                  description:
                    "Founded on a passion to create caravans that make every journey better, JB Caravans build durable and stylish caravans...",
                  types: ["Off Road", "Semi Off Road", "On Road", "Hybrid"],
                  link: "/listings/jb/",
                },
                {
                  name: "Coronet RV",
                  image:
                    "https://www.caravansforsale.com.au/wp-content/uploads/2025/01/Coronet-RV.png",
                  description:
                    "Coronet RV has been around since 1959. We specialise in semi off-road and off-road caravans...",
                  types: ["Off Road", "Semi Off Road", "On Road", "Family"],
                  link: "/listings/coronet-rv/",
                },
                {
                  name: "Jayco",
                  image:
                    "https://www.caravansforsale.com.au/wp-content/uploads/2025/01/Jayco.png",
                  description:
                    "Jayco has been Australia’s number one caravan manufacturer since 1975. We’re all about quality, innovation and reliability...",
                  types: ["Off Road", "On Road", "Hybrid", "Family"],
                  link: "/listings/jayco/",
                },
              ].map((man) => (
                <SwiperSlide key={man.name}>
                  <div className="post_item">
                    <div className="post_image">
                      <Image
                        src={man.image}
                        alt={man.name}
                        width={300}
                        height={200}
                      />
                    </div>
                    <div className="post_info">
                      <h3>{man.name}</h3>
                      <p>{man.description}</p>
                      <ul>
                        <li>
                          <i className="bi bi-info-circle" />
                          <span>{man.types.join(", ")}</span>
                        </li>
                      </ul>
                      <Link href={man.link}>
                        View Listings <i className="bi bi-chevron-right" />
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="swiper-button-next swiper-button-next-manufacturer" />
            <div className="swiper-button-prev swiper-button-prev-manufacturer" />
          </div>
        </div>
      </section>

      {/* Latest Blog Section */}
      <section className="related-products latest_blog section-padding blog style-8">
        <div className="container">
          <div className="title">
            <div className="tpof_tab">
              <h3>Latest News, Reviews &amp; Advice</h3>
              <div className="viewall_bttn">
                <Link href="https://www.caravansforsale.com.au/blog/">
                  <i className="bi bi-chevron-right" />
                </Link>
              </div>
            </div>
          </div>

          <div className="content">
            <div className="blog-content">
              <div className="row">
                {[
                  [
                    {
                      title:
                        "Buying a Used Caravan in Australia Complete 2025 Inspection Checklist",
                      image:
                        "https://www.caravansforsale.com.au/wp-content/uploads/2025/07/Buying-a-Used-Caravan-in-Australia-Complete-2025-Inspection-Checklist-Mob.jpg",
                      date: "July 30, 2025",
                      link: "#",
                    },
                    {
                      title:
                        "20 Essential Tips for Living in a Caravan Full Time in Australia",
                      image:
                        "https://www.caravansforsale.com.au/wp-content/uploads/2025/07/Living-in-a-Caravan-Mob-.jpg",
                      date: "July 29, 2025",
                      link: "#",
                    },
                    {
                      title:
                        "Best Beachside Caravan Parks in Australia for the Ultimate Coastal Getaway",
                      image:
                        "https://www.caravansforsale.com.au/wp-content/uploads/2025/07/Best-Beachside-Caravan-Parks-in-Australia-for-the-Ultimate-Coastal-Getaway-mobile.jpg",
                      date: "July 26, 2025",
                      link: "#",
                    },
                  ],
                  [
                    {
                      title:
                        "Best Off Road Caravans 2025: What’s New, Tough, and Worth Your Money",
                      image:
                        "https://www.caravansforsale.com.au/wp-content/uploads/2025/06/2.jpg",
                      date: "June 17, 2025",
                      link: "#",
                    },
                    {
                      title:
                        "Best Pop-Top Caravans with Shower & Toilet in Australia for 2025",
                      image:
                        "https://www.caravansforsale.com.au/wp-content/uploads/2025/06/A-Comprehensive-Guide-to-Pop-Top-Caravans-with-Shower-Toilet_Mobile-.jpg",
                      date: "June 13, 2025",
                      link: "#",
                    },
                    {
                      title:
                        "Best Caravans for Couples in Australia: A Complete Guide for 2025",
                      image:
                        "https://www.caravansforsale.com.au/wp-content/uploads/2025/06/Best-Caravans-for-Couples-in-Australia-A-Complete-Guide-for-2025_mobile1.jpg",
                      date: "June 6, 2025",
                      link: "#",
                    },
                  ],
                  [
                    {
                      title:
                        "Buying a Used Caravan in Australia Complete 2025 Inspection Checklist",
                      image:
                        "https://www.caravansforsale.com.au/wp-content/uploads/2025/07/Buying-a-Used-Caravan-in-Australia-Complete-2025-Inspection-Checklist-Mob.jpg",
                      date: "July 30, 2025",
                      link: "#",
                    },
                    {
                      title:
                        "20 Essential Tips for Living in a Caravan Full Time in Australia",
                      image:
                        "https://www.caravansforsale.com.au/wp-content/uploads/2025/07/Living-in-a-Caravan-Mob-.jpg",
                      date: "July 29, 2025",
                      link: "#",
                    },
                    {
                      title:
                        "Best Beachside Caravan Parks in Australia for the Ultimate Coastal Getaway",
                      image:
                        "https://www.caravansforsale.com.au/wp-content/uploads/2025/07/Best-Beachside-Caravan-Parks-in-Australia-for-the-Ultimate-Coastal-Getaway-mobile.jpg",
                      date: "July 26, 2025",
                      link: "#",
                    },
                  ],
                ].map((group, groupIndex) => (
                  <div className="col-lg-4" key={groupIndex}>
                    <div className="side-posts">
                      {group.map((post, postIndex) => (
                        <div className="item" key={postIndex}>
                          <div className="img img-cover">
                            <Image
                              src={post.image}
                              alt={post.title}
                              width={300}
                              height={200}
                            />
                          </div>
                          <div className="info">
                            <h4 className="title">
                              <Link href={post.link}>{post.title}</Link>
                            </h4>
                            <div className="date-author">
                              <Link href={post.link} className="date">
                                {post.date}
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

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
