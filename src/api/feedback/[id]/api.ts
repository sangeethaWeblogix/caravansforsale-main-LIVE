// src/app/api/cf7/[id]/route.ts
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  // ✅ single slash; no trailing double slashes
  const endpoint = `https://www.caravansforsale.com.au/wp-json/contact-form-7/v1/contact-forms/${id}/feedback`;

  const formData = await req.formData();
  const resp = await fetch(endpoint, {
    method: "POST",
    body: formData,
    headers: { Accept: "application/json" }, // ask for JSON explicitly
  });

  // Return whatever CF7 returns; don’t assume JSON blindly
  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } else {
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: { "content-type": ct || "text/plain" },
    });
  }
}
