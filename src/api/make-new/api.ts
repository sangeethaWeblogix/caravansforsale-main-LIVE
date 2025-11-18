 const API_BASE =process.env.NEXT_PUBLIC_CFS_API_BASE;

// api/productList/api.ts
 export const fetchMakeDetails = async () => {
  const res = await fetch(`${API_BASE}/make_details`);
  const json = await res.json();
  return json?.data?.make_options || [];
};

