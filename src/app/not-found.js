"use client";

import Link from "next/link";
import "./not-found.css";

export default function NotFoundPage() {
  return (
    <div className="page-wrap">
      <div className="card" role="main" aria-labelledby="page-title">
        <h1 id="page-title" className="err-number">
          404
        </h1>
        <p className="err-sub">
          Oops! The caravan or page you’re looking for isn’t available.
        </p>

        <div className="search-wrap">
          <form action="/search" method="get" role="search">
            <input
              type="search"
              name="q"
              placeholder="Search caravans, brands, or models..."
            />
          </form>
        </div>

        <div className="actions">
          <Link className="btn btn-primary" href="/">
            Go to Homepage
          </Link>
          <Link className="btn btn-outline" href="/listings/">
            Browse Caravans
          </Link>
        </div>

        <div className="popular">
          <h4>Popular Searches:</h4>
          <ul>
            <li>
              <Link href="/listings/couples-caravan-search/">
                couples caravan
              </Link>
            </li>
            <li>
              <Link href="/listings/tandem-axle-caravans-search/">
                tandem axle caravans
              </Link>
            </li>
            <li>
              <Link href="/listings/cafe-lounge-caravans-search/">
                cafe lounge caravans
              </Link>
            </li>
            <li>
              <Link href="/listings/bunk-bed-caravans-search/">
                bunk bed caravans
              </Link>
            </li>
            <li>
              <Link href="/listings/triple-bunk-caravans-search/">
                triple bunk caravans
              </Link>
            </li>
            <li>
              <Link href="/listings/caravan-with-bunk-beds-search/">
                caravan with bunk beds
              </Link>
            </li>
            <li>
              <Link href="/listings/caravan-with-ensuite-search/">
                caravan with ensuite
              </Link>
            </li>
            <li>
              <Link href="/listings/caravan-with-toilet-and-shower-search/">
                caravan with toilet and shower
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
