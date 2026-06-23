
"use client";

import "./navbar.css?=60";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const [activePanel, setActivePanel] = useState<null | "buynow">(null);
  const toggleNav = () => setIsOpen(!isOpen);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const sidenavRef = useRef<HTMLDivElement | null>(null);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const megaMenuRef = useRef<HTMLLIElement | null>(null);
  const [hamOpen, setHamOpen] = useState(false);
  const hamRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setMegaMenuOpen(false);
      }
      if (hamRef.current && !hamRef.current.contains(e.target as Node)) {
        setHamOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Force full-page load for listing links so browser tab shows native loading indicator
  // re-runs after mounted=true so sidenavRef.current is not null
  useEffect(() => {
    const el = sidenavRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/listings/")) return;
      window.location.href = href;
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [mounted]);

  const closeNav = () => {
    setIsOpen(false);
    setActivePanel(null);
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
                priority
              />
            </a>
          </div>

          <div className="header_right_info">
            {/* <button className="navbar-toggler mytogglebutton">
              <i className="bi bi-search"></i>
            </button> */}

            <button
              className="navbar-toggler d-none"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div
              className="collapse navbar-collapse justify-content-end align-items-center"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav mb-2 mb-lg-0">
                <li className="nav-item desktop-buynow-item" ref={megaMenuRef}>
                  <span className="nav-link desktop-buynow-trigger" style={{ cursor: "pointer" }} onClick={() => setMegaMenuOpen(prev => !prev)}>
                    Buy
                  </span>
                  <div className={`desktop-mega-menu${megaMenuOpen ? " mega-open" : ""}`}>
                    <div className="desktop-mega-menu-inner">
                    <div className="mega-col">
                      <div className="mega-col-title">Browse</div>
                      <a href="/listings/" className="mega-link-bold">All Caravans</a>
                      <a href="/listings/new-condition/" className="mega-link-bold">New Caravans</a>
                      <a href="/listings/used-condition/" className="mega-link-bold">Used Caravans</a>
                      <div className="mega-col-title mega-col-title-mt">Caravan Type</div>
                      <a href="/listings/off-road-category/">Off Road</a>
                      <a href="/listings/hybrid-category/">Hybrid</a>
                      <a href="/listings/pop-top-category/">Pop Top</a>
                      <a href="/listings/luxury-category/">Luxury</a>
                      <a href="/listings/family-category/">Family</a>
                      <a href="/listings/touring-category/">Touring</a>
                      <div className="mega-col-title mega-col-title-mt">By State</div>
                      <a href="/listings/australian-capital-territory-state/">Australian Capital Territory</a>
                      <a href="/listings/new-south-wales-state/">New South Wales</a>
                      <a href="/listings/northern-territory-state/">Northern Territory</a>
                      <a href="/listings/queensland-state/">Queensland</a>
                      <a href="/listings/south-australia-state/">South Australia</a>
                      <a href="/listings/tasmania-state/">Tasmania</a>
                      <a href="/listings/victoria-state/">Victoria</a>
                      <a href="/listings/western-australia-state/">Western Australia</a>
                    </div>
                    
                    <div className="mega-col">
                      
                      <div className="mega-col-title">By Region</div>
                      <a href="/listings/victoria-state/melbourne-region/">Melbourne</a>
                      <a href="/listings/new-south-wales-state/sydney-region/">Sydney</a>
                      <a href="/listings/queensland-state/brisbane-region/">Brisbane</a>
                      <a href="/listings/western-australia-state/perth-region/">Perth</a>
                      <a href="/listings/south-australia-state/adelaide-region/">Adelaide</a>
                      <a href="/listings/victoria-state/geelong-region/">Geelong</a>
                      <a href="/listings/new-south-wales-state/newcastle-region/">Newcastle</a>
                      <a href="/listings/queensland-state/cairns-region/">Cairns</a>
                      <a href="/listings/tasmania-state/hobart-region/">Hobart</a>
                      <a href="/listings/northern-territory-state/darwin-region/">Darwin</a>
                      <div className="mega-col-title mega-col-title-mt">By Price</div>
                      <a href="/listings/under-20000/">Under $20k</a>
                      <a href="/listings/under-30000/">Under $30k</a>
                      <a href="/listings/under-40000/">Under $40k</a>
                      <a href="/listings/under-50000/">Under $50k</a>
                      <a href="/listings/under-70000/">Under $70k</a>
                      <a href="/listings/under-100000/">Under $100k</a>
                      <a href="/listings/under-150000/">Under $150k</a>
                      <a href="/listings/over-200000/">Over $200k</a>
                      
                    </div>
                    <div className="mega-col">
                      <div className="mega-col-title">Popular Makes</div>
                      <a href="/listings/jayco/">Jayco</a>
                      <a href="/listings/evernew/">Evernew</a>
                      <a href="/listings/design-rv/">Design RV</a>
                      <a href="/listings/avan/">Avan</a>
                      <a href="/listings/newgen/">Newgen</a>
                      <a href="/listings/adria/">Adria</a>
                      <a href="/listings/retreat/">Retreat</a>
                      <a href="/listings/snowy-river/">Snowy River</a>
                      <a href="/listings/crusader/">Crusader</a>
                      <a href="/listings/supreme/">Supreme</a>
                      <a href="/listings/essential/">Essential</a>
                      <a href="/listings/golf/">Golf</a>
                      <a href="/listings/royal-flair/">Royal Flair</a>
                      <a href="/listings/new-age/">New Age</a>
                      <a href="/listings/mdc/">MDC</a>
                      <a href="/listings/jb/">JB</a>
                      <a href="/listings/lotus/">Lotus</a>
                      <a href="/listings/windsor/">Windsor</a>
                      <a href="/listings/nova/">Nova</a>
                    </div>
                    <div className="mega-col">
                      
                      <div className="mega-col-title ">By Weight</div>
                      <a href="/listings/under-1500-kg-atm/">Under 1500 Kgs</a>
                      <a href="/listings/under-2500-kg-atm/">Under 2500 Kgs</a>
                      <a href="/listings/under-3500-kg-atm/">Under 3500 Kgs</a>
                      <a href="/listings/over-3500-kg-atm/">Over 3500 Kgs</a>
                      <div className="mega-col-title mega-col-title-mt">By Length</div>
                      <a href="/listings/under-12-length-in-feet/">Under 12ft</a>
                      <a href="/listings/under-14-length-in-feet/">Under 14ft</a>
                      <a href="/listings/under-17-length-in-feet/">Under 17ft</a>
                      <a href="/listings/under-20-length-in-feet/">Under 20ft</a>
                      <a href="/listings/under-23-length-in-feet/">Under 23ft</a>
                      <a href="/listings/over-24-length-in-feet/">Over 24ft</a>
                      <div className="mega-col-title mega-col-title-mt">By People</div>
                      <a href="/listings/under-2-people-sleeping-capacity/">Under 2 People</a>
                      <a href="/listings/under-4-people-sleeping-capacity/">Under 4 People</a>
                      <a href="/listings/under-6-people-sleeping-capacity/">Under 6 People</a>
                      <a href="/listings/over-6-people-sleeping-capacity/">Over 6 People</a>
                    </div>
                    </div>
                  </div>
                </li>
                
                <li className="nav-item">
                  <a className="nav-link" href="/sell-my-caravan/">Sell My Caravan</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/dealer-advertising/">Dealer Advertising</a>
                </li>
                
                <li className="nav-item login">
                  <a className="nav-link" href="/login/">
                    <i className="bi bi-person-fill"></i> Login
                  </a>
                </li>
              </ul>

              <div className="ham-menu-wrapper" ref={hamRef}>
                <button className="ham-menu-btn" onClick={() => setHamOpen(prev => !prev)} aria-label="Menu">
                  <i className="bi bi-list"></i>
                </button>
                {hamOpen && (
                  <div className="ham-dropdown">
                    <a href="/listings/" className="ham-item">Caravan Listings</a>
                    <a href="/sell-my-caravan/" className="ham-item">Sell My Caravan</a>
                    <a href="/dealer-advertising/" className="ham-item">Dealer Advertising</a>
                    <a href="/blog/" className="ham-item">Blog</a>
                    <a href="/about-us/" className="ham-item">About</a>
                    <a href="/contact/" className="ham-item">Contact</a>
                  </div>
                )}
              </div>
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

            <div className="left_menu d-lg-none">
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
      {mounted && (
        <div id="mySidenav" ref={sidenavRef} className={`sidenav ${isOpen ? "open" : ""}`}>

          {/* ── Main Panel ── */}
          <div className={`sidenav-panel sidenav-panel-main${activePanel ? " panel-slide-out" : ""}`}>
            <div className="sidenav-header">
              <a href="/" onClick={closeNav} className="sidenav-logo-link">
                <Image src="/images/cfs-logo-black.svg" alt="Caravans For Sale" width={120} height={40} className="sidenav-logo-img" />
              </a>
              <button className="sidenav-close" onClick={closeNav} aria-label="Close menu">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="sidenav-scrollable">
              <div className="sidebar-navigation">
                <ul>
                  <li><a href="/" onClick={closeNav}>Home</a></li>
                  <li className="sidenav-has-child" onClick={() => setActivePanel("buynow")}>
                    <span>Buy</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </li>
                  <li><a href="/blog/" onClick={closeNav}>Blog</a></li>
                  <li><a href="/about-us/" onClick={closeNav}>About</a></li>
                  <li><a href="/contact/" onClick={closeNav}>Contact</a></li>
                </ul>
              </div>
              <div className="sidenav-cta">
                <a href="/sell-my-caravan/" className="sidenav-cta-link" onClick={closeNav}>Sell My Caravan</a>
                <a href="/dealer-advertising/" className="sidenav-cta-link" onClick={closeNav}>Dealer Advertising</a>
                <a href="/login/" className="sidenav-cta-login" onClick={closeNav}>
                  <i className="bi bi-person-fill"></i> Login
                </a>
              </div>
            </div>
          </div>

          {/* ── Buy Now Sub-Panel ── */}
          <div className={`sidenav-panel sidenav-panel-sub${activePanel === "buynow" ? " panel-slide-in" : ""}`}>
            <div className="sidenav-header">
              <button className="sidenav-back" onClick={() => setActivePanel(null)} aria-label="Back">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M12 14L7 9l5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Back</span>
              </button>
              <button className="sidenav-close" onClick={closeNav} aria-label="Close menu">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="sidenav-scrollable">
              <div className="snav-direct-links">
                <Link href="/listings/" onClick={closeNav}>All Caravans</Link>
                <Link href="/listings/new-condition/" onClick={closeNav}>New Caravans</Link>
                <Link href="/listings/used-condition/" onClick={closeNav}>Used Caravans</Link>
              </div>

              <div className="snav-section">
                <div className="snav-section-heading">Popular Makes</div>
                <div className="snav-section-links">
                  <Link href="/listings/jayco/" onClick={closeNav}>Jayco</Link>
                  <Link href="/listings/evernew/" onClick={closeNav}>Evernew</Link>
                  <Link href="/listings/design-rv/" onClick={closeNav}>Design RV</Link>
                  <Link href="/listings/avan/" onClick={closeNav}>Avan</Link>
                  <Link href="/listings/newgen/" onClick={closeNav}>Newgen</Link>
                  <Link href="/listings/adria/" onClick={closeNav}>Adria</Link>
                  <Link href="/listings/retreat/" onClick={closeNav}>Retreat</Link>
                  <Link href="/listings/snowy-river/" onClick={closeNav}>Snowy River</Link>
                  <Link href="/listings/crusader/" onClick={closeNav}>Crusader</Link>
                  <Link href="/listings/supreme/" onClick={closeNav}>Supreme</Link>
                  <Link href="/listings/essential/" onClick={closeNav}>Essential</Link>
                  <Link href="/listings/golf/" onClick={closeNav}>Golf</Link>
                  <Link href="/listings/royal-flair/" onClick={closeNav}>Royal Flair</Link>
                  <Link href="/listings/new-age/" onClick={closeNav}>New Age</Link>
                  <Link href="/listings/mdc/" onClick={closeNav}>MDC</Link>
                  <Link href="/listings/jb/" onClick={closeNav}>JB</Link>
                  <Link href="/listings/lotus/" onClick={closeNav}>Lotus</Link>
                  <Link href="/listings/windsor/" onClick={closeNav}>Windsor</Link>
                  <Link href="/listings/nova/" onClick={closeNav}>Nova</Link>
                </div>
              </div>

              <div className="snav-section">
                <div className="snav-section-heading">Caravan Type</div>
                <div className="snav-section-links">
                  <Link href="/listings/off-road-category/" onClick={closeNav}>Off Road</Link>
                  <Link href="/listings/hybrid-category/" onClick={closeNav}>Hybrid</Link>
                  <Link href="/listings/pop-top-category/" onClick={closeNav}>Pop Top</Link>
                  <Link href="/listings/luxury-category/" onClick={closeNav}>Luxury</Link>
                  <Link href="/listings/family-category/" onClick={closeNav}>Family</Link>
                  <Link href="/listings/touring-category/" onClick={closeNav}>Touring</Link>
                </div>
              </div>

              <div className="snav-section">
                <div className="snav-section-heading">Popular Locations</div>
                <div className="snav-section-links">
                  <div className="snav-sub-heading">By State</div>
                  <Link href="/listings/australian-capital-territory-state/" onClick={closeNav}>Australian Capital Territory</Link>
                  <Link href="/listings/new-south-wales-state/" onClick={closeNav}>New South Wales</Link>
                  <Link href="/listings/northern-territory-state/" onClick={closeNav}>Northern Territory</Link>
                  <Link href="/listings/queensland-state/" onClick={closeNav}>Queensland</Link>
                  <Link href="/listings/south-australia-state/" onClick={closeNav}>South Australia</Link>
                  <Link href="/listings/tasmania-state/" onClick={closeNav}>Tasmania</Link>
                  <Link href="/listings/victoria-state/" onClick={closeNav}>Victoria</Link>
                  <Link href="/listings/western-australia-state/" onClick={closeNav}>Western Australia</Link>
                  <div className="snav-sub-heading">By Region</div>
                  <Link href="/listings/victoria-state/melbourne-region/" onClick={closeNav}>Melbourne</Link>
                  <Link href="/listings/western-australia-state/perth-region/" onClick={closeNav}>Perth</Link>
                  <Link href="/listings/victoria-state/geelong-region/" onClick={closeNav}>Geelong</Link>
                  <Link href="/listings/queensland-state/cairns-region/" onClick={closeNav}>Cairns</Link>
                  <Link href="/listings/victoria-state/ballarat-region/" onClick={closeNav}>Ballarat</Link>
                  <Link href="/listings/tasmania-state/launceston-region/" onClick={closeNav}>Launceston</Link>
                  <Link href="/listings/new-south-wales-state/sydney-region/" onClick={closeNav}>Sydney</Link>
                  <Link href="/listings/south-australia-state/adelaide-region/" onClick={closeNav}>Adelaide</Link>
                  <Link href="/listings/tasmania-state/hobart-region/" onClick={closeNav}>Hobart</Link>
                  <Link href="/listings/queensland-state/toowoomba-region/" onClick={closeNav}>Toowoomba</Link>
                  <Link href="/listings/victoria-state/bendigo-region/" onClick={closeNav}>Bendigo</Link>
                  <Link href="/listings/victoria-state/shepparton-region/" onClick={closeNav}>Shepparton</Link>
                  <Link href="/listings/queensland-state/brisbane-region/" onClick={closeNav}>Brisbane</Link>
                  <Link href="/listings/new-south-wales-state/newcastle-region/" onClick={closeNav}>Newcastle</Link>
                  <Link href="/listings/queensland-state/townsville-region/" onClick={closeNav}>Townsville</Link>
                  <Link href="/listings/northern-territory-state/darwin-region/" onClick={closeNav}>Darwin</Link>
                  <Link href="/listings/queensland-state/ipswich-region/" onClick={closeNav}>Ipswich</Link>
                </div>
              </div>

              <div className="snav-section">
                <div className="snav-section-heading">By Price</div>
                <div className="snav-section-links">
                  <Link href="/listings/under-20000/" onClick={closeNav}>Under $20k</Link>
                  <Link href="/listings/under-30000/" onClick={closeNav}>Under $30k</Link>
                  <Link href="/listings/under-40000/" onClick={closeNav}>Under $40k</Link>
                  <Link href="/listings/under-50000/" onClick={closeNav}>Under $50k</Link>
                  <Link href="/listings/under-70000/" onClick={closeNav}>Under $70k</Link>
                  <Link href="/listings/under-100000/" onClick={closeNav}>Under $100k</Link>
                  <Link href="/listings/under-150000/" onClick={closeNav}>Under $150k</Link>
                  <Link href="/listings/under-200000/" onClick={closeNav}>Under $200k</Link>
                  <Link href="/listings/over-200000/" onClick={closeNav}>Over $200k</Link>
                </div>
              </div>

              <div className="snav-section">
                <div className="snav-section-heading">By Weight</div>
                <div className="snav-section-links">
                  <Link href="/listings/under-1500-kg-atm/" onClick={closeNav}>Under 1500 Kgs</Link>
                  <Link href="/listings/under-2500-kg-atm/" onClick={closeNav}>Under 2500 Kgs</Link>
                  <Link href="/listings/under-3500-kg-atm/" onClick={closeNav}>Under 3500 Kgs</Link>
                  <Link href="/listings/over-3500-kg-atm/" onClick={closeNav}>Over 3500 Kgs</Link>
                </div>
              </div>

              <div className="snav-section">
                <div className="snav-section-heading">By People</div>
                <div className="snav-section-links">
                  <Link href="/listings/under-2-people-sleeping-capacity/" onClick={closeNav}>Under 2 People</Link>
                  <Link href="/listings/under-4-people-sleeping-capacity/" onClick={closeNav}>Under 4 People</Link>
                  <Link href="/listings/under-6-people-sleeping-capacity/" onClick={closeNav}>Under 6 People</Link>
                  <Link href="/listings/over-6-people-sleeping-capacity/" onClick={closeNav}>Over 6 People</Link>
                </div>
              </div>

              <div className="snav-section">
                <div className="snav-section-heading">By Length</div>
                <div className="snav-section-links">
                  <Link href="/listings/under-12-length-in-feet/" onClick={closeNav}>Under 12ft</Link>
                  <Link href="/listings/under-14-length-in-feet/" onClick={closeNav}>Under 14ft</Link>
                  <Link href="/listings/under-17-length-in-feet/" onClick={closeNav}>Under 17ft</Link>
                  <Link href="/listings/under-20-length-in-feet/" onClick={closeNav}>Under 20ft</Link>
                  <Link href="/listings/under-23-length-in-feet/" onClick={closeNav}>Under 23ft</Link>
                  <Link href="/listings/over-24-length-in-feet/" onClick={closeNav}>Over 24ft</Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Overlay */}
      <div
        className={`overlay-close ${isOpen ? "active" : ""}`}
        onClick={closeNav}
      ></div>
      <div
        id="overlay"
        className={`overlay ${isOpen ? "active" : ""}`}
        onClick={() => {
          closeNav();
        }}
      ></div>

    </>
  );
}
