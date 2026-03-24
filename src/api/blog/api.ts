const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  link: string;
  image: string;
  slug: string;
  date: string;
}

export interface BlogApiResponse {
  data: {
    latest_blog_posts: {
      items: BlogPost[];
      current_page?: number;
      total_pages?: number;
    };
  };
}

export type BlogPageResult = {
  items: BlogPost[];
  currentPage: number;
  totalPages: number;
  total_pages: number;
};

export const fetchBlogs = async (page: number = 1): Promise<BlogPageResult> => {
  if (!API_BASE) {
    console.error("❌ CFS_API_BASE env missing"); // ✅ Server log
    return { items: [], currentPage: page, totalPages: 1, total_pages: 1 };
  }

  const url = `${API_BASE}/blog?page=${page}`;
  console.log("[Blog API] GET", url); // ✅ Server terminal-ல் தெரியும்

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // ✅ cache: no-store எடுத்துட்டேன்
    });

    if (!res.ok) {
      console.error(`❌ Blog API failed: ${res.status}`);
      return { items: [], currentPage: page, totalPages: 1, total_pages: 1 };
    }

    const data: BlogApiResponse = await res.json();
    console.log("[Blog API] Response:", JSON.stringify(data).slice(0, 200)); // ✅ data வருதா பாக்க

    const lp = data?.data?.latest_blog_posts ?? {
      items: [],
      current_page: page,
      total_pages: 1,
    };

    return {
      items: lp.items ?? [],
      currentPage: lp.current_page ?? page,
      totalPages: lp.total_pages ?? 1,
      total_pages: lp.total_pages ?? 1,
    };
  } catch (err) {
    console.error("❌ fetchBlogs error:", err);
    return { items: [], currentPage: page, totalPages: 1, total_pages: 1 };
  }
};