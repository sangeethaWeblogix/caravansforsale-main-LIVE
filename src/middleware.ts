 import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  const fullPath = url.pathname + url.search;

  // 🚫 1️⃣ Return 410 for any URL containing "feed" (case-insensitive)
  if (/feed/i.test(fullPath)) {
    return new NextResponse(null, { status: 410 });
  }

  // 🔁 2️⃣ Remove "add-to-cart" query parameter if present
  if (url.searchParams.has("add-to-cart")) {
    url.searchParams.delete("add-to-cart");

    const cleanUrl =
      url.origin +
      url.pathname +
      (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "");

    return NextResponse.redirect(cleanUrl, { status: 301 });
  }

  // ✅ Continue normal processing
  return NextResponse.next();
}

// ✅ Apply globally (safe exclusions)
export const config = {
  matcher: [
    // Apply middleware to all routes except Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
