import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  if (url.searchParams.has("add-to-cart")) {
    url.searchParams.delete("add-to-cart");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
