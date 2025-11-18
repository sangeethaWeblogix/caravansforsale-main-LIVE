 "use client";

import Link from "next/link";

import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";

import "swiper/css/navigation";

import "swiper/css/pagination";

import { Navigation, Pagination } from "swiper/modules";

import Skelton from '../skelton';

import Head from "next/head";

import { useEffect, useMemo, useRef } from "react";

import { toSlug } from "@/utils/seo/slug";

import ImageWithSkeleton from "../ImageWithSkeleton";
 
// ... keep all your interfaces (Product, Filters, Props) unchanged
 
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

  isFeaturedLoading,

  isPremiumLoading,

  isMainLoading,

  isNextLoading

}: Props) {

  const [showInfo, setShowInfo] = useState(false);

  const [showContact, setShowContact] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
 
  // Merge exclusive products every 10 normal ones

  const mergedProducts = useMemo(() => {

    const merged: Product[] = [];

    const exclusive = exculisiveProducts || [];

    const normal = products || [];

    let exclusiveIndex = 0;
 
    for (let i = 0; i < normal.length; i++) {

      merged.push(normal[i]);

      if ((i + 1) % 10 === 0 && exclusiveIndex < exclusive.length) {

        merged.push(exclusive[exclusiveIndex++]);

      }

    }

    while (exclusiveIndex < exclusive.length) {

      merged.push(exclusive[exclusiveIndex++]);

    }

    return merged;

  }, [products, exculisiveProducts]);
 
  // Helper: generate images

  const getProductImages = (sku?: string, slug?: string): string[] => {

    if (!sku || !slug) return ["/images/sample3.webp"];

    const base = `https://caravansforsale.b-cdn.net/Thumbnails/${sku}`;

    const mainImage = `${base}/${slug}-main.webp`;

    const subImages = Array.from({ length: 4 }, (_, i) => `${base}/${slug}-sub${i + 1}.webp`);

    return [mainImage, ...subImages];

  };
 
  const getHref = (p: Product) => {

    const slug = p.slug?.trim() || toSlug(p.name);

    return slug ? `/product/${slug}/` : "";

  };
 
  return (
<>
<Head>
<title>{metaTitle}</title>
<meta name="description" content={metaDescription} />

        {/* other meta tags */}
</Head>
 
      <div className="col-lg-6">

        {/* Your existing top filter, featured, premium sections */}

        {/* ... keep them unchanged ... */}
 
        {/* MAIN PRODUCT GRID */}
<div className="dealers-section product-type">
<div className="other_items">
<div className="related-products">

              {isMainLoading ? (
<Skelton count={10} />

              ) : (
<div className="row g-3">

                  {mergedProducts.map((item, index) => {

                    const href = getHref(item);

                    const images = getProductImages(item.sku, item.slug);
 
                    // First 5 products → load images eagerly (fast LCP)

                    // Rest → lazy load when in viewport

                    const isPriority = index < 5;
 
                    return (
<div className="col-lg-6 mb-0" key={`${item.id || item.slug}-${index}`}>
<Link

                          href={href}

                          prefetch={false}

                          onClick={() => sessionStorage.setItem("cameFromListings", "true")}

                          className="lli_head"
>
<div className="product-card">
<div className="img">

                              {/* Background thumbnail */}
<div className="background_thumb">
<ImageWithSkeleton

                                  src={images[1] || images[0]}

                                  alt="Background"

                                  width={300}

                                  height={200}

                                  priority={isPriority}           // First 5 = priority

                                  loading={isPriority ? "eager" : "lazy"}

                                />
</div>
 
                              {/* Main Swiper */}
<div className="main_thumb position-relative">

                                {item.is_exclusive && <span className="lab">Spotlight Van</span>}
<Swiper

                                  modules={[Navigation, Pagination]}

                                  spaceBetween={10}

                                  slidesPerView={1}

                                  navigation

                                  pagination={{ clickable: true }}

                                  className="main_thumb_swiper"
>

                                  {images.map((img, i) => (
<SwiperSlide key={i}>
<div className="thumb_img">
<ImageWithSkeleton

                                          src={img}

                                          alt={`${item.name} - ${i + 1}`}

                                          width={300}

                                          height={200}

                                          priority={isPriority && i === 0}   // Only first image of first 5 cards

                                          loading={isPriority && i === 0 ? "eager" : "lazy"}

                                        />
</div>
</SwiperSlide>

                                  ))}
</Swiper>
</div>
</div>
 
                            {/* Product Details */}
<div className="product_de">
<div className="info">
<h3 className="title">{item.name}</h3>
</div>
 
                              {/* Price, Info, Details, Buttons */}

                              {/* ... your existing JSX ... */}
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
 
        {/* Pagination (Next/Prev) - keep your existing one */}
<div className="pagination-wrapper mt-4">
<nav className="woocommerce-pagination custom-pagination mt-4">
<ul className="pagination-icons">
<li>
<button onClick={onPrev} disabled={pagination.current_page === 1} className="prev-icon">

                  Back
</button>
</li>
<li className="page-count">

                Page {pagination.current_page} of {pagination.total_pages}
</li>
<li>
<button

                  onClick={onNext}

                  disabled={pagination.current_page >= pagination.total_pages}

                  className="next-icon"
>

                  Next
</button>
</li>
</ul>
</nav>
</div>
</div>
 
      {/* Your popups remain unchanged */}
</>

  );

}
 