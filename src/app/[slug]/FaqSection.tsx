"use client";
import { useState } from "react";
import "./details.css";

type FaqItem = {
  heading: string;
  content: string;
};

export default function FaqSection({ data, catLabel = "", catLink = "/listings/" }: { data: FaqItem[]; catLabel?: string; catLink?: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const toggleAccordion = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };


  return (
    <section className="blog-faq-section">
      <div className="container">
        <div className="blog-faq-layout">

          {/* Left: FAQ accordion */}
          <div className="blog-faq-left">
            <div className="blog-faq-header">
              <span className="blog-faq-icon"><i className="bi bi-chat-square-text" /></span>
              <h2 className="blog-faq-title">Frequently asked questions (FAQs)</h2>
            </div>
            <div className="blog-faq-list">
              {data.map((faq, index) => {
                const isOpen = activeIndex === index;
                return (
                  <div key={index} className={`blog-faq-item${isOpen ? " blog-faq-item--open" : ""}`}>
                    <button
                      className="blog-faq-question"
                      onClick={() => toggleAccordion(index)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.heading}</span>
                      <i className={`bi ${isOpen ? "bi-dash" : "bi-plus"}`} />
                    </button>
                    {isOpen && (
                      <div
                        className="blog-faq-answer"
                        dangerouslySetInnerHTML={{ __html: faq.content }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: CTA card */}
          <div className="blog-faq-cta">
            <div className="blog-faq-cta__icon"><img src="/images/category.svg" alt="" width={36} height={36} /></div>
            <h3 className="blog-faq-cta__heading">
              {catLabel ? `Ready to Find Your Dream ${catLabel} Caravan?` : "Ready to Find Your Dream Caravan?"}
            </h3>
            <p className="blog-faq-cta__desc">
              {catLabel ? `Explore thousands of ${catLabel.toLowerCase()} caravans for sale across Australia and start your journey in style.` : "Explore thousands of caravans for sale across Australia and start your journey in style."}
            </p>
            <a href={catLink} className="blog-faq-cta__btn">
              {catLabel ? `Browse ${catLabel} Caravans →` : "Browse Caravans →"}
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
