import Link from "next/link";
import "./page.css";

export const metadata = {
  title: "410 - Page Permanently Removed | Caravans For Sale",
  description:
    "This page has been permanently removed and is no longer available. Browse caravans for sale across Australia.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GonePage() {
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
        <Link className="btn-410" href="/listings/">
          Browse Caravans
        </Link>
      </div>
    </div>
  );
}
