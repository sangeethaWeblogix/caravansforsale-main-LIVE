export type Manufacturer = {
  term_id: number;
  name: string;
  slug: string;
  description?: string;
  caravan_type?: string;
  image?: string;
  link?: string;
};

export type ManufacturerResponse = {
  page: {
    per_page: number;
    total_items: number;
    total_pages: number;
  };
  categories: Manufacturer[];
};

export async function fetchManufacturers(): Promise<Manufacturer[] | null> {
  const BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

  try {
    const res = await fetch(`${BASE}/get-manufacturer-categories/`, {
      headers: { Accept: "application/json" },
      cache: "no-store", // safer while testing
    });

    if (!res.ok) {
      console.error("Failed to fetch manufacturers:", res.status);
      return null;
    }

    const data = (await res.json()) as ManufacturerResponse;
    console.log("Fetched manufacturers data:", data);
    return data.categories ?? [];
  } catch (err) {
    console.error("Error fetching manufacturers:", err);
    return null;
  }
}
