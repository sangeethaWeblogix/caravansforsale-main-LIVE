/**
 * Shared Cloudflare KV utility for params-count lookups.
 *
 * Used by both:
 *  - src/app/api/params-count/route.ts  (client-side requests via browser)
 *  - src/api/productList/api.ts          (server-side SSR/ISR fetches)
 *
 * Key format MUST match cfs_params_warmer_build_kv_key() in
 * cfs-params-cache-warmer.php exactly:
 *   - Sort all params alphabetically by key
 *   - Lowercase the `condition` value
 *   - encodeURIComponent both key and value (= PHP rawurlencode)
 *   - Join with &, prefix with "params-count:"
 */

const CF_ACCOUNT_ID   = process.env.CF_ACCOUNT_ID;
const CF_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN    = process.env.CF_API_TOKEN;

export interface ParamsCountKvResult {
  success?: boolean;
  data: unknown[];
  total?: number;
  total_products?: number;
}

/** Build the canonical KV key for a params-count query. */
export function buildParamsKvKey(params: Record<string, string>): string {
  const entries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const parts = entries.map(([k, v]) => {
    const value = k === "condition" ? v.toLowerCase() : v;
    return `${encodeURIComponent(k)}=${encodeURIComponent(value)}`;
  });
  return `params-count:${parts.join("&")}`;
}

/**
 * Fetch a pre-warmed params-count result from Cloudflare KV.
 *
 * Returns the full parsed KV object on hit ({data, total, …}),
 * or null on a cache miss / credential error.
 *
 * Callers:
 *  - route.ts  → return the object directly as JSON to the browser
 *  - api.ts    → extract `.data` for SSR rendering
 */
export async function fetchParamsCountFromKV(
  params: Record<string, string>
): Promise<ParamsCountKvResult | null> {
  if (!CF_ACCOUNT_ID || !CF_NAMESPACE_ID || !CF_API_TOKEN) return null;

  const kvKey = buildParamsKvKey(params);
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}` +
    `/storage/kv/namespaces/${CF_NAMESPACE_ID}/values/${encodeURIComponent(kvKey)}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
      // Edge-cache the KV read for 5 min — the warmer only updates daily.
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const json = (await res.json()) as ParamsCountKvResult;
      // KV value must have a `data` array; guard against corrupted entries.
      if (Array.isArray(json?.data)) return json;
      return null;
    }

    if (res.status === 401 || res.status === 403) {
      console.error(
        `[paramsCountKv] Cloudflare KV auth failed (HTTP ${res.status}). ` +
          `Check CF_API_TOKEN / CF_ACCOUNT_ID / CF_KV_NAMESPACE_ID.`
      );
    }
    // 404 = key not yet warmed for this combo — silent, expected.
    return null;
  } catch (err) {
    console.warn(`[paramsCountKv] KV fetch error for key "${kvKey}":`, err);
    return null;
  }
}
