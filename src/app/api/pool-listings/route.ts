import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  const url = `${API_BASE}/pool_test?${params}`;

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
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    console.log(`[WP API pool_test] ${Date.now() - t0}ms | ${params.substring(0, 80)}`);

    if (!res.ok) {
      if (res.status === 410) {
        try {
          const body = await res.json();
          console.log("[WP API pool_test] 410 body:", body);
          return NextResponse.json(body, { status: 410 });
        } catch {
          return NextResponse.json({ success: false }, { status: 410 });
        }
      }
      return NextResponse.json({ success: false }, { status: res.status });
    }

    const raw = await res.text();

    // fetch பண்ணின உடனே raw response-ஐ முதலில் log பண்றோம்
    console.log("[WP API pool_test] RAW response:", raw);

    const jsonStart = raw.indexOf('{');
    const data = JSON.parse(jsonStart > 0 ? raw.substring(jsonStart) : raw);

    // parse பண்ணின data-வையும் log பண்றோம்
    console.log("[WP API pool_test] Parsed data:", JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("[WP API pool_test] Error:", err);
    const status = err?.name === "AbortError" ? 504 : 500;
    return NextResponse.json({ success: false }, { status });
  }
}