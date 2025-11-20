const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export const fetchRegion = async () => {
  const res = await fetch(`${API_BASE}/region-based-caravans-list`, {
    cache: "no-store",
  });

  const json = await res.json();
  return json?.regions || [];
};
