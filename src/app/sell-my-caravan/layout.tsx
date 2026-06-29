import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sell My Caravan Online Australia | $49 Until Sold",
  description:
    "Sell your caravan online in Australia with CaravansForSale.com.au. List your caravan for a one-time $49 fee, keep 100% of the sale price, and stay live until sold.",
  robots: "index, follow",
  alternates: {
    canonical: "https://www.caravansforsale.com.au/sell-my-caravan/",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
