import { NextRequest, NextResponse } from "next/server";
const API_KEY = process.env.CFS_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NextResponse.json({}, { status: response.status });
    }

    const raw = await response.text();
    const idx = raw.indexOf('{"');
    try {
      const data = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({});
    }
  } catch {
    return NextResponse.json({}, { status: 502 });
  }
}