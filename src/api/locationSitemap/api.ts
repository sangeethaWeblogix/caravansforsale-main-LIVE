 const API_BASE = "https://admin.caravansforsale.com.au/wp-json/cfs/v1";

export async function fetchAllLocations(signal?: AbortSignal) {
  const url = `${API_BASE}/location-search-all`;
  const res = await fetch(url, { cache: "no-store", signal });

  if (!res.ok) throw new Error(`Location API failed: ${res.status}`);
  return await res.json();
}
