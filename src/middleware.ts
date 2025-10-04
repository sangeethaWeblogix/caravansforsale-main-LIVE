import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  if (url.searchParams.has("add-to-cart")) {
    url.searchParams.delete("add-to-cart");

    const cleanUrl =
      url.origin +
      url.pathname +
      (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "");

    return NextResponse.redirect(cleanUrl, { status: 301 });
  }

  return NextResponse.next();
}

// ✅ Only match /listings/* routes
export const config = {
  matcher: ["/listings/:path*"],
};
