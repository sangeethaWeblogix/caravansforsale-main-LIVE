const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
 const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

// api/productList/api.ts
 export const fetchMakeDetails = async () => {
  const res = await fetch(`${API_BASE}/make_details`);
  const json = await res.json();
  return json?.data?.make_options || [];
};


// api/productList/api.ts
export const fetchModelsByMake = async (make: string) => {
  const res = await fetch(`${API_BASE}/new-list?make=${make}`, {
    headers: {
      Accept: "application/json",
      ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Added
    },
  });
  const json = await res.json();
  const modelOptions = json?.data?.model_options || [];
  return modelOptions.map((m: { name: string; slug: string }) => ({
    name: m.name,
    slug: m.slug,
  }));
};
