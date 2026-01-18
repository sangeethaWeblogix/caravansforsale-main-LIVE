 // app/listings/layout.tsx
import React, { ReactNode } from "react";
import "../components/ListContent/newList.css"
import "./listings.css"
import { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Caravans For Sale in Australia - Find Exclusive Deals",
  description:
    "Browse new & used caravans for sale across Australia. Compare off-road, hybrid, pop-top & luxury models by price, size, weight and sleeping capacity.",
  robots: "index, follow",
  openGraph: {
    title: "Caravans For Sale in Australia - Find Exclusive Deals",
    description:
      "Browse new & used caravans for sale across Australia. Compare off-road, hybrid, pop-top & luxury models by price, size, weight and sleeping capacity.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caravans For Sale in Australia - Find Exclusive Deals",
    description:
      "Browse new & used caravans for sale across Australia. Compare off-road, hybrid, pop-top & luxury models by price, size, weight and sleeping capacity.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/listings",
  },
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo",
  },
};

// ✅ CRITICAL - INLINE IMMEDIATE CSS
const criticalListingsCSS = `
  /* FORCE IMMEDIATE VISIBILITY - NO WHITE SPACE */
  body {
    background: #ffffff !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
  
  .listings-container {
    opacity: 1 !important;
    visibility: visible !important;
    background: #ffffff !important;
    min-height: 70vh;
    display: block !important;
  }
  
  /* SKELETON - ALWAYS VISIBLE IMMEDIATELY */
  #listings-skeleton {
    display: flex !important;
    opacity: 1 !important;
    visibility: visible !important;
    background: #ffffff;
    animation: fadeInSkeleton 0.1s ease-in forwards;
  }
  
  @keyframes fadeInSkeleton {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  /* CONTENT - HIDDEN INITIALLY */
  .listings-content {
    display: none !important;
    opacity: 0;
  }
  
  /* WHEN LOADED - SHOW CONTENT, HIDE SKELETON */
  .listings-loaded #listings-skeleton {
    display: none !important;
  }
  
  .listings-loaded .listings-content {
    display: block !important;
    opacity: 1;
    animation: fadeInContent 0.3s ease-in forwards;
  }
  
  @keyframes fadeInContent {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* SKELETON STYLES */
  .skeleton-header {
    height: 8px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
    margin-bottom: 12px;
  }
  
  .skeleton-text {
    height: 4px;
    background: #f0f0f0;
    border-radius: 2px;
    margin-bottom: 8px;
  }
  
  .skeleton-card {
    height: 240px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .skeleton-filter {
    height: 200px;
    background: #f5f5f5;
    border-radius: 8px;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* ✅ INLINE CSS - LOADS INSTANTLY */}
      <style dangerouslySetInnerHTML={{ __html: criticalListingsCSS }} />
      
      {/* ✅ INLINE JS - EXECUTES IMMEDIATELY */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // EXECUTE IMMEDIATELY WHEN PARSED
          (function() {
            // Force body visibility
            if (document.body) {
              document.body.style.background = '#ffffff';
              document.body.style.opacity = '1';
              document.body.style.visibility = 'visible';
            }
            
            // Global function to mark listings loaded
            window.markListingsLoaded = function() {
              var container = document.querySelector('.listings-container');
              if (container) {
                container.classList.add('listings-loaded');
                
                // Force hide skeleton
                var skeleton = document.getElementById('listings-skeleton');
                if (skeleton) {
                  skeleton.style.display = 'none';
                  skeleton.style.opacity = '0';
                }
              }
            };
            
            // Fallback - auto hide after timeout
            setTimeout(function() {
              if (window.markListingsLoaded) window.markListingsLoaded();
            }, 3000);
            
            // Initial DOM check
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                // Ensure skeleton is visible
                var skeleton = document.getElementById('listings-skeleton');
                if (skeleton) {
                  skeleton.style.display = 'flex';
                  skeleton.style.opacity = '1';
                }
              });
            } else {
              // DOM already loaded
              var skeleton = document.getElementById('listings-skeleton');
              if (skeleton) {
                skeleton.style.display = 'flex';
                skeleton.style.opacity = '1';
              }
            }
          })();
        `
      }} />
      
      <div className="listings-container">
        {/* ✅ SKELETON - EXACTLY LIKE YOUR IMAGE */}
        <div id="listings-skeleton" className="listings-skeleton">
          <div className="container mx-auto px-4 py-8">
            {/* Header - Like your image */}
            <div className="mb-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-3/4">
                  <div className="skeleton-header" style={{ width: '300px', height: '32px' }}></div>
                  <div className="skeleton-text" style={{ width: '200px' }}></div>
                  <div className="skeleton-header mt-4" style={{ width: '400px', height: '28px' }}></div>
                </div>
                <div className="w-1/4 text-right">
                  <div className="skeleton-header inline-block" style={{ width: '80px', height: '32px' }}></div>
                  <div className="skeleton-text ml-auto" style={{ width: '100px' }}></div>
                </div>
              </div>
              
              {/* Filter buttons */}
              <div className="flex gap-3 mb-6">
                <div className="skeleton-header" style={{ width: '100px', height: '40px' }}></div>
                <div className="skeleton-header" style={{ width: '120px', height: '40px' }}></div>
                <div className="skeleton-header" style={{ width: '160px', height: '40px' }}></div>
              </div>
            </div>
            
            {/* Main Content - Like your image */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters sidebar */}
              <div className="lg:w-1/4">
                <div className="space-y-6">
                  <div className="skeleton-header" style={{ height: '24px', width: '100px' }}></div>
                  <div className="skeleton-filter"></div>
                  <div className="skeleton-filter"></div>
                  <div className="skeleton-filter"></div>
                </div>
              </div>
              
              {/* Listings grid */}
              <div className="lg:w-3/4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton-card"></div>
                  ))}
                </div>
                
                {/* Pagination skeleton */}
                <div className="mt-8 flex justify-center">
                  <div className="skeleton-header" style={{ width: '200px', height: '40px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* ✅ Actual content - hidden initially */}
        <div className="listings-content">
          {children}
        </div>
      </div>
      
      {/* ✅ Additional script for child component to call */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // Function for child components to call when they load
          window.listingsContentReady = function() {
            if (window.markListingsLoaded) {
              window.markListingsLoaded();
            }
          };
        `
      }} />
    </>
  );
}