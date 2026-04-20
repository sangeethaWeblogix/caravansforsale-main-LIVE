
  "use client";

  import { useEffect, useState, useRef } from "react";
  import "bootstrap/dist/css/bootstrap.min.css";
  //  import "bootstrap/dist/js/bootstrap.bundle.min.js";
  import "./main.css?=14";
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
 import {  type HomeBlogPost } from "@/api/home/api";

  interface Item {
    label: string;
    capacity: number;
    slug: string;
    permalink: string;
    caravan_count: string;
    starting_price: number;
    display_text: string;
    state: string;
    short_label: string;
    short_count: string;
    region: string;
  }
 
  interface Props {
    sleepBands: Item[];
    regionBands: Item[];
    manufactureBands: Item[];
    atmBands: Item[];
    lengthBands: Item[];
    priceBands: Item[];
    usedData: { by_category: Item[]; by_state: Item[]; by_region: Item[] };
    stateBands: Item[];
    requirements: any;
    homeblog: HomeBlogPost[];
 
   }
  /* --------------------------------- Page ---------------------------------- */
  export default function HomePage({
    sleepBands,
    regionBands,
    manufactureBands,
    atmBands,
    lengthBands,
    priceBands,
    usedData,
    stateBands,
    requirements,
    homeblog,

  }: Props) {
  
    const [usedCategoryList, setUsedCategoryList] = useState<Item[]>([]);
    const [usedState, setUsedState] = useState<Item[]>([]);
    const [usedRegion, setUsedRegion] = useState<Item[]>([]);
    const [adIndex, setAdIndex] = useState<number>(0);
  

    console.log("add", adIndex)
    const bannerSectionRef = useRef<HTMLDivElement | null>(null);
    

    //  useEffect(() => {
    //   async function loadBands() {
    //     const data = await fetchSleepBands();
    //     setBands(data);
    //   }
    //   loadBands();
    // }, []);
console.log("homestate", stateBands)

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
          <SearchSection 
          sleepBands={sleepBands}
    regionBands={regionBands}
    manufactureBands={manufactureBands}
    atmBands={atmBands}
    lengthBands={lengthBands}
    priceBands={priceBands}
    usedData={usedData}
     requirements={requirements}
    stateBands={stateBands}/>
        </section>

        {/* Deal of the Month Section */}
        {/*}<section className="deal-of-month product-details section-padding">
            <FeaturedSection />
          </section> */}
        {/*<section className="post-requirements product-details section-padding">
          <PostRequirement />
        </section> */}
        
      
        {/* Caravans by Manufacturer Section */}
        <section className="caravans_by_manufacturer related-products section-padding">
          <Manufactures />
        </section>

        {/* Latest Blog Section */}
        <BlogSection blogPosts ={homeblog} />
      </div>

    );
  }
