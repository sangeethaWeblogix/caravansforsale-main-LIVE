 import { NextRequest, NextResponse } from "next/server";
import { parseSlugToFilters } from "@/app/components/urlBuilder";

/* ──────────────────────────────────────────────
   Edge-safe in-memory cache
────────────────────────────────────────────── */
const seoCache = new Map<
  string,
  { robots: string; expires: number }
>();

const CACHE_TTL = 60 * 1000; // 1 minute

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const fullPath = url.pathname + url.search;

  /* 1️⃣ Block /feed URLs */
  if (/feed/i.test(fullPath)) {
    return new NextResponse(null, { status: 410 });
  }

  /* 2️⃣ Remove add-to-cart param */
  if (url.searchParams.has("add-to-cart")) {
    url.searchParams.delete("add-to-cart");
    return NextResponse.redirect(url, { status: 301 });
  }

  /* 3️⃣ Default response */
  const response = NextResponse.next();

  /* 4️⃣ SEO Middleware (LISTINGS ONLY) */
  if (url.pathname.startsWith("/listings")) {
    const cacheKey = fullPath; // ✅ FIXED: include query params

    /* 🔹 Cache hit */
    const cached = seoCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      response.headers.set("X-Robots-Tag", cached.robots);
      return response;
    }

    try {
      const slugParts = url.pathname
        .replace("/listings", "")
        .split("/")
        .filter(Boolean);

      const filters = parseSlugToFilters(
        slugParts,
        Object.fromEntries(url.searchParams)
      );

      const apiUrl =
        "https://admin.caravansforsale.com.au/wp-json/cfs/v1/new_optimize_code?" +
        new URLSearchParams(filters as Record<string, string>).toString();

      /* 🔹 AbortController with safe timeout */
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const apiRes = await fetch(apiUrl, {
        headers: {
          "User-Agent": "next-middleware",
        },
        signal: controller.signal,
        next: { revalidate: 60 }, // Edge cache hint
      });

      clearTimeout(timeoutId);

      let robotsHeader = "index, follow"; // ✅ safe default

      if (apiRes.ok) {
        const data = await apiRes.json();

        const rawIndex = String(data?.seo?.index ?? "")
          .toLowerCase()
          .trim();

        const rawFollow = String(data?.seo?.follow ?? "")
          .toLowerCase()
          .trim();

        robotsHeader =
          (rawIndex === "noindex" ? "noindex" : "index") +
          ", " +
          (rawFollow === "nofollow" ? "nofollow" : "follow");
      }

      /* 🔹 Save to cache */
      seoCache.set(cacheKey, {
        robots: robotsHeader,
        expires: Date.now() + CACHE_TTL,
      });

      response.headers.set("X-Robots-Tag", robotsHeader);
    } catch (error: any) {
      /* ✅ AbortError is EXPECTED → ignore silently */
      if (error?.name !== "AbortError") {
        console.error("Middleware SEO error:", error);
      }

      response.headers.set("X-Robots-Tag", "index, follow");
    }
  }

  return response;
}

/* ──────────────────────────────────────────────
   Matcher
────────────────────────────────────────────── */
export const config = {
  matcher: [
    "/listings/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
