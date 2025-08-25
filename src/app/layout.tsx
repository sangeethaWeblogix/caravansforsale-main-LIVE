// src/app/layout.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Navbar from "./navbar/Navbar";
import Footer from "./footer/Footer";
import React from "react";
import { Metadata } from "next";
import ScrollToTop from "./ScrollToTop";
export const metadata: Metadata = {
  title: {
    default: "Caravans For Sale | New & Used Caravan Sales in Australia",
    template: "%s ",
  },
  description:
    "Browse new & used caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts via link (runtime load) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="flex flex-col min-h-screen new_font"
        style={{
          fontFamily:
            "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
        }}
      >
        <Navbar />
        <ScrollToTop />
        <main className="product-page style-5">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
