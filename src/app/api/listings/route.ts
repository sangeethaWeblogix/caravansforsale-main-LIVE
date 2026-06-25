import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  const url = `${API_BASE}/new_optimize_code?${params}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const t0 = Date.now();

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      next: { revalidate: 3600 }, // Cache in Next.js data cache for 1 hr (shared across all users)
    });

    clearTimeout(timeoutId);
    console.log(`[WP API] ${Date.now() - t0}ms | ${params.substring(0, 80)}`);

    if (!res.ok) {
      // For 410, forward the full body (contains emp_exclusive_products for 0-product pages)
      if (res.status === 410) {
        try {
          const body = await res.json();
          return NextResponse.json(body, { status: 410 });
        } catch {
          return NextResponse.json({ success: false }, { status: 410 });
        }
      }
      return NextResponse.json({ success: false }, { status: res.status });
    }

    const raw = await res.text();
    const jsonStart = raw.indexOf('{');
    const data = JSON.parse(jsonStart > 0 ? raw.substring(jsonStart) : raw);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const status = err?.name === "AbortError" ? 504 : 500;
    return NextResponse.json({ success: false }, { status });
  }
}
