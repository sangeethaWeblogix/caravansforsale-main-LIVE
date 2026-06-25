"use client";
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/solid.min.css";
import "@fortawesome/fontawesome-free/css/regular.min.css";
import React, { useState } from "react";

const STATE_LINKS = [
  { label: "Victoria",              img: "/images/vic_map.svg", href: "/sell-my-caravan/" },
  { label: "New South Wales",       img: "/images/nsw_map.svg", href: "/sell-my-caravan/" },
  { label: "Queensland",            img: "/images/qld_map.svg", href: "/sell-my-caravan/" },
  { label: "Western Australia",     img: "/images/wa_map.svg",  href: "/sell-my-caravan/" },
  { label: "South Australia",       img: "/images/sa_map.svg",  href: "/sell-my-caravan/" },
  { label: "Tasmania",              img: "/images/tas_map.svg", href: "/sell-my-caravan/" },
];

const CITY_LINKS = [
  { label: "Sell My Caravan Melbourne", href: "/sell-my-caravan/" },
  { label: "Sell My Caravan Sydney", href: "/sell-my-caravan/" },
  { label: "Sell My Caravan Brisbane", href: "/sell-my-caravan/" },
  { label: "Sell My Caravan Perth", href: "/sell-my-caravan/" },
  { label: "Sell My Caravan Adelaide", href: "/sell-my-caravan/" },
  { label: "Sell My Caravan Gold Coast", href: "/sell-my-caravan/" },
  { label: "Sell My Caravan Sunshine Coast", href: "/sell-my-caravan/" },
  { label: "Sell My Caravan Newcastle", href: "/sell-my-caravan/" },
  { label: "Sell My Caravan Canberra", href: "/sell-my-caravan/" },
  { label: "Sell My Caravan Hobart", href: "/sell-my-caravan/" },
];

const CARAVAN_TYPES = [
  { label: "Off Road Caravans", img: "/images/off-road.webp", href: "/listings/off-road-category/" },
  { label: "Family Caravans", img: "/images/family.webp", href: "/listings/family-caravans-category/" },
  { label: "Pop Top Caravans", img: "/images/pop-top.webp", href: "/listings/pop-top-category/" },
  { label: "Hybrid Caravans", img: "/images/hybrid.webp", href: "/listings/hybrid-caravans-category/" },
  { label: "Luxury Caravans", img: "/images/luxury.webp", href: "/listings/luxury-caravans-category/" },
  { label: "Couples Caravans", img: "/images/touring.webp", href: "/listings/couples-caravans-category/" },
  { label: "Touring Caravans", img: "/images/touring.webp", href: "/listings/touring-caravans-category/" },
  { label: "Bunk Caravans", img: "/images/family.webp", href: "/listings/bunk-caravans-category/" },
  { label: "Small Caravans", img: "/images/pop-top.webp", href: "/listings/small-caravans-category/" },
  { label: "Used Caravans", img: "/images/off-road.webp", href: "/listings/used-condition/" },
];

const HOW_TO_STEPS = [
  { num: 1, iconSet: "fa-regular", icon: "fa-file-lines",    title: "Create Your Listing",    desc: "Add your caravan details, specifications, price and contact information." },
  { num: 2, iconSet: "fa-regular", icon: "fa-image",         title: "Upload Photos",          desc: "Add clear photos of the inside, outside and key features of your caravan." },
  { num: 3, iconSet: "fa-regular", icon: "fa-comment-dots",  title: "Receive Buyer Enquiries", desc: "Interested buyers contact you directly through your listing." },
  { num: 4, iconSet: "fa-regular", icon: "fa-handshake",     title: "Negotiate Directly",     desc: "Arrange inspections, answer questions and negotiate with buyers." },
  { num: 5, iconSet: "fa-regular", icon: "fa-circle-check",  title: "Complete The Sale",      desc: "Once sold, mark your listing as sold or remove it from the site." },
];

const FAQ_COL1 = [
  "How do I sell my caravan online?",
  "What photos should I upload?",
  "How much does it cost to list my caravan?",
  "How long does it take to list a caravan?",
  "Can I edit my listing after it's live?",
  "How do buyers contact me?",
  "Can dealers list caravans on CaravansForSale?",
];

const FAQ_COL2 = [
  "What information should I include in my listing?",
  "How do I price my caravan?",
  "Can I remove my listing at any time?",
  "What happens when my caravan is sold?",
  "How many photos can I upload?",
  "Do I handle the payment directly with the buyer?",
  "Is my listing visible across Australia?",
];

const FAQ_BOTTOM = [
  "Can I relist my caravan if it doesn't sell?",
  "Is there a limit to how long my ad is active?",
  "Do I need an account to list my caravan?",
  "Can I update the price after listing?",
  "Is it safe to sell my caravan online?",
];

