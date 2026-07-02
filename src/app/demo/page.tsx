import type { Metadata } from "next";
import StateHome from "./home";
import "../globals.css";

export const revalidate = 86400;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LocationStateDemoPage() {
  return <StateHome />;
}
