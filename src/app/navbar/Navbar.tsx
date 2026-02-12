  "use client";

import "./navbar.css";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";


type DropdownType = "state" | "category" | "price" | null;
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
            <Link className="navbar-brand" href="/">
              <Image
                src="/images/cfs-logo-black.svg?=1"
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

          {/* <div
              className="collapse navbar-collapse justify-content-end"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className="nav-link" href="/sell-my-caravan/">
                    Sell My Caravan
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" href="/dealer-advertising/">
                    Dealer Advertising
                  </Link>
                </li>
                <li className="nav-item login">
                  <Link className="nav-link" href="/login/">
                    <i className="bi bi-person-fill"></i> Login
                  </Link>
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
                <Link href="/sell-my-caravan/"
                  onClick={() => {
                    setNavigating(true); // start loader immediately
                    closeNav();
                  }}
                >
                  Sell My Caravan
                </Link>
              </li> */}

              {/* <li>
                <Link href="/dealer-advertising/"
                  onClick={() => {
                    setNavigating(true); // start loader immediately
                    closeNav();
                  }}
                >
                  Dealer Advertising
                </Link>
              </li> */}
              
              <li>
                <a href="/listings/"
                  onClick={() => {
                     
                    closeNav();
                  }}
                >
                  All Listings
                </a>
              </li>
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
                <a href="/blog/" onClick={() => {
                  // setNavigating(true); // start loader immediately
                  closeNav();
                }} >
                  Blog
                </a>
              </li>
              <li>
                <a href="/about-us/" onClick={() => {
                  // setNavigating(true); // start loader immediately
                  closeNav();
                }} >
                  About
                </a>
              </li>
              <li>
                <a href="/contact/" onClick={() => {
                  // setNavigating(true); // start loader immediately
                  closeNav();
                }}>
                  Contact
                </a>
              </li>
            </ul>
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