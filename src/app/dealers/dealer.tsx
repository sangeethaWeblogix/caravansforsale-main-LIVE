"use client";

import Image from "next/image";
import Link from "next/link";
import "./dealerlist.css";

export default function CaravanDealersPage() {
  return (
    <>
      {/* Banner Search Section */}
      <section
        className="services top_search_filter style-1"
        style={{
          backgroundImage:
            "url(https://www.caravansforsale.com.au/wp-content/uploads/2024/11/banner_cover_dealer.jpg)",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="container">
          <div className="row align-items-center justify-content-center">
            <div className="col-lg-12">
              <div className="section-head text-center">
                <div className="dealer_sbox dealer-aus-sec">
                  <h1 className="divide-orange pb-10">
                    Caravan Dealers in Australia
                  </h1>
                  <h4>Find Best Caravan Dealers Near You</h4>
                  <form>
                    <div className="search">
                      <input
                        type="text"
                        id="hofilter-location-title"
                        className="searchTerm"
                        placeholder="e.g. Victoria, 3000"
                      />
                      <input type="hidden" id="hofilter_location_uri" />
                      <input type="hidden" id="hofilter_state" />
                      <button
                        type="button"
                        className="searchButton"
                        onClick={() => {
                          // TODO: implement search_by_dealer function
                        }}
                      >
                        Go
                      </button>
                    </div>
                    <div className="hosuggestions">
                      <ul id="hosuggestionsul"></ul>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick State Links */}
      <section className="quick_stlink section-padding">
        <div className="container">
          <ul className="category_icon">
            {["nsw", "qld", "vic", "sa", "wa", "tas"].map((state) => (
              <li key={state}>
                <Link
                  href={`https://www.caravansforsale.com.au/caravan-dealers/${state}`}
                >
                  <div className="item-image"></div>
                  <span>{state.toUpperCase()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Dealer Listings Section (Partial Sample) */}
      <section className="dealers_section section-padding">
        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              <div className="dealer_list_home">
                <div className="row">
                  <div className="col-lg-8">
                    <div className="dealer_li_top">
                      <div className="dealer_ll_left">
                        <div className="dealer_thumb">
                          <Image
                            src="https://www.caravansforsale.com.au/wp-content/uploads/2024/04/QLD-caravan-clearance-centre.png"
                            alt="QLD caravan clearance centre"
                            width={300}
                            height={200}
                          />
                        </div>
                      </div>
                      <div className="dealer_ll_right">
                        <h3>
                          <Link href="https://www.caravansforsale.com.au/dealers/qld-caravan-clearance-centre/gympie-qld-4570/">
                            QLD caravan clearance centre
                          </Link>
                        </h3>
                        <p>1-11 Pinewood Avenue Gympie, QLD, 4570</p>
                      </div>
                    </div>
                    <div className="dealer_about">
                      <p>
                        QLD Caravan Clearance Centre (QCCC) is located in the
                        middle of Gympie, QLD and is your go to caravan dealer.
                        With over 15 years experience in the industry the
                        passionate and friendly QCCC team will help you find
                        your dream caravan at the right price.
                      </p>
                    </div>
                  </div>
                  <div className="col-lg-4 bl-lg">
                    <div className="dealer_info_right">
                      <h4>Brands We Sell</h4>
                      <ul>
                        {[
                          "Nextgen",
                          "Franklin",
                          "Hilltop",
                          "New Age",
                          "Newgen",
                        ].map((brand) => (
                          <li key={brand}>
                            <Link
                              href={`https://www.caravansforsale.com.au/listings/${brand
                                .toLowerCase()
                                .replace(" ", "-")}`}
                            >
                              {brand}
                            </Link>
                          </li>
                        ))}
                        <li className="view_profile_tbn">
                          <Link href="https://www.caravansforsale.com.au/dealers/qld-caravan-clearance-centre/gympie-qld-4570/">
                            View Profile
                          </Link>
                        </li>
                      </ul>
                      <Link
                        className="btn rounded-pill bg-blue4 text-white mt-20 aust"
                        href="https://www.caravansforsale.com.au/gympie/qld/new-used/qld-caravan-clearance-centre"
                        target="_blank"
                      >
                        View Our Caravan Listings
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div
                className="listing-sidebar-banner-container"
                style={{ position: "sticky", top: "80px" }}
              ></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
