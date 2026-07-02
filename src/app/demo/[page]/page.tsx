import type { Metadata } from "next";
import StateHomePaged from "../StateHomePaged";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

export default async function LocationStatePagedPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: pageSlug } = await params;
  const match = pageSlug.match(/^page(\d+)$/);
  const pageNum = match ? Math.max(1, parseInt(match[1], 10)) : 1;

  return <StateHomePaged initialPage={pageNum} />;
}
