
import "./page.css";
import ListingsPage from "@/app/components/ListContent/Listings";
import "../listings/listings.css";
import "../components/ListContent/newList.css";

export const metadata = {
  title: "410 - Page Permanently Removed | Caravans For Sale",
  description:
    "This page has been permanently removed and is no longer available. Browse caravans for sale across Australia.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GonePage({
  response,
  linksData,
  productListData,
  initialCategoryCounts,
  initialMakeCounts,
  initialBottomLinksData,
  apiFilters,
} = {}) {
  const empExclusiveProducts = response?.data?.emp_exclusive_products;
  const hasEmpExclusive =
    Array.isArray(empExclusiveProducts) && empExclusiveProducts.length > 0;

  if (hasEmpExclusive && apiFilters) {
    return (
      <ListingsPage
        {...apiFilters}
        initialData={response}
        linksData={linksData}
        productListData={productListData}
        initialCategoryCounts={initialCategoryCounts}
        initialMakeCounts={initialMakeCounts}
        initialBottomLinksData={initialBottomLinksData}
        initialDistances={{}}
      />
    );
  }

  return (
    <div className="page-wrap-410">
      <div className="card-410">
        <p className="err-number-410" aria-hidden="true">
          410
        </p>
        <h1 className="err-title-410">Page Permanently Removed</h1>
        <p className="err-desc-410">
          The page you requested has been permanently removed and is no longer
          available.
        </p>
      </div>
    </div>
  );
}
