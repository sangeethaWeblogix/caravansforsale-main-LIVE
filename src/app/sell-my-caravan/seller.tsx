"use client";
import { useState } from "react";

const SellYourCaravan = () => {

  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (id) => {
    setActiveFaq(activeFaq === id ? null : id);
  };
  return (
    <div className="page_wrapper">

      {/* Banner Section */}
      <section className="banner_section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-12 col-md-12">
              <div className="banner_text text-center">
                <h1 className="mb-2">
                  Sell Your Caravan
                  <article>
                    <span> $35 </span>
                    <span style={{ color: "#f58333", fontSize: "20px" }}>
                      (inc. GST)
                    </span>
                    <span style={{ fontSize: "33px", color: "black" }}>
                      Until Sold.
                    </span>
                  </article>
                </h1>

                <p className="mb-4">
                  No subscriptions. No commissions. No ongoing fees.
                </p>

                <a href="#" className="btn white_btn">
                  List Your Caravan
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="row_am free_app_section" id="getstarted">
        <div className="container">
          <div className="free_app_inner">
            <div className="row">

              {[
                {
                  img: "/images/chat2.png",
                  title: "Direct Buyer Contact",
                  desc: "Connect directly with interested buyers."
                },
                {
                  img: "/images/calendar.png",
                  title: "Live Until Sold",
                  desc: "Your listing stays online until your caravan is sold."
                },
                {
                  img: "/images/caravan.png",
                  title: "Caravan-Only Marketplace",
                  desc: "Reach a targeted audience of caravan buyers."
                },
                {
                  img: "/images/dollar.png",
                  title: "Keep 100% of Your Sale",
                  desc: "Pay only $35 Inc GST per listing. No commissions or hidden costs."
                }
              ].map((item, index) => (
                <div className="col-md-6 col-lg-3" key={index}>
                  <div className="why_box">
                    <div className="icon">
                      <img src={item.img} alt="image" />
                    </div>
                    <div className="text">
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      </section>

      {/* Image + Pricing */}
      <section className="bottom_layout_section">
        <div className="container">
          <div className="row">
            <div className="col-md-12 col-lg-12">
              <div className="comparison">
                <h2>Reach caravan buyers across Australia</h2>

                <img
                  src="/images/your-caravan-desktop-seller.jpg"
                  className="img-fluid d-none d-lg-block"
                  alt="Caravan For Sale Desktop"
                />

                <img
                  src="/images/your-caravan-mobile.png"
                  className="img-fluid d-block d-lg-none caravan-mobile-img"
                  alt="Caravan For Sale Mobile"
                />
              </div>
            </div>
          </div>

          <div className="pricing">
            <div className="pricing-grid">

              <div className="price-box">
                <div className="price">
                  <sup><small>$</small></sup>35{" "}
                  <span style={{ fontSize: "20px" }}>(Inc. GST)</span>
                </div>
                <span className="special_tag">One-Time Listing Fee</span>
                <ul>
                  <li>1 caravan listed until sold</li>
                  <li>Edit your listing anytime</li>
                  <li>No expiration or monthly fees</li>
                </ul>
                <a href="#" className="btn white_btn">
                  List My Caravan Now
                </a>
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

          {/* FAQ Accordion */}
          <h2>FAQ</h2>

          <div className="accordion" id="accordionFaq">
            {/* FAQ 1 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(1)}
                  >
                    How do I list my caravan for sale on CaravansForSale?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 1 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 1 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 1 ? "show" : ""}`}>
                <div className="card-body">
                  <p>Listing your caravan is easy and only takes a few minutes:</p>

                  <ul>
                    <li><b>1. Sign Up/Login:</b> Create a free account on CaravansForSale (or log in to
                      your existing
                      account).</li>
                    <li><b>2. Create Your Listing:</b> Click the "Sell My Caravan" (or similar) button
                      and
                      enter your
                      caravan’s details. You’ll add a description, price, location, and any key
                      features.</li>
                    <li><b>3. Upload Photos: </b>Add clear photos of your caravan (interior and
                      exterior)
                      to attract
                      buyers.</li>
                    <li><b>4. Pay & Publish:</b> Pay the one-time $35 listing fee and publish your ad.
                      Once
                      submitted,
                      your listing goes live on our site and is visible to thousands of caravan buyers
                      Australia-wide!</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* FAQ 2 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(2)}
                  >
                    How much does it cost to list my caravan, and are there any other fees?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 2 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 2 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 2 ? "show" : ""}`}>
                <div className="card-body">
                  <p> It costs just $35 to list your caravan on CaravansForSale as a private seller. This
                    is a one-time listing fee – no subscriptions and no ongoing monthly charges. We do
                    not take any commission on your sale, so you keep 100% of the sale price. There are
                    no hidden fees or success fees; one flat $35 and your ad stays up until your caravan
                    is sold.</p>
                </div>
              </div>
            </div>

            {/* FAQ 3 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(3)}
                  >
                    How long will my listing stay active?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 3 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 3 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 3 ? "show" : ""}`}>
                <div className="card-body">
                  <p>Your ad stays live until your caravan is sold – there are no expiry dates to worry
                    about. Unlike some sites that might limit your listing to 30 or 60 days,
                    CaravansForSale keeps your listing up for as long as it takes to find the right
                    buyer. You won’t need to renew or pay again to keep it online.</p>
                </div>
              </div>
            </div>

            {/* FAQ 4 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(4)}
                  >
                    How do interested buyers contact me about my caravan?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 4 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 4 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 4 ? "show" : ""}`}>
                <div className="card-body">
                  <p>Interested buyers will reach out to you directly through the “Enquire Now” button on
                    your listing page. When someone clicks this button and sends a message, it goes
                    straight to you (via email). You can then choose to continue the conversation with
                    the potential buyer via email, phone, or SMS – whatever works best for both parties.
                    Your personal contact details aren’t displayed publicly on the listing, so initial
                    inquiries are handled securely through our platform.</p>
                </div>
              </div>
            </div>

            {/* FAQ 5 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(5)}
                  >
                    Can I edit or update my listing after it’s live?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 5 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 5 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 5 ? "show" : ""}`}>
                <div className="card-body">
                  <p>Absolutely! You can update your listing at any time, even after it’s published. If
                    you need to change the price, edit the description, or upload new photos, you’re
                    free to do so. Keeping your listing info up-to-date is easy and comes at no extra
                    cost. In fact, refreshing your details or adding new photos can help attract more
                    interest.</p>
                </div>
              </div>
            </div>

            {/* FAQ 6 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(6)}
                  >
                    What if I sell my caravan or change my mind about selling?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 6 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 6 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 6 ? "show" : ""}`}>
                <div className="card-body">
                  <p>No problem at all – you’re in control. If your caravan is sold or you decide not to
                    sell anymore, you can simply mark your listing as “Sold” or remove it from the site
                    at any time. There are no penalties or extra fees for ending your listing early. We
                    want you to have the flexibility to manage your ad as you see fit.</p>
                </div>
              </div>
            </div>

            {/* FAQ 7 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(7)}
                  >
                    How many photos can I upload, and what details should I include in my ad?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 7 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 7 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 7 ? "show" : ""}`}>
                <div className="card-body">
                  <p>We allow you to add multiple photos (plenty, in fact) to showcase your caravan.
                    There’s a generous photo limit, so feel free to upload lots of clear pictures from
                    all angles – exterior, interior, layout, special features, etc. High-quality photos
                    help attract more buyers, so the more the merrier!</p>
                  <p>In your listing description, be sure to include important details about your caravan:
                    the make and model, year of manufacture, overall condition, any upgrades or
                    accessories, and the registration or roadworthy status. Mentioning highlights (like
                    a new awning or recently serviced brakes) and being honest about any minor issues
                    will build trust with buyers. The more information you provide, the easier it is for
                    buyers to get excited about your caravan.</p>
                </div>
              </div>
            </div>

            {/* FAQ 8 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(8)}
                  >
                    Do I handle the sale and payment directly with the buyer?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 8 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 8 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 8 ? "show" : ""}`}>
                <div className="card-body">
                  <p>Yes. Once you’ve connected with an interested buyer, all the sale details are handled
                    between you and the buyer. This means you will arrange things like inspections, test
                    towing (if applicable), payment, and transfer of ownership directly with the buyer.
                    CaravansForSale does not process payments or get involved in the transaction – we
                    simply provide the marketplace to connect you both. We recommend using secure
                    payment methods and completing any necessary paperwork (e.g. transfer of
                    registration) to finalize the sale. </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}

export default SellYourCaravan;