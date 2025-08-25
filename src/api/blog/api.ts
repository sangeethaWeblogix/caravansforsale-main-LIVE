// src/api/blog/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  link: string;
  image: string;
  slug: string;
  date: string; // e.g. "2024-12-28 20:11:04"
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
};

export const fetchBlogs = async (page: number = 1): Promise<BlogPageResult> => {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_CFS_API_BASE");

  const url = `${API_BASE}/blog?page=${page}`;
  if (typeof window !== "undefined") console.log("[Blog API] GET", url);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blog API failed: ${res.status}`);

  const data: BlogApiResponse = await res.json();
  const lp = data?.data?.latest_blog_posts ?? {
    items: [],
    current_page: page,
    total_pages: 1,
  };
  return {
    items: lp.items ?? [],
    currentPage: lp.current_page ?? page,
    totalPages: lp.total_pages ?? 1,
  };
};
