import Details from "../../blogComponents/details";
import "../../blogComponents/details.css";

type RouteParams = { slug: string };
async function fetchBlogDetail(slug: string) {
  const res = await fetch(
    `https://www.api.caravansforsale.com.au/wp-json/cfs/v1/blog-detail/${encodeURIComponent(
      slug
    )}`,
    { cache: "no-store", headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error("Failed to load blog detail");
  return res.json();
}

export default async function ProductBlogPage(
  { params }: { params: Promise<RouteParams> } // ⬅️ match Next's PageProps (Promise)
) {
  const { slug } = await params; // ⬅️ await it
  const data = await fetchBlogDetail(slug);

  return (
    <div>
      <Details data={data} />
    </div>
  );
}
