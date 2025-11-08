const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export const fetchProductList = async (batch = 1, batchSize = 6000) => {
  const url = `${API_BASE}/all_product_list?batch=${batch}&batch_size=${batchSize}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    const data = await res.json();

    // Extract and format the product list safely
    if (data?.data && Array.isArray(data.data)) {
      return data.data.map((item) => ({
        id: item.id,
        name: item.name,
        regular_price: item.regular_price || "0",
        sale_price: item.sale_price || "0",
        condition: item.condition || "Unknown",
        description: item.description
          ?.replace(/\\u003C\/?p\\u003E/g, "") // remove encoded <p> tags
          ?.replace(/\\u0026#8217;/g, "'") // fix apostrophes
          ?.replace(/\\u003Cbr\\u003E/g, "\n") // convert line breaks
          ?.trim(),
        image: item.image || "",
        stock: item.stock || "N/A",
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching product list:", error);
    return [];
  }
};
