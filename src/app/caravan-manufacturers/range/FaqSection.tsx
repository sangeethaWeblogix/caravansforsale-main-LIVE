"use client";
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";


const FaqSection = () => {
  return (
    <section className="faq section-padding style-4 bg_custom_d">
      <div className="container">
        <div className="section-head text-center style-4">
          <h2 className="mb-30">Frequently asked questions (FAQs)</h2>
        </div>
        <div className="content">
          <div className="faq style-3 style-4">
            <div className="accordion" id="accordionSt4">
              <div className="row">
                <div className="col-lg-12">
                  {/* 1 */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading1">
                      <button
                        className="accordion-button rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse1"
                        aria-expanded="true"
                        aria-controls="collapse1"
                      >
                        What makes the Calibra 20.6F ideal for off-road travel?
                      </button>
                    </h3>
                    <div
                      id="collapse1"
                      className="accordion-collapse collapse show rounded-0"
                      aria-labelledby="heading1"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <p>The caravan features a heavy-duty chassis, 3.5T Oz Trekker suspension, and a 6” extended A-frame. Its off-road capabilities ensure stability and durability on rugged terrains. The setup allows smooth towing across tough conditions.</p>
                      </div>
                    </div>
                  </div>
                  {/* 2. */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading2">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse2"
                        aria-expanded="false"
                        aria-controls="collapse2"
                      >
                        How many people can the Calibra 20.6F accommodate?
                      </button>
                    </h3>
                    <div
                      id="collapse2"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading2"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <p>It includes a queen island bed and three bunk beds, making it perfect for families. The spacious lounge area adds extra seating for relaxation. The layout comfortably accommodates up to five people.</p>
                      </div>
                    </div>
                  </div>
                  {/* 3. */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading3">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse3"
                        aria-expanded="false"
                        aria-controls="collapse3"
                      >
                        What power options does the Calibra 20.6F offer?
                      </button>
                    </h3>
                    <div
                      id="collapse3"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading3"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <p>It has three 210W solar panels and two 100Ah lithium batteries for off-grid power. A 2000W inverter and DC-to-DC charger ensure efficient energy management. Multiple USB and 240V power outlets provide easy device charging.</p>
                      </div>
                    </div>
                  </div>
                  {/* 4. */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading4">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse4"
                        aria-expanded="false"
                        aria-controls="collapse4"
                      >
                        Does the Calibra 20.6F have air conditioning?
                      </button>
                    </h3>
                    <div
                      id="collapse4"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading4"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                       <p>Yes, it comes equipped with an Ibis 4 air conditioning system for year-round comfort. The efficient cooling and heating ensure a pleasant indoor climate. Whether hot or cold, the temperature remains controlled.</p>
                      </div>
                    </div>
                  </div>
                  {/* 5. */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading5">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse5"
                        aria-expanded="false"
                        aria-controls="collapse5"
                      >
                       What kitchen facilities are included in the Calibra 20.6F?
                      </button>
                    </h3>
                    <div
                      id="collapse5"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading5"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <p>It features a slide-out Dometic kitchen with burners and a sink for outdoor cooking. Inside, there’s a full oven, microwave, and large fridge/freezer. The well-equipped kitchen makes meal preparation easy and convenient.</p>
                      </div>
                    </div>
                  </div>
                  {/* 6. */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading6">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse6"
                        aria-expanded="false"
                        aria-controls="collapse6"
                      >
                        Is the Calibra 20.6F suitable for off-grid camping?
                      </button>
                    </h3>
                    <div
                      id="collapse6"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading6"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <p>Yes, with solar panels, lithium batteries, and an advanced battery management system. It also includes a grey water tank, large fresh water storage, and efficient plumbing. These features make it fully capable of remote adventures.</p>
                      </div>
                    </div>
                  </div>
                 



                  {/* Repeat this block for Orbit, Grand City, etc. (2–10) */}
                  {/* Just replace ids (heading2/collapse2, heading3/collapse3, etc.) and update content */}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
