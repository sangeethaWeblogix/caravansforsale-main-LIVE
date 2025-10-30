 "use client";
 import Image from "next/image";
 import Link from "next/link";
 import { Swiper, SwiperSlide } from "swiper/react";
 import "swiper/css";
 import "swiper/css/navigation";
 import "swiper/css/pagination";
 import { Navigation, Autoplay, Pagination } from "swiper/modules";
 
 import "./newlist.css";
 import Head from "next/head";
 import { useEffect, useMemo, useRef, useState } from "react";
 
 interface Product {
   id: number;
   name: string;
   length: string;
   kg: string;
   regular_price: string;
   sale_price?: string;
   price_difference?: string;
   image: string;
   link: string;
   condition: string;
   location?: string;
   categories?: string[];
   people?: string;
   make?: string;
   slug?: string;
 }
 
 interface Pagination {
   current_page: number;
   per_page: number;
   total_products: number; // ✅ match your API key
   total_pages: number;
 }
 export interface Filters {
   category?: string;
   make?: string;
   location?: string | null;
   from_price?: string | number; // ✅ add this
   to_price?: string | number;
   condition?: string;
   sleeps?: string;
   states?: string;
   minKg?: string | number;
   maxKg?: string | number;
   from_year?: number | string;
   to_year?: number | string;
   from_length?: string | number;
   to_length?: string | number;
   model?: string;
   state?: string;
   region?: string;
   suburb?: string;
   pincode?: string;
   orderby?: string;
   slug?: string | undefined;
 }
 interface Props {
   products: Product[];
   data: Product[];
   pagination: Pagination;
   onNext: () => void;
   onPrev: () => void;
   metaTitle: string; // Add metaTitle prop
   metaDescription: string; // Add metaDescription prop
   onFilterChange: (filters: Filters) => void;
   currentFilters: Filters;
   preminumProducts: Product[];
   fetauredProducts: Product[];
   exculisiveProducts: Product[];
 }
 
 export default function ListingContent({
   products,
   pagination,
   onNext,
   onPrev,
   metaTitle,
   metaDescription,
   onFilterChange,
   currentFilters,
   preminumProducts,
   fetauredProducts,
   exculisiveProducts,
 }: Props) {
   const [showInfo, setShowInfo] = useState(false);
   const [showContact, setShowContact] = useState(false);
   const prevRef = useRef(null);
   const nextRef = useRef(null);
   console.log("data-prod", products);
 
   console.log("data-product", exculisiveProducts);
   console.log("data-premium", preminumProducts);
   console.log("data-featu", fetauredProducts);
   // const handleChange = (e) => {
   //   setOrderBy(e.target.value);
   // };
   const mergedProducts = useMemo(() => {
     const merged: Product[] = [];
     const exclusive = exculisiveProducts || [];
     const normal = products || [];
 
     let exclusiveIndex = 0;
 
     for (let i = 0; i < normal.length; i++) {
       merged.push(normal[i]);
 
       // 🔁 After every 10 products, insert one exclusive product if available
       if ((i + 1) % 10 === 0 && exclusiveIndex < exclusive.length) {
         merged.push({
           ...exclusive[exclusiveIndex],
           name: `[Exclusive] ${exclusive[exclusiveIndex].name || "Caravan"}`,
         });
         exclusiveIndex++;
       }
     }
 
     // If there are remaining exclusive products, push them at the end
     while (exclusiveIndex < exclusive.length) {
       merged.push({
         ...exclusive[exclusiveIndex],
         name: `[Exclusive] ${exclusive[exclusiveIndex].name || "Caravan"}`,
       });
       exclusiveIndex++;
     }
 
     return merged;
   }, [products, exculisiveProducts]);
 
   // ✅ Disable background scroll when popup is open
   useEffect(() => {
     if (showInfo || showContact) {
       document.body.style.overflow = "hidden";
     } else {
       document.body.style.overflow = "";
     }
 
     return () => {
       document.body.style.overflow = "";
     };
   }, [showInfo, showContact]);
 
   // Example placeholder function for product links
   const productHref = (slug) => `/listing/${slug}`;
 
   // const imageUrl = "public/favicon.ico";
   // const getHref = (p: Product) => {
   //   const slug = p.slug?.trim() || toSlug(p.name);
   //   return slug ? `/product/${slug}/` : ""; // trailing slash optional
   // };
   const uniqueProducts = useMemo(() => {
     const seen = new Set<string>();
     return (products || []).filter((p) => {
       const k = String(p?.id ?? p?.slug ?? p?.link);
       if (seen.has(k)) return false;
       seen.add(k);
       return true;
     });
   }, [products]);
   console.log("data", uniqueProducts);
   return (
     <>
       <Head>
         <title>{metaTitle}</title> {/* Dynamically set title */}
         <meta name="description" content={metaDescription} />
         <meta property="og:type" content="website" />
         <meta property="robot" content="index, follow" />
         <meta property="og:title" content={metaTitle} />
         <meta property="og:description" content={metaDescription} />
         <meta name="twitter:title" content={metaTitle} />
         <meta name="twitter:description" content={metaDescription} />
       </Head>
 
       <div className="col-lg-6 ">
         <div className="top-filter mb-10">
           <div className="row align-items-center">
             <div className="col-lg-8">
               <p className="show_count">
                 Showing{" "}
                 {(pagination.current_page - 1) * pagination.per_page + 1}–
                 {Math.min(
                   pagination.current_page * pagination.per_page,
                   pagination.total_products
                 )}{" "}
                 of {pagination.total_products} results
               </p>
             </div>
             <div className="col-4 d-lg-none d-md-none">
               <button
                 type="button"
                 className="mobile_fltn navbar-toggler mytogglebutton"
                 data-bs-toggle="offcanvas"
                 data-bs-target="#mobileFilters"
                 aria-controls="mobileFilters"
               >
                 <i className="bi bi-search" /> &nbsp;Filter
               </button>
             </div>
             <div className="col-lg-4 col-8">
               <div className="r-side">
                 <form className="woocommerce-ordering" method="get">
                   <div className="form-group shot-buy">
                     <select
                       name="orderby"
                       className="orderby form-select"
                       aria-label="Shop order"
                       onChange={(e) =>
                         onFilterChange({
                           orderby: e.target.value || "featured",
                         })
                       }
                       value={currentFilters.orderby ?? "featured"} // <— default to "featured"
                     >
                       <option value="featured">Featured</option>
                       <option value="price_asc">Price (Low to High)</option>
                       <option value="price_desc">Price (High to Low)</option>
                       <option value="year-desc">Year Made (High to Low)</option>
                       <option value="year-asc">Year Made (Low to High)</option>
                     </select>
 
                     {/* <input type="hidden" name="paged" value={filters.orderby} /> */}
                   </div>
                 </form>
               </div>
             </div>
           </div>
         </div>
         <div className="other_items featured_items">
           <div className="related-products">
             <div className="d-flex align-items-center justify-content-between mb-3">
               <h3 className="featured_head">Featured listings</h3>
               <div className="d-flex gap-2">
                 <button
                   ref={prevRef}
                   className="swiper-button-prev-custom btn btn-light btn-sm"
                 >
                   <i className="bi bi-chevron-left"></i>
                 </button>
                 <button
                   ref={nextRef}
                   className="swiper-button-next-custom btn btn-light btn-sm"
                 >
                   <i className="bi bi-chevron-right"></i>
                 </button>
               </div>
             </div>
 
             <Swiper
               modules={[Navigation, Autoplay]}
               spaceBetween={10}
               slidesPerView={1}
               breakpoints={{
                 640: { slidesPerView: 1 },
                 768: { slidesPerView: 2 },
                 1024: { slidesPerView: 2 },
               }}
               autoplay={{ delay: 5000, disableOnInteraction: false }}
               navigation={{
                 prevEl: prevRef.current,
                 nextEl: nextRef.current,
               }}
               onInit={(swiper) => {
                 if (
                   swiper.params.navigation &&
                   typeof swiper.params.navigation !== "boolean"
                 ) {
                   swiper.params.navigation.prevEl = prevRef.current;
                   swiper.params.navigation.nextEl = nextRef.current;
                   swiper.navigation.init();
                   swiper.navigation.update();
                 }
               }}
               className="featured-swiper"
             >
               {fetauredProducts.map((item, index) => (
                 <SwiperSlide key={index}>
                   <Link href={productHref("grand-explorer")} prefetch={false}>
                     <div className="product-card">
                       <div className="img">
                         <div className="background_thumb">
                           <Image
                             src="/images/sample3.jpg"
                             alt="Caravan"
                             width={300}
                             height={200}
                             unoptimized
                           />
                         </div>
                         <div className="main_thumb">
                           <Image
                             src="/images/sample3.jpg"
                             alt="Caravan"
                             width={300}
                             height={200}
                             unoptimized
                           />
                         </div>
                       </div>
                       <div className="product_de">
                         <div className="info">
                           {item.name && <h3 className="title">{item.name}</h3>}
                         </div>
 
                         {/* --- PRICE SECTION --- */}
                         {(item.regular_price ||
                           item.sale_price ||
                           item.price_difference) && (
                           <div className="price">
                             <div className="metc2">
                               {(item.regular_price || item.sale_price) && (
                                 <h5 className="slog">
                                   {item.regular_price && (
                                     <>{item.regular_price}</>
                                   )}
                                   {item.sale_price && <s>{item.sale_price}</s>}
                                 </h5>
                               )}
 
                               {item.price_difference &&
                                 item.price_difference !== "0" &&
                                 item.price_difference !== "$0" && (
                                   <p className="card-price">
                                     <span>SAVE</span> {item.price_difference}
                                   </p>
                                 )}
 
                               <div className="more_info">
                                 <button
                                   onClick={(e) => {
                                     e.preventDefault();
                                     setShowInfo(true);
                                   }}
                                 >
                                   <i className="fa fa-info-circle"></i> Info
                                 </button>
                               </div>
                             </div>
                           </div>
                         )}
 
                         {/* --- DETAILS LIST --- */}
                         <ul className="vehicleDetailsWithIcons simple">
                           {item.condition && (
                             <li>
                               <span className="attribute3">
                                 {item.condition}
                               </span>
                             </li>
                           )}
 
                           {item.categories && item.categories.length > 0 && (
                             <li className="attribute3_list">
                               <span className="attribute3">
                                 {item.categories.join(", ")}
                               </span>
                             </li>
                           )}
 
                           {item.length && (
                             <li>
                               <span className="attribute3">{item.length}</span>
                             </li>
                           )}
 
                           {item.kg && (
                             <li>
                               <span className="attribute3">{item.kg}</span>
                             </li>
                           )}
 
                           {item.make && (
                             <li>
                               <span className="attribute3">{item.make}</span>
                             </li>
                           )}
                         </ul>
 
                         {/* --- CONDITION + LOCATION --- */}
                         {(item.condition || item.location) && (
                           <div className="bottom_mid">
                             {item.condition && (
                               <span>
                                 <i className="bi bi-check-circle-fill"></i>{" "}
                                 Condition {item.condition}
                               </span>
                             )}
                             {item.location && (
                               <span>
                                 <i className="fa fa-map-marker-alt"></i>{" "}
                                 {item.location}
                               </span>
                             )}
                           </div>
                         )}
 
                         {/* --- BUTTONS --- */}
                         <div className="bottom_button">
                           <button
                             className="btn"
                             onClick={(e) => {
                               e.preventDefault();
                               setShowContact(true);
                             }}
                           >
                             Contact Dealer
                           </button>
                           <button className="btn btn-primary">
                             View Details
                           </button>
                         </div>
                       </div>
                     </div>
                   </Link>
                 </SwiperSlide>
               ))}
             </Swiper>
           </div>
         </div>
         {/* {premium section } */}
         <div className="dealers-section product-type">
           <div className="other_items">
             <div className="related-products">
               <div className="row g-3">
                 {preminumProducts.map((item, index) => (
                   <div className="col-lg-6 mb-0" key={index}>
                     <Link
                       href={productHref("grand-explorer")}
                       prefetch={false}
                       className="lli_head"
                     >
                       <div className="product-card">
                         <div className="img">
                           <div className="background_thumb">
                             <Image
                               src="/images/sample3.jpg"
                               alt="Caravan"
                               width={300}
                               height={200}
                               unoptimized
                             />
                           </div>
                           <div className="main_thumb position-relative">
                             <span className="lab">Spotlight Van</span>
                             <Swiper
                               modules={[Navigation, Pagination]}
                               spaceBetween={10}
                               slidesPerView={1}
                               navigation
                               pagination={{
                                 clickable: true,
                                 //dynamicBullets: true, // adds smooth, minimal bullets
                               }}
                               onSlideChange={(swiper) => {
                                 const isLast =
                                   swiper.activeIndex ===
                                   swiper.slides.length - 1;
                                 const viewMoreBtn = document.querySelector(
                                   `#view-more-btn-${item}`
                                 );
                                 if (viewMoreBtn instanceof HTMLElement) {
                                   viewMoreBtn.style.display = isLast
                                     ? "block"
                                     : "none";
                                 }
                               }}
                               className="main_thumb_swiper"
                             >
                               {[
                                 "/images/thumb-1.jpg",
                                 "/images/thumb-2.jpg",
                                 "/images/thumb-3.jpg",
                                 "/images/thumb-4.jpg",
                               ].map((img, i) => (
                                 <SwiperSlide key={i}>
                                   <div className="thumb_img">
                                     <Image
                                       src={img}
                                       alt={`Caravan ${i + 1}`}
                                       width={300}
                                       height={200}
                                       unoptimized
                                     />
                                   </div>
                                 </SwiperSlide>
                               ))}
                             </Swiper>
 
                             {/* Hidden "View More" button that appears after last slide */}
                             <div
                               id={`view-more-btn-${item}`}
                               className="view-more-btn-wrapper"
                             >
                               <Link
                                 href="/related-links"
                                 className="view-more-btn"
                               >
                                 View More
                               </Link>
                             </div>
                           </div>
                         </div>
                         <div className="product_de">
                           <div className="info">
                             {item.name && (
                               <h3 className="title">{item.name}</h3>
                             )}
                           </div>
 
                           {/* --- PRICE SECTION --- */}
                           {(item.regular_price ||
                             item.sale_price ||
                             item.price_difference) && (
                             <div className="price">
                               <div className="metc2">
                                 {(item.regular_price || item.sale_price) && (
                                   <h5 className="slog">
                                     {item.regular_price && (
                                       <>{item.regular_price}</>
                                     )}
                                     {item.sale_price && (
                                       <s>{item.sale_price}</s>
                                     )}
                                   </h5>
                                 )}
 
                                 {item.price_difference &&
                                   item.price_difference !== "0" &&
                                   item.price_difference !== "$0" && (
                                     <p className="card-price">
                                       <span>SAVE</span> {item.price_difference}
                                     </p>
                                   )}
 
                                 <div className="more_info">
                                   <button
                                     onClick={(e) => {
                                       e.preventDefault();
                                       setShowInfo(true);
                                     }}
                                   >
                                     <i className="fa fa-info-circle"></i> Info
                                   </button>
                                 </div>
                               </div>
                             </div>
                           )}
 
                           {/* --- DETAILS LIST --- */}
                           <ul className="vehicleDetailsWithIcons simple">
                             {item.condition && (
                               <li>
                                 <span className="attribute3">
                                   {item.condition}
                                 </span>
                               </li>
                             )}
 
                             {item.categories && item.categories.length > 0 && (
                               <li className="attribute3_list">
                                 <span className="attribute3">
                                   {item.categories.join(", ")}
                                 </span>
                               </li>
                             )}
 
                             {item.length && (
                               <li>
                                 <span className="attribute3">
                                   {item.length}
                                 </span>
                               </li>
                             )}
 
                             {item.kg && (
                               <li>
                                 <span className="attribute3">{item.kg}</span>
                               </li>
                             )}
 
                             {item.make && (
                               <li>
                                 <span className="attribute3">{item.make}</span>
                               </li>
                             )}
                           </ul>
 
                           {/* --- CONDITION + LOCATION --- */}
                           {(item.condition || item.location) && (
                             <div className="bottom_mid">
                               {item.condition && (
                                 <span>
                                   <i className="bi bi-check-circle-fill"></i>{" "}
                                   Condition {item.condition}
                                 </span>
                               )}
                               {item.location && (
                                 <span>
                                   <i className="fa fa-map-marker-alt"></i>{" "}
                                   {item.location}
                                 </span>
                               )}
                             </div>
                           )}
 
                           {/* --- BUTTONS --- */}
                           <div className="bottom_button">
                             <button
                               className="btn"
                               onClick={(e) => {
                                 e.preventDefault();
                                 setShowContact(true);
                               }}
                             >
                               Contact Dealer
                             </button>
                             <button className="btn btn-primary">
                               View Details
                             </button>
                           </div>
                         </div>
                       </div>
                     </Link>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         </div>
         <div className="dealers-section product-type">
           <div className="other_items">
             <div className="related-products">
               <div className="row g-3">
                 {mergedProducts.map((item, index) => (
                   <div className="col-lg-6 mb-0" key={index}>
                     <Link
                       href={productHref("grand-explorer")}
                       prefetch={false}
                       className="lli_head"
                     >
                       <div className="product-card">
                         <div className="img">
                           <div className="background_thumb">
                             <Image
                               src="/images/sample3.jpg"
                               alt="Caravan"
                               width={300}
                               height={200}
                               unoptimized
                             />
                           </div>
                           <div className="main_thumb position-relative">
                             <span className="lab">Spotlight Van</span>
                             <Swiper
                               modules={[Navigation, Pagination]}
                               spaceBetween={10}
                               slidesPerView={1}
                               navigation
                               pagination={{
                                 clickable: true,
                                 //dynamicBullets: true, // adds smooth, minimal bullets
                               }}
                               onSlideChange={(swiper) => {
                                 const isLast =
                                   swiper.activeIndex ===
                                   swiper.slides.length - 1;
                                 const viewMoreBtn = document.querySelector(
                                   `#view-more-btn-${item}`
                                 );
                                 if (viewMoreBtn instanceof HTMLElement) {
                                   viewMoreBtn.style.display = isLast
                                     ? "block"
                                     : "none";
                                 }
                               }}
                               className="main_thumb_swiper"
                             >
                               {[
                                 "/images/thumb-1.jpg",
                                 "/images/thumb-2.jpg",
                                 "/images/thumb-3.jpg",
                                 "/images/thumb-4.jpg",
                               ].map((img, i) => (
                                 <SwiperSlide key={i}>
                                   <div className="thumb_img">
                                     <Image
                                       src={img}
                                       alt={`Caravan ${i + 1}`}
                                       width={300}
                                       height={200}
                                       unoptimized
                                     />
                                   </div>
                                 </SwiperSlide>
                               ))}
                             </Swiper>
 
                             {/* Hidden "View More" button that appears after last slide */}
                             <div
                               id={`view-more-btn-${item}`}
                               className="view-more-btn-wrapper"
                             >
                               <Link
                                 href="/related-links"
                                 className="view-more-btn"
                               >
                                 View More
                               </Link>
                             </div>
                           </div>
                         </div>
                         <div className="product_de">
                           <div className="info">
                             {item.name && (
                               <h3 className="title">{item.name}</h3>
                             )}
                           </div>
 
                           {/* --- PRICE SECTION --- */}
                           {(item.regular_price ||
                             item.sale_price ||
                             item.price_difference) && (
                             <div className="price">
                               <div className="metc2">
                                 {(item.regular_price || item.sale_price) && (
                                   <h5 className="slog">
                                     {item.regular_price && (
                                       <>{item.regular_price}</>
                                     )}
                                     {item.sale_price && (
                                       <s>{item.sale_price}</s>
                                     )}
                                   </h5>
                                 )}
 
                                 {item.price_difference &&
                                   item.price_difference !== "0" &&
                                   item.price_difference !== "$0" && (
                                     <p className="card-price">
                                       <span>SAVE</span> {item.price_difference}
                                     </p>
                                   )}
 
                                 <div className="more_info">
                                   <button
                                     onClick={(e) => {
                                       e.preventDefault();
                                       setShowInfo(true);
                                     }}
                                   >
                                     <i className="fa fa-info-circle"></i> Info
                                   </button>
                                 </div>
                               </div>
                             </div>
                           )}
 
                           {/* --- DETAILS LIST --- */}
                           <ul className="vehicleDetailsWithIcons simple">
                             {item.condition && (
                               <li>
                                 <span className="attribute3">
                                   {item.condition}
                                 </span>
                               </li>
                             )}
 
                             {item.categories && item.categories.length > 0 && (
                               <li className="attribute3_list">
                                 <span className="attribute3">
                                   {item.categories.join(", ")}
                                 </span>
                               </li>
                             )}
 
                             {item.length && (
                               <li>
                                 <span className="attribute3">
                                   {item.length}
                                 </span>
                               </li>
                             )}
 
                             {item.kg && (
                               <li>
                                 <span className="attribute3">{item.kg}</span>
                               </li>
                             )}
 
                             {item.make && (
                               <li>
                                 <span className="attribute3">{item.make}</span>
                               </li>
                             )}
                           </ul>
 
                           {/* --- CONDITION + LOCATION --- */}
                           {(item.condition || item.location) && (
                             <div className="bottom_mid">
                               {item.condition && (
                                 <span>
                                   <i className="bi bi-check-circle-fill"></i>{" "}
                                   Condition {item.condition}
                                 </span>
                               )}
                               {item.location && (
                                 <span>
                                   <i className="fa fa-map-marker-alt"></i>{" "}
                                   {item.location}
                                 </span>
                               )}
                             </div>
                           )}
 
                           {/* --- BUTTONS --- */}
                           <div className="bottom_button">
                             <button
                               className="btn"
                               onClick={(e) => {
                                 e.preventDefault();
                                 setShowContact(true);
                               }}
                             >
                               Contact Dealer
                             </button>
                             <button className="btn btn-primary">
                               View Details
                             </button>
                           </div>
                         </div>
                       </div>
                     </Link>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         </div>
         <div className="pagination-wrapper mt-4">
           <nav className="woocommerce-pagination custom-pagination mt-4">
             <ul className="pagination-icons">
               <li className="">
                 <span>
                   <button
                     onClick={onPrev}
                     disabled={pagination.current_page === 1}
                     className="prev-icon"
                   >
                     Back
                   </button>
                 </span>
               </li>
               <li className="page-count">
                 {" "}
                 page {pagination.current_page} of {pagination.total_pages}
               </li>
               <li className="">
                 <button
                   className="next-icon"
                   onClick={onNext}
                   disabled={pagination.current_page === pagination.total_pages}
                 >
                   Next
                 </button>
               </li>
             </ul>
           </nav>
         </div>
       </div>
       {showInfo && (
         <div className="popup-overlay">
           <div className="popup-box">
             <button className="close-popup" onClick={() => setShowInfo(false)}>
               ×
             </button>
             <h4>Description</h4>
             <div className="popup-content">
               <p>
                 Introducing the Explorer 18’6 – one of Australia’s best 18ft off
                 road caravans with an ensuite, built using state-of-the-art 3D
                 modelling technology. This caravan is built to handle any
                 terrain with its 6-inch chassis, TEKO Tuff Ride 3000kg
                 Independent Coil Suspension, and 16 inch all-terrain tyres.
                 Standard features in this caravan include Tuson Sway Control,
                 reverse camera, large dual slide out toolbox & a Victron energy
                 system.
               </p>
               <p>
                 Choose between a comfortable café dinette lounge or L shape
                 lounge in this popular rear door 18ft 6 caravan layout. Custom
                 built to your needs, from the exterior and interior colours, to
                 every option and upgrade you can think of, every Grand City is
                 built to the highest quality. Plus, with 2 x 200w solar panels
                 and 2 x 110Ah lithium batteries and 2 x 95L fresh water and a
                 95L grey water tank, you can go off grid and stay off grid for
                 longer. Choose the Explorer for your next adventure where you
                 dare to explore where others won’t!
               </p>
               <h3>CHASSIS</h3>
               <ul>
                 <li>Built by FP Chassis with Australian Made Steel</li>
                 <li>One Piece Honeycomb Composite Floor</li>
                 <li>6 inch Extended A-Frame</li>
                 <li>AL-KO Electronic Stability Control</li>
                 <li>TEKO Tuff Ride Coil Suspension</li>
                 <li>Cruisemaster DO35</li>
                 <li>Corner Drop Down Stabiliser Legs</li>
                 <li>Trail Safe Bluetooth Break-Away Safety System</li>
                 <li>16 inch Wheels</li>
                 <li>All Terrain Tyres (265/75/R16)</li>
                 <li>3 Arm Rear Bumper</li>
                 <li>Kojack Hydraulic Caravan Jack with Wheel Brace</li>
               </ul>
             </div>
           </div>
         </div>
       )}
 
       {/* === Contact Dealer Popup === */}
       {showContact && (
         <div className="popup-overlay">
           <div className="popup-box">
             <button
               type="button"
               className="close-popup"
               onClick={() => setShowContact(false)}
             >
               ×
             </button>
             <h4>Contact Dealer</h4>
             <div className="sidebar-enquiry">
               <form className="wpcf7-form" noValidate>
                 <div className="form">
                   <div className="form-item">
                     <p>
                       <input
                         id="enquiry2-name"
                         className="wpcf7-form-control"
                         required
                         autoComplete="off"
                         aria-invalid="false"
                         aria-describedby="err-name"
                         type="text"
                         name="enquiry2-name"
                       />
                       <label htmlFor="enquiry2-name">Name</label>
                     </p>
                   </div>
 
                   <div className="form-item">
                     <p>
                       <input
                         id="enquiry2-email"
                         className="wpcf7-form-control"
                         required
                         autoComplete="off"
                         aria-invalid="false"
                         aria-describedby="err-email"
                         type="email"
                         name="enquiry2-email"
                       />
                       <label htmlFor="enquiry2-email">Email</label>
                     </p>
                   </div>
 
                   <div className="form-item">
                     <p className="phone_country">
                       <span className="phone-label">+61</span>
                       <input
                         id="enquiry2-phone"
                         inputMode="numeric"
                         className="wpcf7-form-control"
                         required
                         autoComplete="off"
                         aria-invalid="false"
                         aria-describedby="err-phone"
                         type="tel"
                         name="enquiry2-phone"
                       />
                       <label htmlFor="enquiry2-phone">Phone</label>
                     </p>
                   </div>
 
                   <div className="form-item">
                     <p>
                       <input
                         id="enquiry2-postcode"
                         inputMode="numeric"
                         maxLength={4}
                         className="wpcf7-form-control"
                         required
                         autoComplete="off"
                         aria-invalid="false"
                         aria-describedby="err-postcode"
                         type="text"
                         name="enquiry2-postcode"
                       />
                       <label htmlFor="enquiry2-postcode">Postcode</label>
                     </p>
                   </div>
 
                   <div className="form-item">
                     <p>
                       <label htmlFor="enquiry4-message">
                         Message (optional)
                       </label>
                       <textarea
                         id="enquiry4-message"
                         name="enquiry4-message"
                         className="wpcf7-form-control wpcf7-textarea"
                       ></textarea>
                     </p>
                   </div>
 
                   <p className="terms_text">
                     By clicking &lsquo;Send Enquiry&lsquo;, you agree to Caravan
                     Marketplace{" "}
                     <Link target="_blank" href="/privacy-collection-statement/">
                       Collection Statement
                     </Link>
                     ,{" "}
                     <Link target="_blank" href="/privacy-policy/">
                       Privacy Policy
                     </Link>{" "}
                     and{" "}
                     <Link target="_blank" href="/terms-conditions/">
                       Terms and Conditions
                     </Link>
                     .
                   </p>
 
                   <div className="submit-btn">
                     <button type="submit" className="btn btn-primary">
                       Send Enquiry
                     </button>
                   </div>
                 </div>
               </form>
             </div>
           </div>
         </div>
       )}
     </>
   );
 }
 