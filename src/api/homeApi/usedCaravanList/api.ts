const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export const fetchUsedCaravansList = async () => {
  const res = await fetch(`${API_BASE}/used-caravans-list`, {
    cache: "no-store",
  });

  const json = await res.json();
  return json;
};
