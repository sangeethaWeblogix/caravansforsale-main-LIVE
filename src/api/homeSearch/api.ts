// src/api/homeSearch/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export type HomeSearchItem = Record<string, unknown>;

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function extractList(payload: unknown): HomeSearchItem[] {
  if (!isRecord(payload)) return [];

  // prefer payload.data when it's an object, else use payload itself
  const d: unknown = isRecord(payload.data) ? payload.data : payload;

  // common shapes
  if (isRecord(d) && Array.isArray(d.home_search)) {
    return d.home_search as HomeSearchItem[];
  }
  if (isRecord(d) && Array.isArray(d.items)) {
    return d.items as HomeSearchItem[];
  }

  // fallback: first array under `data` (or under root)
  if (isRecord(d)) {
    const firstArrayUnderData = Object.values(d).find(Array.isArray) as
      | unknown[]
      | undefined;
    if (Array.isArray(firstArrayUnderData)) {
      return firstArrayUnderData as HomeSearchItem[];
    }
  }

  const firstArrayAtRoot = Object.values(payload).find(Array.isArray) as
    | unknown[]
    | undefined;

  return (firstArrayAtRoot as HomeSearchItem[]) ?? [];
}

export async function fetchHomeSearchList(): Promise<HomeSearchItem[]> {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_CFS_API_BASE");

  const url = `${API_BASE}/home_search`;
  if (typeof window !== "undefined") console.log("[HomeSearch API] GET", url);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HomeSearch API failed: ${res.status}`);

  const json = await res.json();
  return extractList(json);
}

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

  const arr = Array.isArray(json?.data) ? json.data : [];
  return arr.map((x) => String(x?.keyword ?? "")).filter(Boolean);
}
