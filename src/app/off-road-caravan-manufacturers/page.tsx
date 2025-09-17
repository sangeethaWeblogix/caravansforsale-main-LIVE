import  Header  from "./Header";
import  Middle  from "./Middle";
import  FaqSection  from "./FaqSection";
import  Footer  from "./Footer";
import './comman.css'

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle =
    "Off-Road Caravan Manufacturers in Australia: Top Brands & Models";
  const metaDescription =
    "Find the best off-road caravan manufacturers in Australia. Off road caravans built with the highest quality standards and offer serious value for money";

  const robots = "index, follow";

  return {
    title: metaTitle,
    description: metaDescription,
    robots: robots,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
    },
  };
}

export default function Home() {
  return (
    <div>
      <Header />
      <Middle />
      <Footer />
      <FaqSection />
      
    </div>
  );
}
