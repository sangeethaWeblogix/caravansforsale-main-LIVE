"use client";

import { useState } from "react";

const FAQS = [
  { q: "Where can I find caravans for sale in Victoria?", a: "You can browse thousands of new and used caravans for sale in Victoria on CaravansForSale.com.au — from Melbourne, Geelong, Ballarat, Bendigo, and regional Victoria." },
  { q: "Are there used caravans for sale in Victoria?", a: "Yes. We list hundreds of used caravans for sale in Victoria from both private sellers and licensed dealers across the state." },
  { q: "What are popular caravan types in Victoria?", a: "Popular choices in Victoria include off road caravans, family caravans with bunks, luxury caravans, pop top caravans, and compact touring caravans." },
  { q: "Can I find off road caravans for sale in Victoria?", a: "Absolutely. Victoria has a strong market for off road caravans suited to the High Country, Grampians, and Gippsland regions." },
  { q: "Should I buy from a dealer or private seller in Victoria?", a: "Dealers offer warranty and finance options while private sellers can offer lower prices. Compare both on CaravansForSale.com.au." },
  { q: "How do I compare caravan prices in Victoria?", a: "Use the filters above to search by price range, condition, make, ATM, and sleeping capacity to find the best value caravan in Victoria." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`lsd-faq__item${open ? " lsd-faq__item--open" : ""}`}>
      <button className="lsd-faq__q" onClick={() => setOpen(!open)}>
        {q}
        <svg className="lsd-faq__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {open ? <line x1="5" y1="12" x2="19" y2="12"/> : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
        </svg>
      </button>
      {open && <p className="lsd-faq__a">{a}</p>}
    </div>
  );
}

export default function StateContent() {
  return (
    <section className="lsd-content">
      <div className="container">
        <div className="lsd-content__grid">

          {/* Left: text content */}
          <div className="lsd-content__left">
            <h2 className="lsd-content__title">Buying a Caravan in Victoria</h2>
            <p className="lsd-content__body">
              Victoria is one of Australia&apos;s strongest caravan markets, with buyers searching across Melbourne, Geelong,
              Ballarat, Gippsland and regional areas for new and used caravans. On CaravansForSale.com.au, you can compare
              caravans for sale in Victoria by price, condition, make, model, ATM, length, sleeping capacity and caravan type.
            </p>
            <p className="lsd-content__body">
              Popular choices include off road caravans, family caravans with bunks, compact pop top caravans for easier
              towing, luxury caravans with ensuite layouts, and touring caravans built for longer holidays. Before enquiring,
              compare the caravan&apos;s tare weight, ATM, payload, layout, service history, inclusions and seller details.
            </p>
            <p className="lsd-content__body">
              Use this Victorian caravan buyers guide as a starting point to browse listings by location, budget, size, weight
              and sleeping capacity.
            </p>
            <a href="/caravan-buyers-guide/" className="lsd-content__link">Read more caravan buying tips &amp; guides →</a>
          </div>

          {/* Right: FAQ */}
          <div className="lsd-content__right">
            <h2 className="lsd-content__title">Frequently Asked Questions</h2>
            <div className="lsd-faq">
              {FAQS.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
