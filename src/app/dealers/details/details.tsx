"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const DealerSection = () => {
  return (
    <section className="dealers_section section-padding">
      <div className="container">
        <div className="row">
          <div className="col-lg-9">
            <div className="dealer_list_home dealer_details_single">
              <div className="row">
                <div className="col-lg-8">
                  <div className="dealer_li_top">
                    <div className="dealer_ll_left">
                      <div className="dealer_thumb">
                        <Image
                          src="https://www.caravansforsale.com.au/wp-content/uploads/2024/04/GOLF_SUPER_CENTRE.png"
                          alt="Golf Super Centre"
                          width={300}
                          height={100}
                        />
                      </div>
                    </div>
                    <div className="dealer_ll_right">
                      <h1>Golf Super Centre</h1>
                    </div>
                  </div>

                  <div className="dealer_about">
                    <p>
                      Welcome to the Golf Super Centre, the mecca for caravan
                      enthusiasts! Their main dealership has the biggest range
                      of Golf Caravans, Campers and Maxxi’s on display.
                    </p>
                    {/* ... (other content can follow same structure) */}

                    <h2>Premium Brands</h2>
                    <ul>
                      <li>Avan: Innovative and stylish caravans.</li>
                      <li>Golf: Durable and versatile models.</li>
                      <li>
                        Jayco: Wide range of family and adventure options.
                      </li>
                      <li>SWIFT: Compact and luxurious.</li>
                    </ul>

                    <h2>Finance and Insurance</h2>
                    <p>
                      Ready to hit the road? Don’t let finance hold you back.
                    </p>

                    <div className="side-tags">
                      <h6 className="title mb-2">Brands We Sell</h6>
                      <div className="content">
                        <Link href="/listings/avan">Avan</Link>
                        <Link href="/listings/golf">Golf</Link>
                      </div>
                    </div>
                    <div className="side-tags">
                      <h6 className="title mb-2">
                        Type of Caravans we most sell
                      </h6>
                      <div className="content">
                        <Link href="/listings/luxury-category">Luxury</Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-4 bl-lg">
                  <div className="dealer_info_right">
                    <h4>Business contact details</h4>
                    <p>
                      <strong>Address :</strong> 1 Reynolds Court, Burpengary,
                      Queensland 4505
                    </p>
                    <p>
                      <strong>Website :</strong>
                      <a
                        href="https://www.golfsupercentre.com.au/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {" "}
                        https://www.golfsupercentre.com.au/
                      </a>
                    </p>

                    <div className="dealer_map">
                      <iframe
                        src="https://maps.google.com/maps?&q=Golf+Super+Centre,+1+Reynolds+Court,+Burpengary+Queensland+4505&z=14&output=embed"
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>

                    <div className="working_hours mt-3">
                      <h4>Opening hours</h4>
                      <ul>
                        {[
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                        ].map((day, i) => (
                          <li key={i}>
                            <strong>{day}:</strong> 9:00 am -{" "}
                            {day === "Saturday" ? "4:00 pm" : "5:00 pm"}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <a
                      className="btn rounded-pill bg-blue4 text-white mt-20"
                      href="https://www.caravansforsale.com.au/burpengary/qld/new-used/golf-super-centre"
                      target="_blank"
                    >
                      View Our Caravan Listings
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="title mt-5 tpof_tab">
              <h4 style={{ fontWeight: 600 }}>
                Recent Caravan Listings by Golf Super Centre
              </h4>
            </div>

            <div className="dealer-list position-relative">
              <Swiper
                modules={[Navigation]}
                navigation
                spaceBetween={30}
                slidesPerView={1}
                breakpoints={{
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
              >
                {[
                  // Example listings array
                  {
                    title:
                      "2023 Golf Tourer 556 Touring with Toilet and Shower",
                    location: "Queensland",
                    image:
                      "https://www.caravansforsale.com.au/wp-content/uploads/2024/08/golf-tourer-556-2023-new-on-road-caravan-4505-main-1.jpg",
                    price: "83,755",
                    link: "/product/2023-golf-tourer-556-touring-with-toilet-and-shower-single-axle/",
                  },
                  {
                    title: "2023 Golf Tourer 650 Touring Family with Bunk Beds",
                    location: "Queensland",
                    image:
                      "https://www.caravansforsale.com.au/wp-content/uploads/2024/08/golf-tourer-650-2023-new-on-road-caravan-4505-main-1.jpg",
                    price: "92,355",
                    link: "/product/2023-golf-tourer-650-touring-family-with-bunk-beds-cafe-lounge/",
                  },
                  {
                    title: "2023 Golf Tourer 650 Touring Family with Bunk Beds",
                    location: "Queensland",
                    image:
                      "https://www.caravansforsale.com.au/wp-content/uploads/2024/08/golf-tourer-650-2023-new-on-road-caravan-4505-main-1.jpg",
                    price: "92,355",
                    link: "/product/2023-golf-tourer-650-touring-family-with-bunk-beds-cafe-lounge/",
                  },
                  {
                    title: "2023 Golf Tourer 650 Touring Family with Bunk Beds",
                    location: "Queensland",
                    image:
                      "https://www.caravansforsale.com.au/wp-content/uploads/2024/08/golf-tourer-650-2023-new-on-road-caravan-4505-main-1.jpg",
                    price: "92,355",
                    link: "/product/2023-golf-tourer-650-touring-family-with-bunk-beds-cafe-lounge/",
                  },
                ].map((listing, index) => (
                  <SwiperSlide key={index}>
                    <Link href={listing.link} target="_blank">
                      <div className="product-card">
                        <div className="img">
                          <Image
                            src={listing.image}
                            alt={listing.title}
                            width={500}
                            height={375}
                          />
                        </div>
                        <div className="product_de">
                          <div className="info">
                            <h6 className="category">
                              <i className="fa fa-map-marker-alt"></i>
                              <span>{listing.location}</span>
                            </h6>
                            <h3 className="title">{listing.title}</h3>
                          </div>
                          <ul className="vehicleDetailsWithIcons simple">
                            <li>
                              <span className="attribute3">New</span>
                            </li>
                          </ul>
                          <div className="price">
                            <span className="woocommerce-Price-amount amount">
                              <bdi>
                                <span className="woocommerce-Price-currencySymbol">
                                  $
                                </span>
                                {listing.price}
                              </bdi>
                            </span>
                          </div>
                          <span className="btn rounded-pill bg-blue4 text-white mt-20">
                            View Details
                          </span>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <hr />
          </div>

          <div className="col-lg-3 col-md-3 rightbar-stick">
            <div className="theiaStickySidebar">
              <p>Information</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DealerSection;
