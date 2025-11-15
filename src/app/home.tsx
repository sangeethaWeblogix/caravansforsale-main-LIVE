"use client";

import { useEffect, useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./home.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Link from "next/link";
import Image from "next/image";
import FeaturedSection from "./featured";
import BlogSection from "./blogSection";
import PostRequirement from "./postRequirement";
import Manufactures from "./manufacture";
import SearchSection from "./searchSection";

/* --------------------------------- Page ---------------------------------- */
export default function ProductPage() {
  const [adIndex, setAdIndex] = useState<number>(0);

  const bannerSectionRef = useRef<HTMLDivElement | null>(null);

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
      <section className="post-requirements product-details section-padding">
        <PostRequirement />
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
              <div className="row">


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
                    cities: ["Adelaide", "Mount Gambier", "Whyalla"],
                    image: "/images/sa_map.svg",
                  },
                  {
                    state: "Tasmania",
                    cities: ["Hobart", "Launceston", "Devonport", "Burnie"],
                    image: "/images/tas_map.svg",
                  },
                ].map((state, index) => (
                  <div className="col-lg-4" key={index}>
                    <div className="service-box">
                      <div className="sec_left">
                        <h5>{state.state}</h5>
                        <div className="info">
                          <div className="quick_linkss">
                            <p>5,733 caravan listings starting at $70,000</p>
                            <Link
                              className="view_all"
                              href={`/listings/${state.state
                                .toLowerCase()
                                .replace(/\s+/g, "-")}-state/`}
                            >
                              View All Caravans For Sale in {state.state} <i className="bi bi-chevron-right" />
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
          </div>
		  
		  {/* Quick Links Section */}
      <div className="faq style-4 pt-4">
        <div className="row">
            <div className="col-lg-12">

              <div className="accordion faq style-3 style-4" id="accordionFaq">
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
                        <li><a href="https://www.caravansforsale.com.au/listings/jayco/">Jayco Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/snowy-river/">Snowy River Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/mdc/">MDC Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/titanium/">Titanium Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/crusader/">Crusader Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/lotus/">Lotus Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/new-age/">New Age Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/jb/">JB Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/essential/">Essential Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/fantasy/">Fantasy Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/urban/">Urban Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/great-aussie/">Great Aussie Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/kokoda/">Kokoda Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/on-the-move/">On The Move Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/avan/">Avan Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/coromal/">Coromal Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/leader/">Leader Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/red-centre/">Red Centre Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/kedron/">Kedron Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/malibu/">Malibu Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/millard/">Millard Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/retreat/">Retreat Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/royal-flair/">Royal Flair Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/franklin/">Franklin Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/hilltop/">Hilltop Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/vacationer/">Vacationer Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/viscount/">Viscount Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/xtour/">XTour Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/concept/">Concept Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/goldstream-rv/">Goldstream RV Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/masterpiece/">Masterpiece Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/vibe/">Vibe Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/adria/">Adria Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/design-rv/">Design RV Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/evernew/">Evernew Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/hinterland/">Hinterland Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/jawa/">Jawa Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/majestic/">Majestic Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/network-rv/">Network RV Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/newgen/">Newgen Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/prime-edge/">Prime Edge Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/regent/">Regent Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/roadstar/">Roadstar Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/spinifex/">Spinifex Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/titan/">Titan Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/windsor/">Windsor Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/atlas/">Atlas Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/cub/">Cub Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/goldstar-rv/">Goldstar RV Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/goldy/">Goldy Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/highclere/">Highclere Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/paramount/">Paramount Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/southern-cross/">Southern Cross Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/sunrise/">Sunrise Caravans For Sale</a><span>5,733 caravan listings starting at $825</span></li>
                      </ul>
                    </div>
                  </div>
                </div>

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
                      Caravans By Popular Regions
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
                        <li><a href="https://www.caravansforsale.com.au/listings/western-australia-state/perth-region/">Caravans For Sale in Perth</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/queensland-state/brisbane-region/">Caravans For Sale in Brisbane</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/south-australia-state/adelaide-region/">Caravans For Sale in Adelaide</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/victoria-state/melbourne-region/">Caravans For Sale in Melbourne</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/new-south-wales-state/sydney-region/">Caravans For Sale in Sydney</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/queensland-state/townsville-region/">Caravans For Sale in Townsville</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/new-south-wales-state/newcastle-region/">Caravans For Sale in Newcastle</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/queensland-state/gold-coast-region/">Caravans For Sale in Gold Coast</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/queensland-state/toowoomba-region/">Caravans For Sale in Toowoomba</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/victoria-state/geelong-region/">Caravans For Sale in Geelong</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/queensland-state/sunshine-coast-region/">Caravans For Sale in Sunshine Coast</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/victoria-state/ballarat-region/">Caravans For Sale in Ballarat</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/victoria-state/bendigo-region/">Caravans For Sale in Bendigo</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/northern-territory-state/darwin-region/">Caravans For Sale in Darwin</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/new-south-wales-state/central-coast-region/">Caravans For Sale in Central Coast</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/new-south-wales-state/coffs-harbour-region/">Caravans For Sale in Coffs Harbour</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/queensland-state/ipswich-region/">Caravans For Sale in Ipswich</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/tasmania-state/hobart-region/">Caravans For Sale in Hobart</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/tasmania-state/launceston-region/">Caravans For Sale in Launceston</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/victoria-state/shepparton-region/">Caravans For Sale in Shepparton</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/victoria-state/mornington-peninsula-region/">Caravans For Sale in Mornington Peninsula</a><span>5,733 caravan listings starting at $825</span></li>

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
                        <li><a href="https://www.caravansforsale.com.au/listings/under-10000/">Caravans under $10,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-20000/">Caravans under $20,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-30000/">Caravans under $30,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-40000/">Caravans under $40,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-50000/">Caravans under $50,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-60000/">Caravans under $60,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-70000/">Caravans under $70,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-80000/">Caravans under $80,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-90000/">Caravans under $90,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-100000/">Caravans under $100,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-125000/">Caravans under $125,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-150000/">Caravans under $150,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-175000/">Caravans under $175,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-200000/">Caravans under $200,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-225000/">Caravans under $225,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-250000/">Caravans under $250,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-275000/">Caravans under $275,000</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-300000/">Caravans under $300,000</a><span>5,733 caravan listings starting at $825</span></li>

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
                        <li><a href="https://www.caravansforsale.com.au/listings/under-600-kg-atm/">Caravans under 600 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-800-kg-atm/">Caravans under 800 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-1000-kg-atm/">Caravans under 1000 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-1250-kg-atm/">Caravans under 1250 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-1500-kg-atm/">Caravans under 1500 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-1750-kg-atm/">Caravans under 1750 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-2000-kg-atm/">Caravans under 2000 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-2250-kg-atm/">Caravans under 2250 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-2500-kg-atm/">Caravans under 2500 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-2750-kg-atm/">Caravans under 2750 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-3000-kg-atm/">Caravans under 3000 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-3500-kg-atm/">Caravans under 3500 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-4000-kg-atm/">Caravans under 4000 Kgs</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-4500-kg-atm/">Caravans under 4500 Kgs</a><span>5,733 caravan listings starting at $825</span></li>


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
                        <li><a href="https://www.caravansforsale.com.au/listings/1-people-sleeping-capacity">Caravans Under 1 People Sleeping Capacity</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/2-people-sleeping-capacity">Caravans Under 2 People Sleeping Capacity</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/3-people-sleeping-capacity">Caravans Under 3 People Sleeping Capacity</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/4-people-sleeping-capacity">Caravans Under 4 People Sleeping Capacity</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/5-people-sleeping-capacity">Caravans Under 5 People Sleeping Capacity</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/6-people-sleeping-capacity">Caravans Under 6 People Sleeping Capacity</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/7-people-sleeping-capacity">Caravans Under 7 People Sleeping Capacity</a><span>5,733 caravan listings starting at $825</span></li>


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
                        <li><a href="https://www.caravansforsale.com.au/listings/under-12-length-in-feet/">Caravans Under 12ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-13-length-in-feet/">Caravans Under 13ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-14-length-in-feet/">Caravans Under 14ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-15-length-in-feet/">Caravans Under 15ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-16-length-in-feet/">Caravans Under 16ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-17-length-in-feet/">Caravans Under 17ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-18-length-in-feet/">Caravans Under 18ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-19-length-in-feet/">Caravans Under 19ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-20-length-in-feet/">Caravans Under 20ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-21-length-in-feet/">Caravans Under 21ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-22-length-in-feet/">Caravans Under 22ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-23-length-in-feet/">Caravans Under 23ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-24-length-in-feet/">Caravans Under 24ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-25-length-in-feet/">Caravans Under 25ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-26-length-in-feet/">Caravans Under 26ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-27-length-in-feet/">Caravans Under 27ft Length</a><span>5,733 caravan listings starting at $825</span></li>
                        <li><a href="https://www.caravansforsale.com.au/listings/under-28-length-in-feet/">Caravans Under 28ft Length</a><span>5,733 caravan listings starting at $825</span></li>
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
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/off-road-category/">Used Off Road Caravans</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/hybrid-category/">Used Hybrid Caravans</a><span>4,256 caravan listings starting at $910</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/pop-top-category/">Used Pop Top Caravans</a><span>6,312 caravan listings starting at $750</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/luxury-category/">Used Luxury Caravans</a><span>2,189 caravan listings starting at $15,600</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/family-category/">Used Family Caravans</a><span>5,021 caravan listings starting at $1,250</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/touring-category/">Used Touring Caravans</a><span>3,894 caravan listings starting at $1,100</span></li>
</ul>

<hr></hr>

<ul>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/australian-capital-territory-state/">Used Caravans in Australian Capital Territory</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/new-south-wales-state/">Used Caravans in New South Wales</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/northern-territory-state/">Used Caravans in Northern Territory</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/queensland-state/">Used Caravans in Queensland</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/south-australia-state/">Used Caravans in South Australia</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/tasmania-state/">Used Caravans in Tasmania</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/victoria-state/">Used Caravans in Victoria</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/western-australia-state/">Used Caravans in Western Australia</a><span>5,733 caravan listings starting at $825</span></li>
</ul>
<hr></hr>
<ul>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/western-australia-state/perth-region/">Used Caravans in Perth, Western Australia</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/south-australia-state/adelaide-region/">Used Caravans in Adelaide, South Australia</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/new-south-wales-state/newcastle-region/">Used Caravans in Newcastle, New South Wales</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/victoria-state/melbourne-region/">Used Caravans in Melbourne, Victoria</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/queensland-state/townsville-region/">Used Caravans in Townsville, Queensland</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/queensland-state/brisbane-region/">Used Caravans in Brisbane, Queensland</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/queensland-state/gold-coast-region/">Used Caravans in Gold Coast, Queensland</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/victoria-state/ballarat-region/">Used Caravans in Ballarat, Victoria</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/victoria-state/geelong-region/">Used Caravans in Geelong, Victoria</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/new-south-wales-state/sydney-region/">Used Caravans in Sydney, New South Wales</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/new-south-wales-state/coffs-harbour-region/">Used Caravans in Coffs Harbour, New South Wales</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/queensland-state/sunshine-coast-region/">Used Caravans in Sunshine Coast, Queensland</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/queensland-state/toowoomba-region/">Used Caravans in Toowoomba, Queensland</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/victoria-state/shepparton-region/">Used Caravans in Shepparton, Victoria</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/victoria-state/bendigo-region/">Used Caravans in Bendigo, Victoria</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/northern-territory-state/darwin-region/">Used Caravans in Darwin, Northern Territory</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/queensland-state/ipswich-region/">Used Caravans in Ipswich, Queensland</a><span>5,733 caravan listings starting at $825</span></li>
  <li><a href="https://www.caravansforsale.com.au/listings/used-condition/victoria-state/north-west-region/">Used Caravans in North West, Victoria</a><span>5,733 caravan listings starting at $825</span></li>
</ul>


                    </div>
                  </div>
                </div>

              </div>

            </div>
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
        <Manufactures />
      </section>

      {/* Latest Blog Section */}
      <BlogSection />
      
    </div>
  );
}
