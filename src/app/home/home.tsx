"use client";

import { useEffect, useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
//  import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./main.css?=6";
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
      
      <section className="caravans_by_state related-products services section-padding style-1">
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="section-head mb-4">
                <h2>Explore all things caravans</h2>
              </div>
            </div>
          </div>

          <div className="content explore_tab">
            <ul className="nav nav-pills" id="pills-tab-2" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className="nav-link active"
                  id="pills-buy-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#pills-buy"
                  type="button"
                  role="tab"
                  aria-controls="pills-buy"
                  aria-selected="true"
                >
                  <span><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 500 500" width="24" height="24" fill="currentColor" >
                    <g>
                      <path d="M32.7,267.3c1.9-8.3,4.3-16.4,9.5-23.4c7.4-10.1,17.1-16.9,29.3-19.9c64.3-16.1,128.6-32.2,192.9-48.1
		c37.3-9.2,70.9,24.2,61.7,61.5c-14.8,60.2-30,120.2-45,180.3c-1.1,4.4-2,8.8-3.3,13.2c-6.4,20.9-20.3,33.5-41.9,37.3
		c-0.7,0.1-1.3,0.4-2,0.7c-3.7,0-7.4,0-11.1,0c-0.7-0.2-1.3-0.6-2-0.7c-18.5-3.1-31.5-13.4-39.3-30.3c-3.7-8.1-7.1-16.3-10.7-24.5
		c-1-2.2-2-4.5-3.3-7.4c-8.6,8.7-16.3,16.9-24.5,24.8c-18.4,17.6-47.2,18.7-66.9,2.9c-19.9-16-25-43.8-12.1-65.8
		c2.6-4.4,5.9-8.3,9.6-11.9c7.2-7.1,14.4-14.3,22-21.8c-11.3-4.9-22.1-9.3-32.6-14.2c-15.2-7-24.8-18.8-28.9-35.1
		c-0.4-1.6,0-3.4-1.3-4.8C32.7,275.8,32.7,271.5,32.7,267.3z M275.3,208.5c-0.6,0.1-2.1,0.2-3.6,0.6c-63.5,15.8-127,31.6-190.5,47.5
		c-8.5,2.1-13.7,7.8-14.3,15.3c-0.7,7.8,3.6,14.2,11.8,17.8c17.3,7.5,34.6,15,51.9,22.4c3.9,1.7,7.2,4,9.4,7.7
		c4,6.8,2.8,15.2-3.4,21.3c-13.3,13.4-26.7,26.6-40,40c-7.9,8-7.4,19.6,1.1,26.1c7,5.4,16.2,4.6,23.1-2.2
		c13.2-13.1,26.3-26.2,39.5-39.4c2.7-2.7,5.5-4.8,9.3-5.7c8.6-1.9,16.2,2.1,19.9,10.6c7.8,17.8,15.4,35.6,23.1,53.4
		c2.8,6.4,7.7,10.1,14.6,10.7c6.4,0.5,11.6-2.2,15.3-7.5c1.9-2.6,2.5-5.7,3.3-8.7c8.1-32.4,16.2-64.8,24.4-97.1
		c7.6-30.5,15.3-60.9,22.8-91.4C295.7,218.5,287.7,208.4,275.3,208.5z"/>
                      <path d="M468.8,215.4c-3.8,10.2-11.4,13.6-22,13.4c-20-0.4-40-0.1-59.9-0.1c-2.8,0-5.7,0-8.4-0.9c-7.7-2.4-12.7-10.2-11.8-18.1
		c0.9-8,7.3-14.5,15.5-14.9c9.2-0.4,18.4-0.2,27.6-0.2c12.5,0,25,0.4,37.4-0.1c10.5-0.4,17.8,3.2,21.6,13.2
		C468.8,210.3,468.8,212.9,468.8,215.4z"/>
                      <path d="M359.9,165.3c-5.4-0.2-10.7-3.4-13.8-9.9c-3.1-6.5-1.9-13.5,3.2-18.8c8.6-8.8,17.4-17.4,26.1-26.2
		c7.1-7.1,14.2-14.2,21.4-21.3c7.5-7.4,18.2-7.7,25-0.8c6.9,7,6.5,17.3-1.1,25c-15.4,15.4-30.9,30.8-46.3,46.2
		C370.9,163.1,366.8,165.3,359.9,165.3z"/>
                      <path d="M234,148.6c-0.3,7.2-3.6,12.5-10.2,15.3c-6.8,2.9-13.2,1.8-18.5-3.3c-7.5-7.2-14.7-14.6-22-21.9
		c-8.4-8.4-16.9-16.8-25.3-25.3c-7.8-7.8-8.1-18.3-1-25.3c7-6.8,17.4-6.4,25,1.2c15.4,15.3,30.7,30.7,46.1,46
		C231.8,139,234.1,143.2,234,148.6z"/>
                      <path d="M306.2,84.9c0,10.9,0.1,21.8,0,32.7c-0.1,10.4-7.2,17.9-16.9,17.9c-9.7,0-17-7.5-17.1-17.8c-0.1-22.1-0.1-44.1,0-66.2
		c0-10.3,7.4-17.9,17-17.9c9.7,0,16.9,7.5,17,17.9C306.3,62.6,306.2,73.7,306.2,84.9z"/>
                      <path d="M418.8,331.3c0,7.2-3.1,12.6-9.5,15.7c-6.6,3.2-13.3,2.6-18.6-2.6c-16.7-16.3-33.2-32.8-49.6-49.5
		c-6.3-6.4-5.9-16.7,0.4-23c6.4-6.5,16.8-7.3,23.4-0.9c16.7,16.3,33.2,32.9,49.7,49.5C417.4,323.4,418.8,327.1,418.8,331.3z"/>
                    </g>
                  </svg> Buying</span>
                </button>
              </li>

              <li className="nav-item" role="presentation">
                <button
                  className="nav-link"
                  id="pills-sell-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#pills-sell"
                  type="button"
                  role="tab"
                  aria-controls="pills-sell"
                  aria-selected="false"
                >
                  <span><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 500 500" width="24" height="24" fill="currentColor" >
                    <g>
                      <path d="M308.5,472.9c-21.1-4.6-37.3-18.8-55.7-28.6c-3.2-1.7-5.9-2.5-9.7-1.9c-18.1,3.3-34-1.5-47.1-14.5
		C145.9,378,95.8,328,45.9,277.7c-21.5-21.6-20.8-53.7,1-75.6c40.3-40.4,80.6-80.7,121-121c6.3-6.3,12.5-12.5,18.8-18.8
		c12.2-12,26.8-17.1,43.9-15.7c29.9,2.4,59.9,4.4,89.9,6.5c4.3,0.3,8.7,0.5,13,0.9c2.2,0.2,3.1-0.4,3-2.8c-0.2-3.9-0.1-7.8,0-11.8
		c0.2-7.3,5.5-12.5,12.4-12.5c6.7,0,11.8,5,12.2,12.2c0.2,3.9,0.3,7.9,0,11.7c-0.3,4.1,1,5.4,5.2,5.7c22.6,1.6,39.3,13.4,52,31.5
		c4,5.6,5.5,12.4,7.6,18.9c13.6,40.7,27,81.4,40.7,122c5.8,17,4.1,32.9-5.1,48.4c-33,55.4-66,110.9-98.8,166.5
		c-9.2,15.6-21.8,25.7-39.9,28.5c-0.4,0.1-0.8,0.4-1.2,0.6C317.2,472.9,312.9,472.9,308.5,472.9z M225.6,71.1
		c-7.5-0.8-15.5,2.6-22.4,9.6C157,127,110.6,173.2,64.4,219.5c-12.7,12.7-12.6,29.2,0.1,42c49.3,49.3,98.5,98.5,147.8,147.8
		c1.8,1.8,3.8,3.6,6,5c11.7,7.6,25.5,5.6,36.3-5.2c45.5-45.5,90.8-91.1,136.5-136.3c9.2-9.1,12.5-19.1,11.3-31.7
		c-2.1-22.5-3.4-45.1-5.1-67.7c-1.6-22.1-3-44.3-5-66.4c-1.3-15-12-24.8-27-25.8c-1.4-0.1-3.8-1.5-4.2,1.4c-0.3,2.3-0.2,4.2,2.7,5.5
		c17,7.3,26,22.4,24.8,40.9c-1.5,21.9-21.8,38.1-44.8,35.8c-21.2-2.2-37.8-22.9-34.9-43.9c2.1-15.5,10.3-26.5,24.6-32.8
		c1.6-0.7,2.8-1.2,3-3.5c0.4-4.3-1.1-5.6-5.3-5.9C296.8,76.3,262.3,73.7,225.6,71.1z M423.4,177.8c-0.3,0.1-0.6,0.2-1,0.2
		c1.4,19.1,2.1,38.3,4.3,57.2c2.6,22.5-3.4,40.8-20,56.9c-44.4,43.4-88,87.7-132,131.5c-2.6,2.6-2.5,3.7,0.7,5.4
		c8.3,4.7,16.5,9.7,24.7,14.5c14.9,8.7,30.8,4.6,39.8-10.2c4.7-7.7,9.2-15.4,13.8-23.2c28.8-48.5,57.5-97.1,86.4-145.5
		c5.4-9.1,6.6-18.3,2.9-28.3c-2.8-7.5-5.1-15.1-7.6-22.7C431.5,201.9,427.4,189.9,423.4,177.8z M361.1,116.7c0,3.3,0.1,5.6,0,8
		c-0.3,7.4-5.4,12.6-12.2,12.7c-6.9,0-12.2-5.4-12.4-13c-0.1-2.3,0-4.6,0-8c-4.7,7.6-3.3,15.7,2.6,20.5c6,4.9,14.7,4.6,20.3-0.7
		C364.8,131.1,365.8,123.3,361.1,116.7z"/>
                      <path d="M209.7,327.5c-10.7-0.1-22.7-5.2-32.4-15.2c-2.1-2.2-3.4-2.4-5.4,0c-1.8,2.2-4,4.2-6.1,6.2c-5.3,4.8-12.4,4.9-17.2,0.1
		c-4.9-4.8-5-12.2-0.1-17.6c1.9-2.1,3.9-4.3,6.2-6.1c2.4-2,2.2-3.2,0-5.3c-11.4-11.1-16.4-24.7-15-40.5c1-11.2,5.6-20.9,13.3-29.1
		c5.2-5.5,12.7-5.9,17.9-1.2c5.1,4.7,5.2,12.1,0.2,17.9c-9.8,11.4-9.3,25.5,1.3,35.8c2,1.9,3,1.8,4.8-0.1
		c9.8-9.9,19.5-19.8,29.6-29.5c2.6-2.5,2-3.7-0.2-6c-22-22.4-19.3-57.3,5.6-75.3c19.5-14.1,45.9-11.9,63.6,5.4
		c2.7,2.6,4.2,3.1,6.7,0c1.9-2.4,4.2-4.5,6.5-6.4c5.1-4.1,12-3.6,16.6,1c4.3,4.5,4.6,11.8,0.3,16.6c-2.1,2.4-4.3,4.7-6.8,6.8
		c-2.4,2-2,3.3,0.1,5.3c15.9,16.2,19.7,37.8,10.3,57.2c-2.2,4.6-5.1,8.7-8.7,12.4c-5.1,5.3-12.4,5.9-17.5,1.4
		c-5.3-4.6-5.8-12.2-0.7-17.9c6.4-7.2,8.7-15.2,6.2-24.5c-1.3-4.9-4.3-8.7-7.9-12.3c-1.4-1.4-2.2-1.2-3.5,0.1
		c-10.4,10.5-20.9,21-31.4,31.4c-2.2,2.1-0.2,3,0.8,4c8.7,8.6,13.9,18.8,15.2,31C264.8,302.3,242.2,327.5,209.7,327.5z M237.3,278.3
		c0-7.4-3.3-14.2-8.9-19.1c-1.5-1.3-2.2-1.2-3.5,0.1c-10.4,10.5-20.9,20.9-31.4,31.4c-1.1,1.1-1.3,1.8-0.2,3.1
		c6.6,7.9,17.7,11.2,27.5,7.8C230.9,298,237.3,288.9,237.3,278.3z M216.1,201.7c0,7.3,3.3,14.2,8.8,19.2c1.4,1.2,2.2,1.4,3.5,0
		c10.4-10.5,20.9-20.9,31.4-31.4c1-1,1.5-1.6,0.3-3.1c-6.6-7.9-17.8-11.2-27.6-7.9C222.6,181.9,216.1,191.1,216.1,201.7z"/>
                    </g>
                  </svg> Selling</span>
                </button>
              </li>

              <li className="nav-item" role="presentation">
                <button
                  className="nav-link"
                  id="pills-research-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#pills-research"
                  type="button"
                  role="tab"
                  aria-controls="pills-research"
                  aria-selected="false"
                >
                  <span><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 500 500" width="24" height="24" fill="currentColor" >
                    <g>
                      <path d="M336.9,0c9.4,1.8,18.9,2.6,28.2,4.8c70,16.7,123.5,75.7,133,146.9C510.6,244.3,450,329.5,358.3,348
		c-26,5.3-52,4.5-77.8-2.2c-12-3.1-18.3-13-15.6-24.1c2.6-10.8,13.2-16.6,25.3-13.7c71.4,17.3,141.7-21.5,164.2-90.7
		c25.7-79-26.2-163.5-108.2-176.5C270,28.9,199.4,80.7,189,157.1c-5.9,42.9,6.6,80.7,36.2,112.5c5.9,6.3,9.9,12.9,7.4,21.9
		c-1.1,4.1-3.6,7.2-6.5,10.1c-13.5,13.4-26.9,27-40.4,40.3c-2.6,2.5-3.4,4.5-2,8.3c8.1,22.3,4.7,43.1-11.7,60.2
		c-23.8,25-48.3,49.3-73.1,73.2c-16.3,15.7-36.2,20.2-57.8,13.2C19.1,489.8,6,474.2,1.2,451.7c-0.2-0.9-0.1-2-1-2.7
		c0-4.9,0-9.8,0-14.6c0.3-0.9,0.7-1.8,0.9-2.7c1.9-12.1,7.2-22.6,15.8-31.2c23.7-23.9,47.3-47.9,71.5-71.3
		c17.9-17.3,39.3-21,62.7-12.4c2.5,0.9,4,0.8,5.9-1.2c9-9.2,18-18.3,27.3-27.2c2.4-2.3,2.4-3.7,0.4-6.3c-10.2-13-18.2-27.3-24-42.7
		c-1.4-3.7-3-5.1-7.2-5.1c-42.9,0.2-85.9-0.1-128.8,0.2c-12.1,0.1-20.4-4.1-24.3-15.8c0-2.6,0-5.2,0-7.8
		c3.9-11.7,12.2-15.9,24.3-15.8c39.9,0.4,79.7,0.1,119.6,0.2c4.4,0,5.9-0.9,5.3-5.5c-1.3-9.4-1.2-18.8,0-28.2
		c0.5-4.1-0.1-5.5-4.8-5.5c-28.1,0.3-56.3,0.1-84.4,0.1c-8.4,0-14.9-3.3-18.7-10.8c-6.8-13.2,2.9-28.2,18.2-28.2
		c31.2-0.1,62.5-0.1,93.7,0.1c4,0,5.7-1.1,7.3-4.9C183.1,57.5,222.9,21.8,280,5.7C290.3,2.8,301,1.9,311.6,0C320,0,328.5,0,336.9,0z
		 M58.3,460.8c6.5-0.1,11.3-2.7,15.5-6.9c13.4-13.5,26.9-26.9,40.3-40.4c9.5-9.5,19.3-18.9,28.6-28.7c11-11.5,5.7-29.4-9.5-32.9
		c-7.5-1.7-13.7,0.9-19,6.2c-22.7,22.8-45.5,45.5-68.3,68.3c-1.5,1.5-2.9,3.1-3.9,4.9c-3.7,6.4-3.8,13-0.1,19.5
		C45.6,457.3,51.4,460.4,58.3,460.8z"/>
                      <path d="M324.1,234.3c-22.4,0-44.9,0.1-67.3,0c-8.6,0-15.6-5-18.5-12.7c-2.8-7.5-0.7-16,5.3-21.4c3.7-3.2,8-4.9,12.9-4.9
		c45,0,90.1-0.1,135.1,0c11.2,0,19.6,8.5,19.6,19.4c0.1,11.1-8.3,19.6-19.9,19.6C369,234.3,346.6,234.3,324.1,234.3z"/>
                      <path d="M323.7,156.2c-12.3,0-24.7,0-37,0c-12.3,0-21-8.2-21-19.5c0-11.3,8.8-19.5,21-19.5c25,0,50,0,75.1,0c12.3,0,21,8.2,21,19.5
		c0,11.3-8.7,19.5-21,19.5C349.1,156.2,336.4,156.2,323.7,156.2z"/>
                    </g>
                  </svg> Researching</span>
                </button>
              </li>
            </ul>
            <div className="tab-content" id="pills-tabContent-2">

              {/* --- Tab 1 --- */}
              <div
                className="tab-pane fade show active"
                id="pills-buy"
                role="tabpanel"
                aria-labelledby="pills-buy-tab"
              >
                <div className="content-info pb-0">
                  <div className="explore-boxes">
                    {/* Box 1 */}
                    <div className="explore-box active">
                      <h3>See New Caravan Listings</h3>
                      <p>
                        Browse the latest new caravans from top dealerships in Australia.
                      </p>
                      <a href="/listings/new-condition/" className="btn btn-primary">
                        Browse New Listings
                      </a>
                      <div className="illustration left" />
                    </div>

                    {/* Box 2 */}
                    <div className="explore-box">
                      <h3>Used Caravans For Sale</h3>
                      <p>
                        Find great deals on quality used caravans for sale by dealers and
                        private sellers.
                      </p>
                      <a href="/listings/used-condition/" className="btn btn-primary">
                        Search Used Listings
                      </a>
                      <div className="illustration center" />
                    </div>

                    {/* Box 3 */}
                    <div className="explore-box">
                      <h3>See All Caravans</h3>
                      <p>
                        Explore the full range of new and used caravans across Australia.
                      </p>
                      <a href="/listings/" className="btn btn-primary">
                        Start Searching
                      </a>
                      <div className="illustration right" />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Tab 2 --- */}
              <div
                className="tab-pane fade"
                id="pills-sell"
                role="tabpanel"
                aria-labelledby="pills-sell-tab"
              >
                <div className="content-info pb-0">
                  <div className="banner_sell_caravan">
                    <div className="row align-items-center">
                      <div className="col-lg-6">
                        <div className="content">
                          <h3 className="title">Sell Your Caravan Today!</h3>

                          <p className="desc">
                            Reach thousands of potential buyers in minutes.
                            <br />
                            List your caravan for sale on CaravansForSale.com.au,
                            <br />
                            the trusted marketplace for Aussie caravan owners.
                          </p>

                          {/* <Link href="#" className="btn">
                SELL YOUR CARAVAN
              </Link> */}
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <Image
                          src="/images/sell-banner-small.jpg"
                          alt="Sell Your Caravan Banner"
                          width={400}
                          height={300}
                          priority
                          className="bgImg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Tab 3 --- */}
              <div
                className="tab-pane fade"
                id="pills-research"
                role="tabpanel"
                aria-labelledby="pills-research-tab"
              >
                <div className="content-info pb-0">
                  <PostRequirement />
                </div>
              </div>

            </div>

          </div>






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
