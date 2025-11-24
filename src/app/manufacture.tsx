"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import Link from "next/link";

const data = [
  {
    img: "/images/australian-offroad.png",
    alt: "Australian Off Road Logo",
    title: "Australian Off Road",
    desc: "Discover Australian Off Road (AOR) caravans with our guide. Explore top models like Sierra ZR and Aurora, their features, and pricing for your next rugged adventure.",
    type: "Off Road, Hybrid, Campers",
    link: "/aor-caravans-australia-reviews-prices-models/",
  },
  {
    img: "/images/vibe_caravans.png",
    alt: "Vibe Caravans Logo",
    title: "Vibe Caravans",
    desc: "Check out VIBE Caravans Australia’s top models: VIBE’N, MARLO, TOUGH, and OG. Features, off-grid capabilities and prices from $92,990. For adventure seekers and off-road enthusiasts.",
    type: "Off Road, Hybrid, Semi Off Road",
    link: "/vibe-caravans-australia-review-prices-models/",
  },
  {
    img: "/images/Ezytrail.png",
    alt: "Ezytrail Logo",
    title: "Ezytrail Caravans",
    desc: "Read genuine Ezytrail Caravans reviews from Australian owners. Discover towing performance, comfort, and durability before you buy your next van.",
    type: "Off Road, Hybrid, On Road",
    link: "/ezytrail-caravans-reviews-2025/",
  },
  {
    img: "/images/Avan.png",
    alt: "Avan Logo",
    title: "Avan Caravans",
    desc: "Discover Avan Caravans: detailed 2025 review of models, features, and prices ($38K-$109K). Your guide to caravans for sale in Australia starts here!",
    type: "Campers, Pop Tops, Hard Tops",
    link: "/avan-caravans-review-features-prices/",
  },
  {
    img: "/images/blue_sky.png",
    alt: "Blue Sky Logo",
    title: "Blue Sky Caravans",
    desc: "Find your perfect Blue Sky Caravan! Compare off-road models, explore standout features, and discover why Blue Sky Caravans is a top choice for Australian travelers.",
    type: "Off-Road, Touring, Family, Luxury",
    link: "/blue-sky-caravans-review-australia/",
  },
  {
    img: "/images/Crusader-Caravans.png",
    alt: "Crusader Caravans Logo",
    title: "Crusader Caravans",
    desc: "Looking for a Crusader Caravan? Explore our in-depth reviews, key features, and price comparisons to find the perfect model for your adventures.",
    type: "Off-Road, Touring, Family, Luxury",
    link: "/crusader-caravans-review-features-compare-prices/",
  },
  {
    img: "/images/JB-caravans.png",
    alt: "JB Caravans Logo",
    title: "JB Caravans",
    desc: "Explore JB Caravans&#x27; latest models, prices, and reviews for 2025. From off-road adventures to luxury touring, find the perfect caravan for your journey. Learn more!",
    type: "Off-Road, Hybrid, On-Road",
    link: "/jb-caravans-australia-models-reviews-prices/",
  },
  {
    img: "/images/MDC.png",
    alt: "MDC Caravans Logo",
    title: "MDC Caravans",
    desc: "Discover MDC Caravans Australia – read reviews, explore key features, and compare off-road caravan models. Find the perfect adventure-ready caravan today!",
    type: "Off-Road, Hybrid, On-Road",
    link: "/mdc-caravans-australia-reviews-features/",
  },
  {
    img: "/images/Latitude.png?=1647112222",
    alt: "Latitude RV Caravans Logo",
    title: "Latitude RV Caravans",
    desc: "From rugged design to luxury finishes—uncover the best Latitude RV caravans. Detailed reviews, pricing, and comparisons for every adventurer.",
    type: "Off-Road, Hybrid, On-Road",
    link: "/latitude-rv-caravans-models-reviews-prices-features/",
  },
  {
    img: "/images/Adria.png",
    alt: "Adria Caravans Logo",
    title: "Adria Caravans",
    desc: "Find your perfect Adria Caravan! Compare off-road models, explore standout features, and discover why Adria Caravans is a top choice for Australian travelers.",
    type: "Compact, Touring, Family, Luxury",
    link: "/adria-caravans-review-australia/",
  },
  {
    img: "/images/Fantasy-Caravans.png",
    alt: "Fantasy Caravans Logo",
    title: "Fantasy Caravans",
    desc: "Fantasy Caravans offers Australian-made models for families, from compact to off-road hybrids. Enjoy comfort, durability, and style on your next holiday.",
    type: "Semi Off-Road, Hybrid, Off-Road, Small Caravans",
    link: "/fantasy-caravans-review-models-prices/",
  },
  {
    img: "/images/Red-Centre-Caravans.png",
    alt: "Red Centre Caravans Logo",
    title: "Red Centre Caravans",
    desc: "Explore our detailed review of Red Centre Caravans, designed for Australian adventures. Discover models for sale, features, and why they&#x27;re perfect for your next journey.",
    type: "Off-Road, Semi Off-Road, Touring, Hybrid",
    link: "/red-centre-caravans-review-australia/",
  },
  {
    img: "/images/urban-caravans.png?=1647112222",
    alt: "Urban Caravans Logo",
    title: "Urban Caravans",
    desc: "Experience the Urban Caravans Tungsten Tourer from $94,990. A premium semi off-road caravan with durability, luxury features, and advanced amenities.",
    type: "Off-Road, Off-Grid, Hybrid, On-Road",
    link: "/urban-caravans-australia-review-prices-models/",
  },
  {
    img: "/images/Vision_Logo.png",
    alt: "Vision RV Caravans Logo",
    title: "Vision RV Caravans",
    desc: "Looking for a tough off-road caravan? Read our Vision RV Caravans review, explore key features, and compare models available in Australia.",
    type: "Off-Road, Family, Luxury",
    link: "/vision-rv-caravans-review-australia/",
  },
  {
    img: "/images/Trakmaster.png",
    alt: "Trakmaster Logo",
    title: "Trakmaster",
    desc: "Explore the off-road capabilities of the Trakmaster Pilbara Extreme caravan. Find out why it&#x27;s built for adventure in our in-depth review.",
    type: "Off-Road, Camper",
    link: "/trakmaster-pilbara-extreme-review/",
  },
  {
    img: "/images/Austrack-Campers.png",
    alt: "Austrack Campers Logo",
    title: "Austrack Campers",
    desc: "Thinking about investing in the Gibb 14 by Austrack Campers? Discover its key features and performance details in this thorough review.",
    type: "Off-Road, Hybrid",
    link: "/austrack-campers-gibb-14-in-depth-review/",
  },
  {
    img: "/images/newgen-logo.png?=1647112222",
    alt: "Newgen Caravans Logo",
    title: "Newgen Caravans",
    desc: "Explore the Newgen Caravans NG15, offering a spacious layout and premium features. Read our review of this exceptional off-road hybrid caravan!",
    type: "Off-Road, Hybrid",
    link: "/newgen-caravans-ng15-comprehensive-review/",
  },
];

