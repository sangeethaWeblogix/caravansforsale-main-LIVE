import { fetchBlogs } from "@/api/blog/api";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchBlogs(1);
    return NextResponse.json(data.items);
  } catch {
    return NextResponse.json([]);
  }
}
