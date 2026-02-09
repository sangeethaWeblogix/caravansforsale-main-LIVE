"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/*
Scroll to top instantly whenever the URL (pathname or query) changes
 */

export default function ScrollToTopGlobal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  }, [pathname, searchParams.toString()]);

  return null;
}