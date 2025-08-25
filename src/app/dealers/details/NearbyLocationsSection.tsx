"use client";

import React from "react";
import Link from "next/link";

const locations = [
  "Arundel", "Avoca", "Bakers Creek", "Bells Creek",
  "Bowen", "Brendale", "Bundaberg East", "Burleigh Heads",
  "Burleigh Waters", "Burpengary East", "Caboolture", "Chevallum",
];

const getLink = (location: string) =>
  `https://www.caravansforsale.com.au/caravan-dealers/qld/${location.toLowerCase().replace(/ /g, "-")}${location.includes("Burpengary East") ? "-4505" : ""}`;

const NearbyLocationsSection = () => {
  return (
    <section className="search_quick_links section-padding" >
      <div className="container">
        <div className="title">
          <h2>Find Caravan Dealers Near Burpengary</h2>
        </div>
        <div className="row">
          {[0, 1, 2].map((col) => (
            <div className="col-lg-4" key={col}>
              <ul>
                {locations.slice(col * 4, col * 4 + 4).map((loc, idx) => (
                  <li key={idx}>
                    <div className="link_list_s">
                      <Link href={getLink(loc)}>
                        <i className="bi bi-search"></i> {loc}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NearbyLocationsSection;
