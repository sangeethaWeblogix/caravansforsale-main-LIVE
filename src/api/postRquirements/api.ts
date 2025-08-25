// src/api/requirements/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export type Requirement = {
  id?: number; // if the API returns one
  featured?: "0" | "1";
  type: string; // e.g., "Hybrid"
  condition: string; // e.g., "Used" | "New"
  location: string; // e.g., "2033"
  requirements: string; // text
  budget: string; // number as string
  active?: "0" | "1";
  created_at?: string;
};

type ListResp = {
  success: boolean;
  data: Requirement[]; // screenshot shows an array under data
};

export async function fetchRequirements(): Promise<Requirement[]> {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_CFS_API_BASE");
  const url = `${API_BASE}/cara_req`; // ← from your screenshot
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetchRequirements failed: ${res.status}`);
  const json: ListResp = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

// If your backend accepts JSON POST at same endpoint.
// If it’s form-data or a different path (e.g. /cara_req/create),
// just tweak the fetch below.
export async function createRequirement(
  payload: Requirement
): Promise<boolean> {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_CFS_API_BASE");
  const url = `${API_BASE}/cara_req`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // normalize optional booleans to "0"/"1" strings if needed
    body: JSON.stringify({
      ...payload,
      featured: payload.featured ?? "0",
      active: payload.active ?? "1",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`createRequirement failed: ${res.status} ${text}`);
  }
  // if your API returns {success:true}, you can check it here:
  // const json = await res.json(); return json?.success === true;
  return true;
}
