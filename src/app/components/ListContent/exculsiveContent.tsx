 "use client";
 import Image from "next/image";
 import Link from "next/link";
 import { Swiper, SwiperSlide } from "swiper/react";
    import { Navigation,   Pagination } from "swiper/modules";
 
 import "swiper/css";
 import "swiper/css/navigation";
  import "swiper/css/pagination";
 import "../../listings/listings.css";
 import Head from "next/head";
   import Skelton from '../skelton'
 
 import { toSlug } from "../../../utils/seo/slug";
 import { useEffect, useMemo, useState } from "react";
  import "./exculisve.css";
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
   data: Product[];
 pagination: Pagination;
    onNext: () => void;
    onPrev: () => void;
    
     isPremiumLoading: boolean; // Add isMainLoading prop
 }
 
 export default function ExculisiveContent({
  data,
     pagination,
    onNext,
    onPrev,
    
     isPremiumLoading,
 }: Props) {
   // const imageUrl = "public/favicon.ico";
    const [showInfo, setShowInfo] = useState(false);
       const [showContact, setShowContact] = useState(false);
     const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
   
       
   const getHref = (p: Product) => {
     const slug = p.slug?.trim() || toSlug(p.name);
     return slug ? `/product/${slug}/` : ""; // trailing slash optional
   };

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
   const uniqueProducts = useMemo(() => {
     const seen = new Set<string>();
     return (data || []).filter((p) => {
       const k = String(p?.id ?? p?.slug ?? p?.link);
       if (seen.has(k)) return false;
       seen.add(k);
       return true;
     });
   }, [data]);
   console.log("pagoination", pagination);

   const getProductImages = (sku?: string): string[] => {
  if (!sku) return ["/images/sample3.jpg"]; // fallback
  const base = `https://www.admin.caravansforsale.com.au/wp-content/uploads/thumbnail/${sku}`;
  return Array.from({ length: 5 }, (_, i) => `${base}/${i + 1}.jpg`);
};
   return (
     <>
      
       <div className="col-lg-6 col-md-8">
         <div className="row align-items-center">
           <div className="flex flex-col items-center justify-center text-center py-10 search-icon">
             {/* <Image
               src="/images/search.png"
               alt="No Results"
               width={10}
               height={10}
               className="search-icon"
             /> */}
             <i className="bi bi-search" />
             <h4 className="text-lg font-semibold text-gray-800">
               No caravans match your filters
             </h4>
             <p className="text-gray-500 mt-1 max-w-md">
               Here are some Spotlight Vans that may interest you.
             </p>
           </div>
         </div>
         
 
          <div className="dealers-section product-type">
                     <div className="other_items">
                       <div className="related-products">
                         <div className="row g-3">
                           {uniqueProducts.map((item, index) => {  
                             const href = getHref(item);
                             const images = getProductImages(item.sku);
         
                     return (
         
                             <div className="col-lg-6 mb-0" key={index}>
                               <Link
         href={href}
                             onClick={() => {
                               if (typeof window !== "undefined") {
                                 sessionStorage.setItem("cameFromListings", "true");
                               }
                             }}                        prefetch={false}
                                 className="lli_head"
                               >
                                 <div className="product-card">
                                   <div className="img">
                                     <div className="background_thumb">
                                       <Image
               src={images[1]}
                                         alt="Caravan"
                                         width={300}
                                         height={200}
                                         unoptimized
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
                                         {images.map((img, i) => (
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
                                       )}
           
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
                                                  setSelectedProduct(item);
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
                           );
                   })}
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
        {showInfo && selectedProduct && (
                 <div className="popup-overlay">
                   <div className="popup-box">
                     <button className="close-popup" onClick={() => setShowInfo(false)}>
                       ×
                     </button>
                     <h4>Description</h4>
                     <div className="popup-content">
                        {selectedProduct.description ? (
                 <div
                   className="description-text"
                   dangerouslySetInnerHTML={{
                     __html: selectedProduct.description.replace(/\\r\\n/g, "<br/>"),
                   }}
                 />
               ) : (
                 <p>No description available.</p>
               )}
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
 