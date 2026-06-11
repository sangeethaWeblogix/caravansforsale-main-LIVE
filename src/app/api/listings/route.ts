import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  const url = `${API_BASE}/new_optimize_code?${params}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Cache-Control": "no-cache",
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
