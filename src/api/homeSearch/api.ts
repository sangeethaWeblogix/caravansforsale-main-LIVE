// src/api/homeSearch/api.ts
// Calls the internal Next.js proxy (/api/home-search) so CFS_API_KEY stays server-side only.

export interface KeywordSuggestion {
  keyword: string;
  url: string;
  id: string | number;
}

export interface HomeSearchItem {
  id: string | number;
  name?: string;
  url?: string;
}

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function extractList(payload: unknown): HomeSearchItem[] {
  if (!isRecord(payload)) return [];

  const d: unknown = isRecord(payload.data) ? payload.data : payload;

  if (isRecord(d) && Array.isArray(d.home_search)) {
    return d.home_search as HomeSearchItem[];
  }
  if (isRecord(d) && Array.isArray(d.items)) {
    return d.items as HomeSearchItem[];
  }

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
  const res = await fetch("/api/home-search", { cache: "no-store" });
  if (!res.ok) throw new Error(`HomeSearch API failed: ${res.status}`);

  const json = await res.json();
  return extractList(json);
}

export async function fetchKeywordSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<KeywordSuggestion[]> {
  const url = `/api/home-search?keyword=${encodeURIComponent(query)}`;

  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) throw new Error(`Keyword API failed: ${res.status}`);

  const json = (await res.json()) as {
    success?: boolean;
    data?: { keyword?: string; url?: string; id?: string | number }[];
  };

  const arr = Array.isArray(json?.data) ? json.data : [];

  return arr
    .map((x) => ({
      id: x?.id ?? "",
      keyword: String(x?.keyword ?? "").trim(),
      url: String(x?.url ?? "").trim(),
    }))
    .filter((x) => !!x.keyword);
}
