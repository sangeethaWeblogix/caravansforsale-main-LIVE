// app/types/global.d.ts
export {};

declare global {
  interface Window {
    markListingsLoaded: () => void;
    listingsContentReady: () => void;
    hideContentSkeleton: () => void;
  }
}