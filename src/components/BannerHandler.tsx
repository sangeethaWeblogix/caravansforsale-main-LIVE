"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { shouldShowBanner } from "@/utils/bannerUtils";

type FullBanner = {
  id: number;
  name: string;
  image_url: string;
  placement: string;
  banner_type: string;
  target_url: string;
  page_url: string;
  banner_size: string;
  device_target: string;
  url_match_type: "exact" | "contains";
  excluded_urls?: string;
  position: string;
};

type BannerContextType = {
  matchedBanners: FullBanner[];
  isMobile: boolean;
};

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function BannerProvider({ children }: { children: ReactNode }) {
   console.log("BannerProvider mounted");
  const [allBanners, setAllBanners] = useState<FullBanner[]>([]);
  const [matchedBanners, setMatchedBanners] = useState<FullBanner[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchBanners() {
       console.log("Fetching banners...");
      try {
        const res = await fetch(
          "https://admin.caravansforsale.com.au/wp-json/ads-manager/v1/banners",
        );
        const data = await res.json();
setAllBanners(Array.isArray(data) ? data : data.data || []);
console.log("banner", data)
      } catch (error) {
        console.error("Banner fetch error:", error);
      }
    }

    fetchBanners();
  }, []);

  useEffect(() => {
    if (!pathname || allBanners.length === 0) return;
 console.log("All banners:", allBanners);        // ← banners வருகிறதா?
  console.log("Pathname:", pathname);              // ← pathname என்ன?
  console.log("isMobile:", isMobile);  
    const device = isMobile ? "mobile" : "desktop";

    const filtered = allBanners.filter((banner) => {
if (!["home", "homepage"].includes(banner.placement)) return false;
      if (!shouldShowBanner(pathname, banner)) return false;
      if (banner.device_target !== device) return false;
      return false;
    });

    setMatchedBanners(filtered);
  }, [pathname, allBanners, isMobile]);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
    };

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <BannerContext.Provider value={{ matchedBanners, isMobile }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanners() {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error("useBanners must be used inside BannerProvider");
  }
  return context;
}