const Manufacture = () => {
  return (
    <div className="container">
      <div className="section-head mb-40">
        <h2>High-Quality Caravans for Sale – Without the Big Brand Price Tag</h2>
        <p>
          Discover the best caravan manufacturers offering premium craftsmanship,
          clever layouts, and unbeatable value.
        </p>
      </div>

      <div className="range-home position-relative">

        <Swiper
          modules={[Navigation, Autoplay]}
          navigation={{
            nextEl: ".manu-next",
            prevEl: ".manu-prev",
          }}
          autoplay={{ delay: 3000 }}
          spaceBetween={20}
          slidesPerView={1}
          breakpoints={{
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {data.map((item, index) => (
            <SwiperSlide key={index}>
              <div className="post_item">
                <div className="post_image">
                  <Image
                    src={item.img}
                    alt={item.alt}
                    width={300}
                    height={200}
                    style={{ objectFit: "contain" }}
                  />
                </div>

                <div className="post_info">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>

                  <ul className="mb-3">
                    <li>
                      <i className="bi bi-info-circle" />
                      <span>{item.type}</span>
                    </li>
                  </ul>

                  <Link href={item.link} target="_blank">
                    View Review <i className="bi bi-chevron-right" />
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Arrows */}
        <div className="swiper-button-next manu-next" />
        <div className="swiper-button-prev manu-prev" />
      </div>
    </div>
  );
};

export default Manufacture;
