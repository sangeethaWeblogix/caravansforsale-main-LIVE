// export const dynamic = "force-dynamic"
;

import Header from "./Header";
import Middle from "./Middle";
import FaqSection from "./FaqSection";
import "./comman.css?=1";

export default function Home() {
  return (
    <div>
      <Header />
      <Middle />
      <FaqSection />
    </div>
  );
}
