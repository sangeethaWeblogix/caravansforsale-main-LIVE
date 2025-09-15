"use client";

import Link from "next/link";

export default function Breadcrumbs() {
  return (
    <section className="services breadcrumbs_border pt-15 pb-15">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <ul className="breadcrumbs">
              <li className="breadcrumbs-item">
                <Link
                  className="breadcrumbs-link"
                  href="https://www.admin.caravansforsale.com.au"
                  rel="nofollow"
                >
                  Home
                </Link>
              </li>
              <li className="breadcrumbs-item">
                <Link
                  className="breadcrumbs-link"
                  href="https://www.caravansforsale.com.au/caravan-manufacturers/all"
                  rel="nofollow"
                >
                  Manufacturers
                </Link>
              </li>
              <li className="breadcrumbs-item">
                <Link
                  href="https://www.admin.caravansforsale.com.au/caravan-manufacturers/everest-caravans/"
                  rel="category tag"
                >
                  Everest Caravans
                </Link>
                &nbsp;
              </li>
              <li className="breadcrumbs-item">Calibra</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
