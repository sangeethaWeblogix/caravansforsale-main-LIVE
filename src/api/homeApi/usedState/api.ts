const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export const fetchUsedStateBasedCaravans = async () => {
  const res = await fetch(`${API_BASE}/used-caravans-by-state`, {
    cache: "no-store",
  });

  const json = await res.json();
  return json?.states || [];
};
