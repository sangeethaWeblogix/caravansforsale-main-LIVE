"use client";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "../../listings/listings.css";
import Head from "next/head";
import { toSlug } from "../../../utils/seo/slug";
import { useMemo } from "react";
import Exculisive from "../../../../public/images/exclusive-deal.webp";
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
  is_exclusive: boolean;
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
  pagination: Pagination;
  onNext: () => void;
  onPrev: () => void;
  metaTitle: string; // Add metaTitle prop
  metaDescription: string; // Add metaDescription prop
  onFilterChange: (filters: Filters) => void;
  currentFilters: Filters;
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
}: Props) {
  const imageUrl = "public/favicon.ico";
  const getHref = (p: Product) => {
    const slug = p.slug?.trim() || toSlug(p.name);
    return slug ? `/product/${slug}/` : ""; // trailing slash optional
  };
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    return (products || []).filter((p) => {
      const k = String(p?.id ?? p?.slug ?? p?.link);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [products]);

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
        <meta name="twitter:image" content={imageUrl} /> {/* Twitter image */}
      </Head>

      <div className="col-lg-6 col-md-8">
        <div className="top-filter mb-10">
          <div className="row align-items-center">
            <div className="col-lg-6">
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
            <div className="col-lg-6 col-8">
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
                      <option value="year_desc">Year Made (High to Low)</option>
                      <option value="year_asc">Year Made (Low to High)</option>
                    </select>

                    {/* <input type="hidden" name="paged" value={filters.orderby} /> */}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="dealers-section product-type">
          {uniqueProducts.map((product) => {
            const href = getHref(product);
            return (
              <article
                className="vehicleSearch html general null pro"
                key={product.id}
              >
                <div className="vehicleSearch__column-poster">
                  <Link href={href}>
                    {" "}
                    <div>
                      {product.is_exclusive && (
                        <span className="lab">
                          <Image
                            src={Exculisive}
                            alt="Exclusive Deal"
                            unoptimized
                            width={0}
                            height={0}
                            sizes="100vw"
                            style={{ width: "auto", height: "auto" }}
                          />
                        </span>
                      )}
                      <Swiper
                        navigation
                        modules={[Navigation]}
                        className="mySwiper"
                      >
                        <SwiperSlide>
                          <div className="swiper-zoom-container">
                            {product.image && product.image.trim() !== "" ? (
                              <Image
                                src={product.image}
                                alt="Caravan"
                                width={1593}
                                height={1195}
                              />
                            ) : (
                              <Image
                                src="/images/img.png"
                                alt="Fallback Caravan"
                                width={1593}
                                height={1195}
                              />
                            )}
                          </div>
                        </SwiperSlide>
                      </Swiper>
                    </div>
                  </Link>

                  <div className="vehicleThumbDetails">
                    <div className="title">
                      {product.link ? (
                        <Link href={href}>
                          {" "}
                          <h3 className="woocommerce-loop-product__title">
                            {product.name}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="woocommerce-loop-product__title">
                          {product.name}
                        </h3>
                      )}
                    </div>
                    <ul className="vehicleDetailsWithIcons simple">
                      {product.condition && (
                        <li>
                          <span className="attribute3">
                            {product.condition}
                          </span>
                        </li>
                      )}

                      {product.categories && product.categories.length > 0 && (
                        <li className="attribute3_list">
                          <span className="attribute3">
                            {product.categories.join(", ")}
                          </span>
                        </li>
                      )}

                      {product.length && (
                        <li>
                          <span className="attribute3">{product.length}</span>
                        </li>
                      )}

                      {product.kg && (
                        <li>
                          <span className="attribute3">{product.kg}</span>
                        </li>
                      )}

                      {product.people && (
                        <li>
                          <span className="attribute3">{product.people}</span>
                        </li>
                      )}
                      {product.make && (
                        <li>
                          <span className="attribute3">{product.make}</span>
                        </li>
                      )}
                    </ul>

                    <div className="vehicleThumbDetails__part">
                      <div className="price">
                        <div className="vehicleThumbDetails__part__price">
                          {/* If regular price is 0, show POA */}
                          {Number(product.regular_price) === 0 ? (
                            <span className="woocommerce-Price-amount amount">
                              <bdi>POA</bdi>
                            </span>
                          ) : product.sale_price ? (
                            <>
                              <del>
                                <span className="woocommerce-Price-amount old-price amount">
                                  <bdi>{product.regular_price}</bdi>
                                </span>
                              </del>
                              <ins>
                                <span className="woocommerce-Price-amount amount">
                                  <bdi>{product.sale_price}</bdi>
                                </span>
                              </ins>
                            </>
                          ) : (
                            <span className="woocommerce-Price-amount amount">
                              <bdi>
                                {parseFloat(
                                  String(product.regular_price).replace(
                                    /[^0-9.]/g,
                                    ""
                                  )
                                ) === 0
                                  ? "POA"
                                  : product.regular_price}
                              </bdi>{" "}
                            </span>
                          )}
                        </div>

                        {(() => {
                          const cleaned = (
                            product.price_difference || ""
                          ).replace(/[^0-9.]/g, "");
                          const numericValue = parseFloat(cleaned);
                          return numericValue > 0 ? (
                            <div className="vehicleThumbDetails__part__finance">
                              <span className="n_price">
                                <small>Save</small>
                                <span>{product.price_difference}</span>
                              </span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <div className="vehicleThumbDetails__features__address">
                        <label>Seller Location</label>
                        <h3>{product.location}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
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
    </>
  );
}
