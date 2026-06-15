import { NextRequest, NextResponse } from "next/server";
import { parseSlugToFilters } from "@/app/components/urlBuilder";
const API_KEY = process.env.CFS_API_KEY;

/* ──────────────────────────────────────────────
   Edge-safe in-memory cache
────────────────────────────────────────────── */
const seoCache = new Map<string, { robots: string; expires: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

/* ──────────────────────────────────────────────
   Bot Detection
────────────────────────────────────────────── */
const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'crawler',
  'spider',
  'bot'
] as const;

function isBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const fullPath = url.pathname + url.search;
  const userAgent = request.headers.get('user-agent') || '';

  // Forward pathname to server components (for per-slug metadata injection in root layout)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', url.pathname);

  /* 🚫 Listings: forbidden path segments OR unknown query params → 410 (URL unchanged) */
  if (url.pathname.startsWith('/listings')) {
    const segments = url.pathname.split('/').filter(Boolean);
    const hasForbiddenSegment = segments.some(s => /(page|feed)/i.test(s));

    // Only these query params are valid on listing pages
    const ALLOWED_PARAMS = new Set(['clickid', 'orderby', 'search', 'keyword', 'radius_kms']);
    const hasUnknownParam = Array.from(url.searchParams.keys()).some(k => !ALLOWED_PARAMS.has(k.toLowerCase()));

    // Even allowed params must not carry page/feed in their values (e.g. ?clickid=uuid/page)
    const hasForbiddenValue = Array.from(url.searchParams.values()).some(v => /(page|feed)/i.test(v));

    if (hasForbiddenSegment || hasUnknownParam || hasForbiddenValue) {
      return NextResponse.rewrite(new URL('/410', request.url), { status: 410 });
    }
  }

  /* 🤖 STEP 1: Bot Detection - Let Cloudflare Worker Handle It */
  if (isBot(userAgent)) {
    console.log(`🤖 Bot detected: ${userAgent.substring(0, 50)}...`);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('X-Is-Bot', 'true');
    return response;
  }
 if (
    !url.pathname.endsWith('/') &&
    !url.pathname.includes('.') &&
    !url.pathname.startsWith('/api') &&
    !url.pathname.startsWith('/_next') &&
     !url.pathname.startsWith('/listings')
  ) {
    url.pathname = `${url.pathname}/`;
    return NextResponse.redirect(url, 308);
  }
  /* 1️⃣ Block /feed URLs */
  if (/feed/i.test(fullPath)) {
    return new NextResponse(null, { status: 410 });
  }
  /* 2️⃣ Remove add-to-cart param */

  if (url.searchParams.has("add-to-cart")) {
    url.searchParams.delete("add-to-cart");
    return NextResponse.redirect(url, { status: 301 });
  }

  /* 3️⃣ SEO Middleware (LISTINGS ONLY) — set all requestHeaders BEFORE creating response */
  let robotsHeader = "index, follow";

  if (url.pathname.startsWith("/listings")) {
    const cacheKey = fullPath;

    /* 🔹 Cache hit */
    const cached = seoCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      robotsHeader = cached.robots;
    } else {
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
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const apiRes = await fetch(apiUrl, {
          headers: {
            "User-Agent": "next-middleware",
            ...(API_KEY && { "X-API-Key": API_KEY }),
          },
          signal: controller.signal,
          // @ts-ignore - Edge runtime specific
          next: { revalidate: 60 },
        });

        clearTimeout(timeoutId);

        if (apiRes.ok) {
          const data = await apiRes.json();
          const seo = data?.seo_v2 ?? data?.seo ?? {};

          const rawIndex = String(seo?.index ?? "").toLowerCase().trim();
          const rawFollow = String(seo?.follow ?? "").toLowerCase().trim();

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
      } catch (error: any) {
        /* ✅ AbortError is EXPECTED → ignore silently */
        if (error?.name !== "AbortError") {
          console.error("Middleware SEO error:", error);
        }
        // robotsHeader stays "index, follow"
      }
    }
  }

  /* 4️⃣ Create response AFTER all requestHeaders mutations are complete */
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (url.pathname.startsWith("/listings")) {
    response.headers.set("X-Robots-Tag", robotsHeader);
  }

  return response;
}

/* ──────────────────────────────────────────────
   Matcher
────────────────────────────────────────────── */
export const config = {
  matcher: [
    "/",
    "/listings/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
