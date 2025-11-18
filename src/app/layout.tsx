export const dynamic = "force-dynamic";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Navbar from "./navbar/Navbar";
import Footer from "./footer/Footer";
import React from "react";
import { Metadata } from "next";
import ScrollToTop from "./ScrollToTop";
import UTMTracker from "./UTMTracker";

export const metadata: Metadata = {
  title: {
    default: "Caravans For Sale | New & Used Caravan Sales in Australia",
    template: "%s ",
  },
  description:
    "Browse new & used caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity",
  icons: { icon: "/favicon.ico" },
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/", // ✅ base canonical
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />

        {/* ✅ Google Tag Manager (Head) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-86MYWLZRTY"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-86MYWLZRTY');
    `,
          }}
        />
      </head>
      <body
        className="flex flex-col min-h-screen new_font"
        style={{
          fontFamily:
            "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
        }}
      >
        {/* ✅ Google Tag Manager (noscript) - right after body */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-56V5NDV"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>

        <UTMTracker />
        <Navbar />
        <ScrollToTop />
        <main className="product-page style-5">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
