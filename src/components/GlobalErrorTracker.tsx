"use client";

import { useEffect } from "react";

// Known third-party noise — don't alert on these
const IGNORE_PATTERNS = [
  "parentNode",           // GTM script race condition
  "ResizeObserver",       // Browser internal
  "Non-Error promise",    // Browser extension noise
  "hydrat",               // Next.js hydration (expected in dev)
  "Loading chunk",        // Next.js lazy chunk (retry handles it)
  "ChunkLoadError",       // Same
];

function shouldIgnore(message: string): boolean {
  const m = message.toLowerCase();
  return IGNORE_PATTERNS.some((p) => m.includes(p.toLowerCase()));
}

function report(errorType: string, message: string) {
  if (shouldIgnore(message)) return;
  fetch("/api/report-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      errorSource: "FRONTEND",
      errorType,
      message: message.substring(0, 500),
      pageUrl: window.location.href,
    }),
  }).catch(() => {});
}

export default function GlobalErrorTracker() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      report("JS Error: " + e.message, e.message + (e.filename ? ` (${e.filename}:${e.lineno})` : ""));
    };

    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message ?? String(e.reason ?? "Unhandled rejection");
      report("Unhandled Promise: " + msg, msg);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
