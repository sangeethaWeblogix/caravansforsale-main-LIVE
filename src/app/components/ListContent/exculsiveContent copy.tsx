"use client";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import Skelton from "../skelton";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { toSlug } from "@/utils/seo/slug";
import ImageWithSkeleton from "../ImageWithSkeleton";
import { useEnquiryForm } from "./enquiryform";
import { usePathname, useRouter } from "next/navigation";

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
  gallery?: string[];
  // Include additional properties that might come from API
  list_page_title?: string;
  weight?: string;
  price?: string;
  thumbnail?: string;
  url?: string;
  sleeps?: string;
  manufacturer?: string;
  is_exclusive?: boolean;
  pageTitle?: string;
  image_url?: string[];
  image_format?: string[];
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
  pageTitle: string; // Add pageTitle prop
  metaTitle: string; // Add metaTitle prop
  metaDescription: string; // Add metaDescription prop
  isPremiumLoading: boolean; // Add isMainLoading prop
}

export default function ExculisiveContent({
  data,
  pageTitle,
  metaTitle,
  metaDescription,
  isPremiumLoading,
}: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lazyImages, setLazyImages] = useState<{ [key: string]: string[] }>({});
  const router = useRouter();

  const [loadedAll, setLoadedAll] = useState<{ [key: string]: boolean }>({});
  const [swiperActivated, setSwiperActivated] = useState<
    Record<number, boolean>
  >({});
  const [swiperKey, setSwiperKey] = useState(0);
  const [navigating, setNavigating] = useState(false);

  const pathname = usePathname();
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "listingsReturnUrl",
        window.location.pathname + window.location.search,
      );
    } catch {}
  }, []);
  useEffect(() => {
    // 🔥 Route finished changing → stop loader
    setNavigating(false);
  }, [pathname]);
  const enquiryProduct = selectedProduct
    ? {
        id: selectedProduct.id,
        slug: selectedProduct.slug,
        name: selectedProduct.name,
      }
    : {
        id: 0,
        slug: "",
        name: "",
      };

  const {
    form,
    errors,
    touched,
    submitting,
    setField,
    onBlur,
    onSubmit,
    isFinanceQuoteChecked,
    setFinanceQuoteChecked,
  } = useEnquiryForm(enquiryProduct);

  // Remove all the lazy loading state and just load all images immediately

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
  console.log("exxx", data);
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

  // ✅ Helper: generate up to 5 image URLs from SKU

  const IMAGE_BASE_URL = "https://caravansforsale.imagestack.net/400x300/";

  const IMAGE_EXT = ".avif";
  const goToProduct = (href: string) => {
    try {
      sessionStorage.setItem("cameFromListings", "true");
      sessionStorage.setItem(
        "listingsReturnUrl",
        window.location.pathname + window.location.search,
      );
    } catch {}

    router.push(href);
  };

  useEffect(() => {
    const cameBack = sessionStorage.getItem("cameFromListings");

    if (cameBack) {
      // 🔁 force swiper remount
      setSwiperKey((k) => k + 1);

      // optional: reset activation map
      setSwiperActivated({});
      setLazyImages({});
      setLoadedAll({});

      sessionStorage.removeItem("cameFromListings");
    }
  }, []);

  const handleViewDetails = async (
    e: React.MouseEvent,
    productId: number,
    href: string,
  ) => {
    e.preventDefault(); // stop <Link> default
    e.stopPropagation(); // stop bubbling to parent

    // 🔁 show loader
    setNavigating(true);

    // 🔁 tracking + session flag
    await handleProductClick(productId);

    // 🔁 navigate
    goToProduct(href);
  };
  const MAX_SWIPER_IMAGES = 5;

  const getFirstImage = (item: Product): string | undefined => {
    const img = item.image_format?.[0];
    return img ? `${IMAGE_BASE_URL}${img}${IMAGE_EXT}` : undefined;
  };

  const getRemainingImages = (item: Product): string[] => {
    if (!Array.isArray(item.image_format)) return [];

    return item.image_format
      .slice(0, MAX_SWIPER_IMAGES)
      .map((img) => `${IMAGE_BASE_URL}${img}${IMAGE_EXT}`);
  };

  const loadRemaining = (item: Product) => {
    if (loadedAll[item.id]) return;

    const images = getRemainingImages(item);

    setLazyImages((prev) => ({
      ...prev,
      [item.id]: images,
    }));

    setLoadedAll((prev) => ({
      ...prev,
      [item.id]: true,
    }));
  };
  const getIP = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip || "";
    } catch {
      return "";
    }
  };

  const handleProductClick = async (id) => {
    await postTrackEvent(
      "https://admin.caravansforsale.com.au/wp-json/cfs/v1/update-clicks",
      id,
    );

    // Allow product page to show "Back to Search"
    sessionStorage.setItem("cameFromListings", "true");
  };

  const isRefreshRef = useRef(false);

  useEffect(() => {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;

    if (nav?.type === "reload") {
      isRefreshRef.current = true;
    }
  }, []);

  const postTrackEvent = async (url: string, product_id: number) => {
    const ip = await getIP();
    const user_agent = navigator.userAgent;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id,
        ip,
        user_agent,
      }),
    });
  };
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Number(entry.target.getAttribute("data-product-id"));
            postTrackEvent(
              "https://admin.caravansforsale.com.au/wp-json/cfs/v1/update-impressions",
              id,
            );
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 },
    );

    document
      .querySelectorAll(".product-card[data-product-id]")
      .forEach((el) => {
        observer.observe(el);
      });

    return () => observer.disconnect();
  }, [data]);

  const activateSwiper = (item: Product) => {
    if (swiperActivated[item.id]) return;

    setSwiperActivated((prev) => ({
      ...prev,
      [item.id]: true,
    }));

    loadRemaining(item);
  };

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
              <h1 className="show_count">
                <strong>{pageTitle}</strong>
              </h1>
            </div>
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
          </div>
        </div>

        {/* {premium section } */}
        <div className="dealers-section product-type">
          <div className="other_items">
            <div className="related-products">
              <div className="row g-3">
                {data.map((item, index) => {
                  const href = getHref(item);
                  const isPriority = index < 5;
                  const firstImage = getFirstImage(item);
                  const isActive = swiperActivated[item.id];
                  const slides = isActive
                    ? (lazyImages[item.id] ?? [])
                    : firstImage
                      ? [firstImage, firstImage]
                      : [];
                  return (
                    <div className="col-lg-6 mb-0" key={index}>
                      <Link
                        href={href}
                        prefetch={false}
                        className="lli_head"
                        onClick={(e) => {
                          e.preventDefault();
                          goToProduct(href);
                        }}
                      >
                        <div
                          className={`product-card sku-${item.sku}`}
                          data-product-id={item.id}
                        >
                          <div className="img">
                            <div className="background_thumb">
                              <ImageWithSkeleton
                                src={firstImage}
                                priority={isPriority}
                                alt="Caravan"
                                width={400}
                                height={300}
                              />
                            </div>
                            <div
                              className="main_thumb position-relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="lab">Spotlight Van</span>

                              <Swiper
                                key={`${swiperKey}-${item.id}`}
                                modules={[Navigation, Pagination]}
                                slidesPerView={1}
                                navigation
                                pagination={{ clickable: true }}
                                watchOverflow={false} // 🔥 IMPORTANT
                                allowTouchMove={true}
                                onMouseEnter={() => {
                                  if (!swiperActivated[item.id]) {
                                    activateSwiper(item);
                                  }
                                }}
                                onTouchStart={() => {
                                  if (!swiperActivated[item.id]) {
                                    activateSwiper(item);
                                  }
                                }}
                                onNavigationNext={() => {
                                  if (!swiperActivated[item.id]) {
                                    activateSwiper(item);
                                  }
                                }}
                                onNavigationPrev={() => {
                                  if (!swiperActivated[item.id]) {
                                    activateSwiper(item);
                                  }
                                }}
                                className="main_thumb_swiper"
                              >
                                {slides.map((img, i) => (
                                  <SwiperSlide key={i}>
                                    <div className="thumb_img">
                                      <ImageWithSkeleton
                                        src={img}
                                        alt={`Caravan ${i + 1}`}
                                        width={400}
                                        height={300}
                                      />
                                    </div>
                                  </SwiperSlide>
                                ))}
                              </Swiper>
                            </div>
                          </div>
                          <div className="product_de">
                            <div className="info">
                              {item.name && (
                                <h3
                                  className="title cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    goToProduct(href);
                                  }}
                                >
                                  {item.name}
                                </h3>
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
                                          "",
                                        );
                                        const regNum =
                                          Number(cleanRegular) || 0;
                                        const cleanSale = rawSale.replace(
                                          /[^0-9.]/g,
                                          "",
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
                                Contact Seller
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
                    __html: selectedProduct.description.replace(
                      /\\r\\n/g,
                      "<br/>",
                    ),
                  }}
                />
              ) : (
                <p>No description available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === Contact Seller Popup === */}
      {showContact && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button
              type="button"
              className="close-popup"
              onClick={() => {
                setShowContact(false);
                setSelectedProduct(null); // reset selected product
              }}
            >
              ×
            </button>

            <h4>Contact Seller</h4>

            <div className="sidebar-enquiry">
              <form className="wpcf7-form" noValidate onSubmit={onSubmit}>
                <div className="form">
                  {/* Name */}
                  <div className="form-item">
                    <p>
                      <input
                        id="enquiry2-name"
                        className="wpcf7-form-control"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        onBlur={() => onBlur("name")}
                        required
                        autoComplete="off"
                      />
                      <label htmlFor="enquiry2-name">Name</label>
                    </p>
                    {touched.name && errors.name && (
                      <div className="cfs-error">{errors.name}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="form-item">
                    <p>
                      <input
                        id="enquiry2-email"
                        className="wpcf7-form-control"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        onBlur={() => onBlur("email")}
                        required
                        autoComplete="off"
                      />
                      <label htmlFor="enquiry2-email">Email</label>
                    </p>
                    {touched.email && errors.email && (
                      <div className="cfs-error">{errors.email}</div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="form-item">
                    <p className="phone_country">
                      <span className="phone-label">+61</span>
                      <input
                        id="enquiry2-phone"
                        className="wpcf7-form-control"
                        inputMode="numeric"
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        onBlur={() => onBlur("phone")}
                        required
                        autoComplete="off"
                      />
                      <label htmlFor="enquiry2-phone">Phone</label>
                    </p>
                    {touched.phone && errors.phone && (
                      <div className="cfs-error">{errors.phone}</div>
                    )}
                  </div>

                  {/* Postcode */}
                  <div className="form-item">
                    <p>
                      <input
                        id="enquiry2-postcode"
                        className="wpcf7-form-control"
                        inputMode="numeric"
                        maxLength={4}
                        value={form.postcode}
                        onChange={(e) => setField("postcode", e.target.value)}
                        onBlur={() => onBlur("postcode")}
                        required
                        autoComplete="off"
                      />
                      <label htmlFor="enquiry2-postcode">Postcode</label>
                    </p>

                    {touched.postcode && errors.postcode && (
                      <div className="cfs-error">{errors.postcode}</div>
                    )}
                  </div>

                  {/* Message */}
                  <div className="form-item">
                    <p>
                      <label htmlFor="enquiry4-message">
                        Message (optional)
                      </label>
                      <textarea
                        id="enquiry4-message"
                        className="wpcf7-form-control wpcf7-textarea"
                        value={form.message}
                        onChange={(e) => setField("message", e.target.value)}
                      ></textarea>
                    </p>
                  </div>

                  {/* finance checkbox */}
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="financeQuote"
                      onChange={() =>
                        setFinanceQuoteChecked((prevState) => !prevState)
                      }
                      checked={isFinanceQuoteChecked}
                    />
                    <label htmlFor="financeQuote">
                      Get a no-obligation finance quote with competitive rates
                    </label>
                  </div>

                  <p className="terms_text">
                    By clicking &lsquo;Send Enquiry&lsquo;, you agree to Caravan
                    Marketplace{" "}
                    <Link href="/privacy-collection-statement" target="_blank">
                      Collection Statement
                    </Link>
                    ,{" "}
                    <Link href="/privacy-policy" target="_blank">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link href="/terms-conditions" target="_blank">
                      Terms and Conditions
                    </Link>
                    .
                  </p>

                  <div className="submit-btn">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? "Sending..." : "Send Enquiry"}
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
