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
  // import NextTopLoader from "nextjs-toploader";
import ThemeRegistry from './components/ThemeRegistry';

  
  export const metadata: Metadata = {
    title: {
      default: "Caravans For Sale – Australia’s Marketplace for New & Used Caravans",
      template: "%s ",
    },
    description:
      "Browse new & used caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity",
    icons: { icon: "/favicon.ico" },
    // robots: "index, follow",
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
    },
    alternates: {
      canonical: "https://www.caravansforsale.com.au",
    },
    
  
  };
  
  
  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
    const gtmServer = process.env.NEXT_PUBLIC_GTM_SERVER_URL;
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
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),
                  dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl+
                    '&gtm_url=${gtmServer}';
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
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
        src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  
          <UTMTracker />
          <Navbar />
          <ScrollToTop />
          <main className="product-page style-5">
            {/* <NextTopLoader
          color="#ff6600"
          height={3}
          showSpinner={false}
        /> */}
 <ThemeRegistry>
          {children}
        </ThemeRegistry>
                    </main>
          

          <Footer />
        </body>
      </html>
      
    );
  }
  