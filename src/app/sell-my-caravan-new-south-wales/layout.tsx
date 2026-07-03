import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Sell My Caravan in New South Wales for $49 Until Sold | CaravansForSale.com.au",
    template: "%s ",
  },
  description:
    "Sell your caravan in New South Wales on CaravansForSale.com.au for just $49 until sold. No subscriptions, no commissions, and connect directly with caravan buyers across Sydney and regional New South Wales.",
  icons: { icon: "/favicon.ico" },
  robots: "noindex, nofollow",
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/sell-my-caravan-new-south-wales/",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
