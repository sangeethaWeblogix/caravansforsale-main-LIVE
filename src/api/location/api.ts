 const API_LOCATION = process.env.NEXT_PUBLIC_CFS_API_BASE;

export const fetchLocations = async (keyword: string) => {
  if (!keyword || keyword.trim().length < 2) return [];

  const res = await fetch(
    `${API_LOCATION}/location-search?keyword=${encodeURIComponent(keyword)}`
  );

  if (!res.ok) throw new Error("Location API failed");

  const data = await res.json();

  // ✅ Maintain API order: State → Region → Pincode
  const orderedResults = [
    ...(Array.isArray(data.state_only) ? data.state_only : []),
    ...(Array.isArray(data.region_state) ? data.region_state : []),
    ...(Array.isArray(data.pincode_location_region_state)
      ? data.pincode_location_region_state
      : []),
  ];

  return orderedResults;
};
