// src/app/categories-sitemap.xml/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(
    "https://admin.caravansforsale.com.au/wp-json/cfs/v1/params-product-list"
  );
  const json = await res.json();

  console.log("Fetched categories JSON:", json); // 👈 this shows in your terminal, not browser

  return new NextResponse("ok");
}
