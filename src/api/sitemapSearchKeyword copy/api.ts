// src/api/sitemapSearchKeyword/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export async function fetchSearchkeywords(
  signal?: AbortSignal
): Promise<{ name: string; url: string }[]> {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_CFS_API_BASE");

  const url = `${API_BASE}/search-keyword`;

  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) throw new Error(`Keyword API failed: ${res.status}`);

  const json = (await res.json()) as {
    success?: boolean;
    data?: { name?: string; url?: string }[];
  };

  const arr = Array.isArray(json?.data) ? json.data : [];

  // ✅ Return full object (not just name)
  const result = arr.map((x) => ({
    name: x?.name?.trim() || "",
    url: x?.url?.trim() || "",
  }));

  // console.log("✅ Keywords fetched:", result);
  return result;
}
