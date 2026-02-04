const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export const fetchLatestUsedCaravans = async () => {
  try {
    const res = await fetch(
      `${API_BASE}/latest-used-caravans`,
      {
        cache: "no-store", // always fresh
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch   used caravans");
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("fetchUsedCaravans error:", error);
    return null;
  }
};
