 "use client";
 import Link from "next/link";
 import { Swiper, SwiperSlide } from "swiper/react";
 import "swiper/css";
 import "swiper/css/navigation";
 import "swiper/css/pagination";
 import { Navigation, Autoplay, Pagination } from "swiper/modules";
 import Skelton from "../skelton";
 import Head from "next/head";
 import { useEffect, useMemo, useRef, useState } from "react";
 import { toSlug } from "@/utils/seo/slug";
 import ImageWithSkeleton from "../ImageWithSkeleton";
  
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
   description?: string;
   sku?: string;
   is_exclusive?: boolean
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
   isMainLoading: boolean;
   isFeaturedLoading: boolean;
   isPremiumLoading: boolean;
   isNextLoading: boolean;
   pageTitle: string;
 }
 
 export default function ListingContent({
   pageTitle,
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
   isFeaturedLoading,
   isPremiumLoading,
   isMainLoading,
   isNextLoading,
 }: Props) {
   // const [isClient, setIsClient] = useState(false);
 
   // useEffect(() => {
   //   setIsClient(true);
   // }, []);
 
   const prevRef = useRef(null);
   const nextRef = useRef(null);
 
   console.log("data-product", exculisiveProducts);
   console.log("data-premium", preminumProducts);
   console.log("data-featu", fetauredProducts);
   // const handleChange = (e) => {
   //   setOrderBy(e.target.value);
   // };
 
   const getMainImage = (sku?: string, slug?: string): string => {
     if (!sku || !slug) return "/images/sample3.webp";
     return `https://caravansforsale.imagestack.net/800x600/${sku}/${slug}main1.webp`;
   };
 
   const getSubImages = (sku?: string, slug?: string): string[] => {
     if (!sku || !slug) return [];
 
     const base = `https://caravansforsale.imagestack.net/800x600/${sku}/${slug}`;
     // sub1 → sub10
     return Array.from({ length: 10 }, (_, i) => `${base}sub${i + 1}.webp`);
   };
 
   // Remove all the lazy loading state and just load all images immediately
 
  const mergedProducts = useMemo(() => {
   const merged: Product[] = [];
   const exclusive = exculisiveProducts || [];
   const normal = products || [];
 
   let exclusiveIndex = 0;
 
   for (let i = 0; i < normal.length; i++) {
     // normal product
     merged.push({ ...normal[i],  is_exclusive: false });
 
     // insert exclusive after every 8 products
     if ((i + 1) % 4 === 0 && exclusiveIndex < exclusive.length) {
       merged.push({
         ...exclusive[exclusiveIndex],
         name: exclusive[exclusiveIndex].name || "Caravan",
          is_exclusive: true,
       });
       exclusiveIndex++;
     }
   }
 
   // if exclusive products remain, push them at end
   while (exclusiveIndex < exclusive.length) {
     merged.push({
       ...exclusive[exclusiveIndex],
       name: exclusive[exclusiveIndex].name || "Caravan",
        is_exclusive: true,
     });
     exclusiveIndex++;
   }
 
   return merged;
 }, [products, exculisiveProducts]);
 
 
   // Example placeholder function for product links
 
   // const imageUrl = "public/favicon.ico";
   const getHref = (p: Product) => {
     const slug = p.slug?.trim() || toSlug(p.name);
     return slug ? `/product/${slug}/` : ""; // trailing slash optional
   };
   // const uniqueProducts = useMemo(() => {
   //   const seen = new Set<string>();
   //   return (products || []).filter((p) => {
   //     const k = String(p?.id ?? p?.slug ?? p?.link);
   //     if (seen.has(k)) return false;
   //     seen.add(k);
   //     return true;
   //   });
   // }, [products]);
   console.log("data", mergedProducts);
 
   // ✅ Helper: generate up to 5 image URLs from SKU
 
   // ✅ Randomly shuffle premium products on each page load
   // ✅ Premium products shuffle after mount
   const [shuffledPremiumProducts, setShuffledPremiumProducts] = useState<
     Product[]
   >([]);
 
   useEffect(() => {
     if (!preminumProducts || preminumProducts.length === 0) return;
 
     // Fisher–Yates shuffle
     const shuffled = [...preminumProducts];
     for (let i = shuffled.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
     }
 
     setShuffledPremiumProducts(shuffled);
   }, [preminumProducts]);
 
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
            <div className="col-lg-8 col-sm-6">
               <h1 className="show_count">
                 <strong>{pageTitle}</strong>
               </h1>
             </div>
            <div className="col-4 col-sm-2 d-lg-none ">
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

            <div className="col-lg-4 col-sm-4 col-8">
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
         {fetauredProducts.length > 0 && (
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
               {isFeaturedLoading ? (
                 <Skelton count={3} /> // ✅ show skeletons
               ) : (
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
                   {fetauredProducts.map((item, index) => {
                     const href = getHref(item);
                     const mainImage = getMainImage(item.sku, item.slug);
 
                     return (
                       <SwiperSlide key={index}>
                         <Link
                           href={href}
                           prefetch={false}
                           onClick={() => {
                             if (typeof window !== "undefined") {
                               sessionStorage.setItem(
                                 "cameFromListings",
                                 "true"
                               );
                             }
                           }}
                         >
                           <div className="product-card">
                             <div className="img">
                               <div className="background_thumb">
                                 <ImageWithSkeleton
                                   src={mainImage}
                                   alt="Caravan"
                                   width={300}
                                   height={200}
                                 />
                               </div>
                               <div className="main_thumb">
                                 <ImageWithSkeleton
                                   src={mainImage}
                                   alt="Caravan"
                                   width={300}
                                   height={200}
                                 />
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
                                     {(item.regular_price ||
                                       item.sale_price) && (
                                       <h5 className="slog">
                                         {/* ✅ Stable price rendering: precompute safely */}
                                         {(() => {
                                           const rawRegular =
                                             item.regular_price || "";
                                           const rawSale = item.sale_price || "";
                                           const cleanRegular =
                                             rawRegular.replace(/[^0-9.]/g, "");
                                           const regNum =
                                             Number(cleanRegular) || 0;
                                           const cleanSale = rawSale.replace(
                                             /[^0-9.]/g,
                                             ""
                                           );
                                           const saleNum =
                                             Number(cleanSale) || 0;
 
                                           // If regular price is 0 → show POA
                                           if (regNum === 0) {
                                             return <>POA</>;
                                           }
 
                                           // If sale price exists → show sale and strike-through
                                           if (saleNum > 0) {
                                             return (
                                               <>
                                                 <del>{rawRegular}</del>{" "}
                                                 {rawSale}
                                               </>
                                             );
                                           }
 
                                           // Otherwise → show regular price
                                           return <>{rawRegular}</>;
                                         })()}
                                       </h5>
                                     )}
 
                                     {/* ✅ Show SAVE only if > $0 */}
                                     {(() => {
                                       const cleanDiff = (
                                         item.price_difference || ""
                                       ).replace(/[^0-9.]/g, "");
                                       const diffNum = Number(cleanDiff) || 0;
                                       return diffNum > 0 ? (
                                         <p className="card-price">
                                           <span>SAVE</span>{" "}
                                           {item.price_difference}
                                         </p>
                                       ) : null;
                                     })()}
                                     <div className="more_info">
                                       {item.location && (
                                         <div className="informat">
                                           {item.location && (
                                             <span>
                                               <i className="fa fa-map-marker-alt"></i>{" "}
                                               {item.location}
                                             </span>
                                           )}
                                         </div>
                                       )}
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
 
                                 {item.categories &&
                                   item.categories.length > 0 && (
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
                                     <span className="attribute3">
                                       {item.kg}
                                     </span>
                                   </li>
                                 )}
 
                                 {item.make && (
                                   <li>
                                     <span className="attribute3">
                                       {item.make}
                                     </span>
                                   </li>
                                 )}
                               </ul>
                             </div>
                           </div>
                         </Link>
                       </SwiperSlide>
                     );
                   })}
                 </Swiper>
               )}
             </div>
           </div>
         )}
         {/* {premium section } */}
         <div className="dealers-section product-type">
           <div className="other_items">
             <div className="related-products">
               <div className="row g-3">
                 {shuffledPremiumProducts.map((item, index) => {
                   const href = getHref(item);
                   const mainImage = getMainImage(item.sku, item.slug);
                   const subImages = getSubImages(item.sku, item.slug);
                   return (
                     <div className="col-lg-12 mb-0" key={index}>
                       <Link
                         href={href}
                         onClick={() => {
                           if (typeof window !== "undefined") {
                             sessionStorage.setItem("cameFromListings", "true");
                           }
                         }}
                         prefetch={false}
                         className="lli_head"
                       >
                         <div className="product-card">
                           <div className="img">
                             <div className="background_thumb">
                               <ImageWithSkeleton
                                 src={mainImage}
                                 // priority={isPriority}
                                 alt="Caravan"
                                 width={300}
                                 height={200}
                               />
                             </div>
                             <div className="main_thumb position-relative">
                               <span className="lab">Spotlight Van</span>
                               {isPremiumLoading ? (
                                 <Skelton count={2} /> // ✅ show skeletons
                               ) : (
                                 <Swiper
                                   modules={[Navigation, Pagination]}
                                   spaceBetween={10}
                                   slidesPerView={1}
                                   navigation
                                   pagination={{
                                     clickable: true,
                                   }}
                                   className="main_thumb_swiper"
                                 >
                                   {subImages.map((img, i) => (
                                     <SwiperSlide key={i}>
                                       <div className="thumb_img">
                                         <ImageWithSkeleton
                                           src={img}
                                           alt={`Caravan ${i + 1}`}
                                           width={300}
                                           height={200}
                                           // priority={isPriority && i === 0}
                                         />
                                       </div>
                                     </SwiperSlide>
                                   ))}
                                 </Swiper>
                               )}
 
                               {/* Hidden "View More" button that appears after last slide */}
                               {/* <div
                                                                       id={`view-more-btn-${item}`}
                                                                       className="view-more-btn-wrapper"
                                                                     >
                                                                       <Link
                                                                         href="/related-links"
                                                                         className="view-more-btn"
                                       
                                                                       >
                                                                         View More
                                                                       </Link>
                                                                     </div> */}
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
                                       {/* ✅ Stable price rendering: precompute safely */}
                                       {(() => {
                                         const rawRegular =
                                           item.regular_price || "";
                                         const rawSale = item.sale_price || "";
                                         const cleanRegular = rawRegular.replace(
                                           /[^0-9.]/g,
                                           ""
                                         );
                                         const regNum =
                                           Number(cleanRegular) || 0;
                                         const cleanSale = rawSale.replace(
                                           /[^0-9.]/g,
                                           ""
                                         );
                                         const saleNum = Number(cleanSale) || 0;
 
                                         // If regular price is 0 → show POA
                                         if (regNum === 0) {
                                           return <>POA</>;
                                         }
 
                                         // If sale price exists → show sale and strike-through
                                         if (saleNum > 0) {
                                           return (
                                             <>
                                               <del>{rawRegular}</del> {rawSale}
                                             </>
                                           );
                                         }
 
                                         // Otherwise → show regular price
                                         return <>{rawRegular}</>;
                                       })()}
                                     </h5>
                                   )}
 
                                   {/* ✅ Show SAVE only if > $0 */}
                                   {(() => {
                                     const cleanDiff = (
                                       item.price_difference || ""
                                     ).replace(/[^0-9.]/g, "");
                                     const diffNum = Number(cleanDiff) || 0;
                                     return diffNum > 0 ? (
                                       <p className="card-price">
                                         <span>SAVE</span>{" "}
                                         {item.price_difference}
                                       </p>
                                     ) : null;
                                   })()}
 
                                   <div className="more_info">
                                     {item.location && (
                                       <div className="informat">
                                         {item.location && (
                                           <span>
                                             <i className="fa fa-map-marker-alt"></i>{" "}
                                             {item.location}
                                           </span>
                                         )}
                                       </div>
                                     )}
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
 
                               {item.categories &&
                                 item.categories.length > 0 && (
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
                                   <span className="attribute3">
                                     {item.make}
                                   </span>
                                 </li>
                               )}
                             </ul>
                           </div>
                         </div>
                       </Link>
                     </div>
                   );
                 })}
               </div>
             </div>
           </div>
         </div>
         <div className="dealers-section product-type">
           <div className="other_items">
             <div className="related-products">
               {isMainLoading ? (
                 <Skelton count={6} />
               ) : (
                 <div className="row g-3">
                   {mergedProducts.map((item, index) => {
                     const href = getHref(item);
                     const mainImage = getMainImage(item.sku, item.slug);
                     const subImages = getSubImages(item.sku, item.slug);
  
                     return (
                       <div className="col-lg-12 mb-0" key={index}>
                         <Link
                           href={href}
                           onClick={() => {
                             if (typeof window !== "undefined") {
                               sessionStorage.setItem(
                                 "cameFromListings",
                                 "true"
                               );
                             }
                           }}
                           prefetch={false}
                           className="lli_head"
                         >
                           <div className="product-card">
                             <div className="img">
                               <div className="background_thumb">
                                 <ImageWithSkeleton
                                   src={mainImage}
                                   // priority={isPriority}
                                   alt="Caravan"
                                   width={300}
                                   height={200}
                                 />
                               </div>
                               <div className="main_thumb position-relative">
 {item. is_exclusive && <span className="lab">Spotlight Van</span>}
 
                                 {isMainLoading ? (
                                   <Skelton count={2} /> // ✅ show skeletons
                                 ) : (
                                   <Swiper
                                     modules={[Navigation, Pagination]}
                                     spaceBetween={10}
                                     slidesPerView={1}
                                     navigation
                                     pagination={{
                                       clickable: true,
                                     }}
                                     className="main_thumb_swiper"
                                   >
                                     {subImages.map((img, i) => (
                                       <SwiperSlide key={i}>
                                         <div className="thumb_img">
                                           <ImageWithSkeleton
                                             src={img}
                                             alt={`Caravan ${i + 1}`}
                                             width={300}
                                             height={200}
                                             // priority={isPriority && i === 0}
                                           />
                                         </div>
                                       </SwiperSlide>
                                     ))}
                                   </Swiper>
                                 )}
 
                                 {/* Hidden "View More" button that appears after last slide */}
                                 {/* <div
                                                                       id={`view-more-btn-${item}`}
                                                                       className="view-more-btn-wrapper"
                                                                     >
                                                                       <Link
                                                                         href="/related-links"
                                                                         className="view-more-btn"
                                       
                                                                       >
                                                                         View More
                                                                       </Link>
                                                                     </div> */}
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
                                     {(item.regular_price ||
                                       item.sale_price) && (
                                       <h5 className="slog">
                                         {/* ✅ Stable price rendering: precompute safely */}
                                         {(() => {
                                           const rawRegular =
                                             item.regular_price || "";
                                           const rawSale = item.sale_price || "";
                                           const cleanRegular =
                                             rawRegular.replace(/[^0-9.]/g, "");
                                           const regNum =
                                             Number(cleanRegular) || 0;
                                           const cleanSale = rawSale.replace(
                                             /[^0-9.]/g,
                                             ""
                                           );
                                           const saleNum =
                                             Number(cleanSale) || 0;
 
                                           // If regular price is 0 → show POA
                                           if (regNum === 0) {
                                             return <>POA</>;
                                           }
 
                                           // If sale price exists → show sale and strike-through
                                           if (saleNum > 0) {
                                             return (
                                               <>
                                                 <del>{rawRegular}</del>{" "}
                                                 {rawSale}
                                               </>
                                             );
                                           }
 
                                           // Otherwise → show regular price
                                           return <>{rawRegular}</>;
                                         })()}
                                       </h5>
                                     )}
 
                                     {/* ✅ Show SAVE only if > $0 */}
                                     {(() => {
                                       const cleanDiff = (
                                         item.price_difference || ""
                                       ).replace(/[^0-9.]/g, "");
                                       const diffNum = Number(cleanDiff) || 0;
                                       return diffNum > 0 ? (
                                         <p className="card-price">
                                           <span>SAVE</span>{" "}
                                           {item.price_difference}
                                         </p>
                                       ) : null;
                                     })()}
 
                                     <div className="more_info">
                                       {item.location && (
                                         <div className="informat">
                                           {item.location && (
                                             <span>
                                               <i className="fa fa-map-marker-alt"></i>{" "}
                                               {item.location}
                                             </span>
                                           )}
                                         </div>
                                       )}
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
 
                                 {item.categories &&
                                   item.categories.length > 0 && (
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
                                     <span className="attribute3">
                                       {item.kg}
                                     </span>
                                   </li>
                                 )}
 
                                 {item.make && (
                                   <li>
                                     <span className="attribute3">
                                       {item.make}
                                     </span>
                                   </li>
                                 )}
                               </ul>
                             </div>
                           </div>
                         </Link>
                       </div>
                     );
                   })}
                 </div>
               )}
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
                   disabled={
                     pagination.current_page === pagination.total_pages ||
                     !isNextLoading
                   }
                 >
                   Next
                 </button>
               </li>
             </ul>
           </nav>
         </div>
       </div>
       
     </>
   );
 }
 