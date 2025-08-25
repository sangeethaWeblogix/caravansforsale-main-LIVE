"use client";
// import { useState } from 'react';

// const faqs = [
//   {
//     question: 'What defines an “off road” caravan?',
//     answer:
//       'An off-road caravan is specially designed to handle rough terrains and challenging conditions. It features reinforced chassis, heavy-duty suspension, increased ground clearance, and durable materials to withstand the rigors of off-grid travel. These caravans provide comfort and safety while exploring remote locations away from paved roads.',
//   },
//   {
//     question: 'Are off-road caravans suitable for full-time living?',
//     answer: `Yes, many off-road caravans are designed with the durability and amenities needed for full-time living. With features like ample storage, large water tanks, air conditioning, and off-grid power systems, they support extended stays in remote locations. This makes them ideal for exploring rugged destinations such as the <a href="https://www.queensland.com/au/en/places-to-see/destinations/cairns-and-great-barrier-reef/cape-york" target="_blank">Cape York Peninsula in North Queensland</a> or the <a href="https://www.discovertasmania.com.au/things-to-do/nature-and-wildlife/tarkineforestreserve/" target="_blank">Tarkine Wilderness</a> in North West Tasmania.`,
//   },
//   {
//     question: 'How much should I budget for a 2025 model?',
//     answer:
//       'Pricing for 2025 off-road caravans varies widely depending on size, features, and customization. Entry-level models may start around $60,000 AUD; to explore affordable options, check out <a href="https://www.caravansforsale.com.au/listings/under-60000/" target="_blank">caravans under $60,000 for sale in Australia</a>. Luxury or family-sized caravans can exceed $200,000 AUD.',
//   },
//   {
//     question: 'Which caravan is best for families in rough terrain?',
//     answer:
//       'Family-friendly off-road caravans typically offer multiple sleeping areas, such as bunk beds and queen beds, along with spacious living and dining areas. Models with durable chassis, advanced suspension, and ample water and power capacity are ideal for families exploring rough terrain safely and comfortably.',
//   },
//   {
//     question: 'Is lithium power necessary for off-road travel?',
//     answer:
//       'While not strictly necessary, lithium batteries provide significant advantages for off-road caravans. They offer higher energy capacity, faster charging, longer lifespan, and lighter weight compared to traditional lead-acid batteries, enabling longer off-grid stays with reliable power for appliances and systems.',
//   },
//   {
//     question: 'What suspension type is ideal for rough terrain?',
//     answer:
//       'Independent coil or airbag suspension systems are preferred for off-road caravans as they absorb shocks better and provide smoother rides over uneven surfaces. Quality suspension enhances safety, protects the caravan’s structure, and improves towing stability on challenging terrain.',
//   },
//   {
//     question: 'Can I tow an off-road caravan with a standard SUV?',
//     answer:
//       'Towing capability depends on your SUV’s towing capacity and the caravan’s weight. Many off-road caravans are designed to be lightweight and manageable, but it’s essential to match your vehicle’s specifications. For recommendations, check out <a href="https://rac.com.au/horizons/drive/best-towing-vehicles" target="_blank">RAC WA’s guide to best towing vehicles</a>.',
//   },
//   {
//     question: 'How do I maintain an off-road caravan?',
//     answer:
//       'Regular maintenance includes checking suspension and chassis integrity, inspecting tyres and brakes, servicing electrical and plumbing systems, and cleaning solar panels. Proper storage and timely repairs help preserve durability and performance.',
//   },
//   {
//     question: 'Are solar panels standard on 2025 models?',
//     answer:
//       'Most 2025 off-road caravans come equipped with solar panels or have them as standard or optional features. For advice on selecting the best panels, see the <a href="https://www.solar4rvs.com.au/buying/buyer-guides/guide-best-solar-panels-for-caravan" target="_blank">Solar4RVs buyer’s guide</a>.',
//   },
//   {
//     question: 'What’s the difference between hybrid and traditional off-road caravans?',
//     answer:
//       'Hybrid caravans combine features of pop-top and hard-top designs, offering lighter weight and compact storage with expandable living space. Traditional models offer fixed hard tops with maximum durability, but at a higher weight.',
//   },
//   {
//     question: 'How long can I stay off-grid with these models?',
//     answer:
//       'Off-grid duration depends on water storage, battery capacity, solar power, and resource management. Well-equipped caravans can support extended stays lasting several days to weeks.',
//   },
// ];

export default function FaqSection() {
  // const [activeIndex, setActiveIndex] = useState(0);

  // const toggleAccordion = (index) => {
  //   setActiveIndex(index === activeIndex ? null : index);
  // };

  return (
    <section className="faq section-padding style-4 pt-40 pb-40 bg_custom_d">
      <div className="container">
        <div className="section-head text-center style-4">
          <h2 className="mb-30">Frequently asked questions (FAQs)</h2>
        </div>
        {/* <div className="content">
            <div className="faq style-3 style-4">
          <div className="accordion" id="accordionFaq">
            {faqs.map((faq, index) => (
              <div className="accordion-item border-bottom rounded-0" key={index}>
                <h3 className="accordion-header" id={`heading${index}`}>
                  <button
                    className={`accordion-button rounded-0 py-4 ${
                      activeIndex === index ? '' : 'collapsed'
                    }`}
                    type="button"
                    onClick={() => toggleAccordion(index)}
                    aria-expanded={activeIndex === index}
                    aria-controls={`collapse${index}`}
                  >
                    {faq.question}
                  </button>
                </h3>
                <div
                  id={`collapse${index}`}
                  className={`accordion-collapse collapse ${
                    activeIndex === index ? 'show' : ''
                  }`}
                  aria-labelledby={`heading${index}`}
                  data-bs-parent="#accordionFaq"
                >
                  <div
                    className="accordion-body"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        </div> */}
      </div>
    </section>
  );
}
