
"use client";

import "./navbar.css?=4";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

type DropdownType =
  | "manufacturers"
  | "category"
  | "locations"
  | "price"
  | "weight"
  | "people"
  | "length"
  | null;

type LocationSubType = "state" | "region" | null;
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [openLocationSub, setOpenLocationSub] = useState<LocationSubType>(null);
  const toggleNav = () => setIsOpen(!isOpen);
  const [navigating, setNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
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
    setOpenLocationSub(null);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDropdown = (name: Exclude<DropdownType, null>) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
    setOpenLocationSub(null);
  };

  const toggleLocationSub = (name: Exclude<LocationSubType, null>) => {
    setOpenLocationSub((prev) => (prev === name ? null : name));
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light style-4 header-white">
        <div className="container">
          <div className="logo_left">
            <a className="navbar-brand" href="/">
              <Image
                src="/images/cfs-logo-black.svg"
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

            <div
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
            </div>

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
              <li>
                <a href="/listings/" onClick={closeNav}>All Caravans</a>
              </li>
              <li>
                <a href="/listings/new-condition/" onClick={closeNav}>New Caravans</a>
              </li>
              <li>
                <a href="/listings/used-condition/" onClick={closeNav}>Used Caravans</a>
              </li>

              {/* Popular Makes */}
              <li className={openDropdown === "manufacturers" ? "selected" : ""}>
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("manufacturers");
                  }}
                >
                  Popular Makes
                </div>
                <ul className={openDropdown === "manufacturers" ? "submenu open" : "submenu"}>
                  <li><a className="dropdown-item" href="/listings/jayco/" onClick={closeNav}>Jayco</a></li>
                  <li><a className="dropdown-item" href="/listings/evernew/" onClick={closeNav}>Evernew</a></li>
                  <li><a className="dropdown-item" href="/listings/design-rv/" onClick={closeNav}>Design Rv</a></li>
                  <li><a className="dropdown-item" href="/listings/avan/" onClick={closeNav}>Avan</a></li>
                  <li><a className="dropdown-item" href="/listings/newgen/" onClick={closeNav}>Newgen</a></li>
                  <li><a className="dropdown-item" href="/listings/adria/" onClick={closeNav}>Adria</a></li>
                  <li><a className="dropdown-item" href="/listings/retreat/" onClick={closeNav}>Retreat</a></li>
                  <li><a className="dropdown-item" href="/listings/snowy-river/" onClick={closeNav}>Snowy River</a></li>
                  <li><a className="dropdown-item" href="/listings/crusader/" onClick={closeNav}>Crusader</a></li>
                  <li><a className="dropdown-item" href="/listings/supreme/" onClick={closeNav}>Supreme</a></li>
                  <li><a className="dropdown-item" href="/listings/essential/" onClick={closeNav}>Essential</a></li>
                  <li><a className="dropdown-item" href="/listings/golf/" onClick={closeNav}>Golf</a></li>
                  <li><a className="dropdown-item" href="/listings/royal-flair/" onClick={closeNav}>Royal Flair</a></li>
                  <li><a className="dropdown-item" href="/listings/new-age/" onClick={closeNav}>New Age</a></li>
                  <li><a className="dropdown-item" href="/listings/mdc/" onClick={closeNav}>Mdc</a></li>
                  <li><a className="dropdown-item" href="/listings/jb/" onClick={closeNav}>Jb</a></li>
                  <li><a className="dropdown-item" href="/listings/lotus/" onClick={closeNav}>Lotus</a></li>
                  <li><a className="dropdown-item" href="/listings/windsor/" onClick={closeNav}>Windsor</a></li>
                  <li><a className="dropdown-item" href="/listings/nova/" onClick={closeNav}>Nova</a></li>
                </ul>
              </li>

              {/* Popular Caravan Type */}
              <li className={openDropdown === "category" ? "selected" : ""}>
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("category");
                  }}
                >
                  Caravan Type
                </div>
                <ul className={openDropdown === "category" ? "submenu open" : "submenu"}>
                  <li><a className="dropdown-item" href="/listings/off-road-category/" onClick={closeNav}>Off Road</a></li>
                  <li><a className="dropdown-item" href="/listings/hybrid-category/" onClick={closeNav}>Hybrid</a></li>
                  <li><a className="dropdown-item" href="/listings/pop-top-category/" onClick={closeNav}>Pop Top</a></li>
                  <li><a className="dropdown-item" href="/listings/luxury-category/" onClick={closeNav}>Luxury</a></li>
                  <li><a className="dropdown-item" href="/listings/family-category/" onClick={closeNav}>Family</a></li>
                  <li><a className="dropdown-item" href="/listings/touring-category/" onClick={closeNav}>Touring</a></li>
                </ul>
              </li>

              {/* Popular Locations */}
              <li className={openDropdown === "locations" ? "selected" : ""}>
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("locations");
                  }}
                >
                  Popular Locations
                </div>
                <ul className={openDropdown === "locations" ? "submenu open" : "submenu"}>
                  {/* State */}
                  <li className={openLocationSub === "state" ? "selected" : ""}>
                    <div
                      className="drop_down"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleLocationSub("state");
                      }}
                    >
                      State
                    </div>
                    <ul className={openLocationSub === "state" ? "submenu open" : "submenu"}>
                      <li><a className="dropdown-item" href="/listings/australian-capital-territory-state/" onClick={closeNav}>Australian Capital Territory</a></li>
                      <li><a className="dropdown-item" href="/listings/new-south-wales-state/" onClick={closeNav}>New South Wales</a></li>
                      <li><a className="dropdown-item" href="/listings/northern-territory-state/" onClick={closeNav}>Northern Territory</a></li>
                      <li><a className="dropdown-item" href="/listings/queensland-state/" onClick={closeNav}>Queensland</a></li>
                      <li><a className="dropdown-item" href="/listings/south-australia-state/" onClick={closeNav}>South Australia</a></li>
                      <li><a className="dropdown-item" href="/listings/tasmania-state/" onClick={closeNav}>Tasmania</a></li>
                      <li><a className="dropdown-item" href="/listings/victoria-state/" onClick={closeNav}>Victoria</a></li>
                      <li><a className="dropdown-item" href="/listings/western-australia-state/" onClick={closeNav}>Western Australia</a></li>
                    </ul>
                  </li>
                  {/* Region */}
                  <li className={openLocationSub === "region" ? "selected" : ""}>
                    <div
                      className="drop_down"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleLocationSub("region");
                      }}
                    >
                      Region
                    </div>
                    <ul className={openLocationSub === "region" ? "submenu open" : "submenu"}>
                      <li><a className="dropdown-item" href="/listings/victoria-state/melbourne-region/" onClick={closeNav}>Melbourne</a></li>
                      <li><a className="dropdown-item" href="/listings/western-australia-state/perth-region/" onClick={closeNav}>Perth</a></li>
                      <li><a className="dropdown-item" href="/listings/victoria-state/geelong-region/" onClick={closeNav}>Geelong</a></li>
                      <li><a className="dropdown-item" href="/listings/queensland-state/cairns-region/" onClick={closeNav}>Cairns</a></li>
                      <li><a className="dropdown-item" href="/listings/victoria-state/ballarat-region/" onClick={closeNav}>Ballarat</a></li>
                      <li><a className="dropdown-item" href="/listings/tasmania-state/launceston-region/" onClick={closeNav}>Launceston</a></li>
                      <li><a className="dropdown-item" href="/listings/new-south-wales-state/sydney-region/" onClick={closeNav}>Sydney</a></li>
                      <li><a className="dropdown-item" href="/listings/south-australia-state/adelaide-region/" onClick={closeNav}>Adelaide</a></li>
                      <li><a className="dropdown-item" href="/listings/tasmania-state/hobart-region/" onClick={closeNav}>Hobart</a></li>
                      <li><a className="dropdown-item" href="/listings/queensland-state/toowoomba-region/" onClick={closeNav}>Toowoomba</a></li>
                      <li><a className="dropdown-item" href="/listings/victoria-state/bendigo-region/" onClick={closeNav}>Bendigo</a></li>
                      <li><a className="dropdown-item" href="/listings/victoria-state/shepparton-region/" onClick={closeNav}>Shepparton</a></li>
                      <li><a className="dropdown-item" href="/listings/queensland-state/brisbane-region/" onClick={closeNav}>Brisbane</a></li>
                      <li><a className="dropdown-item" href="/listings/new-south-wales-state/newcastle-region/" onClick={closeNav}>Newcastle</a></li>
                      <li><a className="dropdown-item" href="/listings/queensland-state/townsville-region/" onClick={closeNav}>Townsville</a></li>
                      <li><a className="dropdown-item" href="/listings/northern-territory-state/darwin-region/" onClick={closeNav}>Darwin</a></li>
                      <li><a className="dropdown-item" href="/listings/queensland-state/ipswich-region/" onClick={closeNav}>Ipswich</a></li>
                    </ul>
                  </li>
                </ul>
              </li>

              {/* By Price */}
              <li className={openDropdown === "price" ? "selected" : ""}>
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("price");
                  }}
                >
                  By Price
                </div>
                <ul className={openDropdown === "price" ? "submenu open" : "submenu"}>
                  <li><a className="dropdown-item" href="/listings/under-20000/" onClick={closeNav}>Under $20k</a></li>
                  <li><a className="dropdown-item" href="/listings/between-20000-30000/" onClick={closeNav}>Under $30k</a></li>
                  <li><a className="dropdown-item" href="/listings/between-30000-40000/" onClick={closeNav}>Under $40k</a></li>
                  <li><a className="dropdown-item" href="/listings/between-40000-50000/" onClick={closeNav}>Under $50k</a></li>
                  <li><a className="dropdown-item" href="/listings/between-50000-70000/" onClick={closeNav}>Under $70k</a></li>
                  <li><a className="dropdown-item" href="/listings/between-70000-100000/" onClick={closeNav}>Under $100k</a></li>
                  <li><a className="dropdown-item" href="/listings/between-100000-150000/" onClick={closeNav}>Under $150k</a></li>
                  <li><a className="dropdown-item" href="/listings/between-150000-200000/" onClick={closeNav}>Under $200k</a></li>
                  <li><a className="dropdown-item" href="/listings/over-200000/" onClick={closeNav}>Over $200k</a></li>
                </ul>
              </li>

              {/* By Weight */}
              <li className={openDropdown === "weight" ? "selected" : ""}>
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("weight");
                  }}
                >
                  By Weight
                </div>
                <ul className={openDropdown === "weight" ? "submenu open" : "submenu"}>
                  <li><a className="dropdown-item" href="/listings/under-1500-kg-atm/" onClick={closeNav}>Under 1500 Kgs</a></li>
                  <li><a className="dropdown-item" href="/listings/between-1500-kg-to-2500-kg-atm/" onClick={closeNav}>Under 2500 Kgs</a></li>
                  <li><a className="dropdown-item" href="/listings/between-2500-kg-to-3500-kg-atm/" onClick={closeNav}>Under 3500 Kgs</a></li>
                  <li><a className="dropdown-item" href="/listings/between-3500-kg-to-4500-kg-atm/" onClick={closeNav}>Under 4500 Kgs</a></li>
                </ul>
              </li>

              {/* By People */}
              <li className={openDropdown === "people" ? "selected" : ""}>
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("people");
                  }}
                >
                  By People
                </div>
                <ul className={openDropdown === "people" ? "submenu open" : "submenu"}>
                  <li><a className="dropdown-item" href="/listings/between-1-2-people-sleeping-capacity/" onClick={closeNav}>Under 2 People</a></li>
                  <li><a className="dropdown-item" href="/listings/between-3-4-people-sleeping-capacity/" onClick={closeNav}>Under 4 People</a></li>
                  <li><a className="dropdown-item" href="/listings/between-4-6-people-sleeping-capacity/" onClick={closeNav}>Under 6 People</a></li>
                  <li><a className="dropdown-item" href="/listings/over-6-people-sleeping-capacity/" onClick={closeNav}>Over 6 People</a></li>
                </ul>
              </li>

              {/* By Length */}
              <li className={openDropdown === "length" ? "selected" : ""}>
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("length");
                  }}
                >
                  By Length
                </div>
                <ul className={openDropdown === "length" ? "submenu open" : "submenu"}>
                  <li><a className="dropdown-item" href="/listings/under-12-length-in-feet/" onClick={closeNav}>Under 12ft</a></li>
                  <li><a className="dropdown-item" href="/listings/between-12-14-length-in-feet/" onClick={closeNav}>Under 14ft</a></li>
                  <li><a className="dropdown-item" href="/listings/between-15-17-length-in-feet/" onClick={closeNav}>Under 17ft</a></li>
                  <li><a className="dropdown-item" href="/listings/between-18-20-length-in-feet/" onClick={closeNav}>Under 20ft</a></li>
                  <li><a className="dropdown-item" href="/listings/between-21-23-length-in-feet/" onClick={closeNav}>Under 23ft</a></li>
                  <li><a className="dropdown-item" href="/listings/over-24-length-in-feet/" onClick={closeNav}>Over 24ft</a></li>
                </ul>
              </li>

              <li>
                <a href="/blog/" onClick={closeNav}>Blog</a>
              </li>
              <li>
                <a href="/about-us/" onClick={closeNav}>About</a>
              </li>
              <li>
                <a href="/contact/" onClick={closeNav}>Contact</a>
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
