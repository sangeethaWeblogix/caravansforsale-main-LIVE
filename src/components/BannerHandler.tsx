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
  currentHomeBannerIndex: number;
   isLoading: boolean;
  
};

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function BannerProvider({ children }: { children: ReactNode }) {
   console.log("BannerProvider mounted");
  const [allBanners, setAllBanners] = useState<FullBanner[]>([]);
  const [matchedBanners, setMatchedBanners] = useState<FullBanner[]>([]);
  const [isMobile, setIsMobile] = useState(false);
    const [currentHomeBannerIndex, setCurrentHomeBannerIndex] = useState(0); // ✅ inside component

  const pathname = usePathname();
const PLACEMENTS = ["listings", "homepage", "sidebar", "header", "footer"];
  const [isLoading, setIsLoading] = useState(true); // ✅ add

 useEffect(() => {
  async function fetchAllBanners() {
    try {
      setIsLoading(true);
        const cached = sessionStorage.getItem("banners_cache");
      if (cached) {
        setAllBanners(JSON.parse(cached));
        setIsLoading(false);
        return; // ✅ fetch-யே skip பண்ணு
      }
      const res = await fetch("/api/banners"); // ✅ CORS இல்லை
      const data = await res.json();
      const banners = Array.isArray(data) ? data : [];
      console.log(`✅ Total banners: ${banners.length}`, banners);
      setAllBanners(banners);
    } catch (error) {
      console.error("Banner fetch error:", error);
    }  finally {
        setIsLoading(false); // ✅ fetch முடிஞ்சது
      }
  }
  fetchAllBanners();
}, []);

  useEffect(() => {
    const homeBanners = allBanners.filter((b) => b.placement === "home");
    if (homeBanners.length === 0) return;

    const stored = parseInt(localStorage.getItem("homeBannerIndex") || "-1", 10);
    const next = (stored + 1) % homeBanners.length;
    localStorage.setItem("homeBannerIndex", String(next));
    setCurrentHomeBannerIndex(next);
  }, [allBanners]);

  // BannerProvider-ல் இதை add பண்ணு debug-க்கு
allBanners.forEach((banner) => {
  console.log(
    "Banner:", banner.name,
    "| page_url:", banner.page_url,
    "| pathname:", pathname,
    "| shouldShow:", shouldShowBanner(pathname, banner)
  );
});

  useEffect(() => {
    if (!pathname || allBanners.length === 0) return;
 console.log("All banners:", allBanners);        // ← banners வருகிறதா?
  console.log("Pathname:", pathname);              // ← pathname என்ன?
  console.log("isMobile:", isMobile);  
    const device = isMobile ? "mobile" : "desktop";

    const filtered = allBanners.filter((banner) => {
        const result = shouldShowBanner(pathname, banner);

// if (!["home", "homepage"].includes(banner.placement)) return true;
 console.log(
    "Banner:", banner.name,
    "| placement:", banner.placement,
    "| page_url:", banner.page_url,
    "| pathname:", pathname,
    "| shouldShow result:", result  // ← true வருதா false வருதா?
  );
  if (!shouldShowBanner(pathname, banner)) return false;

      // ✅ 2. Device check — "all" இருந்தா எல்லா device-லயும் காட்டு
      if (
        banner.device_target !== "all" &&
        banner.device_target !== device
      ) {
        return false;
      }

      return true;
    });

    console.log("Pathname:", pathname);
    console.log("Device:", device);
    console.log("Matched banners:", filtered);


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
    <BannerContext.Provider value={{ matchedBanners, isMobile, currentHomeBannerIndex, isLoading   }}>
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
