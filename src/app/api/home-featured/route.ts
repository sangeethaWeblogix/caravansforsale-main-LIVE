import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

// Map type param → WP endpoint + how to extract products from response
const ENDPOINT_MAP: Record<string, { path: string; extract: (d: any) => any[] }> = {
  all:      { path: "exclusive-list",        extract: (d) => d?.data?.products ?? [] },
  new:      { path: "new-list",              extract: (d) => d?.data?.products ?? [] },
  used:     { path: "featured-used-caravans", extract: (d) => d?.products ?? [] },
  featured: { path: "exclusive-list",        extract: (d) => d?.data?.products ?? [] },
};

// Normalize each product so components always get image_format as string[]
function normalizeProduct(p: any): any {
  if (!p.image_format) {
    const img = p.image ?? p.thumbnail ?? p.main_image ?? null;
    p.image_format = img ? [img] : [];
  } else if (typeof p.image_format === "string") {
    p.image_format = [p.image_format];
  }
  // ensure seller_type exists (used/private classification)
  if (!p.seller_type) p.seller_type = "dealer";
  return p;
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "all";
  const mapping = ENDPOINT_MAP[type] ?? ENDPOINT_MAP.all;
  const url = `${API_BASE}/${mapping.path}`;

  const visitorIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const t0 = Date.now();

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
        ...(visitorIp && { "X-Visitor-IP": visitorIp }),
      },
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    console.log(`[WP API] home-featured type=${type} → ${mapping.path} ip=${visitorIp || "(none)"} — ${Date.now() - t0}ms`);

    if (!res.ok) {
      return NextResponse.json({ success: false }, { status: res.status });
    }

    const raw = await res.text();
    const jsonStart = raw.indexOf('{');
    const json = JSON.parse(jsonStart > 0 ? raw.substring(jsonStart) : raw);

    const products = mapping.extract(json).map(normalizeProduct);

    return NextResponse.json(
      { success: true, products },
      { headers: { "X-Debug-Visitor-IP": visitorIp || "(none)" } }
    );
  } catch (err: any) {
    clearTimeout(timeoutId);
    const status = err?.name === "AbortError" ? 504 : 500;
    return NextResponse.json({ success: false }, { status });
  }
}
