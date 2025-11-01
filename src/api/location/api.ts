const API_LOCATION = process.env.NEXT_PUBLIC_CFS_API_BASE;

export const fetchLocations = async (keyword: string) => {
  if (!keyword || keyword.trim().length < 2) return [];

  const res = await fetch(
    `${API_LOCATION}/location-search?keyword=${encodeURIComponent(keyword)}`
  );
  if (!res.ok) throw new Error("Location API failed");

  const data = await res.json();

  if (Array.isArray(data.pincode_location_region_state)) {
    return data.pincode_location_region_state;
  }

  return [];
};
