import { NextRequest, NextResponse } from "next/server";
import { fetchParamsCountFromKV, buildParamsKvKey } from "@/lib/paramsCountKv";

const API_KEY = process.env.CFS_API_KEY;

/**
 * Fall back to the live WP API when KV has no entry (dynamic filter combos
 * created by users stacking multiple filters not covered by the daily warm).
 */
async function fetchFromWP(
  searchParams: URLSearchParams,
  kvKey: string
): Promise<NextResponse> {
  const paramsStr = searchParams.toString();
  const url = `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${paramsStr}`;

  console.log(`[params-count] KV MISS — falling back to WP | params="${paramsStr}" | kv_key="${kvKey}"`);

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "CaravansForsale-NextJS/1.0 (internal API)",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
    });

    if (!response.ok) {
      console.error(
        `[params-count] WP API HTTP ${response.status} | params="${paramsStr}" | kv_key="${kvKey}" | Check CFS_API_KEY.`
      );
      return NextResponse.json({}, { status: response.status });
    }

    const raw = await response.text();

    // Detect SiteGround / Cloudflare bot challenge
    if (raw.includes("sgcaptcha") || raw.trimStart().startsWith("<html")) {
      console.error(
        `[params-count] BOT CHALLENGE blocked request | params="${paramsStr}" | kv_key="${kvKey}" | Fix: whitelist server IP in SiteGround.`
      );
      return NextResponse.json({}, { status: 503 });
    }

    const idx = raw.indexOf('{"');
    try {
      const data = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
      console.log(`[params-count] WP API OK | params="${paramsStr}" | kv_key="${kvKey}"`);
      return NextResponse.json(data, { headers: { "X-Params-Cache": "MISS" } });
    } catch {
      console.error(
        `[params-count] WP API unparseable body | params="${paramsStr}" | kv_key="${kvKey}" | body_preview="${raw.slice(0, 200)}"`
      );
      return NextResponse.json({});
    }
  } catch (err) {
    console.error(
      `[params-count] WP API fetch failed | params="${paramsStr}" | kv_key="${kvKey}" | error="${(err as Error).message}"`
    );
    return NextResponse.json({}, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Convert URLSearchParams to a plain object for the shared KV utility
  const paramsObj: Record<string, string> = {};
  searchParams.forEach((v, k) => { paramsObj[k] = v; });

  // 1. Check Cloudflare KV for a pre-warmed response (shared with SSR path)
  const kvResult = await fetchParamsCountFromKV(paramsObj);
  if (kvResult !== null) {
    return NextResponse.json(kvResult, {
      headers: { "X-Params-Cache": "HIT" },
    });
  }

  // 2. KV miss — call the live WP API (dynamic combos not covered by daily warm)
  const kvKey = buildParamsKvKey(paramsObj);
  return fetchFromWP(searchParams, kvKey);
}
