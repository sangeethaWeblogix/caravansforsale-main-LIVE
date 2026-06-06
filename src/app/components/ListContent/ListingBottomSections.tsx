"use client";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import { fetchStateBasedCaravans } from "@/api/homeApi/state/api";
import { fetchRegion } from "@/api/homeApi/region/api";
import { fetchManufactures } from "@/api/homeApi/manufacture/api";
import { fetchPriceBasedCaravans } from "@/api/homeApi/price/api";
import { fetchAtmBasedCaravans } from "@/api/homeApi/weight/api";
import { fetchLengthBasedCaravans } from "@/api/homeApi/length/api";
import { fetchSleepBands } from "@/api/homeApi/sleep/api";
import CaravansByStateSkeleton from "../Caravansbystateskeleton";
import TabCardSkeleton from "../TabCardSkeleton";
import "../../home/main.css?=4";

type TabsItem = {
  caravan_count?: string;
  permalink?: string;
  short_label?: string;
  state?: string;
  region?: string;
  display_text?: string;
};

const stateMeta: Record<string, { code: string; image: string }> = {
  victoria: { code: "VIC", image: "/images/vic_map.svg?=1" },
  "new-south-wales": { code: "NSW", image: "/images/nsw_map.svg?=1" },
  queensland: { code: "QLD", image: "/images/qld_map.svg?=1" },
  "south-australia": { code: "SA", image: "/images/sa_map.svg?=1" },
  "western-australia": { code: "WA", image: "/images/wa_map.svg?=1" },
  tasmania: { code: "TAS", image: "/images/tas_map.svg?=1" },
};

export default function ListingBottomSections() {
  const [stateBands, setStateBands] = useState<TabsItem[]>([]);
  const [regionBands, setRegionBands] = useState<TabsItem[]>([]);
  const [priceBands, setPriceBands] = useState<TabsItem[]>([]);
  const [atmBands, setAtmBands] = useState<TabsItem[]>([]);
  const [lengthBands, setLengthBands] = useState<TabsItem[]>([]);
  const [sleepBands, setSleepBands] = useState<TabsItem[]>([]);
  const [manufactureBands, setManufactureBands] = useState<TabsItem[]>([]);
  const [activeTab, setActiveTab] = useState("Region");
  const [isTabsLoading, setIsTabsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchStateBasedCaravans(),
      fetchRegion(),
      fetchPriceBasedCaravans(),
      fetchAtmBasedCaravans(),
      fetchLengthBasedCaravans(),
      fetchSleepBands(),
      fetchManufactures(),
    ])
      .then(([states, regions, prices, atm, lengths, sleeps, manufactures]) => {
        setStateBands(states);
        setRegionBands(regions);
        setPriceBands(prices);
        setAtmBands(atm);
        setLengthBands(lengths);
        setSleepBands(sleeps);
        setManufactureBands(manufactures);
        setIsTabsLoading(false);
      })
      .catch(() => setIsTabsLoading(false));
  }, []);

  const tabsData = [
    {
      key: "Region",
      label: "Location",
      cards: regionBands.map((item) => ({
        title: "Caravans for Sale in " + item.region,
        sub: `${item.caravan_count ?? 0}`,
        url: `/listings/${item.permalink}`,
      })),
    },
    {
      key: "price",
      label: "Price",
      cards: priceBands.map((item) => ({
        title: "Caravans for Sale " + item.short_label,
        sub: `${item.caravan_count ?? 0}`,
        url: `/listings/${item.permalink}`,
      })),
    },
    {
      key: "Weight",
      label: "Weight",
      cards: atmBands.map((item) => ({
        title: "Caravans for Sale " + item.short_label,
        sub: `${item.caravan_count ?? 0}`,
        url: `/listings/${item.permalink}`,
      })),
    },
    {
      key: "Sleep",
      label: "Sleep",
      cards: sleepBands.map((item) => ({
        title: "Caravans for Sale " + item.short_label,
        sub: `${item.caravan_count ?? 0}`,
        url: `/listings/${item.permalink}`,
      })),
    },
    {
      key: "Length",
      label: "Length",
      cards: lengthBands.map((item) => ({
        title: "Caravans for Sale " + item.short_label,
        sub: `${item.caravan_count ?? 0}`,
        url: `/listings/${item.permalink}`,
      })),
    },
    {
      key: "Manufacturer",
      label: "Manufacturer",
      cards: manufactureBands.map((item) => ({
        title: item.short_label + " Caravans for Sale",
        sub: `${item.caravan_count ?? 0}`,
        url: `/listings/${item.permalink}`,
      })),
    },
  ];

  return (
    <>
      {/* Browse Caravans by State */}
      <div className="caravans_by_state related-products services section-padding style-1 ">
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="section-head mb-2 py-2">
                <h2>Browse Caravans for sale in Australia by State</h2>
              </div>
            </div>
          </div>
          {stateBands.length === 0 ? (
            <CaravansByStateSkeleton count={4} />
          ) : (
            <div className="content">
              <div className="explore-state position-relative">
                <Swiper
                  modules={[Navigation]}
                  navigation={{
                    nextEl: ".listing-state-next",
                    prevEl: ".listing-state-prev",
                  }}
                  spaceBetween={20}
                  slidesPerView={1}
                  breakpoints={{
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 4 },
                    1280: { slidesPerView: 4 },
                  }}
                >
                  {stateBands.map((item, index) => {
                    const key = (item.state || "")
                      .toLowerCase()
                      .replace(/\s+/g, "-");
                    const meta = stateMeta[key] || {};
                    const stateCode = meta.code || "";
                    const mapImage = meta.image || "";
                    return (
                      <SwiperSlide key={index}>
                        <div className="service-box">
                          <div className="sec_right">
                            <span>
                              {mapImage && (
                                <Image
                                  src={mapImage}
                                  alt={`${item.state} map`}
                                  width={100}
                                  height={100}
                                />
                              )}
                            </span>
                          </div>
                          <div className="sec_left">
                            <h3>{item.state}</h3>
                            <div className="info">
                              <div className="quick_linkss">
                                <p>{item.display_text}</p>
                                <a
                                  className="view_all"
                                  href={`/listings${item.permalink}`}
                                >
                                  View All Caravans for Sale in {stateCode}{" "}
                                  <i className="bi bi-chevron-right"></i>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
                <div className="swiper-button-next listing-state-next" />
                <div className="swiper-button-prev listing-state-prev" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popular Caravan Searches */}
      <div className="quick_links_tabs pb-5">
        <div className="container">
          <div className="section-head mb-2 py-2">
            <h2>Popular Caravan Searches Across Australia</h2>
          </div>
          <div className="custom-tabs-wrap">
            <div className="custom-tabs-top">
              <div className="custom-tabs-nav">
                {tabsData.map((tab) => (
                  <button
                    key={tab.key}
                    className={`custom-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="custom-tabs-content">
              {tabsData.map((tab) => (
                <div
                  key={tab.key}
                  className="custom-card-grid"
                  style={{ display: activeTab === tab.key ? "grid" : "none" }}
                >
                  {isTabsLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <TabCardSkeleton key={i} />
                      ))
                    : tab.cards?.map((item, index) => (
                        <a href={item.url} className="custom-card" key={index}>
                          <h4 className="custom-card-title">
                            <span className="count">{item.sub}</span>{" "}
                            {item.title}
                          </h4>
                        </a>
                      ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
