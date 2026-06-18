import { NextRequest, NextResponse } from "next/server";
import { parseSlugToFilters, type Filters } from "@/app/components/urlBuilder";
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

/* Helper: rewrite to /410/ page (trailing slash avoids the 308 redirect loop on Vercel) */
function gone410(request: NextRequest): NextResponse {
  const res = NextResponse.rewrite(new URL('/410/', request.url), { status: 410 });
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

/* Helper: render the listing page itself with HTTP 410 — used when 0 regular products exist
   (listing page handles exclusive-products check and renders content if any are found) */
function render410(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  const newHeaders = new Headers(request.headers);
  newHeaders.set('x-skip-middleware', '1');
  newHeaders.set('x-pathname', url.pathname);
  const res = NextResponse.rewrite(url, { status: 410, request: { headers: newHeaders } });
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}


/** Convert parsed Filters to API query params (mirrors the logic in api/listings/api.ts). */
function buildApiParams(filters: Filters): URLSearchParams {
  const p = new URLSearchParams();
  p.set('page', '1');
  if (filters.category) p.set('category', filters.category);
  if (filters.make) p.set('make', filters.make);
  if (filters.model) p.set('model', filters.model);
  if (filters.state) p.set('state', filters.state);
  if (filters.region) p.set('region', filters.region);
  if (filters.suburb) p.set('suburb', filters.suburb);
  if (filters.pincode) p.set('pincode', filters.pincode);
  if (filters.from_price) p.set('from_price', `${filters.from_price}`);
  if (filters.to_price) p.set('to_price', `${filters.to_price}`);
  if (filters.minKg) p.set('from_atm', `${filters.minKg}`);
  if (filters.maxKg) p.set('to_atm', `${filters.maxKg}`);
  if (filters.from_length) p.set('from_length', `${filters.from_length}`);
  if (filters.to_length) p.set('to_length', `${filters.to_length}`);
  if (filters.condition) p.set('condition', filters.condition.toLowerCase().replace(/\s+/g, '-'));
  if (filters.sleeps) p.set('sleep', `${filters.sleeps}`);
  if (filters.from_sleep) p.set('from_sleep', `${filters.from_sleep}`);
  if (filters.to_sleep) p.set('to_sleep', `${filters.to_sleep}`);
  if (filters.acustom_fromyears) p.set('acustom_fromyears', `${filters.acustom_fromyears}`);
  if (filters.acustom_toyears) p.set('acustom_toyears', `${filters.acustom_toyears}`);
  return p;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const fullPath = url.pathname + url.search;
  const userAgent = request.headers.get('user-agent') || '';

  // Second pass from render410() — listing page renders its own exclusive-products check
  if (request.headers.get('x-skip-middleware') === '1') {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  // Forward pathname to server components (for per-slug metadata injection in root layout)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', url.pathname);

  /* 🚫 Block /page/N/ path segments OR ?page= query param → HTTP 410 Gone (no redirect) */
  if (
    (/\/page\/\d+/i.test(url.pathname) && !url.pathname.startsWith('/blog/')) ||
    (url.searchParams.has('page') && !url.pathname.startsWith('/api'))
  ) {
    return render410(request);
  }

  /* 🚫 Listings: forbidden segments, unknown params, OR wrong URL order → 410 */
  if (url.pathname.startsWith('/listings')) {
    const segments = url.pathname.split('/').filter(Boolean);
    const hasForbiddenSegment = segments.some(s => /(page|feed)/i.test(s));

    const ALLOWED_PARAMS = new Set(['clickid', 'orderby', 'search', 'keyword', 'radius_kms']);
    const hasUnknownParam = Array.from(url.searchParams.keys()).some(k => !ALLOWED_PARAMS.has(k.toLowerCase()));
    const hasForbiddenValue = Array.from(url.searchParams.values()).some(v => /(page|feed)/i.test(v));

    if (hasForbiddenSegment) {
      return gone404(request);
    }
    if (hasUnknownParam || hasForbiddenValue) {
      return render410(request);
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
        return render410(request);
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

        // Build API params using the same mapping as fetchListings (api/listings/api.ts).
        // Raw filter keys (minKg, maxKg, sleeps) must be converted to API names (from_atm, to_atm, sleep).
        const apiParams = buildApiParams(filters);
        const apiUrl =
          "https://admin.caravansforsale.com.au/wp-json/cfs/v1/new_optimize_code?" +
          apiParams.toString();

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

          // 0 regular products → 410 (regardless of exclusive products)
          const products = data?.data?.products ?? [];
          if (products.length === 0) {
            seoCache.set(cacheKey, { robots: "noindex, nofollow", isEmpty: true, expires: Date.now() + CACHE_TTL });
            return render410(request);
          }

          const seo = data?.seo_v2 ?? data?.seo ?? {};
          const rawIndex = String(seo?.index ?? "").toLowerCase().trim();
          const rawFollow = String(seo?.follow ?? "").toLowerCase().trim();

          robotsHeader =
            (rawIndex === "noindex" ? "noindex" : "index") +
            ", " +
            (rawFollow === "nofollow" ? "nofollow" : "follow");

          // Band-only pages (range filter with no other filters) → always noindex.
          // Mirrors the meta.ts rule: all band pages are noindex.
          const hasBand = !!(filters.maxKg || filters.minKg || filters.to_price || filters.from_price ||
            filters.to_length || filters.from_length || filters.to_sleep || filters.from_sleep);
          if (hasBand) {
            robotsHeader = "noindex, nofollow";
          }

          seoCache.set(cacheKey, {
            robots: robotsHeader,
            isEmpty: false,
            expires: Date.now() + CACHE_TTL,
          });
        } else if (apiRes.status === 410) {
          // WordPress returns 410 for 0 products — let listing page handle exclusive-products check
          seoCache.set(cacheKey, { robots: "noindex, nofollow", isEmpty: true, expires: Date.now() + CACHE_TTL });
          return render410(request);
        }
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
