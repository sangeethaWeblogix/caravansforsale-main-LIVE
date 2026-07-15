
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

const BASE_PARAM_KEYS = new Set(["per_page", "orderby", "seed", "page"]);

async function fetchPoolTest(url: string, signal: AbortSignal) {
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; CFS-SSR/1.0; +https://www.caravansforsale.com.au)",
      ...(API_KEY && { "X-API-Key": API_KEY }),
    },
    cache: "no-store",
  });

  const raw = await res.text();
  const jsonStart = raw.indexOf("{");
  const cleaned =
    jsonStart === -1 ? raw : jsonStart === 0 ? raw : raw.substring(jsonStart);

  let data: any;
  try {
    data = JSON.parse(cleaned);
  } catch {
    data = null;
  }

  return { res, data, raw };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params = searchParams.toString();

  // The WP Typesense engine drops `premium_products`/`exclusive_products`
  // from the response specifically when the query has no filters beyond
  // the base pagination/ordering params (i.e. the default /listings/ view).
  // Only route through Typesense once a real filter is applied.
  const hasRealFilter = [...searchParams.keys()].some((key) => !BASE_PARAM_KEYS.has(key));
  const url = `${API_BASE}/pool_test?${params}${hasRealFilter ? `${params ? "&" : ""}engine=typesense` : ""}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const t0 = Date.now();

  try {
    const { res, data, raw } = await fetchPoolTest(url, controller.signal);

    clearTimeout(timeoutId);
    console.log(`[WP API pool_test] ${Date.now() - t0}ms | ${params.substring(0, 80)}`);

    if (!res.ok) {
      if (res.status === 410) {
        try {
          const body = data ?? JSON.parse(raw);
          console.log("[WP API pool_test] 410 body:", body);
          return NextResponse.json(body, { status: 410 });
        } catch {
          return NextResponse.json({ success: false }, { status: 410 });
        }
      }
      console.log(`[WP API pool_test] non-OK status: ${res.status}`);
      return NextResponse.json({ success: false }, { status: res.status });
    }

    if (!data) {
      console.log("[WP API pool_test] JSON parse failed. Raw response:", raw.substring(0, 500));
      return NextResponse.json({ success: false, error: "invalid_json" }, { status: 502 