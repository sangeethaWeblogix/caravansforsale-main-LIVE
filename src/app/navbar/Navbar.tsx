"use client";

import "./navbar.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";

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
    const router = useRouter();

  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const toggleNav = () => setIsOpen(!isOpen);
     const [navigating, setNavigating] = useState(false);
  const pathname = usePathname();
const searchParams = useSearchParams();

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
              {/* <ul className="navbar-nav mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className="nav-link" href="/listings/">
                    About Our Deals
                  </Link>
                </li>
              </ul> */}
            </div>

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
              <li className={openDropdown === "state" ? "selected" : ""}>
                {" "}
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("state");
                  }}
                >
                  Browse by State
                </div>
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
                        onClick={() => {
    setNavigating(true); // start loader immediately
    closeNav();
  }}
                      >
                        {state}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              <li className={openDropdown === "category" ? "selected" : ""}>
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("category");
                  }}
                >
                  Browse by Category
                </div>
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
                        onClick={() => {
    setNavigating(true); // start loader immediately
    closeNav();
  }}
                      >
                        {cat
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              <li className={openDropdown === "price" ? "selected" : ""}>
                <div
                  className="drop_down"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("price");
                  }}
                >
                  Browse by Price
                </div>
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
                        onClick={() => {
    setNavigating(true); // start loader immediately
    closeNav();
  }}
                      >
                        Under ${price.toLocaleString()}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              {/* <li>
              <Link href="/caravan-dealers/" onClick={() => {
    setNavigating(true); // start loader immediately
    closeNav();
  }}>
                Caravan Dealers
              </Link>
            </li> */}
              <li>
                <Link href="/listings/"  
  onClick={() => {
    setNavigating(true); // start loader immediately
    closeNav();
  }}
>
                  All Listings
                </Link>
              </li>
              <li>
                <Link href="/blog/" onClick={() => {
    setNavigating(true); // start loader immediately
    closeNav();
  }} >
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact/" onClick={() => {
    setNavigating(true); // start loader immediately
    closeNav();
  }}>
                  Contact
                </Link>
              </li>
            </ul>
            <div className="mobile_cta hidden-lg hidden-md">
              <span>Find Your Ideal Caravan</span>
              <Link className="btn btn-primary" href="/caravan-enquiry-form/">
                Enquire Now
              </Link>
            </div>
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
    setNavigating(true); // start loader immediately
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
