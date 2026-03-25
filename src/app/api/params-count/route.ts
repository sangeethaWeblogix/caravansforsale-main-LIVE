import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const url = `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 0 }, // no cache
  });

  const data = await response.json();
  
  return NextResponse.json(data);
}