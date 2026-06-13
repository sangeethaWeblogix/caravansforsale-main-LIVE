const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
 const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

// api/productList/api.ts
 export const fetchMakeDetails = async () => {
  const res = await fetch(`${API_BASE}/make_details`);
  const json = await res.json();
  return json?.data?.make_options || [];
};



export const fetchModelCounts = async (make: string): Promise<{ name: string; slug: string; count: number }[]> => {
  try {
    const res = await fetch(
      `${API_BASE}/params_count?group_by=model&make=${encodeURIComponent(make)}`,
      {
        headers: {
          Accept: "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }),
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data ?? [];
  } catch {
    return [];
  }
};

export const fetchMakeCounts = async (): Promise<{ name: string; slug: string; count: number }[]> => {
  try {
    const res = await fetch(`${API_BASE}/params_count?group_by=make`, {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data ?? [];
  } catch {
    return [];
  }
};

export const fetchCategoryCounts = async (): Promise<{ name: string; slug: string; count: number }[]> => {
  try {
    const res = await fetch(`${API_BASE}/params_count?group_by=category`, {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data ?? []).map((c: { name: string; slug: string; count: number }) => ({
      ...c,
      slug: c.slug.replace(/-category$/, ""),
    }));
  } catch {
    return [];
  }
};

export const fetchProductList = async () => {
  try {
const res = await fetch(`${API_BASE}/params-product-list`, {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Added
      },
    });
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




// const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

// export const fetchProductList = async () => {
//   try {
//     const res = await fetch("https://admin.caravansforsale.com.au/wp-json/cfs/v1/params-product-list");

//     if (!res.ok) {
//       throw new Error("Failed to fetch product list");
//     }

//     const data = await res.json(); // Extract JSON from response
//     return data; // Return the JSON result
//   } catch (error) {
//     console.error("fetchProductList error:", error);
//     return null; // Or throw error again, depending on your app's needs
//   }
// };