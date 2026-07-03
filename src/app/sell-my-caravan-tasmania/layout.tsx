import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Sell My Caravan in Tasmania for $49 Until Sold | CaravansForSale.com.au",
    template: "%s ",
  },
  description:
    "Sell your caravan in Tasmania on CaravansForSale.com.au for just $49 until sold. No subscriptions, no commissions, and connect directly with caravan buyers across Hobart and regional Tasmania.",
  icons: { icon: "/favicon.ico" },
  robots: "noindex, nofollow",
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/sell-my-caravan-tasmania/",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
