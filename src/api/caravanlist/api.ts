const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export const fetchCaravanList = async () => {
  const res = await fetch(`${API_BASE}/get-caravans-by-type`, {
    cache: "no-store",
  });

  const json = await res.json();
  return json?.categories || [];
};
