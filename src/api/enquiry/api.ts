// src/api/enquiry/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
// e.g. "https://www.dev.caravansforsale.com.au/wp-json/cfs/v1"

export type ProductEnquiryPayload = {
  product_id: number | string;
  email: string;
  name: string;
  phone: string;
  postcode: string;
};

export type ProductEnquiryResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

export async function createProductEnquiry(
  payload: ProductEnquiryPayload
): Promise<ProductEnquiryResponse> {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_CFS_API_BASE");

  const res = await fetch(`${API_BASE}/product_enquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    // next/image pages usually don't need credentials; add if your API requires:
    // credentials: "include",
    cache: "no-store",
  });

  const raw = await res.text();
  let json: ProductEnquiryResponse;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    json = { message: raw || "Invalid JSON from server" };
  }

  if (!res.ok) {
    throw new Error(json.message || "Product enquiry failed");
  }

  return json;
}
