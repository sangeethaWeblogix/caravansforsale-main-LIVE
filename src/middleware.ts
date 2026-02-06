 import { NextRequest, NextResponse } from "next/server";
import { parseSlugToFilters } from "@/app/components/urlBuilder";

/* ──────────────────────────────────────────────
   Edge-safe in-memory cache
────────────────────────────────────────────── */
const seoCache = new Map<string, { robots: string; expires: number }>();

const CACHE_TTL = 60 * 1000; // 1 minute

/* ──────────────────────────────────────────────
   Bot Detection for Static HTML Serving
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

// Routes mapping - generateStaticPages.js-ல இருக்கிற FOLLOW_PAGES-க்கு match ஆகணும்
const STATIC_ROUTES_MAPPING: Record<string, string> = {
  '/': 'homepage',
   
};

function isBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

async function getStaticHtmlFromKV(pathname: string): Promise<string | null> {
  const kvKey = STATIC_ROUTES_MAPPING[pathname];
  
  if (!kvKey) {
    return null;
  }

  try {
    const kvResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE_ID}/values/${kvKey}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
        },
        // @ts-ignore - Edge runtime specific
        next: { revalidate: 3600 }
      }
    );

    if (kvResponse.ok) {
      return await kvResponse.text();
    }
  } catch (error) {
    console.error('KV fetch error:', error);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const fullPath = url.pathname + url.search;
  const userAgent = request.headers.get('user-agent') || '';

  /* 🤖 STEP 1: Check for Bot & Serve Static HTML */
  if (isBot(userAgent)) {
    console.log(`🤖 Bot detected: ${userAgent.substring(0, 50)}...`);
    console.log(`📍 Checking static version for: ${url.pathname}`);
    
    const staticHtml = await getStaticHtmlFromKV(url.pathname);
    
    if (staticHtml) {
      console.log(`✅ Serving static HTML from KV for: ${url.pathname}`);
      
      return new NextResponse(staticHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          'X-Served-From': 'KV-Static',
          'X-Robot-Friendly': 'true',
          'X-Robots-Tag': 'index, follow',
        },
      });
    } else {
      console.log(`⚠️ No static version found, falling back to Next.js`);
    }
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

  /* 3️⃣ Default response */
  const response = NextResponse.next();

  /* 4️⃣ SEO Middleware (LISTINGS ONLY) */
  if (url.pathname.startsWith("/listings")) {
    const cacheKey = fullPath;

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
        // @ts-ignore - Edge runtime specific
        next: { revalidate: 60 },
      });

      clearTimeout(timeoutId);

      let robotsHeader = "index, follow";

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
    "/",
    "/listings/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};