"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { type HomeBlogPost } from "@/api/home/api";
import HomeFeatured from "./HomeFeatured";
import HomeStateSection from "./HomeStateSection";
import HomeTypeSection from "./HomeTypeSection";
import HomeLocationSection from "./HomeLocationSection";
import HomeBuyerGuide from "./HomeBuyerGuide";
import HomeListingSlider from "./HomeListingSlider";
import { useBanners } from "@/components/BannerHandler";
import { useBannerTracking } from "@/hooks/useBannerTracking";
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

  const { matchedBanners, isMobile, isLoading: bannerLoading } = useBanners();
  const sortedHome = [...matchedBanners]
    .filter(b => b.placement === "home")
    .sort((a, b) => Number(b.id) - Number(a.id));
  const homeDkBanner = sortedHome.find(b => b.device_target === "desktop");
  const homeMbBanner = sortedHome.find(b => b.device_target === "mobile");
  const activeBanner = isMobile ? (homeMbBanner ?? homeDkBanner) : (homeDkBanner ?? homeMbBanner);
  const activeBanners = useMemo(() => activeBanner ? [activeBanner] : [], [activeBanner]);

  const bannerClickUrl = useMemo(() => {
    if (!activeBanner?.target_url) return "#";
    try {
      const url = new URL(activeBanner.target_url);
      url.searchParams.set("utm_source", "caravansforsale");
      url.searchParams.set("utm_medium", "display");
      url.searchParams.set("utm_campaign", `${activeBanner.placement}_banner`);
      url.searchParams.set("utm_content", `banner_${activeBanner.id}`);
      return url.toString();
    } catch {
      return activeBanner.target_url;
    }
  }, [activeBanner]);
  const { bannerRefs, trackClick } = useBannerTracking(activeBanners);

  const handleBannerClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!activeBanner) return;
    e.preventDefault();

    // Unique click ID per click — like Google's gclid
    const clickId = "ck_" + Math.random().toString(36).slice(2) + Date.now().toString(36);

    // Append cfs_click_id to the UTM url
    let finalUrl = bannerClickUrl;
    try {
      const u = new URL(bannerClickUrl);
      u.searchParams.set("cfs_click_id", clickId);
      finalUrl = u.toString();
    } catch { /* fallback to base url */ }

    // Open advertiser site in new tab with full tracking url
    window.open(finalUrl, "_blank", "noopener,noreferrer");

    // Track click internally in CFS WordPress
    const body = JSON.stringify({
      banner_id: Number(activeBanner.id),
      event_type: "click",
      click_id: clickId,
      session_id: sessionStorage.getItem("blr_session") || "home_" + Date.now(),
      page_url: window.location.href,
      device_type: window.innerWidth < 768 ? "mobile" : "desktop",
      user_agent: navigator.userAgent,
      ip_address: "",
    });
    const trackUrl = `${process.env.NEXT_PUBLIC_CF7_BASE}/wp-json/ads-manager/v1/banners/track`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(trackUrl, new Blob([body], { type: "application/json" }));
    } else {
      fetch(trackUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  }, [activeBanner, bannerClickUrl]);

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
                  <Image src="/images/category.svg" alt="" width={16} height={16} className="hd-banner__trust-icon" unoptimized />
                  Thousands of Listings
                </span>
                <span className="hd-banner__trust-item">
                  <Image src="/images/australia.png" alt="" width={16} height={16} className="hd-banner__trust-icon" unoptimized />
                  Australia Wide
                </span>
                <span className="hd-banner__trust-item">
                  <Image src="/images/seller.svg" alt="" width={16} height={16} className="hd-banner__trust-icon" unoptimized />
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
          {bannerLoading ? (
            <div style={{ width: "100%", aspectRatio: "2000/517", background: "#f0f0f0", borderRadius: 8 }} />
          ) : activeBanner ? (
            <a
              href={bannerClickUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hd-banner-ad__inner"
              ref={(el) => { bannerRefs.current[0] = el; }}
              data-banner-id={activeBanner.id}
              onClick={handleBannerClick}
            >
              <span className="hd-banner-ad__label">Advertisement</span>
              <picture>
                {homeMbBanner && <source media="(max-width: 767px)" srcSet={homeMbBanner.image_url} />}
                <img
                  src={(homeDkBanner ?? homeMbBanner)?.image_url}
                  alt={activeBanner.name}
                  className="hd-banner-ad__img"
                />
              </picture>
            </a>
          ) : (
            <a href="https://www.aussiefivestarcaravans.com.au/" target="_blank" rel="noopener noreferrer" className="hd-banner-ad__inner">
              <span className="hd-banner-ad__label">Advertisement</span>
              <picture>
                <source media="(max-width: 767px)" srcSet="/images/aussiefivestar-1157x598.jpg" />
                <img src="/images/aussiefivestar-2000x517.jpg" alt="Aussie Fivestar Caravans" className="hd-banner-ad__img" />
              </picture>
            </a>
          )}
        </div>
      </div>

      {/* ── New Caravans for Sale ── */}
      <HomeListingSlider
        title="New Caravans for Sale"
        viewAllHref="/listings/new-caravans/"
        apiUrl="/api/home-featured/?type=new"
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
        apiUrl="/api/home-featured/?type=used"
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
