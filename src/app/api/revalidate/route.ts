import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Called by backend admin when a product is updated/created.
// Clears the ISR cache for that product page so the live site reflects changes immediately.
//
// Usage:
//   POST /api/revalidate?secret=YOUR_SECRET
//   Body: { "slug": "pro-rv-dingo-13ft6-touring-hybrid-ensuite-outdoor-kitchen" }
//
// Or revalidate all product pages at once:
//   POST /api/revalidate?secret=YOUR_SECRET
//   Body: { "all": true }
//
// Set REVALIDATION_SECRET in .env.local / Vercel env vars.

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.REVALIDATION_SECRET || secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, all } = body as { slug?: string; all?: boolean };

    if (all) {
      // Revalidate the entire /product route — clears all product page caches.
      revalidatePath("/product/[slug]", "page");
      return NextResponse.json({ revalidated: true, scope: "all product pages" });
    }

    if (!slug) {
      return NextResponse.json({ error: "slug or all required" }, { status: 400 });
    }

    const path = `/product/${slug}`;
    revalidatePath(path, "page");
    return NextResponse.json({ revalidated: true, path });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
