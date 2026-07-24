import { NextResponse } from "next/server";

// Temporary debug route — DELETE after testing
// Hit /api/debug-headers/ to see what headers SiteGround receives from Vercel
export async function GET() {
  const url = "https://admin.caravansforsale.com.au/header-echo.php";

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
        "X-API-Key": process.env.CFS_API_KEY || "",
      },
      cache: "no-store",
    });

    const text = await res.text();

    // Check if SiteGround challenged this request too
    if (text.includes("sgcaptcha") || text.trimStart().startsWith("<html")) {
      return NextResponse.json({
        result: "BOT_CHALLENGE — header-echo.php itself was challenged. Transform Rule may not be working.",
        status: res.status,
      });
    }

    const data = JSON.parse(text);
    const headers = data.headers ?? {};

    return NextResponse.json({
      result: "SUCCESS — SiteGround received these headers:",
      cf_connecting_ip:  headers["cf-connecting-ip"]  ?? "NOT PRESENT ✅",
      true_client_ip:    headers["true-client-ip"]    ?? "NOT PRESENT ✅",
      x_forwarded_for:   headers["x-forwarded-for"]   ?? "NOT PRESENT ✅",
      user_agent:        headers["user-agent"]         ?? "NOT PRESENT ❌",
      x_api_key:         headers["x-api-key"]         ? "PRESENT ✅" : "NOT PRESENT ❌",
      all_headers: headers,
    });
  } catch (err: any) {
    return NextResponse.json({ result: "FETCH ERROR", error: err?.message }, { status: 500 });
  }
}
