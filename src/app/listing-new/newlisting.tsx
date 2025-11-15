"use client";

import React, { useState, useRef, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";
import Image from "next/image";

export default function Newlisting() {
  const [orderBy, setOrderBy] = useState("featured");
  const [showInfo, setShowInfo] = useState(false);
  const [showContact, setShowContact] = useState(false);


  // Refs for custom navigation
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const handleChange = (e) => {
    setOrderBy(e.target.value);
  };

  // ✅ Disable background scroll when popup is open
  useEffect(() => {
    if (showInfo || showContact) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showInfo, showContact]);

  // Example placeholder function for product links
  const productHref = (slug) => `/listing/${slug}`;

  return (
    <>
      <section className="services product_listing new_listing bg-gray-100 section-padding pb-30 style-1">
        <div className="container container-xxl">
          <div className="content mb-4">
            <div className="text-sm text-gray-600 header">
              <Link href="/" className="hover:underline">
                Home
              </Link>{" "}
              &gt;{" "}
              <span className="font-medium text-black">Listings</span>
            </div>
            <h1 className="page-title">5473 Caravans for sale in Australia</h1>
          </div>

          <div className="row">
            {/* Sidebar filter */}
            <div className="col-lg-3">
              <div className="filter">{/* Filters go here */}</div>
            </div>

            {/* Main listing section */}
            <div className="col-lg-6">
              {/* Top Filter */}
              <div className="top-filter mb-10">
                <div className="row align-items-center">
                  <div className="col-lg-8">
                    <p className="show_count">Showing 1–12 of 5473 results</p>
                  </div>

                  <div className="col-4 d-lg-none d-md-none">
                    <button
                      type="button"
                      className="mobile_fltn navbar-toggler mytogglebutton"
                      data-bs-toggle="offcanvas"
                      data-bs-target="#mobileFilters"
                      aria-controls="mobileFilters"
                    >
                      <i className="bi bi-search"></i> &nbsp;Filter
                    </button>
                  </div>

                  <div className="col-lg-4 col-8">
                    <div className="r-side">
                      <form className="woocommerce-ordering" method="get">
                        <div className="form-group shot-buy">
                          <select
                            name="orderby"
                            className="orderby form-select"
                            aria-label="Shop order"
                            value={orderBy}
                            onChange={handleChange}
                          >
                            <option value="featured">Featured</option>
                            <option value="price_asc">
                              Price (Low to High)
                            </option>
                            <option value="price_desc">
                              Price (High to Low)
                            </option>
                            <option value="year_desc">
                              Year Made (High to Low)
                            </option>
                            <option value="year_asc">
                              Year Made (Low to High)
                            </option>
                          </select>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              {/* Swiper Section */}
              <div className="other_items featured_items">
                <div className="related-products">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="featured_head">Featured listings</h3>
                    <div className="d-flex gap-2">
                      <button
                        ref={prevRef}
                        className="swiper-button-prev-custom btn btn-light btn-sm"
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      <button
                        ref={nextRef}
                        className="swiper-button-next-custom btn btn-light btn-sm"
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  </div>

                  <Swiper
                    modules={[Navigation, Autoplay]}
                    spaceBetween={10}
                    slidesPerView={1}
                    breakpoints={{
                      640: { slidesPerView: 1 },
                      768: { slidesPerView: 2 },
                      1024: { slidesPerView: 2 },
                    }}
                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                    navigation={{
                      prevEl: prevRef.current,
                      nextEl: nextRef.current,
                    }}
                    onInit={(swiper) => {
                      swiper.params.navigation.prevEl = prevRef.current;
                      swiper.params.navigation.nextEl = nextRef.current;
                      swiper.navigation.init();
                      swiper.navigation.update();
                    }}
                    className="featured-swiper"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                      <SwiperSlide key={item}>
                        <Link
                          href={productHref("grand-explorer")}
                          prefetch={false}
                        >
                          <div className="product-card">
                            <div className="img">
                              <div className="background_thumb">
                                <Image
                                  src="/images/sample3.jpg"
                                  alt="Caravan"
                                  width={300}
                                  height={200}
                                  unoptimized
                                />
                              </div>
                              <div className="main_thumb">
                                <Image
                                  src="/images/sample3.jpg"
                                  alt="Caravan"
                                  width={300}
                                  height={200}
                                  unoptimized
                                />
                              </div>
                            </div>
                            <div className="product_de">
                              <div className="info">
                                <h3 className="title">
                                  2024 Grand Explorer 18'6 Off Road Luxury
                                  Ensuite
                                </h3>
                              </div>
                              <div className="price">
                                <div className="metc2">
                                  <h5 className="slog">
                                    $94,999 <s>$99,990</s>
                                  </h5>
                                  <p className="card-price">
                                    <span>SAVE</span> $4,991
                                  </p>
                                  <div className="more_info">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setShowInfo(true);
                                      }}
                                    >
                                      <i className="fa fa-info-circle"></i> Info
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <ul className="vehicleDetailsWithIcons simple">
                                <li>
                                  <span className="attribute3">Used</span>
                                </li>
                                <li className="attribute3_list">
                                  <span className="attribute3">Touring</span>
                                </li>
                                <li>
                                  <span className="attribute3">22 ft</span>
                                </li>
                                <li>
                                  <span className="attribute3">2986 Kg</span>
                                </li>
                                <li>
                                  <span className="attribute3">Empire</span>
                                </li>
                              </ul>
                              <div className="bottom_mid">
                                <span>
                                  <i className="bi bi-check-circle-fill"></i> Condition New
                                </span>
                                <span>
                                  <i className="fa fa-map-marker-alt"></i>{" "}
                                  Victoria
                                </span>
                              </div>
                              <div className="bottom_button">
                                <button
                                  className="btn"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setShowContact(true);
                                  }}
                                >
                                  Contact Dealer
                                </button>
                                <button className="btn btn-primary">
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>

              <div className="dealers-section product-type">
                <div className="other_items">
                  <div className="related-products">
                    <div className="row g-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                        <div className="col-lg-6 mb-0" key={item}>
                          <Link
                            href={productHref("grand-explorer")}
                            prefetch={false}
                            className="lli_head"
                          >
                            <div className="product-card">
                              <div className="img">
                                <div className="background_thumb">
                                  <Image
                                    src="/images/sample3.jpg"
                                    alt="Caravan"
                                    width={300}
                                    height={200}
                                    unoptimized
                                  />
                                </div>
                                <div className="main_thumb position-relative">
                                  <span className="lab">Spotlight Van</span>
                                  <Swiper
                                    modules={[Navigation, Pagination]}
                                    spaceBetween={10}
                                    slidesPerView={1}
                                    navigation
                                    pagination={{
                                      clickable: true,
                                      //dynamicBullets: true, // adds smooth, minimal bullets
                                    }}
                                    onSlideChange={(swiper) => {
                                      const isLast = swiper.activeIndex === swiper.slides.length - 1;
                                      const viewMoreBtn = document.querySelector(`#view-more-btn-${item}`);
                                      if (viewMoreBtn) {
                                        viewMoreBtn.style.display = isLast ? "block" : "none";
                                      }
                                    }}
                                    className="main_thumb_swiper"
                                  >
                                    {[
                                      "/images/thumb-1.jpg",
                                      "/images/thumb-2.jpg",
                                      "/images/thumb-3.jpg",
                                      "/images/thumb-4.jpg",
                                    ].map((img, i) => (
                                      <SwiperSlide key={i}>
                                        <div className="thumb_img">
                                          <Image
                                            src={img}
                                            alt={`Caravan ${i + 1}`}
                                            width={300}
                                            height={200}
                                            unoptimized
                                          />
                                        </div>
                                      </SwiperSlide>
                                    ))}
                                  </Swiper>

                                  {/* Hidden "View More" button that appears after last slide */}
                                  <div id={`view-more-btn-${item}`} className="view-more-btn-wrapper">
                                    <Link
                                      href="/related-links"

                                      className="view-more-btn"

                                    >
                                      View More
                                    </Link>
                                  </div>
                                </div>

                              </div>
                              <div className="product_de">
                                <div className="info">
                                  <h3 className="title">
                                    2024 Grand Explorer 18'6 Off Road Luxury
                                    Ensuite
                                  </h3>
                                </div>
                                <div className="price">
                                  <div className="metc2">
                                    <h5 className="slog">
                                      $94,999
                                    </h5>

                                    <div className="more_info">
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setShowInfo(true);
                                        }}
                                      >
                                        <i className="fa fa-info-circle"></i> Info
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <ul className="vehicleDetailsWithIcons simple">
                                  <li>
                                    <span className="attribute3">Used</span>
                                  </li>
                                  <li className="attribute3_list">
                                    <span className="attribute3">Touring</span>
                                  </li>
                                  <li>
                                    <span className="attribute3">22 ft</span>
                                  </li>
                                  <li>
                                    <span className="attribute3">2986 Kg</span>
                                  </li>
                                  <li>
                                    <span className="attribute3">Empire</span>
                                  </li>
                                </ul>
                                <div className="bottom_mid">
                                  <span>
                                    <i className="bi bi-check-circle-fill"></i> Condition New
                                  </span>
                                  <span>
                                    <i className="fa fa-map-marker-alt"></i>{" "}
                                    Victoria
                                  </span>
                                </div>
                                <div className="bottom_button">
                                  <button
                                    className="btn"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setShowContact(true);
                                    }}
                                  >
                                    Contact Dealer
                                  </button>
                                  <button className="btn btn-primary">
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Sidebar filter */}
            <div className="col-lg-3">
              <div className="filter">{/* Filters go here */}</div>
            </div>
          </div>
        </div>
      </section>

      {/* === Info Popup === */}
      {showInfo && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button
              className="close-popup"
              onClick={() => setShowInfo(false)}
            >
              ×
            </button>
            <h4>Description</h4>
            <div className="popup-content">
              <p>Introducing the Explorer 18’6 – one of Australia’s best 18ft off road caravans with an ensuite, built using state-of-the-art 3D modelling technology. This caravan is built to handle any terrain with its 6-inch chassis, TEKO Tuff Ride 3000kg Independent Coil Suspension, and 16 inch all-terrain tyres. Standard features in this caravan include Tuson Sway Control, reverse camera, large dual slide out toolbox & a Victron energy system.</p>
              <p>Choose between a comfortable café dinette lounge or L shape lounge in this popular rear door 18ft 6 caravan layout. Custom built to your needs, from the exterior and interior colours, to every option and upgrade you can think of, every Grand City is built to the highest quality. Plus, with 2 x 200w solar panels and 2 x 110Ah lithium batteries and 2 x 95L fresh water and a 95L grey water tank, you can go off grid and stay off grid for longer. Choose the Explorer for your next adventure where you dare to explore where others won’t!</p>
              <h3>CHASSIS</h3>
              <ul>
                <li>Built by FP Chassis with Australian Made Steel</li>
                <li>One Piece Honeycomb Composite Floor</li>
                <li>6 inch Extended A-Frame</li>
                <li>AL-KO Electronic Stability Control</li>
                <li>TEKO Tuff Ride Coil Suspension</li>
                <li>Cruisemaster DO35</li>
                <li>Corner Drop Down Stabiliser Legs</li>
                <li>Trail Safe Bluetooth Break-Away Safety System</li>
                <li>16 inch Wheels</li>
                <li>All Terrain Tyres (265/75/R16)</li>
                <li>3 Arm Rear Bumper</li>
                <li>Kojack Hydraulic Caravan Jack with Wheel Brace</li>
              </ul>

            </div>

          </div>
        </div>
      )}

      {/* === Contact Dealer Popup === */}
      {showContact && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button
              type="button"
              className="close-popup"
              onClick={() => setShowContact(false)}
            >
              ×
            </button>
            <h4>Contact Dealer</h4>
            <div className="sidebar-enquiry">
              <form className="wpcf7-form" noValidate>
                <div className="form">
                  <div className="form-item">
                    <p>
                      <input
                        id="enquiry2-name"
                        className="wpcf7-form-control"
                        required
                        autoComplete="off"
                        aria-invalid="false"
                        aria-describedby="err-name"
                        type="text"
                        name="enquiry2-name"
                      />
                      <label htmlFor="enquiry2-name">Name</label>
                    </p>
                  </div>

                  <div className="form-item">
                    <p>
                      <input
                        id="enquiry2-email"
                        className="wpcf7-form-control"
                        required
                        autoComplete="off"
                        aria-invalid="false"
                        aria-describedby="err-email"
                        type="email"
                        name="enquiry2-email"
                      />
                      <label htmlFor="enquiry2-email">Email</label>
                    </p>
                  </div>

                  <div className="form-item">
                    <p className="phone_country">
                      <span className="phone-label">+61</span>
                      <input
                        id="enquiry2-phone"
                        inputMode="numeric"
                        className="wpcf7-form-control"
                        required
                        autoComplete="off"
                        aria-invalid="false"
                        aria-describedby="err-phone"
                        type="tel"
                        name="enquiry2-phone"
                      />
                      <label htmlFor="enquiry2-phone">Phone</label>
                    </p>
                  </div>

                  <div className="form-item">
                    <p>
                      <input
                        id="enquiry2-postcode"
                        inputMode="numeric"
                        maxLength="4"
                        className="wpcf7-form-control"
                        required
                        autoComplete="off"
                        aria-invalid="false"
                        aria-describedby="err-postcode"
                        type="text"
                        name="enquiry2-postcode"
                      />
                      <label htmlFor="enquiry2-postcode">Postcode</label>
                    </p>
                  </div>

                  <div className="form-item">
                    <p>
                      <label htmlFor="enquiry4-message">Message (optional)</label>
                      <textarea
                        id="enquiry4-message"
                        name="enquiry4-message"
                        className="wpcf7-form-control wpcf7-textarea"
                      ></textarea>
                    </p>
                  </div>

                  <p className="terms_text">
                    By clicking 'Send Enquiry', you agree to Caravan Marketplace{" "}
                    <a target="_blank" href="/privacy-collection-statement/">
                      Collection Statement
                    </a>
                    ,{" "}
                    <a target="_blank" href="/privacy-policy/">
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a target="_blank" href="/terms-conditions/">
                      Terms and Conditions
                    </a>
                    .
                  </p>

                  <div className="submit-btn">
                    <button type="submit" className="btn btn-primary">
                      Send Enquiry
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
