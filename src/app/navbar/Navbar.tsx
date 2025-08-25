"use client";

import "./navbar.css";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const STATES = [
  "New South Wales",
  "Queensland",
  "Western Australia",
  "Victoria",
  "South Australia",
  "Australian Capital Territory",
  "Tasmania",
];

const CATEGORIES = [
  "off-road",
  "hybrid",
  "pop-top",
  "luxury",
  "family",
  "touring",
];

const PRICES = [
  50000, 60000, 70000, 80000, 90000, 100000, 120000, 140000, 160000, 180000,
  200000,
];
type DropdownType = "state" | "category" | "price" | null;
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const toggleNav = () => setIsOpen(!isOpen);
  const closeNav = () => {
    setIsOpen(false);
    setOpenDropdown(null);
  };

  const toggleDropdown = (name: Exclude<DropdownType, null>) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light style-4 header-white">
        <div className="container">
          <div className="logo_left">
            <Link className="navbar-brand" href="/">
              <Image
                src="/images/cfs-logo-black.svg"
                alt="Caravans For Sale"
                width={150}
                height={50}
              />
            </Link>
          </div>

          <div className="header_right_info">
            {/* <button className="navbar-toggler mytogglebutton">
              <i className="bi bi-search"></i>
            </button> */}

            <button
              className="navbar-toggler hidden-xs hidden-sm"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div
              className="collapse navbar-collapse justify-content-end"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className="nav-link" href="#">
                    About Our Deals
                  </Link>
                </li>
              </ul>
            </div>

            <div className="left_menu">
              <input
                type="checkbox"
                id="openSideMenu"
                className="openSideMenu"
                checked={isOpen}
                onChange={toggleNav}
              />
              <label htmlFor="openSideMenu" className="menuIconToggle">
                <div className="hamb-line dia p-1"></div>
                <div className="hamb-line hor"></div>
                <div className="hamb-line dia p-2"></div>
              </label>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div id="mySidenav" className={`sidenav ${isOpen ? "open" : ""}`}>
        <div className="sidebar-navigation">
          <ul>
            <li>
              <a
                href="#"
                className="drop_down"
                onClick={(e) => {
                  e.preventDefault();
                  toggleDropdown("state");
                }}
              >
                Browse by State
              </a>
              <ul
                className={
                  openDropdown === "state" ? "submenu open" : "submenu"
                }
              >
                {STATES.map((state) => (
                  <li key={state}>
                    <Link
                      className="dropdown-item"
                      href={`/listings/${state
                        .toLowerCase()
                        .replace(/ /g, "-")}-state/`}
                      onClick={closeNav}
                    >
                      {state}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            <li>
              <a
                href="#"
                className="drop_down"
                onClick={(e) => {
                  e.preventDefault();
                  toggleDropdown("category");
                }}
              >
                Browse by Category
              </a>
              <ul
                className={
                  openDropdown === "category" ? "submenu open" : "submenu"
                }
              >
                {CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <Link
                      className="dropdown-item"
                      href={`/listings/${cat}-category/`}
                      onClick={closeNav}
                    >
                      {cat
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            <li>
              <a
                href="#"
                className="drop_down"
                onClick={(e) => {
                  e.preventDefault();
                  toggleDropdown("price");
                }}
              >
                Browse by Price
              </a>
              <ul
                className={
                  openDropdown === "price" ? "submenu open" : "submenu"
                }
              >
                {PRICES.map((price) => (
                  <li key={price}>
                    <Link
                      className="dropdown-item"
                      href={`/listings/under-${price}/`}
                      onClick={closeNav}
                    >
                      Under ${price.toLocaleString()}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {/* <li>
              <Link href="/caravan-dealers/" onClick={closeNav}>
                Caravan Dealers
              </Link>
            </li> */}
            <li>
              <Link href="/listings/" onClick={closeNav}>
                All Listings
              </Link>
            </li>
            <li>
              <Link href="/blog/" onClick={closeNav}>
                Blog
              </Link>
            </li>
            <li>
              <Link href="/contact/" onClick={closeNav}>
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`overlay-close ${isOpen ? "active" : ""}`}
        onClick={closeNav}
      ></div>
      <div
        id="overlay"
        className={`overlay ${isOpen ? "active" : ""}`}
        onClick={closeNav}
      ></div>
    </>
  );
}
