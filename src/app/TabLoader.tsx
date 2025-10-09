"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

export default function TabLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(true);
    NProgress.start();

    const timer = setTimeout(() => {
      NProgress.done();
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [pathname, searchParams?.toString()]);

  useEffect(() => {
    const favicon = document.querySelector(
      "link[rel='icon']"
    ) as HTMLLinkElement;
    if (!favicon) return;

    if (isLoading) {
      favicon.classList.add("loading");
      // draw arc + convert to base64
    } else {
      favicon.classList.remove("loading");
      favicon.href = "/favicon.ico";
    }
  }, [isLoading]);

  return null;
}
