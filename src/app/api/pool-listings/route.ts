
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  const url = `${API_BASE}/pool_test?${params}${params ? '&' : ''}engine=typesense`;

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
          console.log("[WP API pool_test] 410 body:", body);
          return NextResponse.json(body, { status: 410 });
        } catch {
          return NextResponse.json({ success: false }, { status: 410 });
        }
      }
      console.log(`[WP API pool_test] non-OK status: ${res.status}`);
      return NextResponse.json({ success: false }, { status: res.status });
    }

    const raw = await res.text();

    // Safe JSON-start detection: only strip a prefix if '{' is found
    // AND it isn't already at index 0.
    const jsonStart = raw.indexOf("{");
    const cleaned =
      jsonStart === -1
        ? raw
        : jsonStart === 0
        ? raw
        : raw.substring(jsonStart);

    let data;
    try {
      data = JSON.parse(cleaned);
    } catch (parseErr) {
      console.log("[WP API pool_test] JSON parse failed. Raw response:", raw.substring(0, 500));
      return NextResponse.json({ success: false, error: "invalid_json" }, { status: 502 });
    }

    console.log("[WP API pool_test] summary:", {
      success: data?.success,
      total_products: data?.pagination?.total_products,
      returned: data?.products?.length ?? data?.data?.products?.length,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("[WP API pool_test] Error:", err);
    const status = err?.name === "AbortError" ? 504 : 500;
    console.log(`[WP API pool_test] fetch error (${status}):`, err?.message);
    return NextResponse.json({ success: false }, { status });
  }
}