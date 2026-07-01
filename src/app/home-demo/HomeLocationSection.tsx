"use client";

import Image from "next/image";

const MAJOR_CITIES = [
  { name: "Adelaide",   href: "/listings/south-australia-state/adelaide-region/",    imgSrc: "/images/Adelaide.png"   },
  { name: "Brisbane",   href: "/listings/queensland-state/brisbane-region/",         imgSrc: "/images/Brisbane.png"   },
  { name: "Gold Coast", href: "/listings/queensland-state/gold-coast-region/",       imgSrc: "/images/Gold-Coast.png" },
  { name: "Melbourne",  href: "/listings/victoria-state/melbourne-region/",          imgSrc: "/images/Melbourne.png"  },
  { name: "Perth",      href: "/listings/western-australia-state/perth-region/",     imgSrc: "/images/Perth.png"      },
  { name: "Sydney",     href: "/listings/new-south-wales-state/sydney-region/",      imgSrc: "/images/Sydney.png"     },
];

const MINOR_CITIES = [
  { name: "Cairns",         href: "/listings/queensland-state/cairns-region/" },
  { name: "Canberra",       href: "/listings/australian-capital-territory-state/australian-capital-territory-region/" },
  { name: "Darwin",         href: "/listings/northern-territory-state/darwin-region/" },
  { name: "Geelong",        href: "/listings/victoria-state/geelong-region/" },
  { name: "Hobart",         href: "/listings/tasmania-state/hobart-region/" },
  { name: "Newcastle",      href: "/listings/new-south-wales-state/newcastle-region/" },
  { name: "Sunshine Coast", href: "/listings/queensland-state/sunshine-coast-region/" },
  { name: "Townsville",     href: "/listings/queensland-state/townsville-region/" },
  { name: "Wollongong",     href: "/listings/new-south-wales-state/illawarra-region/" },
  { name: "Ballarat",       href: "/listings/victoria-state/ballarat-region/" },
];

const FILTERS = [
  {
    icon: <Image src="/images/Budget.png" alt="Budget" width={24} height={24} unoptimized />,
    label: "By Your Budget",
    items: [
      { text: "Under $50k",  href: "/listings/?max_price=50000" },
      { text: "Under $75k",  href: "/listings/?max_price=75000" },
      { text: "Under $100k", href: "/listings/?max_price=100000" },
      { text: "Over $100k",  href: "/listings/?min_price=100000" },
    ],
  },
  {
    icon: <Image src="/images/ATM.png" alt="Weight ATM" width={24} height={24} unoptimized />,
    label: "By Weight (ATM)",
    items: [
      { text: "Under 2000kg",    href: "/listings/?max_atm=2000" },
      { text: "2000kg – 2500kg", href: "/listings/?min_atm=2000&max_atm=2500" },
      { text: "2500kg – 3000kg", href: "/listings/?min_atm=2500&max_atm=3000" },
      { text: "Over 3000kg",     href: "/listings/?min_atm=3000" },
    ],
  },
  {
    icon: <Image src="/images/Length.png" alt="Length" width={24} height={24} unoptimized />,
    label: "By Size (Length)",
    items: [
      { text: "Under 18ft",  href: "/listings/?max_length=18" },
      { text: "18ft – 20ft", href: "/listings/?min_length=18&max_length=20" },
      { text: "20ft – 22ft", href: "/listings/?min_length=20&max_length=22" },
      { text: "Over 22ft",   href: "/listings/?min_length=22" },
    ],
  },
  {
    icon: <Image src="/images/Sleeping.png" alt="Sleeping" width={24} height={24} unoptimized />,
    label: "By Sleeping Capacity",
    items: [
      { text: "2 Berth",     href: "/listings/2-berth-caravans/" },
      { text: "3 – 4 Berth", href: "/listings/3-4-berth-caravans/" },
      { text: "5 – 6 Berth", href: "/listings/5-6-berth-caravans/" },
      { text: "7+ Berth",    href: "/listings/7-plus-berth-caravans/" },
    ],
  },
];


export default function HomeLocationSection() {
  return (
    <section className="hloc-section">
      <div className="container">

        <div className="hloc-header">
          <h2 className="hloc-title">
            Find Caravans for Sale by <span className="hloc-title-accent">Popular Location</span>
          </h2>
          <p className="hloc-subtitle">Browse caravans for sale near you by major Australian cities.</p>
          
        </div>

        <div className="hloc-major-grid">
          {MAJOR_CITIES.map((city) => (
            <a key={city.name} href={city.href} className="hloc-city-card">
              <div className="hloc-city-img-wrap">
                <div className="hloc-city-circle" />
                <Image
                  src={city.imgSrc}
                  alt={city.name}
                  width={110}
                  height={80}
                  className="hloc-city-img"
                  unoptimized
                />
              </div>
              <h3 className="hloc-city-name">
                {city.name} <span className="hloc-city-arrow"></span>
              </h3>
            </a>
          ))}
        </div>

        <div className="hloc-minor-wrap">
          {MINOR_CITIES.map((city, idx) => (
            <a
              key={city.name}
              href={city.href}
              className={`hloc-minor-pill${idx === 0 ? " hloc-minor-pill--active" : ""}`}
            >
              <h3>{city.name}</h3>
            </a>
          ))}
        </div>
<div className="hloc-header">
  <h2 className="hloc-title">
           Search Caravans for Sale <span className="hloc-title-accent">Your Way</span>
          </h2>
   
        </div>
        <div className="hloc-filters">
          
          {FILTERS.map((f) => (
            <div key={f.label} className="hloc-filter-row">
              <div className="hloc-filter-label">
                <span className="hloc-filter-icon-box">{f.icon}</span>
                <span className="hloc-filter-text">{f.label}</span>
              </div>
              <div className="hloc-filter-chips">
                <h3>
                {f.items.map((item,) => (

                  <a key={item.text} href={item.href} className="hloc-chip">
                   {item.text}</a>
                ))}
                </h3>
              </div>
            </div>
          ))}
        </div>
 
        

      </div>
    </section>
  );
}
