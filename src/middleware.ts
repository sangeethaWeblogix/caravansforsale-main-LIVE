import { NextRequest, NextResponse } from "next/server";
import { parseSlugToFilters } from "@/app/components/urlBuilder";
import { buildSlugFromFilters } from "@/app/components/slugBuilter";
const API_KEY = process.env.CFS_API_KEY;

/* ──────────────────────────────────────────────
   Edge-safe in-memory cache
────────────────────────────────────────────── */
const seoCache = new Map<string, { robots: string; isEmpty: boolean; expires: number }>();
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

/* Helper: redirect to /404 */
function gone404(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/404', request.url), { status: 302 });
}

/* Helper: rewrite to /410 page with HTTP 410 status + noindex header (valid URL, 0 products) */
function gone410(request: NextRequest): NextResponse {
  const res = NextResponse.rewrite(new URL('/410', request.url), { status: 410 });
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const fullPath = url.pathname + url.search;
  const userAgent = request.headers.get('user-agent') || '';

  // Forward pathname to server components (for per-slug metadata injection in root layout)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', url.pathname);

  /* 🚫 Listings: forbidden segments, unknown params, OR wrong URL order → 410 */
  if (url.pathname.startsWith('/listings')) {
    const segments = url.pathname.split('/').filter(Boolean);
    const hasForbiddenSegment = segments.some(s => /(page|feed)/i.test(s));

    const ALLOWED_PARAMS = new Set(['clickid', 'orderby', 'search', 'keyword', 'radius_kms']);
    const hasUnknownParam = Array.from(url.searchParams.keys()).some(k => !ALLOWED_PARAMS.has(k.toLowerCase()));
    const hasForbiddenValue = Array.from(url.searchParams.values()).some(v => /(page|feed)/i.test(v));

    if (hasForbiddenSegment || hasUnknownParam || hasForbiddenValue) {
      return gone404(request);
    }

    // Wrong URL order → 410 (URL unchanged, no redirect)
    const slugParts = url.pathname.replace('/listings', '').split('/').filter(Boolean);
    if (slugParts.length > 0) {
      try {
        const filters = parseSlugToFilters(slugParts, Object.fromEntries(url.searchParams));
        const canonicalPath = buildSlugFromFilters(filters);
        const incomingPath = `/listings/${slugParts.join('/')}`;
        const norm = (p: string) => p.replace(/\/$/, '').toLowerCase();
        if (norm(canonicalPath) !== norm(incomingPath)) {
          return gone404(request);
        }
      } catch {
        // parse error → let page component handle it
      }
    }
  }

  /* 🤖 Bot Detection — listing pages not early-returned so bots also get 0-product check */
  if (isBot(userAgent) && !url.pathname.startsWith('/listings')) {
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

  /* 3️⃣ SEO Middleware (LISTINGS ONLY) */
  let robotsHeader = "index, follow";

  if (url.pathname.startsWith("/listings")) {
    const cacheKey = fullPath;

    /* 🔹 Cache hit */
    const cached = seoCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      if (cached.isEmpty) {
        return gone410(request);
      }
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

          // 0 products → 410 (URL unchanged)
          const products = data?.data?.products ?? [];
          if (products.length === 0) {
            seoCache.set(cacheKey, { robots: "noindex, nofollow", isEmpty: true, expires: Date.now() + CACHE_TTL });
            return gone410(request);
          }

          const seo = data?.seo_v2 ?? data?.seo ?? {};
          const rawIndex = String(seo?.index ?? "").toLowerCase().trim();
          const rawFollow = String(seo?.follow ?? "").toLowerCase().trim();

          robotsHeader =
            (rawIndex === "noindex" ? "noindex" : "index") +
            ", " +
            (rawFollow === "nofollow" ? "nofollow" : "follow");
        }

        seoCache.set(cacheKey, {
          robots: robotsHeader,
          isEmpty: false,
          expires: Date.now() + CACHE_TTL,
        });
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Middleware SEO error:", error);
        }
      }
    }
  }

  /* 4️⃣ Create response */
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (url.pathname.startsWith("/listings")) {
    response.headers.set("X-Robots-Tag", robotsHeader);
  }

  if (isBot(userAgent)) {
    response.headers.set('X-Is-Bot', 'true');
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
