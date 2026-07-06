import { NextRequest, NextResponse } from "next/server";

const API_KEY         = process.env.CFS_API_KEY;
const CF_ACCOUNT_ID   = process.env.CF_ACCOUNT_ID;
const CF_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN    = process.env.CF_API_TOKEN;

/**
 * Build the KV lookup key from incoming search params.
 * MUST match cfs_params_warmer_build_kv_key() in cfs-params-cache-warmer.php exactly:
 *   - Sort all params alphabetically by key
 *   - encodeURIComponent both key and value (= PHP rawurlencode)
 *   - Join with &, prefix with "params-count:"
 */
function buildParamsKvKey(searchParams: URLSearchParams): string {
  const entries = [...searchParams.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  const parts = entries.map(
    ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
  );
  return `params-count:${parts.join("&")}`;
}

/**
 * Try fetching pre-warmed data from Cloudflare KV.
 * Returns parsed JSON on hit, null on miss or if CF credentials are absent.
 */
async function fetchFromKV(kvKey: string): Promise<unknown | null> {
  if (!CF_ACCOUNT_ID || !CF_NAMESPACE_ID || !CF_API_TOKEN) return null;

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_NAMESPACE_ID}/values/${encodeURIComponent(kvKey)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
      // Edge-cache the KV response for 5 min so repeated identical requests
      // don't re-hit the CF API — the KV value itself changes only once daily.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null; // 404 = key not in KV (dynamic combo) → fall through
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fall back to the live WP API when KV has no entry (dynamic filter combos
 * created by users stacking multiple filters not covered by the daily warm).
 */
async function fetchFromWP(searchParams: URLSearchParams): Promise<NextResponse> {
  const url = `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${searchParams.toString()}`;
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
    });
    if (!response.ok) {
      return NextResponse.json({}, { status: response.status });
    }
    const raw = await response.text();
    const idx = raw.indexOf('{"');
    try {
      const data = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
      return NextResponse.json(data, { headers: { "X-Params-Cache": "MISS" } });
    } catch {
      return NextResponse.json({});
    }
  } catch {
    return NextResponse.json({}, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // 1. Check Cloudflare KV for a pre-warmed response
  const kvKey  = buildParamsKvKey(searchParams);
  const kvData = await fetchFromKV(kvKey);

  if (kvData !== null) {
    return NextResponse.json(kvData, {
      headers: { "X-Params-Cache": "HIT" },
    });
  }

  // 2. KV miss — call the live WP API (dynamic combos not covered by daily warm)
  return fetchFromWP(searchParams);
}
