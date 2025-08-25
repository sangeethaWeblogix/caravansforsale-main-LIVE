const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

// api/productList/api.ts
export const fetchModelsByMake = async (make: string) => {
  const res = await fetch(`${API_BASE}/new-list?make=${make}`);
  const json = await res.json();
  const modelOptions = json?.data?.model_options || [];
  return modelOptions.map((m: { name: string; slug: string }) => ({
    name: m.name,
    slug: m.slug,
  }));
};