const MAIN_FAQS = [
  {
    q: "How do I list my caravan for sale on CaravansForSale?",
    a: (
      <ul>
        <li><b>1. Sign Up/Login:</b> Create a free account or log in to your existing account.</li>
        <li><b>2. Create Your Listing:</b> Enter your caravan's details, description, price, location and key features.</li>
        <li><b>3. Upload Photos:</b> Add clear photos of your caravan (interior and exterior) to attract buyers.</li>
        <li><b>4. Pay & Publish:</b> Pay the one-time $49 listing fee. Your listing goes live instantly.</li>
      </ul>
    ),
  },
  {
    q: "How much does it cost to list my caravan, and are there any other fees?",
    a: <p>It costs just $49 to list your caravan as a private seller. This is a one-time listing fee — no subscriptions, no commissions, no hidden fees. Your ad stays up until your caravan is sold.</p>,
  },
  {
    q: "How long will my listing stay active?",
    a: <p>Your ad stays live until your caravan is sold. There are no expiry dates. Unlike some sites that limit listings to 30 or 60 days, CaravansForSale keeps your listing up for as long as it takes.</p>,
  },
  {
    q: "How do interested buyers contact me about my caravan?",
    a: <p>Buyers reach out through the "Enquire Now" button on your listing. Messages go straight to your email. Your personal contact details aren't displayed publicly on the listing.</p>,
  },
  {
    q: "Can I edit or update my listing after it's live?",
    a: <p>Absolutely! You can update your listing at any time — change the price, edit the description, or upload new photos — at no extra cost.</p>,
  },
  {
    q: "What if I sell my caravan or change my mind about selling?",
    a: <p>You're in full control. Mark your listing as "Sold" or remove it at any time. No penalties or extra fees.</p>,
  },
  {
    q: "How many photos can I upload, and what details should I include?",
    a: <p>We allow multiple photos. Upload clear pictures from all angles — exterior, interior, layout, and special features. Include make, model, year, condition, upgrades, and registration status in your description.</p>,
  },
  {
    q: "Do I handle the sale and payment directly with the buyer?",
    a: <p>Yes. Once connected, all sale details are handled between you and the buyer. CaravansForSale does not process payments — we simply connect you both.</p>,
  },
];

