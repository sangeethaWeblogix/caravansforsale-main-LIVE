const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export const fetchFeaturedUsedCaravans = async () => {
  try {
    const res = await fetch(
      `${API_BASE}/featured-used-caravans`,
      {
        cache: "no-store", // always fresh
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch featured used caravans");
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("fetchFeaturedUsedCaravans error:", error);
    return null;
  }
};
