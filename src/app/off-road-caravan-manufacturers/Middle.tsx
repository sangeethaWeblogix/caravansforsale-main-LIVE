import Image from "next/image";
import Link from "next/link";

export default function OffRoadCaravanManufacturers() {
  return (
    <section className="services manufacture_content_area section-padding pt-30 pb-50 style-1">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <span className="breadcrumb_links">
              <Link href="/">Home</Link> »{" "}
              <span className="breadcrumb_last" aria-current="page">
                Off Road Caravan Manufacturers
              </span>
            </span>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-9 col-md-9">
            <div className="section-head mb-60">
              <div className="advertisement">
                <Image
                  className="hidden-xs"
                  src="https://www.caravansforsale.com.au/wp-content/uploads/2025/06/Best-Off-Road-Caravan-Manufacturers-You-Havent-Heard-Of.jpg"
                  alt="Best Off Road Caravan Manufacturers"
                  width={900}
                  height={500}
                />
                <Image
                  className="hidden-lg hidden-md hidden-sm br-m-8"
                  src="https://www.caravansforsale.com.au/wp-content/uploads/2025/06/Best-Off-Road-Caravan-Manufacturers-You-Havent-Heard-Of-Mob.jpg"
                  alt="Best Off Road Caravan Manufacturers"
                  width={450}
                  height={250}
                />
              </div>

              <h2 className="divide-orange pb-20">
                Explore the Full Range from Top-Quality Off-Road Caravan
                Manufacturers
              </h2>

              <p>
                We understand that buying a caravan is a significant investment,
                and we offer resources to help make the process easier and help
                you finding some of the{" "}
                <Link href="https://www.caravansforsale.com.au/best-caravans-full-off-road-capabilities-australia/">
                  best off-road caravans in Australia
                </Link>
                . We are here to make a difference and to genuinely help both
                the consumer and the manufacturer.
              </p>

              <p>
                We have showcased below the best off-road caravan manufacturers
                and brands that don&lsquo;t participate in all the big events
                and spend big on advertising. So, all the spend goes towards
                building good quality off road vans.
              </p>

              {/* Repeatable Manufacturer Blocks */}
              {/* <Manufacturer
                index={1}
                name="Orbit Caravans"
                url="https://www.orbitcaravans.com.au/"
                detailsLink="https://www.caravansforsale.com.au/caravan-manufacturers/orbit-caravans"
                imageDesktop="https://www.caravansforsale.com.au/images/Orbit-tig-welded-aluminium-frame-off-road-caravan-manufacturer.jpg"
                imageMobile="https://www.caravansforsale.com.au/images/tig-welded-aluminium-frame-off-road-caravan-manufacturer-Orbit.jpg"
                title="Key Reasons Why Orbit Caravans is a Leading Off-Road Caravan Manufacturer with TIG-Welded Aluminum Frames"
                features={[
                  "Manufacturing Costs: Significantly lower than any other off road caravan manufacturers that build TIG welded aluminium frame caravans.",
                  "Advertising: No expensive celebrity endorsements, TV commercials, or heavy online spending. limited presence at caravan shows and limited dealers.",
                  "Build Focus: Resources are efficiently managed and dedicated to high-quality van construction.",
                  "Australian Owned & Operated: Australian Caravan Manufacturer.",
                  "Expert Staff: All workers with extensive experience from the caravan industry.",
                  "Owner : Run by a skilled off-road caravan manufacturer who is very customer centric.",
                  "Technology: Integrates the latest advancements in technology and design to enhance the performance of every caravan.",
                  "What to Expect: Best value for money , best performance and quality in the TIG welded aluminium frame caravan range in Australia.",
                ]}
              /> */}

              {/* Repeat Manufacturer blocks below using <Manufacturer /> component and pass props */}

              <div className="advertisement">
                <Link
                  href="https://www.caravansforsale.com.au/"
                  className="banner_ad_now"
                  style={{
                    border: "1px solid #d3d3d3",
                    boxShadow: "0px 0px 10px rgb(0 0 0 / 8%)",
                    marginBottom: 15,
                    marginTop: 10,
                  }}
                >
                  <Image
                    className="hidden-xs"
                    src="https://www.caravansforsale.com.au/images/index_link_dk.jpg"
                    alt="Caravans For Sale"
                    width={900}
                    height={200}
                  />
                  <Image
                    className="hidden-lg hidden-md hidden-sm"
                    src="https://www.caravansforsale.com.au/images/index_link_m.jpg"
                    alt="Caravans For Sale Mobile"
                    width={450}
                    height={200}
                  />
                </Link>
              </div>

              {/* Add more manufacturer sections here... */}
            </div>
          </div>

          <div className="col-lg-3 col-md-3 rightbar-stick">
            <div className="theiaStickySidebar">
              <p>Sidebar</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// function Manufacturer({
//   index,
//   name,
//   url,
//   detailsLink,
//   imageDesktop,
//   imageMobile,
//   title,
//   features,
// }) {
//   return (
//     <div className="mb-12">
//       <h3>
//         {index}.{" "}
//         <Link href={url} target="_blank">
//           {name}
//         </Link>
//       </h3>
//       <div className="key_features">
//         <h4>{title}</h4>
//         <ul>
//           {features.map((item, idx) => (
//             <li key={idx}>{item}</li>
//           ))}
//         </ul>
//         <Link href={detailsLink} className="underline block pl-6 text-lg mt-2">
//           View All Range
//         </Link>
//       </div>
//       <div className="advertisement mt-4">
//         <Image
//           className="hidden-xs"
//           src={imageDesktop}
//           alt={`${name} - Caravan Manufacturer`}
//           width={900}
//           height={500}
//         />
//         <Image
//           className="hidden-lg hidden-md hidden-sm br-m-8"
//           src={imageMobile}
//           alt={`${name} - Caravan Manufacturer Mobile`}
//           width={450}
//           height={250}
//         />
//       </div>
//     </div>
//   );
// }
