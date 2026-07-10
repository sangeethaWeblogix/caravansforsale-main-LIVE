"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { type HomeBlogPost } from "@/api/home/api";
import HomeFeatured from "./HomeFeatured";
import HomeStateSection from "./HomeStateSection";
import HomeTypeSection from "./HomeTypeSection";
import HomeLocationSection from "./HomeLocationSection";
import HomeBuyerGuide from "./HomeBuyerGuide";
import HomeListingSlider from "./HomeListingSlider";
import "./main.css?=23";

const BlogSection = dynamic(() => import("../blogSection"), { ssr: false });
const PostRequirement = dynamic(() => import("../postRequirement"), { ssr: false });

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

  const bannerSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedIndex = Number.parseInt(
      localStorage.getItem("ad_index") || "0",
      10,
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
      localStorage.setItem("ad_index", String(next));
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ── Hero Banner ── */}
      <section className="hd-banner">
        <picture>
          <source media="(max-width: 767px)" srcSet="/images/banner_top_mb_new.webp" />
          <img
            src="/images/banner_top_dk_new.webp"
            alt="Caravans for Sale in Australia"
            className="hd-banner__img"
          />
        </picture>
        <div className="hd-banner__overlay">
          <div className="container">
            <div className="hd-banner__content">
              <h1 className="hd-banner__title">
                Caravans for Sale<br />in Australia
              </h1>
              <p className="hd-banner__subtitle">
                Browse new and used caravans for sale from dealers and private sellers across Australia.
              </p>
              <div className="hd-banner__trust">
                <span className="hd-banner__trust-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Thousands of Listings
                </span>
                <span className="hd-banner__trust-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Australia Wide
                </span>
                <span className="hd-banner__trust-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  Dealers &amp; Private Sellers
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* ── Featured Caravans ── */}
      <HomeFeatured />

      {/* ── Banner Ad ── */}
      <div className="hd-banner-ad">
        <div className="container">
          <div className="hd-banner-ad__inner">
            <span className="hd-banner-ad__label">Advertisement</span>
            <picture>
              <source media="(max-width: 767px)" srcSet="/images/banner_ad_top-masterpiece-m.jpg" />
              <img src="/images/banner_ad_top-masterpiece.jpg" alt="Masterpiece Caravans" className="hd-banner-ad__img" />
            </picture>
          </div>
        </div>
      </div>

      {/* ── New Caravans for Sale ── */}
      <HomeListingSlider
        title="New Caravans for Sale"
        viewAllHref="/listings/new-caravans/"
        apiUrl="/api/listings/?per_page=12&condition=new"
        badgeVariant="new"
      />

      {/* ── Sell CTA Banner ── */}
      <section className="caravans_by_state related-products services ">
        <div className="container">
          <div className="sell-banner">
            <div className="sell-content">
              <h3>List Your Caravan For Sale Today</h3>
              <p className="subtitle">Reach thousands of caravan buyers daily.</p>
              <p className="desc">List your caravan on CaravansForSale.com.au — Australia&apos;s trusted marketplace to buy and sell caravans.</p>
              <div className="btns_two">
                <a href="/dealer-advertising/" className="btn primary-btn">Dealer Sign Up</a>
                <a href="/sell-my-caravan/" className="btn secondary-btn">Private Seller - Click Here</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Used Caravans for Sale ── */}
      <HomeListingSlider
        title="Used Caravans for Sale"
        viewAllHref="/listings/used-caravans/"
        apiUrl="/api/listings/?per_page=12&condition=used"
        badgeVariant="used"
      />

      {/* ── Browse by State ── */}
      <HomeStateSection stateBands={stateBands} />

      {/* ── Post Requirements ── */}
      <div className="hd-postreq-wrap">
        <div className="container">
          <PostRequirement requirements={requirements} />
        </div>
      </div>

      {/* ── Browse by Type ── */}
      <HomeTypeSection />

      {/* ── Find by Location ── */}
      <HomeLocationSection />

      {/* ── Buyer Guide + Why Australians ── */}
      <HomeBuyerGuide />

      {/* Deal of the Month Section */}
      {/*}<section className="deal-of-month product-details section-padding">
            <FeaturedSection />
          </section> */}
      {/*<section className="post-requirements product-details section-padding">
          <PostRequirement />
        </section> */}


      {/* Latest Blog Section */}
      <BlogSection />
    </div>
  );
}
