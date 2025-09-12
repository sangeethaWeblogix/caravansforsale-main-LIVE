"use client";
import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

export default function FaqSection({ faqs }: { faqs: FaqItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null; // ✅ nothing to show

  const toggleAccordion = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="faq section-padding style-4 pt-40 pb-40 bg_custom_d">
      <div className="container">
        <div className="section-head text-center style-4">
          <h2 className="mb-30">Frequently asked questions (FAQs)</h2>
        </div>
        <div className="accordion" id="accordionFaq">
          {faqs.map((faq, index) => {
            const isOpen = activeIndex === index;
            return (
              <div className="accordion-item border-bottom" key={index}>
                <h3 className="accordion-header">
                  <button
                    className={`accordion-button ${isOpen ? "" : "collapsed"}`}
                    type="button"
                    onClick={() => toggleAccordion(index)}
                  >
                    {faq.question}
                  </button>
                </h3>
                <div
                  className={`accordion-collapse collapse ${
                    isOpen ? "show" : ""
                  }`}
                >
                  <div
                    className="accordion-body"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
