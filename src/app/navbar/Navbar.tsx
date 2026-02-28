"use client";

import "./navbar.css";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

type DropdownType =
  | "state"
  | "category"
  | "price"
  | "condition"
  | "manufacturers"
  | "weight"
  | "length"
  | "sleep"
  | null;
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const toggleNav = () => setIsOpen(!isOpen);
  const [navigating, setNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
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
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (navigating) {
      // When URL changes → navigation is completed
      setNavigating(false);
    }
  }, [pathname, searchParams]);

  const closeNav = () => {
    setIsOpen(false);
    setOpenDropdown(null);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDropdown = (name: Exclude<DropdownType, null>) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light style-4 header-white">
        <div className="container">
          <div className="logo_left">
            <a className="navbar-brand" href="/">
              <Image
                src="/images/cfs-logo-black.svg?=1"
                alt="Caravans For Sale"
                width={150}
                height={50}
              />
            </a>
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

            {/* <div
              className="collapse navbar-collapse justify-content-end"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav mb-2 mb-lg-0">
                <li className="nav-item">
                  <a className="nav-link" href="/sell-my-caravan/">
                    Sell My Caravan
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/dealer-advertising/">
                    Dealer Advertising
                  </a>
                </li>
                <li className="nav-item login">
                  <a className="nav-link" href="/login/">
                    <i className="bi bi-person-fill"></i> Login
                  </a>
                </li>
              </ul>
            </div> */}

            {/*<div className="navbar-right" ref={dropdownRef}>
              <button className="profile-btn" onClick={() => setOpen(!open)}>
                <span className="profile-icon"><i className="bi bi-person-fill"></i></span>
              </button>

              {open && (
                <div className="profile-dropdown">
                  <a href="/login" className="dropdown-item">
                    <span><i className="bi bi-person-fill"></i></span> Login
                  </a>
                  <a href="/login" className="dropdown-item">
                    <span><i className="bi bi-person-fill-add"></i></span> Register
                  </a>
                </div>
              )}
            </div> */}

            <div className="left_menu">
              <input
                type="checkbox"
                id="openSideMenu"
                className="openSideMenu"
                checked={isOpen}
                onChange={toggleNav}
              />

              {mounted && (
                <label htmlFor="openSideMenu" className="menuIconToggle">
                  <div className="hamb-line dia p-1"></div>
                  <div className="hamb-line hor"></div>
                  <div className="hamb-line dia p-2"></div>
                </label>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      {mounted && (
        <div id="mySidenav" className={`sidenav ${isOpen ? "open" : ""}`}>
          <div className="sidebar-navigation">
            <ul>
              {/* <li>
                <a href="/sell-my-caravan/"
                  onClick={() => {
                    setNavigating(true); // start loader immediately
                    closeNav();
                  }}
                >
                  Sell My Caravan
                </a>
              </li> */}

              {/* <li>
                <a href="/dealer-advertising/"
                  onClick={() => {
                    setNavigating(true); // start loader immediately
                    closeNav();
                  }}
                >
                  Dealer Advertising
                </a>
              </li> */}

              <li>
                <a
                  href="/listings/"
                  onClick={() => {
                    // setNavigating(true); // start loader immediately
                    closeNav();
                  }}
                >
                  All Listings
                </a>
              </li>
              {/* <li className={openDropdown === "state" ? "selected" : ""}>
                {" "}
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("state");
                  }}
                >
                  By State
                </div>
                <ul
                  className={
                    openDropdown === "state" ? "submenu open" : "submenu"
                  }
                >

                  <li>
                    <a className="dropdown-item" href={`/listings/australian-capital-territory-state/`} onClick={closeNav}>Australian Capital Territory</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/new-south-wales-state/`} onClick={closeNav}>New South Wales</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/northern-territory-state/`} onClick={closeNav}>Northern Territory</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/queensland-state/`} onClick={closeNav}>Queensland</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/south-australia-state/`} onClick={closeNav}>South Australia</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/tasmania-state/`} onClick={closeNav}>Tasmania</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/victoria-state/`} onClick={closeNav}>Victoria</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/western-australia-state/`} onClick={closeNav}>Western Australia</a>
                  </li>

                </ul>
              </li> */}

              {/* <li className={openDropdown === "category" ? "selected" : ""}>
                {" "}
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("category");
                  }}
                >
                  By Type
                </div>
                <ul
                  className={
                    openDropdown === "category" ? "submenu open" : "submenu"
                  }
                >

                  <li>
                    <a className="dropdown-item" href={`/listings/off-road-category/`} onClick={closeNav}>Off Road</a>
                    
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/family-category/`} onClick={closeNav}>Family</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/touring-category/`} onClick={closeNav}>Touring</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/luxury-category/`} onClick={closeNav}>Luxury</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/pop-top-category/`} onClick={closeNav}>Pop Top</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/hybrid-category/`} onClick={closeNav}>Hybrid</a>
                  </li>


                </ul>
              </li> */}

              {/* <li className={openDropdown === "price" ? "selected" : ""}>
                {" "}
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("price");
                  }}
                >
                  By Price
                </div>
                <ul
                  className={
                    openDropdown === "price" ? "submenu open" : "submenu"
                  }
                >

                  <li>
                    <a className="dropdown-item" href={`/listings/under-20000/`} onClick={closeNav}>Under $20k</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-20000-30000/`} onClick={closeNav}>Under $30k</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-30000-40000/`} onClick={closeNav}>Under $40k</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-40000-50000/`} onClick={closeNav}>Under $50k</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-50000-75000/`} onClick={closeNav}>Under $75k</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-75000-100000/`} onClick={closeNav}>Under $100k</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-100000-150000/`} onClick={closeNav}>Under $150k</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-150000-200000/`} onClick={closeNav}>Under $200k</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/over-200000/`} onClick={closeNav}>Over $200k</a>
                  </li>
                  


                </ul>
              </li> */}

              {/* <li className={openDropdown === "weight" ? "selected" : ""}>
                {" "}
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("weight");
                  }}
                >
                  By Weight
                </div>
                <ul
                  className={
                    openDropdown === "weight" ? "submenu open" : "submenu"
                  }
                >

                  <li>
                    <a className="dropdown-item" href={`/listings/under-1500-kg-atm/`} onClick={closeNav}>Under 1500 Kgs</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-1500-kg-to-2500-kg-atm/`} onClick={closeNav}>Under 2500 Kgs</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-2500-kg-to-3500-kg-atm/`} onClick={closeNav}>Under 3500 Kgs</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-3500-kg-to-4500-kg-atm/`} onClick={closeNav}>Under 4500 Kgs</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/over-4500-kg-atm/`} onClick={closeNav}>Over 4500 Kgs</a>
                  </li>
                  
                </ul>
              </li> */}

              {/* <li className={openDropdown === "sleep" ? "selected" : ""}>
                {" "}
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("sleep");
                  }}
                >
                  By Sleep
                </div>
                <ul
                  className={
                    openDropdown === "sleep" ? "submenu open" : "submenu"
                  }
                >

                  <li>
                    <a className="dropdown-item" href={`/listings/between-1-2-people-sleeping-capacity/`} onClick={closeNav}>Under 2 People</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-3-4-people-sleeping-capacity/`} onClick={closeNav}>Under 4 People</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-4-6-people-sleeping-capacity/`} onClick={closeNav}>Under 6 People</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/over-6-people-sleeping-capacity/`} onClick={closeNav}>Over 6 People</a>
                  </li>
                                    
                </ul>
              </li> */}

              {/* <li className={openDropdown === "length" ? "selected" : ""}>
                {" "}
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("length");
                  }}
                >
                  By Length
                </div>
                <ul
                  className={
                    openDropdown === "length" ? "submenu open" : "submenu"
                  }
                >

                  <li>
                    <a className="dropdown-item" href={`/listings/under-12-length-in-feet/`} onClick={closeNav}>Under 12ft Length</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-12-14-length-in-feet/`} onClick={closeNav}>Under 14ft Length</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-15-17-length-in-feet/`} onClick={closeNav}>Under 17ft Length</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-18-20-length-in-feet/`} onClick={closeNav}>Under 20ft Length</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/between-21-23-length-in-feet/`} onClick={closeNav}>Under 23ft Length</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/over-24-length-in-feet/`} onClick={closeNav}>Over 24ft Length</a>
                  </li>
                  
                </ul>
              </li> */}

              {/* <li className={openDropdown === "condition" ? "selected" : ""}>
                {" "}
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("condition");
                  }}
                >
                  By Condition
                </div>
                <ul
                  className={
                    openDropdown === "condition" ? "submenu open" : "submenu"
                  }
                >

                  <li>
                    <a className="dropdown-item" href={`/listings/new-condition/`} onClick={closeNav}>New</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/used-condition/`} onClick={closeNav}>Used</a>
                  </li>


                </ul>
              </li> */}

              {/* <li className={openDropdown === "manufacturers" ? "selected" : ""}>
                {" "}
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("manufacturers");
                  }}
                >
                  Popular Manufacturers
                </div>
                <ul
                  className={
                    openDropdown === "manufacturers" ? "submenu open" : "submenu"
                  }
                >

                  <li>
                    <a className="dropdown-item" href={`/listings/jb/`} onClick={closeNav}>JB</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/lotusy/`} onClick={closeNav}>Lotus</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/new-age/`} onClick={closeNav}>New Age</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/snowy-river/`} onClick={closeNav}>Snowy River</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/jayco/`} onClick={closeNav}>Jayco</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/supreme/`} onClick={closeNav}>Supreme</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/crusader/`} onClick={closeNav}>Crusader</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/titanium/`} onClick={closeNav}>Titanium</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/mdc/`} onClick={closeNav}>MDC</a>
                  </li>
                  <li>
                    <a className="dropdown-item" href={`/listings/design-rv/`} onClick={closeNav}>Design RV</a>
                  </li>
                </ul>
              </li> */}

              {/* <li>
                <a href="/used-all/"
                  onClick={() => {
                    setNavigating(true); // start loader immediately
                    closeNav();
                  }}
                >
                  Used Caravans
                </a>
              </li>  */}
              <li>
                <a
                  href="/blog/"
                  onClick={() => {
                    // setNavigating(true); // start loader immediately
                    closeNav();
                  }}
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="/about-us/"
                  onClick={() => {
                    // setNavigating(true); // start loader immediately
                    closeNav();
                  }}
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/contact/"
                  onClick={() => {
                    // setNavigating(true); // start loader immediately
                    closeNav();
                  }}
                >
                  Contact
                </a>
              </li>
            </ul>
            {/* <div className="mobile_cta hidden-lg hidden-md">
              <span>Find Your Ideal Caravan</span>
              <a className="btn btn-primary" href="/caravan-enquiry-form/" onClick={() => {
                setNavigating(true); // start loader immediately
                closeNav();
              }}>
                Enquire Now
              </a>
            </div> */}
          </div>
        </div>
      )}

      {/* Overlay */}
      <div
        className={`overlay-close ${isOpen ? "active" : ""}`}
        onClick={() => {
          setNavigating(true); // start loader immediately
          closeNav();
        }}
      ></div>
      <div
        id="overlay"
        className={`overlay ${isOpen ? "active" : ""}`}
        onClick={() => {
          closeNav();
        }}
      ></div>

      {navigating && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
          }}
          aria-live="polite"
        >
          <div className="text-center">
            <Image
              className="loader_image"
              src="/images/loader.gif" // place inside public/images
              alt="Loading..."
              width={80}
              height={80}
            />{" "}
            <div className="mt-2 fw-semibold">Loading…</div>
          </div>
        </div>
      )}
    </>
  );
}
