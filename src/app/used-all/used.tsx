// app/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { fetchUsedBlogList } from "@/api/usedBlog/api";
import { useEffect, useState } from "react";

type BlogItem = {
  id: number;
  title: string;
  image: string;
  date: string;
  link: string;
  slug: string;
};
// ── Data ────────────────────────────────────────────────────────────────

const states = [
  { name: "Victoria", count: "2,726", startPrice: "$9,000", map: "/images/vic_map.svg" },
  { name: "New South Wales", count: "1,739", startPrice: "$11,990", map: "/images/nsw_map.svg" },
  { name: "Queensland", count: "1,760", startPrice: "$9,000", map: "/images/qld_map.svg" },
  { name: "Western Australia", count: "944", startPrice: "$12,990", map: "/images/wa_map.svg" },
  { name: "South Australia", count: "825", startPrice: "$4,990", map: "/images/sa_map.svg" },
  { name: "Tasmania", count: "182", startPrice: "$14,990", map: "/images/tas_map.svg" },
];

const regions = [
  { name: "Melbourne", count: "1,779", startPrice: "$10,777" },
  { name: "Sydney", count: "382", startPrice: "$18,500" },
  { name: "Brisbane", count: "243", startPrice: "$18,990" },
];

const categories = [
  {
    title: "Caravans For Sale By Price",
    items: [
      { label: "Caravans under $20,000", count: "766", start: "$10,990" },
      { label: "Caravans under $30,000", count: "236", start: "$30,990" },
      { label: "Caravans under $40,000", count: "166", start: "$46,800" },
    ],
  },
  {
    title: "Caravans For Sale By Weight",
    items: [
      { label: "Caravans under 1500 Kgs", count: "766", start: "$10,990" },
      { label: "Caravans under 1750 Kgs", count: "236", start: "$30,990" },
      { label: "Caravans under 2000 Kgs", count: "166", start: "$46,800" },
    ],
  },
  {
    title: "Caravans For Sale By Length",
    items: [
      { label: "Caravans under 12ft Length", count: "766", start: "$10,990" },
      { label: "Caravans under 14ft Length", count: "236", start: "$30,990" },
      { label: "Caravans under 16ft Length", count: "166", start: "$46,800" },
    ],
  },
  {
    title: "Caravans For Sale By Sleeps",
    items: [
      { label: "Caravans under 2 People", count: "766", start: "$10,990" },
      { label: "Caravans under 3 People", count: "236", start: "$30,990" },
      { label: "Caravans under 4 People", count: "166", start: "$46,800" },
    ],
  },
  {
    title: "Caravans For Sale By Type",
    items: [
      { label: "Off Road Caravans", count: "766", start: "$10,990" },
      { label: "Hybrid Caravans", count: "236", start: "$30,990" },
      { label: "Pop Top Caravans", count: "166", start: "$46,800" },
    ],
  },
  {
    title: "Caravans By Popular Manufacturers",
    items: [
      { label: "JB Caravans", count: "766", start: "$10,990" },
      { label: "Lotus Caravans", count: "236", start: "$30,990" },
      { label: "New Age Caravans", count: "166", start: "$46,800" },
    ],
  },
];

const sampleCaravan = {
  title: "2025 Lotus Trooper TR21CL 21'0 Luxury Off Road",
  price: "$176,990",
  image: "https://caravansforsale.imagestack.net/400x300/CFS-N-600024/2025-lotus-trooper-tr21cl-210-luxury-off-roadmain1.avif",
  tags: ["Off Road", "21 ft", "4495 Kg", "Lotus"],
  condition: "Used",
  location: "WA",
};

const featuredCaravans = Array(6).fill(sampleCaravan); // duplicate for demo

const latestCaravans = Array(6).fill(sampleCaravan);

const blogs = [
  {
    title: "How to Choose the Right Caravan",
    date: "12 Jan 2025",
    image: "/images/Best-Luxury-Caravans-2026-Top-Models-Prices-and-Features-in-Australia-Mobile.jpg",
  },
  {
    title: "Best Off-Road Caravans in Australia",
    date: "05 Jan 2025",
    image: "/images/Top-10-Off-Road-Caravans-for-2026-in-Australia-Mobile.jpg",
  },
  {
    title: "New Caravan Buying Checklist",
    date: "28 Dec 2024",
    image: "/images/Best-Off-Grid-Caravans-2026-Australia-Mobile.jpg",
  },
];

// ── Components ──────────────────────────────────────────────────────────

