const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export const fetchProductList = async () => {
  try {
    const res = await fetch(`${API_BASE}/params-product-list`);

    if (!res.ok) {
      throw new Error("Failed to fetch product list");
    }

    const data = await res.json(); // Extract JSON from response
    return data; // Return the JSON result
  } catch (error) {
    console.error("fetchProductList error:", error);
    return null; // Or throw error again, depending on your app's needs
  }
};
