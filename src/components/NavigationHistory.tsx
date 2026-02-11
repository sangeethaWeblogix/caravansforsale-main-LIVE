"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function NavigationHistory() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const existing = sessionStorage.getItem("nav_history");

    let history: string[] = existing ? JSON.parse(existing) : [];

    if (history[history.length - 1] !== pathname) {
      history.push(pathname);
      sessionStorage.setItem("nav_history", JSON.stringify(history));
    }
  }, [pathname]);

  return null;
}
