"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CaravanDetailModal from "./CaravanDetailModal";
import "./product.css";
import DOMPurify from "dompurify";

type Attribute = {
  label?: string;
  value?: string;
  url?: string;
  name?: string;
  title?: string;
  val?: string;
  text?: string;
};

type Category = { name?: string; label?: string; value?: string } | string;

interface ApiData {
  product_details?: ProductData;
  main_image?: string;
  images?: string[];
  categories?: Category[];
  id?: string | number;
  slug?: string;
}

interface ProductDetailResponse {
  data?: ApiData;
}

type ProductData = {
  id?: string | number;
  slug?: string;
  name?: string;
  images?: string[];
  main_image?: string;
  location?: string;
  regular_price?: string | number;
  sale_price?: string | number;
  price_difference?: string | number;
  categories?: Category[];
  attribute_urls?: Attribute[];
  description?: string;
};

export default function ClientLogger({
  data,
}: {
  data: ProductDetailResponse;
}) {
  const [activeImage, setActiveImage] = useState<string>("");
  const pd: ApiData = data?.data ?? {};
  const productDetails: ProductData = pd.product_details ?? {};
  const product: ProductData = productDetails;
  const isBrowser = typeof window !== "undefined";

  function decodeEntities(s: string) {
    if (!isBrowser) {
      return s
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }
    const el = document.createElement("textarea");
    el.innerHTML = s;
    return el.value;
  }

  function buildSafeDescription(raw?: string) {
    const base = (raw ?? "").replace(/\\n/g, "\n");
    const decoded = decodeEntities(base);

    if (!isBrowser) {
      const noHeadings = decoded
        .replace(/<\s*h[1-6][^>]*>/gi, "<strong>")
        .replace(/<\s*\/\s*h[1-6]\s*>/gi, "</strong>");
      const stripped = noHeadings
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "");
      return stripped.replace(/\n/g, "<br>");
    }

    const tmp = document.createElement("div");
    tmp.innerHTML = decoded;

    tmp.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
      const strong = document.createElement("strong");
      strong.textContent = h.textContent ?? "";
      h.replaceWith(strong);
    });

    const purified = DOMPurify.sanitize(tmp.innerHTML, {
      ALLOWED_TAGS: ["br", "p", "ul", "ol", "li", "strong", "em", "b", "i"],
      ALLOWED_ATTR: [],
    });

    return purified.replace(/\n/g, "<br>");
  }

  const [safeHtml, setSafeHtml] = useState<string>("");
  useEffect(() => {
    setSafeHtml(buildSafeDescription(productDetails.description));
  }, [productDetails.description]);

  const productImage: string =
    productDetails.main_image || pd.main_image || "/images/img.png";

  const productSubImage: string[] = useMemo(
    () =>
      Array.isArray(productDetails.images)
        ? productDetails.images.filter(Boolean)
        : Array.isArray(pd.images)
        ? pd.images.filter(Boolean)
        : [],
    [productDetails.images, pd.images]
  );

  const images: string[] = useMemo(
    () => (Array.isArray(pd.images) ? pd.images.filter(Boolean) : []),
    [pd.images]
  );

  useEffect(() => {
    const initial = productImage || images[0] || "/images/img.png";
    setActiveImage(initial);
  }, [productImage, images]);

  const [activeTab, setActiveTab] = useState<"specifications" | "description">(
    "specifications"
  );
  const [showModal, setShowModal] = useState(false);

  const attributes: Attribute[] = Array.isArray(productDetails.attribute_urls)
    ? productDetails.attribute_urls
    : [];

  // ---------- helpers ----------
  const getAttr = (label: string): string =>
    attributes.find(
      (a) => String(a?.label ?? "").toLowerCase() === label.toLowerCase()
    )?.value ?? "";

  const findAttr = (label: string): Attribute | undefined =>
    attributes.find(
      (a) => String(a?.label ?? "").toLowerCase() === label.toLowerCase()
    );

  // build listings link from API-provided url (segment or query)
  const linkFromApiUrl = (rawUrl: string, text: string) => {
    const u = (rawUrl || "").trim().replace(/^\/+|\/+$/g, "");
    const href = /[=&]/.test(u) ? `/listings/?${u}` : `/listings/${u}/`;
    return { href, text };
  };

  const isNonEmpty = (s: unknown): s is string =>
    typeof s === "string" && s.trim().length > 0;

  const rawCats: Category[] = Array.isArray(productDetails.categories)
    ? productDetails.categories
    : Array.isArray(pd.categories)
    ? pd.categories
    : [];

  const categoryNames: string[] = rawCats
    .map((c) =>
      typeof c === "string" ? c : c?.name ?? c?.label ?? c?.value ?? ""
    )
    .filter(isNonEmpty);

  const makeValue = getAttr("Make");

  const slugify = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "-");
  const toInt = (s: string) => {
    const n = parseInt(String(s).replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  };

  type LinkOut = { href: string; text: string };
  type SpecItem = { label: string; value: string; url?: string };

  // ---------- spec fields with API urls ----------
  const specFields: SpecItem[] = [
    {
      label: "Type",
      value: categoryNames.join(", ") || getAttr("Type"),
      url: findAttr("Type")?.url,
    },
    { label: "Make", value: getAttr("Make"), url: findAttr("Make")?.url },
    { label: "Model", value: getAttr("Model"), url: findAttr("Model")?.url },
    { label: "Year", value: getAttr("Years"), url: findAttr("Years")?.url },
    {
      label: "Condition",
      value: getAttr("Conditions"),
      url: findAttr("Conditions")?.url,
    },
    {
      label: "Length",
      value: getAttr("Length") || getAttr("length"),
      url: findAttr("Length")?.url ?? findAttr("length")?.url, // ✅ API url (e.g. "under-16-length-in-feet")
    },
    { label: "Sleep", value: getAttr("sleeps"), url: findAttr("sleeps")?.url },
    { label: "ATM", value: getAttr("ATM"), url: findAttr("ATM")?.url }, // ✅ API url (e.g. "under-2000-kg-atm")
    { label: "Tare Mass", value: getAttr("Tare Mass") },
    { label: "Ball Weight", value: getAttr("Ball Weight") },
    {
      label: "Location",
      value: getAttr("Location"),
      url: findAttr("Location")?.url, // e.g. "queensland-state"
    },
  ];

  // prefer API url; fallback to old rules if missing
  const linksForSpec = (
    label: string,
    value: string,
    apiUrl?: string
  ): LinkOut[] | null => {
    const v = (value || "").trim();
    if (!v) return null;

    if (apiUrl && apiUrl.trim()) {
      return [linkFromApiUrl(apiUrl, v)];
    }

    // ---- fallback logic (only if url not supplied) ----
    const L = label.toLowerCase();

    if (L === "category" || L === "type") {
      return v.split(",").map((c) => ({
        href: `/listings/${slugify(c)}-category/`,
        text: c.trim(),
      }));
    }
    if (L === "make") return [{ href: `/listings/${slugify(v)}/`, text: v }];
    if (L === "model")
      return [{ href: `/listings/${makeValue}/${slugify(v)}/`, text: v }];

    if (L === "location" || L === "state")
      return [{ href: `/listings/${slugify(v)}-state/`, text: v }];

    if (L === "year" || L === "years") {
      const y = toInt(v);
      return y
        ? [
            {
              href: `/listings/?acustom_fromyears=${y}&acustom_toyears=${y}`,
              text: v,
            },
          ]
        : null;
    }

    if (L === "sleep" || L === "sleeps") {
      const s = toInt(v);
      return s
        ? [{ href: `/listings/over-${s}-people-sleeping-capacity/`, text: v }]
        : null;
    }

    if (L === "length") {
      const s = toInt(v);
      return s
        ? [{ href: `/listings/under-${s}-length-in-feet/`, text: v }]
        : null;
    }

    if (L === "atm") {
      const s = toInt(v);
      return s ? [{ href: `/listings/under-${s}-kg-atm/`, text: v }] : null;
    }

    if (L === "condition" || L === "conditions") {
      return [{ href: `/listings/${slugify(v)}-condition/`, text: v }];
    }

    return null;
  };

  const stateFields = [{ label: "Location", value: getAttr("Location") }];

  const parseAmount = (v: string | number | undefined) => {
    const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    });

  const reg = parseAmount(product.regular_price);
  const sale = parseAmount(product.sale_price);
  const hasSale = sale > 0 && reg > 0 && sale < reg;
  const save = hasSale ? reg - sale : 0;
  const isPOA = !hasSale && (reg === 0 || Number.isNaN(reg));

  const handleBackClick = () => {
    // Set a flag in sessionStorage before going back
    if (typeof window !== "undefined") {
      sessionStorage.setItem("forceRefreshOnBack", "true");
      window.history.back();
    }
  };
  useEffect(() => {
    if (typeof window !== "undefined") {
      const shouldReload = sessionStorage.getItem("forceRefreshOnBack");
      if (shouldReload === "true") {
        sessionStorage.removeItem("forceRefreshOnBack");
        window.location.reload(); // Force refresh
      }
    }
  }, []);

  const productId: string | number | undefined =
    product.id ?? pd.id ?? product.name;
  const productSlug: string | undefined = product.slug ?? pd.slug;

  return (
    <section className="product caravan_dtt">
      <div className="container">
        <div className="content">
          <div className="row justify-content-center">
            {/* Left Column */}
            <div className="col-xl-8 col-lg-8 col-md-12">
              <Link
                href="#"
                onClick={handleBackClick}
                className="back_to_search back_to_search_btn"
              >
                <i className="bi bi-chevron-left fs-6"></i> Back to Search
              </Link>

              <div className="product-info left-info">
                <h1 className="title">{product.name}</h1>

                <div className="contactSeller__container d-lg-none">
                  <div className="price_section">
                    <div className="price-shape">
                      <span className="current">
                        <span className="woocommerce-Price-amount amount">
                          <bdi>
                            <span className="woocommerce-Price-currencySymbol"></span>
                            {Number(product.regular_price).toLocaleString(
                              "en-IN"
                            )}{" "}
                          </bdi>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="attributes">
                  {stateFields
                    .filter((f) => f.value)
                    .map((f, index) => (
                      <h6 className="category" key={index}>
                        {f.label}- {f.value}
                      </h6>
                    ))}
                </div>
              </div>

              {/* Image Gallery */}
              <div className="caravan_slider_visible">
                <button
                  className="hover_link Click-here"
                  onClick={() => setShowModal(true)}
                />
                <div className="slider_thumb_vertical image_container">
                  <div className="image_mop">
                    {productSubImage.slice(0, 4).map((image, i) => (
                      <div className="image_item" key={`${image}-${i}`}>
                        <div className="background_thumb">
                          <Image
                            src={image}
                            width={128}
                            height={96}
                            alt="Thumbnail"
                            priority={i < 4}
                            unoptimized
                          />
                        </div>
                        <div className="img">
                          <Image
                            src={image}
                            width={128}
                            height={96}
                            alt={`Thumb ${i + 1}`}
                            priority={i < 4}
                          />
                        </div>
                      </div>
                    ))}

                    <span className="caravan__image_count">
                      <span>{productSubImage.length}+</span>
                    </span>
                  </div>
                </div>

                {/* Large Image */}
                <div className="lager_img_view image_container">
                  <div className="background_thumb">
                    <Image
                      src={activeImage || productImage}
                      width={800}
                      height={600}
                      alt="Large"
                      className="img-fluid"
                    />
                  </div>
                  <a href="#">
                    <Image
                      src={activeImage || productImage}
                      width={800}
                      height={600}
                      alt="Large"
                      className="img-fluid"
                    />
                  </a>
                </div>
              </div>

              {/* Tabs */}
              <section className="product-details">
                <ul className="nav nav-pills">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === "specifications" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("specifications")}
                    >
                      Specifications
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === "description" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("description")}
                    >
                      Description
                    </button>
                  </li>
                </ul>

                <div className="tab-content mt-3">
                  {activeTab === "specifications" && (
                    <div className="tab-pane fade show active">
                      <div className="content-info text-center pb-0">
                        <div className="additional-info">
                          <ul>
                            {specFields
                              .filter((f) => f.value)
                              .map((f) => {
                                const links = linksForSpec(
                                  f.label,
                                  String(f.value),
                                  f.url // ✅ prefer API-provided url
                                );
                                return (
                                  <li key={f.label}>
                                    <strong>{f.label}:</strong>{" "}
                                    <span>
                                      {links
                                        ? links.map((lnk, idx) => (
                                            <span key={lnk.href}>
                                              <Link
                                                href={lnk.href}
                                                prefetch={false}
                                              >
                                                {lnk.text}
                                              </Link>
                                              {idx < links.length - 1
                                                ? ", "
                                                : ""}
                                            </span>
                                          ))
                                        : String(f.value)}
                                    </span>
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === "description" && (
                    <div
                      className="tab-pane fade show active product-description"
                      dangerouslySetInnerHTML={{ __html: safeHtml }}
                    />
                  )}
                </div>
              </section>

              {/* Community Section */}
              <section className="community product_dt_lower style-5 pt-4">
                <div className="content">
                  <div className="heading">
                    <h3>Caravan Marketplace Advantage</h3>
                    <p>
                      We help you get superior service, guaranteed deals, and
                      access to top manufacturers.
                    </p>
                  </div>
                  <div className="card_flex d-flex flex-wrap">
                    {[
                      {
                        img: "low-price",
                        text: "Get exclusive deals from top caravan manufacturers.",
                      },
                      {
                        img: "deal",
                        text: "Our expert team sources deals from across the market.",
                      },
                      {
                        img: "special_deal",
                        text: "Access insights and hidden gems in the industry.",
                      },
                    ].map((item) => (
                      <div className="commun-card" key={item.img}>
                        <div className="icon">
                          <Image
                            src={`/images/${item.img}.svg`}
                            alt={item.img}
                            width={32}
                            height={32}
                          />
                        </div>
                        <div className="inf">
                          <p>{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="contact_dealer mt-3">
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowModal(true)}
                    >
                      Contact Dealer
                    </button>
                  </div>
                </div>
              </section>

              {/* Mobile Bottom Bar */}
              <div className="fixed-bottom-bar d-lg-none">
                <button
                  className="btn enbttn_qqr btn-primary w-100 mb-2"
                  onClick={() => setShowModal(true)}
                >
                  Send Enquiry
                </button>
                <p className="terms_text small">
                  By clicking &apos;Send Enquiry&apos;, you agree to our
                  <Link href="/privacy-collection-statement">
                    {" "}
                    Collection Statement
                  </Link>
                  , <Link href="/privacy-policy">Privacy Policy</Link>, and{" "}
                  <Link href="/terms-conditions">Terms and Conditions</Link>.
                </p>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-xl-4 col-lg-4 d-none d-lg-block">
              <div
                className="product-info-sidebar sticky-top"
                style={{ top: "80px" }}
              >
                <div className="contactSeller__container">
                  <div
                    className="price_section"
                    style={{
                      boxShadow: "0px 4px 15px #0000000d",
                      display: "block",
                      border: "1px solid #ddd",
                      padding: "10px 0px",
                      borderRadius: "6px",
                    }}
                  >
                    <div className="divide-2">
                      <div className="price_section border-0">
                        <div className="price-shape">
                          <span className="current">
                            <div>
                              <div className="price-card">
                                <div className="price-card__left">
                                  {isPOA ? (
                                    <div className="price-card__sale">POA</div>
                                  ) : hasSale ? (
                                    <>
                                      <div className="price-card__sale">
                                        {fmt(sale)}
                                      </div>
                                      <div className="price-card__regular">
                                        <s>{fmt(reg)}</s>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="price-card__sale">
                                      {fmt(reg)}
                                    </div>
                                  )}
                                </div>

                                {hasSale && (
                                  <>
                                    <div className="price-card__divider" />
                                    <div className="price-card__save">
                                      <div className="price-card__saveLabel">
                                        Save
                                      </div>
                                      <div className="price-card__saveValue">
                                        {fmt(save)}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="contact_dealer mt-2">
                      <button
                        className="btn btn-primary "
                        onClick={() => setShowModal(true)}
                      >
                        Contact Dealer{" "}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal */}
            {showModal && (
              <CaravanDetailModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                images={productSubImage}
                product={{
                  id: productId,
                  slug: productSlug,
                  name: product.name ?? "",
                  image: activeImage || productImage,
                  price: hasSale ? sale : reg,
                  regularPrice: reg,
                  salePrice: sale,
                  isPOA,
                  location: product.location ?? undefined,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
