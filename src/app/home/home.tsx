"use client";

import { useEffect, useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
//  import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./main.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Link from "next/link";
import Image from "next/image";
import BlogSection from "../blogSection";
import PostRequirement from "../postRequirement";
import Manufactures from "../manufacture";
import SearchSection from "../searchSection";
import { fetchSleepBands } from "@/api/homeApi/sleep/api";
import { fetchRegion } from "@/api/homeApi/region/api";
import { fetchManufactures } from "@/api/homeApi/manufacture/api";
import { fetchPriceBasedCaravans } from "@/api/homeApi/price/api";
import { fetchAtmBasedCaravans } from "@/api/homeApi/weight/api";
import { fetchLengthBasedCaravans } from "@/api/homeApi/length/api";
import { fetchUsedCaravansList } from "@/api/homeApi/usedCaravanList/api";
import { fetchStateBasedCaravans } from "@/api/homeApi/state/api";
interface Item {
  label: string;
  capacity: number;
  slug: string;
  permalink: string;
  caravan_count: number;
  starting_price: number;
  display_text: string;
  state: string;
}


/* --------------------------------- Page ---------------------------------- */
export default function HomePage() {
  const [sleepBands, setSleepBands] = useState<Item[]>([]);
  const [regionBands, setRegionBands] = useState<Item[]>([]);
  const [manufactureBands, setManufactureBands] = useState<Item[]>([]);
  const [lengthBands, setLengthBands] = useState<Item[]>([]);
  const [atmBands, setAtmBands] = useState<Item[]>([]);
  const [usedCategoryList, setUsedCategoryList] = useState<Item[]>([]);
  const [priceBands, setPriceBands] = useState<Item[]>([]);
  const [usedState, setUsedState] = useState<Item[]>([]);
  const [usedRegion, setUsedRegion] = useState<Item[]>([]);
  const [adIndex, setAdIndex] = useState<number>(0);
  const [stateBands, setStateBands] = useState<Item[]>([]);

  console.log("add", adIndex)
  const bannerSectionRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    async function loadAll() {
      // const [sleep, region, weight, length] = await Promise.all([
      const [sleep, region, manufactures, weight, length, price, usedData, state] =
        await Promise.all([
          fetchSleepBands(),
          fetchRegion(),
          fetchManufactures(),
          fetchAtmBasedCaravans(),
          fetchLengthBasedCaravans(),
          fetchPriceBasedCaravans(),
          fetchUsedCaravansList(),
          fetchStateBasedCaravans(),
          ,
        ]);

      setSleepBands(sleep);
      setRegionBands(region);
      setManufactureBands(manufactures);
      setAtmBands(weight);
      setLengthBands(length);
      setPriceBands(price);
      setUsedCategoryList(usedData.by_category);
      setUsedState(usedData.by_state);
      setUsedRegion(usedData.by_region);
      setStateBands(state);

    }

    loadAll();
  }, []);

  //  useEffect(() => {
  //   async function loadBands() {
  //     const data = await fetchSleepBands();
  //     setBands(data);
  //   }
  //   loadBands();
  // }, []);

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

  const stateMeta = {
    "victoria": { code: "VIC", image: "/images/vic_map.svg" },
    "new-south-wales": { code: "NSW", image: "/images/nsw_map.svg" },
    "queensland": { code: "QLD", image: "/images/qld_map.svg" },
    "south-australia": { code: "SA", image: "/images/sa_map.svg" },
    "western-australia": { code: "WA", image: "/images/wa_map.svg" },
    "tasmania": { code: "TAS", image: "/images/tas_map.svg" }
  };


  return (
    <div>
      {/* Hero Section */}
      <section className="home_top style-1">
        <SearchSection />
      </section>

      {/* Deal of the Month Section */}
      {/*}<section className="deal-of-month product-details section-padding">
          <FeaturedSection />
        </section> */}
      {/*<section className="post-requirements product-details section-padding">
         <PostRequirement />
       </section> */}
      {/* Caravans by State Section */}
      <section className="caravans_by_state related-products services section-padding style-1">
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="section-head mb-4">
                <h2>Caravans For Sale by State</h2>
              </div>
            </div>
          </div>

          {/* <div className="content">
             <div className="explore-state position-relative">
               <div className="row">
                 {stateBands.map((state, index) => (
                   <div className="col-lg-4" key={index}>
                     <div className="service-box">
                       <div className="sec_left">
                         <h5>{state.state}</h5>
                         <div className="info">
                           <div className="quick_linkss">
                             <p>{state.display_text}</p>
                             <Link
                               className="view_all"
                               href={`/listings/${state.state
                                 .toLowerCase()
                                 .replace(/\s+/g, "-")}-state/`}
                             >
                               View All Caravans For Sale in {state.statecode}{" "}
                               <i className="bi bi-chevron-right" />
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
                   </div>
                 ))}
                   
               </div>
             </div>
           </div> */}
          <div className="content">
            <div className="explore-state position-relative">
              <Swiper
                modules={[Navigation]}
                navigation={{
                  nextEl: ".state-manu-next",
                  prevEl: ".state-manu-prev",
                }}
                //autoplay={{ delay: 3000 }}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 4 },
                   1280: { slidesPerView: 4 },
                }}
              >

                {stateBands.map((item, index) => {
                  const key = item.state.toLowerCase().replace(/\s+/g, "-");

                  const meta = stateMeta[key] || {};
                  const stateCode = meta.code || "";
                  const mapImage = meta.image || "";

                  return (
                    <SwiperSlide key={index}>

                      <div className="service-box">

                        <div className="sec_left">
                          <h5>
                            {item.state}
                          </h5>

                          <div className="info">
                            <div className="quick_linkss">
                              {/* ✔ API BASED DISPLAY TEXT */}
                              <p>{item.display_text}</p>

                              <Link className="view_all" href={`/listings${item.permalink}`}>
                                View All 

                              </Link>
                            </div>
                          </div>
                        </div>

                        <div className="sec_right">
                          <span>
                            <Image
                              src={mapImage}
                              alt={`${item.state} map`}
                              width={100}
                              height={100}
                            />
                          </span>
                        </div>
                      </div>

                    </SwiperSlide>
                  );
                })}

              </Swiper>

              {/* Arrows */}
              <div className="swiper-button-next state-manu-next" />
              <div className="swiper-button-prev state-manu-prev" />
            </div>
          </div>

          <section className="banner_sell_caravan">
            {/* Background Image */}
            <Image
              src="/images/sell-banner.jpg"
              alt="Sell Your Caravan Banner"
              fill
              priority
              className="bgImg"
            />

            {/* Dark overlay */}
            <div className="overlay" />

            {/* Content */}
            <div className="content">
              <h2 className="title">Sell Your Caravan Today!</h2>

              <p className="desc">
                Reach thousands of potential buyers in minutes.
                <br />
                List your caravan for sale on CaravansForSale.com.au,
                <br />
                the trusted marketplace for Aussie caravan owners.
              </p>

              <Link href="#" className="btn">
                SELL YOUR CARAVAN
              </Link>
            </div>
          </section>


          {/* Quick Links Section */}
          <div className="faq listing_links style-4 pt-4">
            <div className="row">
              <div className="col">
                <div className="section-head mb-4">
                  <h2>Browse Caravans by Popular Searches</h2>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-12">
                <div
                  className="accordion faq style-3 style-4"
                  id="accordionFaq"
                >
                  



                  {/* Item 2 */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="headingTwo">
                      <button
                        className="accordion-button rounded-0 py-4 collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseTwo"
                        aria-expanded="false"
                        aria-controls="collapseTwo"
                      >
                        Caravans By Popular Region
                      </button>
                    </h3>
                    <div
                      id="collapseTwo"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingTwo"
                      data-bs-parent="#accordionFaq"
                    >
                      <div className="accordion-body">
                        <ul>
                          {regionBands.map((item, index) => (
                            <li key={index}>
                              <Link
                                href={`https://www.caravansforsale.com.au/listings/${item.permalink}`}
                              >
                                {item.label}
                              </Link>
                              <span>{item.display_text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="headingThree">
                      <button
                        className="accordion-button rounded-0 py-4 collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseThree"
                        aria-expanded="false"
                        aria-controls="collapseThree"
                      >
                        Caravans By Price
                      </button>
                    </h3>
                    <div
                      id="collapseThree"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingThree"
                      data-bs-parent="#accordionFaq"
                    >
                      <div className="accordion-body">
                        <ul>
                          {priceBands.map((item, index) => (
                            <li key={index}>
                              <Link
                                href={`https://www.caravansforsale.com.au/listings/${item.permalink}/`}
                              >
                                {item.label}
                              </Link>
                              <span>{item.display_text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="headingFour">
                      <button
                        className="accordion-button rounded-0 py-4 collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseFour"
                        aria-expanded="false"
                        aria-controls="collapseFour"
                      >
                        Caravans By Weight
                      </button>
                    </h3>
                    <div
                      id="collapseFour"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingFour"
                      data-bs-parent="#accordionFaq"
                    >
                      <div className="accordion-body">
                        <ul>
                          {atmBands.map((item, index) => (
                            <li key={index}>
                              <Link
                                href={`https://www.caravansforsale.com.au/listings/${item.permalink}`}
                              >
                                {item.label}
                              </Link>
                              <span>{item.display_text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Item 5 */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="headingFive">
                      <button
                        className="accordion-button rounded-0 py-4 collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseFive"
                        aria-expanded="false"
                        aria-controls="collapseFive"
                      >
                        Caravans By Sleep
                      </button>
                    </h3>
                    <div
                      id="collapseFive"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingFive"
                      data-bs-parent="#accordionFaq"
                    >
                      <div className="accordion-body">
                        <ul>
                          {sleepBands.map((item, index) => (
                            <li key={index}>
                              <Link
                                href={`https://www.caravansforsale.com.au/listings/${item.permalink}`}
                              >
                                {item.label}
                              </Link>
                              <span>{item.display_text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Item 6 */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="headingSix">
                      <button
                        className="accordion-button rounded-0 py-4 collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseSix"
                        aria-expanded="false"
                        aria-controls="collapseSix"
                      >
                        Caravans By Length
                      </button>
                    </h3>
                    <div
                      id="collapseSix"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingSix"
                      data-bs-parent="#accordionFaq"
                    >
                      <div className="accordion-body">
                        <ul>
                          {lengthBands.map((item, index) => (
                            <li key={index}>
                              <Link
                                href={`https://www.caravansforsale.com.au/listings/${item.permalink}`}
                              >
                                {item.label}
                              </Link>
                              <span>{item.display_text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Item 7 */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="headingSeven">
                      <button
                        className="accordion-button rounded-0 py-4 collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseSeven"
                        aria-expanded="false"
                        aria-controls="collapseSeven"
                      >
                        Caravans By Used Condition
                      </button>
                    </h3>
                    <div
                      id="collapseSeven"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingSeven"
                      data-bs-parent="#accordionFaq"
                    >
                      <div className="accordion-body">
                        <ul>
                          {usedCategoryList.map((item, index) => (
                            <li key={index}>
                              <Link
                                href={`https://www.caravansforsale.com.au/listings/${item.permalink}`}
                              >
                                {item.label}
                              </Link>
                              <span>{item.display_text}</span>
                            </li>
                          ))}
                        </ul>

                        <hr></hr>

                        <ul>
                          {usedState.map((item, index) => (
                            <li key={index}>
                              <Link
                                href={`https://www.caravansforsale.com.au/listings/${item.permalink}`}
                              >
                                {item.label}
                              </Link>
                              <span>{item.display_text}</span>
                            </li>
                          ))}
                        </ul>
                        <hr></hr>
                        <ul>
                          {usedRegion.map((item, index) => (
                            <li key={index}>
                              <Link
                                href={`https://www.caravansforsale.com.au/listings/${item.permalink}`}
                              >
                                {item.label}
                              </Link>
                              <span>{item.display_text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* Item 1 */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="headingOne">
                      <button
                        className="accordion-button rounded-0 collapsed py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseOne"
                        aria-expanded="true"
                        aria-controls="collapseOne"
                      >
                        Caravans By Popular Manufacturers
                      </button>
                    </h3>
                    <div
                      id="collapseOne"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingOne"
                      data-bs-parent="#accordionFaq"
                    >
                      <div className="accordion-body">
                        <ul>
                          {manufactureBands.map((item, index) => (
                            <li key={index}>
                              <Link
                                href={`https://www.caravansforsale.com.au/listings/${item.permalink}/`}
                              >
                                {item.label}
                              </Link>
                              <span>{item.display_text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="banner_ads_ls" ref={bannerSectionRef}>
             {[
               { name: "masterpiece", mobile: "masterpiece-m" },
               { name: "orbit", mobile: "orbit-m" },
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
           </div> */}
        </div>
      </section>

      {/* Caravans by Manufacturer Section */}
      <section className="caravans_by_manufacturer related-products section-padding">
        <Manufactures />
      </section>

      {/* Latest Blog Section */}
      <BlogSection />
    </div>

  );
}