export default function SellerDemo() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="page_wrapper demo-page">

      {/* ── Hero ── */}
      <section className="demo-hero">
        <div className="container">
          <h1 className="demo-hero__title">
            Best Place To Sell Your Caravan In Australia
          </h1>
          <div className="demo-hero__divider">
            <span className="demo-hero__divider-line" />
            <i className="fa-solid fa-shield-halved demo-hero__divider-icon" />
            <span className="demo-hero__divider-line" />
          </div>

          {/* Pricing card + CTA wrapper — one seamless unit */}
          <div className="demo-price-wrapper">
          <div className="demo-price-card">
            <div className="demo-price-card__header">
              <h3>Looking to sell your caravan in Australia?</h3>
            </div>
            {/* Left: Australia info */}
            <div className="demo-price-card__left">
              <div className="demo-price-card__aus-circle">
                <img src="/images/australia.png" alt="Australia" />
              </div>
              <p className="demo-price-card__desc">
                CaravansForSale.com.au connects private sellers with caravan buyers across
                Victoria, New South Wales, Queensland, Western Australia, South Australia and Tasmania.
              </p>
              <div className="demo-price-card__trust">
                <span className="demo-price-card__trust-icon">
                  <i className="fa-solid fa-shield-halved" />
                </span>
                <span className="demo-price-card__trust-text">
                  Trusted by thousands<br />of sellers Australia-wide.
                </span>
              </div>
            </div>

            {/* Center: Price highlight */}
            <div className="demo-price-card__center">
              <div className="demo-price-card__badge">ONE-TIME PRICE</div>
              <div className="demo-price-card__price-box">
                <div className="demo-price-card__only">ONLY</div>
                <div className="demo-price-card__amount"><sup>$</sup>49</div>
                <hr className="demo-price-card__hr" />
                <div className="demo-price-card__fee">One-Time Listing Fee (Inc. GST)</div>
              </div>
            </div>

            {/* Right: Features */}
            <div className="demo-price-card__right">
              {[
                { icon: "fa-calendar-days", label: "No Subscriptions" },
                { icon: "fa-percent", label: "No Commissions" },
                { icon: "fa-circle-dollar-to-slot", label: "No Ongoing Fees" },
                { icon: "fa-bullhorn", label: "Ad Live Until Sold" },
              ].map((item, i) => (
                <div key={item.label} className={`demo-price-card__feature${i < 3 ? " demo-price-card__feature--border" : ""}`}>
                  <span className="demo-price-card__feature-icon">
                    <i className={`fa-solid ${item.icon}`} />
                  </span>
                  <span className="demo-price-card__feature-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA — inside wrapper so it attaches seamlessly to card bottom */}
          <a href="https://seller.caravansforsale.com.au/seller-signup/" className="demo-hero__cta">
            List Your Caravan Now <i className="fa-solid fa-arrow-right" />
          </a>
          </div>{/* end demo-price-wrapper */}

          
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="demo-features-section">
        <div className="container">
          <div className="demo-features-grid">
            {[
              { img: "/images/chat2.png", title: "Direct Buyer Contact", desc: "Connect directly with genuine buyers. No middleman." },
              { img: "/images/calendar.png", title: "Live Until Sold", desc: "Your listing stays online and visible until your caravan is sold." },
              { img: "/images/caravan.png", title: "Caravan-Only Marketplace", desc: "Reach a targeted audience actively looking to buy caravans." },
              { img: "/images/dollar.png", title: "Keep 100% of Your Sale", desc: "Pay only $49 Inc GST per listing. No commissions or hidden costs." },
            ].map((item, i) => (
              <div className="demo-feature-card" key={i}>
                <div className="demo-feature-card__icon">
                  <img src={item.img} alt={item.title} />
                </div>
                <h4 className="demo-feature-card__title">{item.title}</h4>
                <p className="demo-feature-card__desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reach section ── */}
      <section className="demo-reach-section">
        <div className="container">

          {/* Heading */}
          <div className="demo-reach-heading">
            <h2>Reach Caravan Buyers Across Australia</h2>
            <p>Your listing is seen by thousands of active buyers Australia-wide.</p>
          </div>

          {/* Device image */}
          <div className="demo-reach-device">
            <img src="/images/your-caravan-desktop-seller.jpg" className="img-fluid d-none d-lg-block" alt="Caravan For Sale Desktop" />
            <img src="/images/your-caravan-mobile.png" className="img-fluid d-block d-lg-none" alt="Caravan For Sale Mobile" />
          </div>

          {/* Pricing + FAQ card */}
          <div className="demo-reach-card">
            {/* Left: Pricing */}
            <div className="demo-reach-card__left">
              <span className="demo-reach-card__badge">BEST VALUE</span>
              <div className="demo-reach-card__price">
                <span className="demo-reach-card__dollar">$</span>
                <span className="demo-reach-card__amount">49</span>
                <span className="demo-reach-card__gst">(Inc. GST)</span>
              </div>
              <p className="demo-reach-card__fee-label">One-Time Listing Fee</p>
              <ul className="demo-reach-card__list">
                {[
                  "1 Caravan listed until sold",
                  "Edit your listing anytime",
                  "No expiration or monthly fees",
                ].map((item) => (
                  <li key={item}>
                    <i className="fa-solid fa-circle-check" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="https://seller.caravansforsale.com.au/seller-signup/" className="demo-reach-card__cta">
                List My Caravan Now <i className="fa-solid fa-arrow-right" />
              </a>
            </div>

            {/* Divider */}
            <div className="demo-reach-card__divider" />

            {/* Right: FAQ items */}
            <div className="demo-reach-card__right">
              <div className="demo-reach-faq">
                
                <div className="demo-reach-faq__body">
                  <h4>How long does the listing stay up?</h4>
                  <ul>
                    <li><i className="fa-solid fa-circle-check" />Your ad stays live until it sells.</li>
                    <li><i className="fa-solid fa-circle-check" />You can update details, photos, and price anytime.</li>
                    <li><i className="fa-solid fa-circle-check" />Mark as sold or remove anytime — no penalties.</li>
                  </ul>
                </div>
              </div>
              <div className="demo-reach-faq demo-reach-faq--border">
                
                <div className="demo-reach-faq__body">
                  <h4>Can I edit my listing after posting?</h4>
                  <ul>
                    <li><i className="fa-solid fa-circle-check" />Yes, updates are allowed anytime.</li>
                    <li><i className="fa-solid fa-circle-check" />No penalties or restrictions.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

         

        </div>
      </section>

      {/* ── Main FAQ accordion ── */}
      <section className="demo-faq-section">
        <div className="container">
          <div className="demo-faq-head">
            <span className="demo-faq-head__tag">FAQ</span>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about selling your caravan on CaravansForSale.com.au</p>
          </div>
          <div className="demo-faq-list">
            {MAIN_FAQS.map((faq, i) => (
              <div
                key={i}
                className={`demo-faq-item${activeFaq === i ? " demo-faq-item--open" : ""}`}
              >
                <button
                  className="demo-faq-item__q"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <span className="demo-faq-item__icon">
                    <i className={`fa-solid ${activeFaq === i ? "fa-minus" : "fa-plus"}`} />
                  </span>
                </button>
                {activeFaq === i && (
                  <div className="demo-faq-item__a">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── City links ── */}
      <section className="demo-city-section">
        <div className="container">
          <h2 className="demo-section-title">Sell Your Caravan Across Australia</h2>

          {/* State cards */}
          <div className="demo-state-grid">
            {STATE_LINKS.map((s) => (
              <a href={s.href} key={s.label} className="demo-state-item">
                <div className="demo-state-item__img">
                  <img src={s.img} alt={s.label} />
                </div>
                <span className="demo-state-item__label">{s.label}</span>
              </a>
            ))}
          </div>

          {/* City cards */}
          <div className="demo-city-grid">
            {CITY_LINKS.map((c) => (
              <a href={c.href} key={c.label} className="demo-city-item">
                <span className="demo-city-icon">
                  <img src="/images/caravan.png" alt="" />
                </span>
                <span className="demo-city-label">{c.label}</span>
                <i className="fa-solid fa-chevron-right demo-city-arrow" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Caravan types ── */}
      <section className="demo-types-section">
        <div className="container">
          <h2 className="demo-section-title">Sell Any Type of Caravan</h2>
          <div className="demo-types-grid">
            {CARAVAN_TYPES.map((t) => (
              <a href={t.href} key={t.label} className="demo-type-item">
                <div className="demo-type-icon">
                  <img src={t.img} alt={t.label} width={80} height={80} />
                </div>
                <span className="demo-type-label">{t.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why buyers section ── */}
      <section className="demo-why-section">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-md-6">
              <img src="/images/your-caravan-desktop-seller.jpg" className="img-fluid demo-why-img" alt="Caravan buyers" />
            </div>
            <div className="col-md-6">
              <h2>Why Thousands of Caravan Buyers Visit CaravansForSale Every Month</h2>
              <p>
                CaravansForSale.com.au is Australia's dedicated caravan marketplace, built exclusively
                for caravan buyers and sellers. We attract thousands of genuine buyers every day who
                are actively searching for road caravans, family caravans, pop-top caravans, luxury
                caravans and more.
              </p>
              <div className="demo-check-grid demo-check-grid--2col mt-3">
                {[
                  "Australia-wide exposure", "Live until sold for one low price",
                  "Caravan-only marketplace", "Update listing anytime",
                  "Direct buyer enquiries", "No dealer involvement",
                  "No commissions or hidden fees", "Simple, fast and effective",
                ].map((t) => (
                  <span key={t} className="demo-check-item">
                    <i className="fa-solid fa-circle-check"></i> {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How to sell ── */}
      <section className="demo-steps-section">
        <div className="container">
          
          <h2 className="demo-steps-title">How To Sell Your Caravan Online</h2>
          <p className="demo-steps-subtitle">List your caravan in minutes and connect with serious buyers Australia-wide.</p>

          {/* Steps: each column has number circle + icon + content; connectors between columns */}
          <div className="demo-steps-wrapper">
            {HOW_TO_STEPS.map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="demo-steps-item">
                  <div className="demo-step-num">{s.num}</div>
                  <div className="demo-step-icon-circle">
                    <i className={`${s.iconSet} ${s.icon}`} />
                  </div>
                  <h4 className="demo-step-title">{s.title}</h4>
                  <p className="demo-step-desc">{s.desc}</p>
                </div>
                {i < HOW_TO_STEPS.length - 1 && (
                  <div className="demo-steps-connector" />
                )}
              </React.Fragment>
            ))}
          </div>

          
        </div>
      </section>

      {/* ── 2-column FAQ ── */}
      <section className="demo-faq2-section">
        <div className="container">
          <h2 className="demo-section-title">Frequently Asked Questions</h2>
          <div className="row">
            <div className="col-md-6">
              <ul className="demo-faq2-list">
                {FAQ_COL1.map((q) => <li key={q}><a href="#">{q}</a></li>)}
              </ul>
            </div>
            <div className="col-md-6">
              <ul className="demo-faq2-list">
                {FAQ_COL2.map((q) => <li key={q}><a href="#">{q}</a></li>)}
              </ul>
            </div>
          </div>
          <div className="demo-faq2-bottom">
            {FAQ_BOTTOM.map((q) => (
              <a href="#" key={q} className="demo-faq2-chip">{q}</a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA strip ── */}
      <section className="demo-cta-strip">
        <div className="container text-center">
          <p>
            Start selling your caravan today for just{" "}
            <strong>$49 (Inc. GST)</strong> — Live until sold!
          </p>
          <a href="https://seller.caravansforsale.com.au/seller-signup/" className="btn white_btn">
            List Your Caravan Now
          </a>
        </div>
      </section>

    </div>
  );
}
