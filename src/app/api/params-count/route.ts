import { NextRequest, NextResponse } from "next/server";
const API_KEY = process.env.CFS_API_KEY; 
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const url = `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${searchParams.toString()}`;
  
const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(API_KEY && { "X-API-Key": API_KEY }),
    },
    next: { revalidate: 60 },
  });

  const data = await response.json();
  
  return NextResponse.json(data);
}