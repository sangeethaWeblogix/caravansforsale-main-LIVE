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
import { useEffect, useState } from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <>
      <footer className="style-8">
        <div className="container">
          <div className="foot py-4  brd-gray">
            <div className="row">
              {/* Left Column */}
              <div className="col-lg-8">
                <div>
                  <p>
                    Marketplace Network Pty Ltd. ABN : 70 694 987 052 <br />
                    Copyright © {currentYear ?? "----"}. All Rights Reserved.
                  </p>
                </div>
                <div className="disclaimer" style={{ marginTop: "12px" }}>
                  <p>
                    Disclaimer: Marketplace Network operates a portfolio of independent “for sale” marketplace websites. Marketplace Network is not affiliated with, endorsed by, or associated with any manufacturers, dealers, advertisers, or sellers listed on our websites unless expressly stated.
                    <br />
                    All product information, images, logos, trademarks, and brand names displayed on our websites are the property of their respective owners and are used for identification and informational purposes only.
Marketplace Network makes no representations or warranties regarding the accuracy, completeness, or reliability of any information published on its platforms and accepts no liability for any loss or damage arising from reliance on such information. Information provided on our websites should not be considered professional, financial, or purchasing advice. Users are encouraged to conduct their own due diligence and seek independent professional advice before making any purchasing or commercial decisions.
                  </p>
                </div>
              </div>

              {/* About Us Column */}
              <div className="col-lg-4 col-sm-12">
                <h6 className="foot-title foot_xs">Company</h6>
                <ul className="menu footer_xs">
                  <li>
                    <a href="/listings/">For Sale</a>
                  </li>
                  <li>
                    <a href="/blog/">Blog</a>
                  </li>
                  <li>
                    <a href="/terms-conditions/">Terms & Conditions</a>
                  </li>
                  <li>
                    <a href="/privacy-policy/">Privacy Policy</a>
                  </li>
                  <li>
                    <a href="/privacy-collection-statement/">
                      Privacy Collection Statement
                    </a>
                  </li>
                  <li>
                    <a href="/about-us/">About</a>
                  </li>
                  <li>
                    <a href="/contact/">Contact Us</a>
                  </li>
                </ul>
              </div>

              {/* Popular Pages Column */}
              {/* <div className="col-lg-3 col-sm-6">
                <h6 className="foot-title foot_xs">Popular Pages</h6>
                <ul className="menu footer_xs">
                  <li>
                    <Link href="/best-caravans-full-off-road-capabilities-australia/">
                      Best Off Road Caravans
                    </Link>
                  </li>
                  <li>
                    <Link href="/best-semi-off-road-caravans-australia-guide/">
                      Best Semi Off Road Caravans
                    </Link>
                  </li>
                  <li>
                    <Link href="/best-caravans-for-extreme-off-road-travel/">
                      Best Extreme Off Road Caravans
                    </Link>
                  </li>
                  <li>
                    <Link href="/best-luxury-caravans-australia-highlights-features-reviews/">
                      Best Luxury Caravans
                    </Link>
                  </li>
                  <li>
                    <Link href="/top-family-off-road-caravans-australia/">
                      Best Family Caravans
                    </Link>
                  </li>
                  <li>
                    <Link href="/touring-caravans/">Best Touring Caravans</Link>
                  </li>
                </ul>
              </div> */}
            </div>

            {/* Social Icons */}
            {/*<div className="content mt-3">
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
            </div> */}
          </div>
        </div>
      </footer>

      {/* To Top Button */}
      <Link
        href="#"
        className="to_top bg-gray rounded-circle icon-40 d-inline-flex align-items-center justify-content-center show"
      >
        <BsChevronUp className="fs-6 text-white" />
      </Link>
    </>
  );
};

export default Footer;
