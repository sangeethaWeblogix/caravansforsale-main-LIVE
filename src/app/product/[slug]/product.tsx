"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import Link from "next/link";
import CaravanDetailModal from "./CaravanDetailModal";
import "./product.css";
import DOMPurify from "dompurify";
import { type HomeBlogPost } from "@/api/home/api";
import { toSlug } from "@/utils/seo/slug";
import ProductSkelton from "../../components/ProductCardSkeleton";
import { useRouter } from "next/navigation";

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
  latest_blog_posts?: string;
  related?: string;
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
  image?: string[];
  title?: string;
  location_shortcode?: string;
  sku?: string;
};

interface BlogPost extends HomeBlogPost {
  // ensure fields you use are present
  id: number;
  title: string;
  image: string;
  slug: string;
  date?: string;
  excerpt?: string;
  link?: string;
}
export default function ClientLogger({
  data,
}: {
  data: ProductDetailResponse;
}) {
  // const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  console.log("datap", data);
  const router = useRouter();

  // const [activeImage, setActiveImage] = useState<string>("");
  const pd: ApiData = data?.data ?? {};
  console.log("pd", pd);
  const productDetails: ProductData = pd.product_details ?? {};
  const blogPosts: BlogPost[] = Array.isArray(data?.data?.latest_blog_posts)
    ? data.data.latest_blog_posts!
    : [];

  const relatedProducts: ProductData[] = Array.isArray(data?.data?.related)
    ? data.data.related!
    : [];

  console.log("releated", blogPosts);
  const loadedCount = useRef(0);

  const handleImageLoad = () => {
    loadedCount.current += 1;
    if (loadedCount.current >= allSubs.length + 1) {
    }
  };

  console.log("datapb", relatedProducts);

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

  const images: string[] = useMemo(
    () => (Array.isArray(pd.images) ? pd.images.filter(Boolean) : []),
    [pd.images]
  );

  const [navigating, setNavigating] = useState(false);

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

  const getHref = (p: BlogPost) => {
    const slug = p.slug?.trim() || toSlug(p.title || "post");
    return `/${slug}/`;
  };
  const getProductHref = (p: ProductData) => {
    const slug = p.slug?.trim() || "post";
    return slug ? `/product/${slug}/` : "";
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
    { label: "Axle Configuration", value: getAttr("Axle Configuration") },

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

    const L = label.toLowerCase();

    // ✅ Always force clean path for Year (ignore API URL)
    if (L === "year" || L === "years") {
      const s = toInt(v);
      return s ? [{ href: `/listings/${s}-caravans-range/`, text: v }] : null;
    }

    // ✅ Only use API URL for fields that are NOT year-related
    if (apiUrl && apiUrl.trim() && !["year", "years"].includes(L)) {
      return [linkFromApiUrl(apiUrl, v)];
    }

    // ---- fallback logic ----
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

    if (L === "sleep" || L === "sleeps") {
      const s = toInt(v);
      return s
        ? [{ href: `/listings/under-${s}-people-sleeping-capacity/`, text: v }]
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

  // const handleBackClick = () => {
  //   // Set a flag in sessionStorage before going back
  //   if (typeof window !== "undefined") {
  //     sessionStorage.setItem("forceRefreshOnBack", "true");
  //     window.history.back();
  //   }
  // };
  const [cameFromSameSite, setCameFromSameSite] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const referrer = document.referrer;
    const origin = window.location.origin;
    const cameFromFlag = sessionStorage.getItem("cameFromListings");

    // ✅ Case 1: User clicked from listings
    if (cameFromFlag === "true") {
      setCameFromSameSite(true);
      sessionStorage.removeItem("cameFromListings");
      return;
    }

    // ✅ Case 2: Opened directly or via copy-paste (no referrer)
    if (!referrer) {
      setCameFromSameSite(false); // Back to Similar Caravans
      return;
    }

    // ✅ Case 3: Came from same domain listings
    if (referrer.startsWith(origin) && referrer.includes("/listings")) {
      setCameFromSameSite(true); // Back to Search
    } else {
      setCameFromSameSite(false); // Back to Similar Caravans
    }
  }, []);

  const makeHref =
    makeValue && makeValue.trim()
      ? `/listings/${slugify(makeValue)}/`
      : "/listings/";

  const productId: string | number | undefined =
    product.id ?? pd.id ?? product.name;

  const productSlug: string | undefined = product.slug ?? pd.slug;
  console.log("product", data);

  const slug = productSlug || "";
  const sku = productDetails.sku;
  console.log("slug1", productDetails);
  console.log("rele", relatedProducts);

  // ---- gallery state ----

  // keep activeImage in sync with main image from API

  const base = `https://caravansforsale.imagestack.net/800x600/${sku}/${slug}`;

  const main = `${base}main1.avif`;
  const [activeImage, setActiveImage] = useState<string>(main);

  const [mainsub, setMainsub] = useState<string[]>([]);

  useEffect(() => {
    if (!sku || !slug) {
      setMainsub([]);
      return;
    }

    const base = `https://caravansforsale.imagestack.net/800x600/${sku}/${slug}`;

    const imgs = [
      `${base}main1.avif`, // main image
      `${base}sub2.avif`, // sub1
      `${base}sub3.avif`, // sub2
      `${base}sub4.avif`, // sub3
      `${base}sub5.avif`, // sub4
    ];

    setMainsub(imgs);
  }, [sku, slug]);

  const [allSubs, setAllSubs] = useState<string[]>([]);

  function checkImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);

      const img = document.createElement("img");
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  useEffect(() => {
    let cancelled = false;

    const loadGallery = async () => {
      // show skeleton while we probe

      // Fallback: no sku/slug => just use API images or main image
      if (!sku || !slug) {
        const fallback = (images.length ? images : [main]).filter(Boolean);
        if (!cancelled) {
          setAllSubs(fallback);
          setActiveImage(fallback[0] || main);
        }
        return;
      }

      const base = `https://caravansforsale.imagestack.net/800x600/${sku}/${slug}`;

      const urls: string[] = [];

      // 1) MAIN
      const mainUrl = `${base}main1.avif`;
      const hasMain = await checkImage(mainUrl);
      if (hasMain) {
        urls.push(mainUrl);
      }

      // 2) allSubs: sub1.avif, sub2.avif, ...
      for (let i = 2; i <= 5; i++) {
        const url = `${base}sub${i}.avif`;
        const ok = await checkImage(url);
        if (!ok) break; // stop when next sub doesn't exist
        urls.push(url);
      }

      // If CDN gave nothing, fall back to API images
      const finalUrls =
        urls.length > 0
          ? urls
          : (images.length ? images : [main]).filter(Boolean);

      for (let i = 6; i <= 70; i++) {
        const url = `${base}sub${i}.avif`;
        const ok = await checkImage(url);
        if (!ok) break; // stop when next sub doesn't exist
        urls.push(url);
      }

      // If CDN gave nothing, fall back to API images
      const finalSubUrls =
        urls.length > 0
          ? urls
          : (images.length ? images : [main]).filter(Boolean);
      if (!cancelled) {
        setMainsub(finalUrls);
        setAllSubs(finalSubUrls);
        setActiveImage(finalUrls[0] || main);
      }
    };

    loadGallery();

    return () => {
      cancelled = true;
    };
  }, [sku, slug, images, main]);
  const getIP = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip || "";
    } catch {
      return "";
    }
  };

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
    if (!productDetails?.id) return;

    postTrackEvent(
      "https://www.admin.caravansforsale.com.au/wp-json/cfs/v1/update-clicks",
      Number(productDetails.id)
    );
  }, [productDetails?.id]);

  // ✅ Add these states after allSubs state
  const [preloadedImages, setPreloadedImages] = useState<string[]>([]); // First 5
  const [remainingImages, setRemainingImages] = useState<string[]>([]); // Rest

  // ✅ Update the useEffect where you load gallery
  useEffect(() => {
    let cancelled = false;

    const loadGallery = async () => {
      if (!sku || !slug) {
        const fallback = (images.length ? images : [main]).filter(Boolean);
        if (!cancelled) {
          setAllSubs(fallback);
          setPreloadedImages(fallback.slice(0, 10));
          setRemainingImages(fallback.slice(10));
          setActiveImage(fallback[0] || main);
        }
        return;
      }


      const base = `https://caravansforsale.imagestack.net/800x600/${sku}/${slug}`;
      const urls: string[] = [];

      // 1) MAIN
      const mainUrl = `${base}main1.avif`;
      const hasMain = await checkImage(mainUrl);
      if (hasMain) urls.push(mainUrl);

      // 2) First 5 subs (sub2 to sub5) - PRELOAD
      for (let i = 2; i <= 5; i++) {
        const url = `${base}sub${i}.avif`;
        const ok = await checkImage(url);
        if (!ok) break;
        urls.push(url);
      }

      // ✅ Set preloaded images immediately
      if (!cancelled) {
        setPreloadedImages(urls);
        setMainsub(urls);
        setActiveImage(urls[0] || main);
      }

      // 3) Remaining subs (sub6 to sub70) - LAZY LOAD
      const remainingUrls: string[] = [];
      for (let i = 6; i <= 70; i++) {
        const url = `${base}sub${i}.avif`;
        const ok = await checkImage(url);
        if (!ok) break;
        remainingUrls.push(url);
      }

      if (!cancelled) {
        setRemainingImages(remainingUrls);
        setAllSubs([...urls, ...remainingUrls]);
      }
    };

    loadGallery();
    return () => {
      cancelled = true;
    };
  }, [sku, slug, images, main]);

  // const [activeImage, setActiveImage] = useState(main);

  console.log("image", allSubs);

  return (
    <>
      <section className={`product caravan_dtt sku-${sku}`}>
        <div className="container">
          <div className="content">
            <div className="row justify-content-center">
              {/* Left Column */}
              <div className="col-xl-8 col-lg-8 col-md-12">
                {cameFromSameSite ? (
                  <Link
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.back();
                    }}
                    className="back_to_search back_to_search_btn"
                  >
                    <i className="bi bi-chevron-left"></i> Back to Search
                  </Link>
                ) : (
                  <Link
                    href={makeHref}
                    className="back_to_search back_to_search_btn"
                    prefetch={false}
                  >
                    <i className="bi bi-chevron-left"></i> Back to Similar
                    Caravans
                  </Link>
                )}

                <div className="product-info left-info">
                  <h1 className="title">{product.name}</h1>

                  <div className="contactSeller__container d-lg-none">
                    <div className="price_section">
                      <div className="price-container">
                        <div className="price-left">
                          <div className="current-price">
                            <bdi>
                              {isPOA || !reg || Number(reg) === 0
                                ? "POA"
                                : hasSale && sale
                                ? fmt(Number(sale))
                                : fmt(Number(reg))}
                            </bdi>
                          </div>

                          {hasSale && reg && (
                            <div className="original-price">
                              <s>{fmt(Number(reg))}</s>
                            </div>
                          )}
                        </div>

                        {hasSale && save && Number(save) > 0 && (
                          <div className="price-right">
                            <span className="save-label">Save</span>
                            <span className="save-value">
                              {fmt(Number(save))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {product.location_shortcode &&
                    product.location_shortcode.trim() !== "" && (
                      <div className="attributes">
                        <h6 className="category">
                          Location- {product.location_shortcode}
                        </h6>
                      </div>
                    )}
                </div>

                <div className="caravan_slider_visible">
                  <button
                    className="hover_link Click-here"
                    onClick={() => setShowModal(true)}
                  />

                  {/* Thumbnails */}
                  <div className="slider_thumb_vertical image_container">
                    <div className="image_mop">
                      {mainsub.slice(0, 4).map((image, i) => (
                        <div className="image_item" key={`${image}-${i}`}>
                          <div className="background_thumb">
                            <Image
                              src={image}
                              width={128}
                              height={96}
                              alt="Thumbnail"
                              unoptimized
                              onLoad={handleImageLoad}
                            />
                          </div>

                          <div
                            className="img"
                            onClick={() => setActiveImage(image)}
                          >
                            <Image
                              src={image}
                              width={128}
                              height={96}
                              alt={`Thumb ${i + 1}`}
                              priority={i < 4}
                              unoptimized
                              onLoad={handleImageLoad}
                            />
                          </div>
                        </div>
                      ))}

                      <span className="caravan__image_count">
                        {/* <span>{allSubs.length}+</span> */}
                       +
                      </span>
                    </div>
                  </div>

                  {/* Large Image */}
                  <div className="lager_img_view image_container">
                    <div className="background_thumb">
                      <Image
                        src={activeImage || allSubs[0]}
                        width={800}
                        height={600}
                        alt="Large"
                        className="img-fluid"
                        unoptimized
                        onLoad={handleImageLoad}
                      />
                    </div>

                    <Link href="#">
                      <Image
                        src={activeImage || allSubs[0]}
                        width={800}
                        height={600}
                        alt="Large"
                        className="img-fluid"
                        unoptimized
                        onLoad={handleImageLoad}
                      />
                    </Link>
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
                                                  onClick={(e) => {
                                                    e.preventDefault(); // ⛔ stop default Link

                                                    setNavigating(true); // ✅ show loader
                                                    router.push(lnk.href); // ✅ go to listings
                                                  }}
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
                <section className="community product_dt_lower hidden-xs style-5 pt-4">
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
                        {/* bottom */}
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
                                      <div className="price-card__sale">
                                        POA
                                      </div>
                                    ) : hasSale ? (
                                      <>
                                        <div className="price-card__sale">
                                          {fmt(Number(sale))}{" "}
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

                                  {hasSale && save && (
                                    <>
                                      <div className="price-card__divider" />
                                      <div className="price-card__save">
                                        <div className="price-card__saveLabel">
                                          Save
                                        </div>
                                        <div className="price-card__saveValue">
                                          {save ? fmt(Number(save)) : ""}
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
                  preloadedImages={preloadedImages} // ✅ First 5 images
                  remainingImages={remainingImages} // ✅ Rest images
                  product={{
                    id: productId,
                    slug: productSlug,
                    name: product.name ?? "",
                    image: activeImage || allSubs[0],
                    price: hasSale ? sale : reg,
                    regularPrice: product.regular_price ?? 0,
                    salePrice: product.sale_price ?? 0,
                    isPOA,
                    location: product.location ?? undefined,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </section>
      {/* ✅ Related Products Section */}
      {relatedProducts.length > 0 && (
        <div
          className="related-products section-padding"
          style={{ position: "relative", zIndex: 0, background: "#ffffffff" }}
        >
          <div className="container">
            <div className="re-title">
              <div className="tpof_tab">
                <h3>Browse Similar Caravans</h3>
              </div>
            </div>
            <div className="similar-products-three position-relative">
              {/* ✅ Swiper React Component */}
              <Swiper
                modules={[Navigation]}
                navigation
                spaceBetween={20}
                slidesPerView={4}
                loop={false}
                breakpoints={{
                  320: { slidesPerView: 1 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 4 },
                }}
              >
                {relatedProducts.length === 0
                  ? Array.from({ length: 4 }).map((_, idx) => (
                      <SwiperSlide key={`related-skeleton-${idx}`}>
                        <ProductSkelton />
                      </SwiperSlide>
                    ))
                  : relatedProducts.map((post) => {
                      const href = getProductHref(post);
                      const sku = post.sku;
                      const slug = post.slug;
                      const base = `https://caravansforsale.imagestack.net/800x600/${sku}/${slug}`;

                      const main = `${base}main1.avif`;
                      return (
                        <SwiperSlide key={post.id}>
                          <Link href={href}>
                            <div className="product-card">
                              <div className="img">
                                <Image
                                  src={main}
                                  alt="product"
                                  width={400}
                                  height={250}
                                  unoptimized
                                />
                              </div>
                              <div className="product_de">
                                <div className="info">
                                  <h6 className="category">
                                    <i className="fa fa-map-marker-alt"></i>{" "}
                                    <span>{post.location}</span>
                                  </h6>
                                  <h3 className="title">{post.title}</h3>
                                </div>
                                <div className="price">
                                  {parseAmount(post.regular_price) === 0 ? (
                                    <span>POA</span>
                                  ) : parseAmount(post.sale_price) > 0 &&
                                    parseAmount(post.sale_price) <
                                      parseAmount(post.regular_price) ? (
                                    <>
                                      <del>
                                        {fmt(parseAmount(post.regular_price))}
                                      </del>{" "}
                                      <ins>
                                        {fmt(parseAmount(post.sale_price))}
                                      </ins>
                                    </>
                                  ) : (
                                    <span>
                                      {fmt(parseAmount(post.regular_price))}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </SwiperSlide>
                      );
                    })}
              </Swiper>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Latest News */}
      <div
        className="related-products latest_blog section-padding"
        style={{ position: "relative", zIndex: 0, background: "#f1f1f1" }}
      >
        <div className="container">
          <div className="news-title">
            <div className="tpof_tab">
              <h3>Latest News, Reviews & Advice</h3>
            </div>
          </div>
          <div className="similar-products-three position-relative">
            {/* ✅ Swiper React Component */}
            <Swiper
              modules={[Navigation]}
              navigation
              spaceBetween={20}
              slidesPerView={4}
              loop={false}
              breakpoints={{
                320: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 4 },
              }}
            >
              {blogPosts.length === 0
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <SwiperSlide key={`blog-skeleton-${idx}`}>
                      <ProductSkelton />
                    </SwiperSlide>
                  ))
                : blogPosts.map((post) => {
                    const href = getHref(post);
                    return (
                      <SwiperSlide key={post.id}>
                        <Link href={href}>
                          <div className="product-card">
                            <div className="img">
                              <Image
                                src={post.image}
                                alt={post.title}
                                width={400}
                                height={250}
                                unoptimized
                              />
                            </div>
                            <div className="product_de">
                              <div className="info">
                                <h5 className="title">{post.title}</h5>
                                <p>{post.excerpt}</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </SwiperSlide>
                    );
                  })}
              {!blogPosts.length && (
                <div className="col-12 py-3 text-muted">No posts found.</div>
              )}
            </Swiper>
          </div>
        </div>

        {navigating && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(2px)",
              zIndex: 9999,
            }}
            aria-live="polite"
          >
            <div className="text-center">
              <Image
                className="loader_image"
                src="/images/loader.gif" // place inside public/images
                alt="Loading..."
                width={80}
                height={80}
                unoptimized
              />{" "}
              <div className="mt-2 fw-semibold">Loading…</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