function StateCard({ state }: { state: (typeof states)[0] }) {

   

  return (
    <div className="service-box">
      <div className="sec_left">
        <h5>{state.name}</h5>
        <div className="info">
          <div className="quick_linkss">
            <p>
              {state.count} used caravans listings starting at {state.startPrice}
            </p>
            <Link href="#" className="view_all">
              View All <i className="bi bi-chevron-right"></i>
            </Link>
          </div>
        </div>
      </div>
      <div className="sec_right">
        <Image
          src={state.map}
          alt={`${state.name} map`}
          width={100}
          height={100}
          className="object-contain"
        />
      </div>
    </div>
  );
}

function ProductCard({ caravan }: { caravan: typeof sampleCaravan }) {
  return (
    <Link href="#" className="lli_head">
      <div className="product-card">
        <div className="img">
          <div className="background_thumb">
            <Image src={caravan.image} alt="Caravan" fill className="object-cover blur-sm opacity-30" />
          </div>
          <div className="main_thumb position-relative">
            <Image
              src={caravan.image}
              alt={caravan.title}
              width={400}
              height={300}
              className="w-full object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </div>

        <div className="product_de">
          <div className="info"><h3 className="title cursor-pointer">{caravan.title}</h3></div>

          <div className="price">
            <div className="metc2">
              <h5 className="slog">{caravan.price}</h5>
            </div>
          </div>

          <ul className="vehicleDetailsWithIcons simple">
            {caravan.tags.map((tag, i) => (
              <li key={i} className="attribute3_list">
                <span>{tag}</span>
              </li>
            ))}
          </ul>

          <div className="bottom_mid">
            <span>
              <i className="bi bi-check-circle-fill"></i> {caravan.condition}
            </span>
            <span>
              <i className="fa fa-map-marker-alt"></i> {caravan.location}
            </span>
          </div>

          <div className="bottom_button">
            <button className="btn btn-primary">
              View Details
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────

export default function Home() {
   const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const loadBlogs = async () => {
    try {
      const res = await fetchUsedBlogList();
      console.log("Fetched blogs:", res);

      if (!res?.data?.latest_blog_posts?.items) {
        setBlogs([]);
        return;
      }

      setBlogs(res.data.latest_blog_posts.items);
    } catch (err) {
      console.error("Blog fetch failed:", err);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  loadBlogs();
}, []);
const formatBlogDate = (dateString: string) => {
  if (!dateString) return "";

  // "2026-1-20 22.18.54" → "2026-1-20"
  const cleanDate = dateString.split(" ")[0];

  const date = new Date(cleanDate);

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

  return (
    <div>
      {/* Ad Banner */}
      <div className="ad_banner">
        <Link href="https://www.caravansforsale.com.au/listings/">
          <div className="item-image">
            <Image
              src="/images/banner_top_dk.jpg"
              alt="off-road"
              width={1200}
              height={200}
              className="hidden-xs"
              priority
              sizes="100vw"
            />
            <Image
              src="/images/banner_top_mb.jpg"
              alt="off-road"
              width={600}
              height={300}
              className="hidden-lg hidden-md hidden-sm"
              sizes="100vw"
            />
          </div>
        </Link>
      </div>

      {/* Hero / Search Requirement */}
      <div className="search_requirement_area py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="section-head search_home">
            <h3>Used caravans for sale in Australia</h3>
            <p className="mb-2 mt-3 fw-semibold">
              Find your perfect used caravan for sale in Australia from thousands of listings across the country, listed by dealers and private sellers.
            </p>
            <p>
              Whether you’re searching by price, weight, length, caravan type, sleeping capacity, manufacturer, or location, CaravansForSale.com.au makes it easy to compare options and find the right caravan for your lifestyle. Browse Australia-wide used caravan listings, explore popular categories, and access expert buying guides to help you make a confident decision.
            </p>
            <Link href="/listings/used-condition/" className="btn">
              Browse Used Caravans
            </Link>
          </div>
        </div>
      </div>

      {/* States Carousel */}
      <section className="caravans_by_state related-products services section-padding mt-3 style-1">
        <div className="container">
          <div className="section-head mb-4">
            <h2>Used Caravans For Sale by State</h2>
          </div>
          <div className="content">
            <div className="explore-state position-relative">
              <Swiper
                modules={[Navigation]}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                  1280: { slidesPerView: 4 },
                }}
                navigation={{
                  nextEl: ".state-manu-next",
                  prevEl: ".state-manu-prev",
                }}
              >
                {states.map((state, i) => (
                  <SwiperSlide key={i}>
                    <StateCard state={state} />
                  </SwiperSlide>
                ))}
              </Swiper>

              <div className="swiper-button-next state-manu-next"></div>
              <div className="swiper-button-prev state-manu-prev"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Regions */}
      <section className="caravans_by_state related-products services section-padding pt-0 style-1">
        <div className="container">
          <div className="section-head mb-4">
            <h2>Used Caravans For Sale by Region</h2>
            <hr className="mb-6" />
          </div>
          <div className="content listing_region">
            <ul>
              {regions.map((r, i) => (
                <li key={i} >
                  <Link href="#" className="font-medium text-blue-600">
                    Used Caravans For Sale in {r.name}
                  </Link>
                  <span className="block mt-1 text-sm text-gray-600">
                    {r.count} caravan listings starting at {r.startPrice}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Popular Searches Grid */}
      <section className="shop-used-caravans py-12" style={{ background: "#fcfcfc", borderTop: "1px solid #ddd", borderBottom: "1px solid #ddd" }}>
        <div className="container">
          <h2>Browse Caravans by Popular Searches</h2>

          <div className="shop-grid">
            {categories.map((cat, i) => (
              <div key={i} className="shop-card">
                <h3>{cat.title}</h3>
                <ul>
                  {cat.items.map((item, j) => (
                    <li key={j}>
                      <Link href="#">
                        {item.label} <span>({item.count} listings starting at {item.start})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Caravans */}
      <section className="caravans_by_state related-products services section-padding style-1">
        <div className="container">
          <div className="section-head mb-4">
            <h2>Featured Used Caravans For Sale</h2>
          </div>
          <div className="content">
            <div className="explore-state position-relative">
              <Swiper
                modules={[Navigation]}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                  1280: { slidesPerView: 4 },
                }}
                navigation={{
                  nextEl: ".featured-next",
                  prevEl: ".featured-prev",
                }}
              >
                {featuredCaravans.map((car, i) => (
                  <SwiperSlide key={i}>
                    <ProductCard caravan={car} />
                  </SwiperSlide>
                ))}
              </Swiper>

              <div className="swiper-button-next featured-next"></div>
              <div className="swiper-button-prev featured-prev"></div>

            </div>
          </div>

          {/* Sell Banner */}
          <div className="banner_sell_caravan">
            <Image
              src="/images/sell-banner.jpg"
              alt="Sell Your Caravan Banner"
              fill
              className="bgImg"
            />
            <div className="overlay"></div>
            <div className="content">
              <h2 className="title">Sell Your Caravan Today!</h2>
              <p className="desc">
                Reach thousands of potential buyers in minutes.<br />
                List your caravan for sale on CaravansForSale.com.au,<br />
                the trusted marketplace for Aussie caravan owners.
              </p>
              <Link href="#" className="btn">
                SELL YOUR CARAVAN
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Caravans */}
      <section className="caravans_by_state related-products services section-padding style-1">
        <div className="container">
          <div className="section-head mb-4">
            <h2>Latest Used Caravans For Sale</h2>
          </div>
          <div className="content">
            <div className="explore-state position-relative">
              <Swiper
                modules={[Navigation]}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                  1280: { slidesPerView: 4 },
                }}
                navigation={{
                  nextEl: ".latest-next",
                  prevEl: ".latest-prev",
                }}
              >
                {latestCaravans.map((car, i) => (
                  <SwiperSlide key={i}>
                    <ProductCard caravan={car} />
                  </SwiperSlide>
                ))}
              </Swiper>

              <div className="swiper-button-next latest-next"></div>
              <div className="swiper-button-prev latest-prev"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blogs */}
      <section className="related-products latest_blog section-padding blog style-8">
        <div className="container">
          <div className="title">
            <div className="tpof_tab">
              <h3>Latest Blogs on Used Caravans</h3>
              <Link href="/blog">
                View All <i className="bi bi-chevron-right"></i>
              </Link>
            </div>
          </div>
          <div className="content">
             {loading ? (
        <p>Loading blogs...</p>
      ) : (
            <Swiper
              modules={[Navigation]}
              spaceBetween={20}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              navigation={{
                nextEl: ".blog-next",
                prevEl: ".blog-prev",
              }}
            >
              {blogs.map((blog, i) => (
                <SwiperSlide key={i}>
                      <Link href={`/${blog.slug}`}>
                  <div className="side-posts">
                    <div className="item">
                      <div className="img img-cover">
                        <Image src={blog.image} alt={blog.title} width={300} height={200} className="object-cover" />
                      </div>
                      <div className="info">
                        <h4 className="title">
                             {blog.title}
                         </h4>
                        <div className="date-author">{formatBlogDate(blog.date)}</div>
                      </div>
                    </div>
                  </div>
                    </Link>
                </SwiperSlide>
              ))}
            </Swiper>
 )}

            <div className="swiper-button-next blog-next"></div>
            <div className="swiper-button-prev blog-prev"></div>
          </div>
        </div>
      </section>
    </div>
  );
}