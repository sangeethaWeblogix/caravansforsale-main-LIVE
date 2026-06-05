const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this


export const fetchLengthBasedCaravans = async () => {
  const res = await fetch(`${API_BASE}/length-based-caravans-list`, {
    cache: "no-store",
     headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ API key added
      },
  });

  const json = await res.json();
  return json?.bands || [];
};
