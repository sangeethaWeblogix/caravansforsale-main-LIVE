 import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const fullPath = url.pathname + url.search;

  /* ================================
     1️⃣ Country Blocking (SG, CN)
     ================================ */
  const country = request.geo?.country;
  const blockedCountries = ["SG", "CN"]; // Singapore, China

  if (country && blockedCountries.includes(country)) {
    return new NextResponse(
      "This website is not available in your region.",
      { status: 403 }
    );
  }

  /* ================================
     2️⃣ Block /feed URLs (SEO safe)
     ================================ */
  if (/feed/i.test(fullPath)) {
    return new NextResponse(null, { status: 410 });
  }

  /* ================================
     3️⃣ Remove add-to-cart param
     ================================ */
  if (url.searchParams.has("add-to-cart")) {
    url.searchParams.delete("add-to-cart");

    const cleanUrl =
      url.origin +
      url.pathname +
      (url.searchParams.toString()
        ? `?${url.searchParams.toString()}`
        : "");

    return NextResponse.redirect(cleanUrl, { status: 301 });
  }

  /* ================================
     4️⃣ Continue normal request
     ================================ */
  return NextResponse.next();
}

/* ================================
   5️⃣ Apply middleware globally
   ================================ */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
