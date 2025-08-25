// src/api/homeSearch/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export async function fetchKeywordSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<string[]> {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_CFS_API_BASE");
  const url = `${API_BASE}/home_search/?keyword=${encodeURIComponent(query)}`;

  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) throw new Error(`Keyword API failed: ${res.status}`);

  const json = (await res.json()) as {
    success?: boolean;
    data?: { keyword?: string }[];
  };

  const arr = Array.isArray(json?.data) ? json!.data! : [];
  return arr.map((x) => String(x?.keyword ?? "")).filter(Boolean);
}
