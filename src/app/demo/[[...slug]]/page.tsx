import type { Metadata } from "next";
import StateHome from "../home";
import { parseDemoFilters } from "../urlUtils";
import "../../globals.css";

export const revalidate = 86400;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LocationStateDemoPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const initialFilters = parseDemoFilters(slug ?? [], query);

  return <StateHome initialFilters={initialFilters} />;
}
