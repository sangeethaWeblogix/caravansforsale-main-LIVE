"use client";

import "./footer.css";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaPinterestP,
} from "react-icons/fa";
import { BsChevronUp } from "react-icons/bs";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  // const siteUrl = "https://www.caravansforsale.com.au";

  return (
    <>
      <footer className="style-8">
        <div className="container">
          <div className="foot py-4 border-1 border-top brd-gray">
            <div className="row">
              {/* Left Column */}
              <div className="col-lg-6">
                <p>
                  Caravan Marketplace (Web Logix) ABN 92 009 784 881. <br />
                  Copyright © {currentYear}. All Rights Reserved.
                </p>
                <div className="disclaimer" style={{ marginTop: "12px" }}>
                  <p>
                    Disclaimer: Caravan marketplace is not affiliated with any
                    manufacturers, dealers listed on our website. All product
                    data listed on our website including logos, and brands are
                    property of their respective owners. Product information is
                    provided for informational purposes only.
                    <br />
                    Caravan marketplace does not make any warranty as to the
                    accuracy, completeness or reliability of the information or
                    accept any liability arising in any way from any omissions
                    or errors. The information should not be regarded as advice
                    or relied upon by you or any other person and we recommend
                    that you seek professional advice before making any purchase
                    decisions.
                  </p>
                </div>
              </div>

              {/* About Us Column */}
              <div className="col-lg-3">
                <h6 className="foot-title foot_xs">About Us</h6>
                <ul className="menu footer_xs">
                  {/* <li><Link href={`${siteUrl}/caravan-dealers/`}>Caravan Dealers</Link></li> */}
                  <li>
                    <Link href="/listings/">For Sale</Link>
                  </li>
                  {/* <li><Link href={`${siteUrl}/caravan-manufacturers/all/`}>Manufacturer Range</Link></li> */}
                  <li>
                    <Link href="/blog/">Blog</Link>
                  </li>
                  <li>
                    <Link href="/terms-conditions/">Terms & Conditions</Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy/">Privacy Policy</Link>
                  </li>
                  <li>
                    <Link href="/privacy-collection-statement/">
                      Privacy Collection Statement
                    </Link>
                  </li>
                  <li>
                    <Link href="/about-us/">About</Link>
                  </li>
                  <li>
                    <Link href="/contact/">Contact Us</Link>
                  </li>
                </ul>
              </div>

              {/* Popular Pages Column */}
              <div className="col-lg-3">
                <h6 className="foot-title foot_xs">Popular Pages</h6>
                <ul className="menu footer_xs">
                  <li>
                    <Link href="/blog/best-caravans-full-off-road-capabilities-australia/">
                      Best Off Road Caravans
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog/best-semi-off-road-caravans-australia-guide/">
                      Best Semi Off Road Caravans
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog/best-caravans-for-extreme-off-road-travel/">
                      Best Extreme Off Road Caravans
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog/best-luxury-caravans-australia-highlights-features-reviews/">
                      Best Luxury Caravans
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog/top-family-off-road-caravans-australia/">
                      Best Family Caravans
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog/touring-caravans/">
                      Best Touring Caravans
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Social Icons */}
            <div className="content mt-3">
              <div className="foot-info logo-social">
                <div className="socials">
                  <a
                    href="https://www.facebook.com/caravansforsale.com.au"
                    className="facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaFacebookF />
                  </a>
                  <a
                    href="https://www.instagram.com/caravansforsale.com.au"
                    className="instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaInstagram />
                  </a>
                  <a
                    href="https://x.com/CaravanMarketPL"
                    className="twitter"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="currentColor"
                      className="bi bi-twitter-x"
                      viewBox="0 0 16 19"
                    >
                      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.youtube.com/@caravansforsalecomau"
                    className="youtube"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaYoutube />
                  </a>
                  <a
                    href="https://au.pinterest.com/caravansforsalecomau/"
                    className="pinterest"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaPinterestP />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* To Top Button */}
      <a
        href="#"
        className="to_top bg-gray rounded-circle icon-40 d-inline-flex align-items-center justify-content-center show"
      >
        <BsChevronUp className="fs-6 text-white" />
      </a>
    </>
  );
};

export default Footer;
