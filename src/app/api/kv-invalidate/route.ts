import { NextRequest, NextResponse } from "next/server";

// Called by Vercel deployment webhook when a new production deploy succeeds.
// Clears CF KV routes-mapping so the Worker bypasses stale KV HTML and falls
// through to Vercel ISR (fresh HTML, no hydration errors).
// Post-deploy warmup then regenerates fresh KV HTML and restores routes-mapping.
//
// Vercel Webhook setup:
//   Dashboard → Project → Settings → Webhooks
//   URL: https://www.caravansforsale.com.au/api/kv-invalidate?secret=cfs-revalidate-2026
//   Events: deployment.succeeded

const CF_API = "https://api.cloudflare.com/client/v4";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.REVALIDATION_SECRET || secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const accountId = process.env.CF_ACCOUNT_ID?.trim();
  const namespaceId = process.env.CF_KV_NAMESPACE_ID?.trim();
  const apiToken = process.env.CF_API_TOKEN?.trim();

  if (!accountId || !namespaceId || !apiToken) {
    return NextResponse.json({ error: "CF credentials missing" }, { status: 500 });
  }

  try {
    // Set routes-mapping to empty object → Worker sees no routes → KV bypass → Vercel ISR
    const res = await fetch(
      `${CF_API}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/routes-mapping`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[KV Invalidate] CF API error:", err);
      return NextResponse.json({ error: "CF KV update failed" }, { status: 500 });
    }

    console.log("[KV Invalidate] routes-mapping cleared — Worker will bypass KV until warmup completes");
    return NextResponse.json({ invalidated: true, message: "KV routes-mapping cleared" });
  } catch (err) {
    console.error("[KV Invalidate] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
