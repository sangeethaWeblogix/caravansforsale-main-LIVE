"use client";
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/solid.min.css";
import { useState } from "react";

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
  { label: "Off Road Caravans", icon: "🏕️", href: "/listings/off-road-category/" },
  { label: "Family Caravans", icon: "👨‍👩‍👧‍👦", href: "/listings/family-caravans-category/" },
  { label: "Pop Top Caravans", icon: "🔼", href: "/listings/pop-top-category/" },
  { label: "Hybrid Caravans", icon: "🚐", href: "/listings/hybrid-caravans-category/" },
  { label: "Luxury Caravans", icon: "⭐", href: "/listings/luxury-caravans-category/" },
  { label: "Couples Caravans", icon: "💑", href: "/listings/couples-caravans-category/" },
  { label: "Touring Caravans", icon: "🗺️", href: "/listings/touring-caravans-category/" },
  { label: "Bunk Caravans", icon: "🛏️", href: "/listings/bunk-caravans-category/" },
  { label: "Small Caravans", icon: "📦", href: "/listings/small-caravans-category/" },
  { label: "Used Caravans", icon: "🔄", href: "/listings/used-condition/" },
];

const HOW_TO_STEPS = [
  { num: 1, title: "Create Your Listing", desc: "Add your caravan details, specifications, price and contact information." },
  { num: 2, title: "Upload Photos", desc: "Add clear photos of the inside, outside and key features of your caravan." },
  { num: 3, title: "Receive Buyer Enquiries", desc: "Interested buyers contact you directly through your listing." },
  { num: 4, title: "Negotiate Directly", desc: "Arrange inspections, answer questions and negotiate with buyers." },
  { num: 5, title: "Complete The Sale", desc: "Once sold, mark your listing as sold or remove it from the site." },
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

      {/* ── Banner ── */}
      <section className="banner_section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10 col-12">
              <div className="banner_text text-center">
                <h1 className="mb-2">
                  Sell Your Caravan
                  <article>
                    <span>$49 </span>
                    <span style={{ color: "#f58333", fontSize: "20px" }}>(inc. GST)</span>
                    <span style={{ fontSize: "33px", color: "black" }}>Until Sold.</span>
                  </article>
                </h1>
                <p className="mb-4">No subscriptions. No commissions. No ongoing fees.</p>
                <a href="https://seller.caravansforsale.com.au/seller-signup/" className="btn white_btn">
                  List Your Caravan
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two info boxes ── */}
      <section className="demo-info-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="demo-info-box demo-info-box--accent">
                <h2>Looking to sell your caravan in Australia?</h2>
                <p>
                  CaravansForSale.com.au connects private sellers with caravan buyers across
                  Melbourne, Sydney, Brisbane, Perth, Adelaide and regional Australia.
                </p>
                <p>List your caravan once for $49 (Inc. GST) and keep your ad live until sold.</p>
                <a href="https://seller.caravansforsale.com.au/seller-signup/" className="btn white_btn mt-2">
                  List Your Caravan
                </a>
              </div>
            </div>
            <div className="col-md-6">
              <div className="demo-info-box">
                <h2>Sell Your Caravan Across Australia</h2>
                <p>
                  Whether you're selling an off-road caravan, family caravan, hybrid caravan, pop-top
                  caravan or luxury caravan, CaravansForSale.com.au helps connect private sellers with
                  buyers across Australia.
                </p>
                <p>Your listing reaches thousands of genuine buyers every day, wherever they are.</p>
                <div className="demo-check-grid">
                  {["Australia-wide exposure", "Direct buyer enquiries", "Live until sold", "One low upfront fee"].map((t) => (
                    <span key={t} className="demo-check-item">
                      <i className="fa-solid fa-circle-check"></i> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature icons (black bg) ── */}
      <section className="row_am free_app_section" id="getstarted">
        <div className="container">
          <div className="free_app_inner">
            <div className="row">
              {[
                { img: "/images/chat2.png", title: "Direct Buyer Contact", desc: "Connect directly with interested buyers." },
                { img: "/images/calendar.png", title: "Live Until Sold", desc: "Your listing stays online until your caravan is sold." },
                { img: "/images/caravan.png", title: "Caravan-Only Marketplace", desc: "Reach a targeted audience of caravan buyers." },
                { img: "/images/dollar.png", title: "Keep 100% of Your Sale", desc: "Pay only $49 Inc GST per listing. No commissions or hidden costs." },
              ].map((item, i) => (
                <div className="col-md-6 col-lg-3" key={i}>
                  <div className="why_box">
                    <div className="icon"><img src={item.img} alt={item.title} /></div>
                    <div className="text"><h4>{item.title}</h4><p>{item.desc}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Device image ── */}
      <section className="bottom_layout_section">
        <div className="container">
          <div className="comparison">
            <h2>Reach caravan buyers across Australia</h2>
            <img src="/images/your-caravan-desktop-seller.jpg" className="img-fluid d-none d-lg-block" alt="Caravan For Sale Desktop" />
            <img src="/images/your-caravan-mobile.png" className="img-fluid d-block d-lg-none caravan-mobile-img" alt="Caravan For Sale Mobile" />
          </div>

          {/* ── Pricing ── */}
          <div className="pricing">
            <div className="pricing-grid">
              <div className="price-box">
                <div className="price"><sup><small>$</small></sup>49 <span style={{ fontSize: "20px" }}>(Inc. GST)</span></div>
                <span className="special_tag">One-Time Listing Fee</span>
                <ul>
                  <li>1 caravan listed until sold</li>
                  <li>Edit your listing anytime</li>
                  <li>No expiration or monthly fees</li>
                </ul>
                <a href="https://seller.caravansforsale.com.au/seller-signup/" className="btn white_btn">List My Caravan Now</a>
              </div>
              <div className="price-box">
                <div className="faq">
                  <h3>How long does the listing stay up?</h3>
                  <ul className="mb-4">
                    <li>Your ad stays live until it sells.</li>
                    <li>You can update details, photos, and price anytime.</li>
                    <li>Mark as sold or remove anytime — no penalties.</li>
                  </ul>
                  <h3>Can I edit my listing after posting?</h3>
                  <ul>
                    <li>Yes, updates are allowed anytime.</li>
                    <li>No penalties or restrictions.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main FAQ accordion ── */}
          <h2 className="demo-section-title">FAQ</h2>
          <div className="accordion mb-5" id="accordionFaq">
            {MAIN_FAQS.map((faq, i) => (
              <div className="card" key={i}>
                <div className="card-header p-0">
                  <h3 className="mb-0">
                    <button className="btn btn-link btn-block text-left py-2" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                      {faq.q}
                      <span className="accordion-icon">
                        <i className={`fa-solid fa-angle-down ${activeFaq === i ? "d-none" : ""}`}></i>
                        <i className={`fa-solid fa-angle-up ${activeFaq === i ? "" : "d-none"}`}></i>
                      </span>
                    </button>
                  </h3>
                </div>
                <div className={`collapse ${activeFaq === i ? "show" : ""}`}>
                  <div className="card-body">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── City links ── */}
      <section className="demo-city-section">
        <div className="container">
          <h2 className="demo-section-title">Sell Your Caravan Across Australia</h2>
          <div className="demo-city-grid">
            {CITY_LINKS.map((c) => (
              <a href={c.href} key={c.label} className="demo-city-item">
                <span className="demo-city-icon">🚐</span>
                <span>{c.label}</span>
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
                <span className="demo-type-icon">{t.icon}</span>
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
            <div className="col-md-5">
              <img src="/images/your-caravan-desktop-seller.jpg" className="img-fluid demo-why-img" alt="Caravan buyers" />
            </div>
            <div className="col-md-7">
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
          <h2 className="demo-section-title">How To Sell Your Caravan Online</h2>
          <div className="demo-steps-grid">
            {HOW_TO_STEPS.map((s) => (
              <div className="demo-step" key={s.num}>
                <div className="demo-step-num">{s.num}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
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
