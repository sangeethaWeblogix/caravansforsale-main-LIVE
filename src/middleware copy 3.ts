 import { NextRequest, NextResponse } from "next/server";
import { parseSlugToFilters } from "@/app/components/urlBuilder";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  /* =================================================
     0️⃣ Normalize trailing slash
     ================================================= */
  if (pathname === "/listings" || pathname === "/listings/") {
  return NextResponse.next();
}


  /* =================================================
     1️⃣ Country Blocking
     ================================================= */
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry");

  if (country && ["SG", "CN"].includes(country)) {
    return new NextResponse(
      "This website is not available in your region.",
      { status: 403 }
    );
  }

  /* =================================================
     2️⃣ Block /feed
     ================================================= */
  if (/\/feed/i.test(pathname)) {
    return new NextResponse(null, { status: 410 });
  }

  /* =================================================
     3️⃣ Remove add-to-cart
     ================================================= */
  if (url.searchParams.has("add-to-cart")) {
    url.searchParams.delete("add-to-cart");
    return NextResponse.redirect(url, 301);
  }

  /* =================================================
     4️⃣ ALWAYS allow root /listings
     ================================================= */
  if (pathname === "/listings") {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  /* =================================================
     5️⃣ SEO logic ONLY for listings sub routes
     ================================================= */
  if (pathname.startsWith("/listings/")) {
    try {
      const slugParts = pathname
        .replace("/listings/", "")
        .split("/")
        .filter(Boolean);

      // SAFETY: if slug empty, skip SEO fetch
      if (slugParts.length === 0) {
        response.headers.set("X-Robots-Tag", "index, follow");
        return response;
      }

      const filters = parseSlugToFilters(
        slugParts,
        Object.fromEntries(url.searchParams)
      );

      const apiUrl =
        "https://www.admin.caravansforsale.com.au/wp-json/cfs/v1/new_optimize_code?" +
        new URLSearchParams(filters as Record<string, string>).toString();

      const apiRes = await fetch(apiUrl, {
        headers: { "User-Agent": "next-middleware" },
      });

      if (apiRes.ok) {
        const data = await apiRes.json();

        const index =
          String(data?.seo?.index).toLowerCase() === "noindex"
            ? "noindex"
            : "index";

        const follow =
          String(data?.seo?.follow).toLowerCase() === "nofollow"
            ? "nofollow"
            : "follow";

        response.headers.set("X-Robots-Tag", `${index}, ${follow}`);
      } else {
        response.headers.set("X-Robots-Tag", "index, follow");
      }
    } catch {
      response.headers.set("X-Robots-Tag", "index, follow");
    }
  }

  return response;
}

export const config = {
  matcher: ["/listings/:path*"],
};
