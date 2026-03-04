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
  target_href_url: string;
  page_url: string;
  banner_size: string;
  device_target: string;
  url_match_type: "exact" | "contains";
  excluded_urls?: string;
  position: string;
};

type BannerContextType = {
  matchedBanners: FullBanner[];
};

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function BannerProvider({ children }: { children: ReactNode }) {
  const [allBanners, setAllBanners] = useState<FullBanner[]>([]);
  const [matchedBanners, setMatchedBanners] = useState<FullBanner[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch(
          "https://www.admin.caravansforsale.com.au/wp-json/ads-manager/v1/banners",
        );
        const data = await res.json();
        setAllBanners(data.data || []);
      } catch (error) {
        console.error("Banner fetch error:", error);
      }
    }

    fetchBanners();
  }, []);

  useEffect(() => {
    if (!pathname || allBanners.length === 0) return;

    const filtered = allBanners.filter((banner) =>
      shouldShowBanner(pathname, banner),
    );

    setMatchedBanners(filtered);
  }, [pathname, allBanners]);

  return (
    <BannerContext.Provider value={{ matchedBanners }}>
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
