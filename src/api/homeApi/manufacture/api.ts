const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export const fetchManufactures = async () => {
  const res = await fetch(`${API_BASE}/manufacturer-based-caravans-list`, {
    cache: "no-store",
  });

  const json = await res.json();
  return json?.manufacturers || [];
};
