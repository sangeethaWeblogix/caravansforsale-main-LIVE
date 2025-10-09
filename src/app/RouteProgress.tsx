"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 120,
  speed: 500,
  minimum: 0.2,
});

export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.start();
    const timer = setTimeout(() => {
      NProgress.done();
    }, 600); // smooth finish
    return () => clearTimeout(timer);
  }, [pathname, searchParams?.toString()]);

  return null;
}
