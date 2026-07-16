
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

// engine=typesense is only appended when a "real filter" (beyond these base keys)
// is present. Typesense handles text/keyword search (make, model, search) but does
// NOT support range filters (sleep, atm, length, price, year) or location filters
// (state, region, suburb, pincode) — those return products:[] from typesense.
// Keep all non-text filters in this set so typesense is only triggered for
// make/model/search queries.
const BASE_PARAM_KEYS = new Set([
  "per_page", "orderby", "seed", "page",
  // Structured/range filters — WP native engine handles these correctly:
  "state", "category", "region", "condition",
  "from_sleep", "to_sleep",
  "from_atm", "to_atm",
  "from_length", "to_length",
  "from_price", "to_price",
  "acustom_fromyears", "acustom_toyears",
  "suburb", "pincode",
]);

async function fetchPoolTest(url: string, signal: AbortSignal) {
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
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
      return NextResponse.json({ success: false, error: "invalid_json" }, { status: 502 });
    }

    if (hasRealFilter) {
      const premiumParams = new URLSearchParams();
      searchParams.forEach((value, key) => {
        if (BASE_PARAM_KEYS.has(key)) premiumParams.set(key, value);
      });
      if (!premiumParams.has("per_page")) premiumParams.set("per_page", "1");

      const premiumUrl = `${API_BASE}/pool_test?${premiumParams.toString()}`;
      const premiumController = new AbortController();
      const premiumTimeout = setTimeout(() => premiumController.abort(), 15000);

      try {
        const { res: pRes, data: pData } = await fetchPoolTest(premiumUrl, premiumController.signal);
        clearTimeout(premiumTimeout);

        if (pRes.ok && pData) {
          const premium = pData?.premium_products ?? pData?.data?.premium_products;
          const exclusive = pData?.exclusive_products ?? pData?.data?.exclusive_products;
          const empExclusive = pData?.emp_exclusive_products ?? pData?.data?.emp_exclusive_products;

          if (data?.data) {
            data.data.premium_products = premium ?? data.data.premium_products;
            data.data.exclusive_products = exclusive ?? data.data.exclusive_products;
            data.data.emp_exclusive_products = empExclusive ?? data.data.emp_exclusive_products;
          } else {
            data.premium_products = premium ?? data.premium_products;
            data.exclusive_products = exclusive ?? data.exclusive_products;
            data.emp_exclusive_products = empExclusive ?? data.emp_exclusive_products;
          }

          console.log("[WP API pool_test] merged premium/exclusive from base engine:", {
            page: premiumParams.get("page"),
            premium_count: premium?.length ?? 0,
            exclusive_count: exclusive?.length ?? 0,
            emp_exclusive_count: empExclusive?.length ?? 0,
          });
        } else {
          console.log("[WP API pool_test] premium/exclusive merge fetch failed, status:", pRes.status);
        }
      } catch (mergeErr: any) {
        clearTimeout(premiumTimeout);
        console.log("[WP API pool_test] premium/exclusive merge fetch error:", mergeErr?.message);
      }
    }

    console.log("[WP API pool_test] summary:", {
      params: params.substring(0, 200),
      success: data?.success,
      total_products: data?.pagination?.total_products,
      pool_size: data?.pagination?.pool_size,
      products_returned: data?.products?.length ?? data?.data?.products?.length ?? 0,
      premium_products: data?.premium_products?.length ?? data?.data?.premium_products?.length ?? 0,
      exclusive_products: data?.exclusive_products?.length ?? data?.data?.exclusive_products?.length ?? 0,
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
