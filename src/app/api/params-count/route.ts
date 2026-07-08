import { NextRequest, NextResponse } from "next/server";

const API_KEY         = process.env.CFS_API_KEY;
const CF_ACCOUNT_ID   = process.env.CF_ACCOUNT_ID;
const CF_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN    = process.env.CF_API_TOKEN;

/**
 * Build the KV lookup key from incoming search params.
 * MUST match cfs_params_warmer_build_kv_key() in cfs-params-cache-warmer.php exactly:
 *   - Sort all params alphabetically by key
 *   - Lowercase the `condition` value (warmer generates data with "New"/"Used"
 *     but stores the key lowercase to match the frontend's "new"/"used")
 *   - encodeURIComponent both key and value (= PHP rawurlencode)
 *   - Join with &, prefix with "params-count:"
 */
function buildParamsKvKey(searchParams: URLSearchParams): string {
  const entries = [...searchParams.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  const parts = entries.map(([k, v]) => {
    // `condition` is stored lowercase in KV by the warmer's key builder, but the
    // frontend may send any case ("new"/"New"). Canonicalise so keys always match.
    const value = k === "condition" ? v.toLowerCase() : v;
    return `${encodeURIComponent(k)}=${encodeURIComponent(value)}`;
  });
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

    if (res.ok) return await res.json();

    // Distinguish a real cache miss from a broken KV layer so failures are
    // visible instead of silently degrading every request to the slow WP path.
    if (res.status === 401 || res.status === 403) {
      // Bad/expired CF_API_TOKEN (or wrong account/namespace) → KV is entirely
      // unreachable; the cache does nothing until this is fixed.
      console.error(
        `[params-count] Cloudflare KV auth failed (HTTP ${res.status}). ` +
          `Check CF_API_TOKEN / CF_ACCOUNT_ID / CF_KV_NAMESPACE_ID — every ` +
          `request is falling back to the live WP API.`
      );
    } else if (res.status !== 404) {
      // 404 = key simply not warmed for this combo → expected, stay quiet.
      console.warn(
        `[params-count] Cloudflare KV read returned HTTP ${res.status} for key "${kvKey}".`
      );
    }
    return null;
  } catch (err) {
    console.warn(`[params-count] Cloudflare KV read error for key "${kvKey}":`, err);
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
      // 401/403 here almost always means a bad CFS_API_KEY (e.g. an unescaped
      // "$" mangled by the host's env parsing). Surface it — otherwise the
      // client just receives an empty {} and every filter list renders blank.
      console.error(
        `[params-count] WP API returned HTTP ${response.status} for ` +
          `"${searchParams.toString()}". Check CFS_API_KEY.`
      );
      return NextResponse.json({}, { status: response.status });
    }
    const raw = await response.text();
    const idx = raw.indexOf('{"');
    try {
      const data = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
      return NextResponse.json(data, { headers: { "X-Params-Cache": "MISS" } });
    } catch {
      console.error("[params-count] WP API returned unparseable body.");
      return NextResponse.json({});
    }
  } catch (err) {
    console.error("[params-count] WP API request failed:", err);
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
