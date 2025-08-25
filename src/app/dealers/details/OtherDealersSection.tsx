"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const otherDealers = [
  {
    name: "Apollo RV Super Centre Brisbane",
    link: "https://www.caravansforsale.com.au/caravan-dealer/apollo-rv-super-centre-brisbane",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2025/01/Apollo-Rv-super-Center.png",
  },
  {
    name: "Arctic Campers - Caboolture",
    link: "https://www.caravansforsale.com.au/caravan-dealer/arctic-campers-caboolture",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/ARCTIC_CAMPERS.png",
  },
  {
    name: "Aussie Escape Caravans",
    link: "https://www.caravansforsale.com.au/caravan-dealer/aussie-escape-caravans",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/05/Aussie-Escape-Caravans.png",
  },
  {
    name: "Badger RV",
    link: "https://www.caravansforsale.com.au/caravan-dealer/badger-rv",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/BADGER-RV.png",
  },
  {
    name: "Beyond RV",
    link: "https://www.caravansforsale.com.au/caravan-dealer/beyond-rv",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/BEYOND-RV.png",
  },
  {
    name: "Brisbane Camperland",
    link: "https://www.caravansforsale.com.au/caravan-dealer/brisbane-camperland",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/Brisbane-camperland.png",
  },
  {
    name: "Caravan World",
    link: "https://www.caravansforsale.com.au/caravan-dealer/caravan-world",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/Caravan-World.png",
  },
  {
    name: "Conqueror Off Road Brisbane",
    link: "https://www.caravansforsale.com.au/caravan-dealer/conqueror-off-road-brisbane",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/Conqueror-Off-Road-Brisbane.png",
  },
  {
    name: "Cub Campers Queensland",
    link: "https://www.caravansforsale.com.au/caravan-dealer/cub-campers-queensland",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/Cub.png",
  },
  {
    name: "Explorer RV Caravans",
    link: "https://www.caravansforsale.com.au/caravan-dealer/explorer-rv-caravans",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/EXPLORER-RV-CARAVANS.png",
  },
  {
    name: "Fair Dinkum Caravans - North Lakes",
    link: "https://www.caravansforsale.com.au/caravan-dealer/fair-dinkum-caravans-north-lakes",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/Fair-Dinkum-Caravans.png",
  },
  {
    name: "Fantasy Caravan - Brisbane",
    link: "https://www.caravansforsale.com.au/caravan-dealer/fantasy-caravan-brisbane",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/Fantasy-Caravan.png",
  },
  {
    name: "Green RV",
    link: "https://www.caravansforsale.com.au/caravan-dealer/green-rv",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/green-rv.png",
  },
  {
    name: "Home and Away RVs",
    link: "https://www.caravansforsale.com.au/caravan-dealer/home-and-away-rvs",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2025/01/logo_basic-Photoroom-copy-1.png",
  },
  {
    name: "Jawa Off Road Campers - Brisbane North",
    link: "https://www.caravansforsale.com.au/caravan-dealer/jawa-off-road-campers-brisbane-north",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/Jawa.png",
  },
  {
    name: "Jawa Off Road Campers - Sunshine Coast",
    link: "https://www.caravansforsale.com.au/caravan-dealer/jawa-off-road-campers-sunshine-coast",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/Jawa.png",
  },
  {
    name: "JB Caravans Brisbane",
    link: "https://www.caravansforsale.com.au/caravan-dealer/jb-caravans-brisbane",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/JB-CARAVAN-BRISBANE.png",
  },
  {
    name: "Kedron Caravans",
    link: "https://www.caravansforsale.com.au/caravan-dealer/kedron",
    img: "https://www.caravansforsale.com.au/wp-content/uploads/2024/04/kedron.png",
  },
];

const OtherDealersSection = () => {
  return (
    <section className="search_quick_links">
      <div className="container">
        <div className="title">
          <h2>Other Caravan Dealers Near Golf Super Centre</h2>
        </div>
        <div className="row">
          {otherDealers.map((dealer, index) => (
            <div className="col-lg-2" key={index}>
              <div className="other_dlogo">
                <Link href={dealer.link}>
                  <Image
                    width={100}
                    height={100}
                    src={dealer.img}
                    alt={dealer.name}
                  />
                  <span>{dealer.name}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OtherDealersSection;
