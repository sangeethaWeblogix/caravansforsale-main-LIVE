import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sell Your Caravan for $49 Until Sold | CaravansForSale.com.au",
  description:
    "Sell your caravan on CaravansForSale.com.au for just $49 until sold. No subscriptions, no commissions, and connect directly with caravan buyers across Australia.",
  robots: "noindex, nofollow",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
