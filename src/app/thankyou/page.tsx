import React from "react";
import Thankyou from "./ThankYou";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "ThankYou";

  const robots = "noindex, nofollow";
  return {
    title: metaTitle,
    robots: robots,
    openGraph: {
      title: metaTitle,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
    },
  };
}

const page = () => {
  return (
    <div>
      <Thankyou />
    </div>
  );
};

export default page;
