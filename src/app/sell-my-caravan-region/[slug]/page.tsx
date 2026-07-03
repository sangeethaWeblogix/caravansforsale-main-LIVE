import { Metadata } from "next";
import { redirect } from "next/navigation";
import RegionSeller from "../RegionSeller";
import {
  ALL_REGIONS,
  getRegionBySlug,
  buildRegionMetadata,
  buildRegionJsonLd,
} from "../regions-data";

export const dynamicParams = true;

type RouteParams = { slug: string };
type PageProps = { params: Promise<RouteParams> };

export async function generateStaticParams() {
  return ALL_REGIONS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) return {};
  return buildRegionMetadata(region);
}

export default async function SellMyCaravanRegionPage({ params }: PageProps) {
  const { slug } = await params;
  const region = getRegionBySlug(slug);

  if (!region) {
    redirect("/404");
  }

  const jsonLd = buildRegionJsonLd(region);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RegionSeller region={region} />
    </>
  );
}
