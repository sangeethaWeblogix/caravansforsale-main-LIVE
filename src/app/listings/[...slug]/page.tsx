import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { metaFromSlug } from "../../../utils/seo/metaFromSlug";
import { Metadata } from "next";
import Head from "next/head"; // Import Head from next/head

type Params = { slug?: string[] };
type SearchParams = { [k: string]: string | string[] | undefined };

// Function to generate metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug = [] } = await params;
  return metaFromSlug(slug);
}

// Main Listings component
export default async function Listings({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  // Resolve both params and searchParams asynchronously
  const [{ slug = [] }, sp] = await Promise.all([params, searchParams]);

  // Extract filters and pagination
  const filters = parseSlugToFilters(slug);
  const paged = Array.isArray(sp?.paged) ? sp!.paged[0] : sp?.paged ?? "1";

  // Get metadata from the slug
  const metaData = await metaFromSlug(slug);

  // Ensure title and description are strings (convert if necessary)
  const title = String(metaData.title ?? "Default Title"); // Convert to string
  const description = String(metaData.description ?? "Default description"); // Convert to string

  return (
    <>
      {/* Inject metadata into the head tag */}
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {/* Add any other meta tags you need */}
      </Head>

      {/* Render ListingsPage with the filters and pagination */}
      <ListingsPage {...filters} page={paged} />
    </>
  );
}
