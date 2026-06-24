import { cache } from "react";
import { fetchListings, type ApiResponse, type Item } from "@/api/listings/api";
import { parseSlugToFilters } from "@/app/components/urlBuilder";

const BASE_URL = "https://www.caravansforsale.com.au";

function parseLengthFt(raw: string): number {
  // handles "19'6 ft" (feet+inches) and "24.93 ft" (decimal feet)
  const feetInches = raw.match(/^(\d+)'(\d+)/);
  if (feetInches) return parseInt(feetInches[1]) + parseInt(feetInches[2]) / 12;
  return parseFloat(raw);
}

function cleanPrice(raw: string): string {
  return raw.replace(/[$,]/g, "").trim();
}

function buildProductListItem(item: Item, position: number) {
  const rawPrice = item.sale_price && item.sale_price !== "" ? item.sale_price : item.regular_price;
  const price = cleanPrice(rawPrice ?? "");
  const lengthFt = parseLengthFt(item.length ?? "");
  const widthMt =
    !isNaN(lengthFt) && lengthFt > 0
      ? (lengthFt * 0.3048).toFixed(2)
      : "";
  const images =
    item.image_format && item.image_format.length > 0
      ? item.image_format
          .slice(0, 5)
          .map((url) => ({ "@type": "ImageObject", url }))
      : item.image
      ? [{ "@type": "ImageObject", url: item.image }]
      : [];
  return {
    "@type": "ListItem",
    position,
    item: {
      "@type": "Caravan",
      bodyType: item.categories && item.categories.length > 0
        ? item.categories.join(", ")
        : "",
      vehicleConfiguration: item.axle ?? "",
      width: {
        "@type": "QuantitativeValue",
        unitCode: "MT",
        value: widthMt,
      },
      url: item.link,
      name: item.name,
      model: item.model ?? "",
      brand: {
        "@type": "Brand",
        name: item.make ?? "",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "AUD",
        price: price,
      },
      image: images,
    },
  };
}

export function buildListingsJsonLd(
  response: ApiResponse,
  pageUrl: string,
  breadcrumbs: { name: string; url: string }[]
) {
  const pageTitle =
    response?.seo_v2?.h1 ||
    response?.seo_v2?.meta_title ||
    "Caravans for Sale in Australia";
  const totalProducts = response?.pagination?.total_products ?? 0;

  const allProducts = [
    ...(response.data?.products || []),
    ...(response.data?.emp_exclusive_products || []),
  ];
const weburl = "https://www.caravansforsale.com.au"
  const collectionPageLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": pageUrl,
        name: pageTitle,
        url: pageUrl,
        inLanguage: "en-AU",
        ...(totalProducts > 0 && { numberOfItems: totalProducts }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b) => ({
          "@type": "ListItem",
          name: b.name,
          item: b.url,
        })),
      },
    ],
  };

  const searchResultsLd = {
    "@context": "https://schema.org/",
    "@type": "SearchResultsPage",
    audience: { "@type": "Audience", audienceType: "caravan buyers" },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: weburl },
    },
    mainEntity: {
      "@type": "OfferCatalog",
      numberOfItems: allProducts.length,
      itemListElement: allProducts.map((item, idx) =>
        buildProductListItem(item, idx + 1)
      ),
    },
  };

  return { collectionPageLd, searchResultsLd };
}

// React.cache deduplicates within a single request — the page component calling
// getCachedListings with the same URL hits Next.js data cache (revalidate: 3600).
const fetchListingsForHead = cache(
  async (pathnameKey: string): Promise<ApiResponse | null> => {
    try {
      if (pathnameKey === "/listings/") {
        return await fetchListings({ page: 1 });
      }
      const slugString = pathnameKey
        .replace(/^\/listings\//, "")
        .replace(/\/$/, "");
      const slugParts = slugString.split("/").filter(Boolean);
      const rawFilters = parseSlugToFilters(slugParts, {});
      const filters = {
        ...rawFilters,
        page: rawFilters.page ? Number(rawFilters.page) : 1,
      };
      return await fetchListings(filters);
    } catch {
      return null;
    }
  }
);

export function buildBreadcrumbs(pathname: string): { name: string; url: string }[] {
  const crumbs: { name: string; url: string }[] = [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Caravans for Sale", url: `${BASE_URL}/listings/` },
  ];
  if (pathname === "/listings/" || pathname === "/listings") return crumbs;

  const slugString = pathname.replace(/^\/listings\//, "").replace(/\/$/, "");
  const slugParts = slugString.split("/").filter(Boolean);
  slugParts.forEach((segment, i) => {
    const label = segment
      .replace(/-(category|state|region|condition|search|suburb)$/, "")
      .replace(/[-+]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({
      name: label,
      url: `${BASE_URL}/listings/${slugParts.slice(0, i + 1).join("/")}/`,
    });
  });
  return crumbs;
}

export default fetchListingsForHead;
