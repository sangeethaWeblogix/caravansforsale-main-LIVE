 import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const fullPath = url.pathname + url.search;

  /* ================================
     1️⃣ Country Blocking (SG, CN)
     ================================ */
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry");

  const blockedCountries = ["SG", "CN"];

  if (country && blockedCountries.includes(country)) {
    return new NextResponse(
      "This website is not available in your region.",
      { status: 403 }
    );
  }

  /* ================================
     2️⃣ Block /feed URLs
     ================================ */
  if (/feed/i.test(fullPath)) {
    return new NextResponse(null, { status: 410 });
  }

  /* ================================
     3️⃣ Remove add-to-cart param
     ================================ */
  if (url.searchParams.has("add-to-cart")) {
    url.searchParams.delete("add-to-cart");
    return NextResponse.redirect(url, { status: 301 });
  }

  /* ================================
     4️⃣ SEO: X-Robots-Tag (Listing pages)
     ================================ */
  const response = NextResponse.next();

  if (url.pathname.startsWith("/listings")) {
    // 🔹 DEFAULT listing behaviour
    let robotsValue = "index, follow";

    // 🔹 Example: filter / tracking params
    if (
      url.searchParams.has("clickid") ||
      url.searchParams.has("utm_source") ||
      url.searchParams.has("page")
    ) {
      robotsValue = "noindex, follow";
    }

    response.headers.set("X-Robots-Tag", robotsValue);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
