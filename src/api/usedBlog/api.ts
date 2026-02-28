const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export const fetchUsedBlogList = async () => {
  try {
    const res = await fetch(`${API_BASE}/used-blog`, {
      cache: "no-store", // optional: always fresh data
    });

    if (!res.ok) {
      throw new Error("Failed to fetch used blog list");
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("fetchUsedBlogList error:", error);
    return null;
  }
};
