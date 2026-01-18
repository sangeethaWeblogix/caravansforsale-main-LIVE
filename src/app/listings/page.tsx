 // app/listings/page.tsx
'use client'

import React, { useEffect, useState } from "react";
import Listing from "../components/ListContent/Listings";
import { fetchListings } from "@/api/listings/api";
import { ensureValidPage } from "@/utils/seo/validatePage";
import { useRouter, useSearchParams } from "next/navigation";
import ApiErrorFallback from "../components/ApiErrorFallback";

export default function ListingsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Call this IMMEDIATELY to ensure skeleton shows
    if (typeof window !== 'undefined') {
      // Force skeleton visibility
      const skeleton = document.getElementById('listings-skeleton');
      if (skeleton) {
        skeleton.style.display = 'flex';
        skeleton.style.opacity = '1';
      }
    }

    const loadListings = async () => {
      try {
        setLoading(true);
        
        // Get current page from URL
        const pageParam = searchParams.get('page');
        const page = ensureValidPage(pageParam || '1', window.location.search);
        
        // Fetch listings
        const response = await fetchListings({ page });
        
        if (!response || response.success === false || !response.data) {
          throw new Error('Failed to load listings');
        }
        
        if (!Array.isArray(response.data.products) || response.data.products.length === 0) {
          router.push('/404');
          return;
        }
        
        setData(response);
        
        // MARK AS LOADED - Hide skeleton, show content
        if (typeof window !== 'undefined') {
          if (window.markListingsLoaded) {
            window.markListingsLoaded();
          }
          if (window.listingsContentReady) {
            window.listingsContentReady();
          }
        }
      } catch (err) {
        console.error("Listings page error:", err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Even on error, hide skeleton
        if (typeof window !== 'undefined') {
          if (window.markListingsLoaded) {
            window.markListingsLoaded();
          }
        }
      } finally {
        setLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(loadListings, 50);
  }, [searchParams, router]);

  // Show error state
  if (error) {
    const isNetworkError = error.includes('fetch') || error.includes('network');
    const isApiError = error.includes('API') || error.includes('Invalid');
    
    // Ensure skeleton is hidden
    useEffect(() => {
      if (typeof window !== 'undefined' && window.markListingsLoaded) {
        window.markListingsLoaded();
      }
    }, []);
    
    if (isNetworkError) {
      return (
        <ApiErrorFallback
          title="Connection failed"
          message="We couldn't reach our servers. Please check your internet connection and try again."
          showRetry={true}
          errorType="network"
        />
      );
    }
    
    if (isApiError) {
      return (
        <ApiErrorFallback
          title="Service error"
          message="Our listing service encountered an error. Our team has been notified and is working on it."
          showRetry={true}
          errorType="api"
        />
      );
    }
    
    return (
      <ApiErrorFallback
        title="Something went wrong"
        message="We're having trouble loading the listings. Please try again or come back later."
        showRetry={true}
        errorType="unknown"
      />
    );
  }

  // Calculate current page
  const pageParam = searchParams.get('page');
  const page = ensureValidPage(pageParam || '1', window.location.search);

  return (
    <>
      {/* Component to trigger loaded state */}
      {data && (
        <script dangerouslySetInnerHTML={{
          __html: `
            // When component renders with data, mark as loaded
            if (window.markListingsLoaded) {
              window.markListingsLoaded();
            }
          `
        }} />
      )}
      
      {data ? (
        <Listing initialData={data} page={page} />
      ) : (
        // Empty div while loading (skeleton will show)
        <div style={{ display: 'none' }}></div>
      )}
    </>
  );
}