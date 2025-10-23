// src/api/homeSearch/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export async function fetchSuburbKeywordSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<Array<{ name: string; value: string }>> {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_CFS_API_BASE");

  // Build the suburb-list API URL
  const url = `${API_BASE}/suburb-list/${encodeURIComponent(query)}`;

  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) throw new Error(`Suburb API failed: ${res.status}`);

  // Parse JSON response
  const json = await res.json();

  // Ensure we have an array
  const arr = Array.isArray(json) ? json : [];

  // Return suburb objects with name and value properties
  return arr
    .map((suburb: any) => ({
      name: String(suburb?.name ?? ""),
      value: String(suburb?.value ?? suburb?.name ?? ""), // Use value if available, fallback to name
    }))
    .filter(
      (suburb: { name: string; value: string }) => suburb.name && suburb.value
    );
}
