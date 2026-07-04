"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useEnquiryForm } from "@/app/components/ListContent/enquiryform";
import CaravanDetailModal from "@/app/product/[slug]/CaravanDetailModal";
import "./demo.css";

/* ── Types ── */
type Attribute = { label?: string; value?: string; url?: string };
type Category  = { name?: string; label?: string; value?: string } | string;
type Region    = { label?: string; value?: string; slug?: string };

interface ProductData {
  id?: string | number;
  slug?: string;
  name?: string;
  title?: string;
  description?: string;
  image_url?: string[];
  image?: string[];
  regular_price?: string | number;
  sale_price?: string | number;
  location?: string;
  location_shortcode?: string;
  region?: Region;
  suburb?: Region;
  categories?: Category[];
  attribute_urls?: Attribute[];
  sku?: string;
  seller_type?: string;
}

interface ApiData {
  product_details?: ProductData;
  categories?: Category[];
  id?: string | number;
  slug?: string;
  related?: ProductData[];
  latest_blog_posts?: BlogPost[];
}

interface BlogPost {
  id: number;
  title: string;
  image?: string;
  slug?: string;
  date?: string;
  excerpt?: string;
}

interface MakeListing {
  id: number;
  name: string;
  slug?: string;
  image: string;
  image_url?: string[];
  regular_price: string;
  sale_price?: string;
  location?: string;
  condition?: string;
  seller_type?: string;
  categories?: string[];
}

interface Props {
  data: { data?: ApiData } | null;
  makeListings?: MakeListing[];
}

/* ── Helpers ── */
const parseAmt = (v: string | number | undefined) => {
  const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const slugify = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "-");
const PRICE_STEPS = [10000,20000,30000,40000,50000,60000,70000,80000,90000,100000,125000,150000,175000,200000,225000,250000,275000,300000];
const getPriceRangeLinks = (price: number): { label: string; href: string }[] => {
  const upperIdx = PRICE_STEPS.findIndex(s => s >= price);
  if (upperIdx <= 0) return [];
  const links: { label: string; href: string }[] = [];
  const hi1 = PRICE_STEPS[upperIdx];
  const lo1 = PRICE_STEPS[upperIdx - 1];
  links.push({ label: `Caravans for Sale near $${lo1.toLocaleString()} to $${hi1.toLocaleString()}`, href: `/listings/?from_price=${lo1}&to_price=${hi1}` });
  if (upperIdx >= 2) {
    const hi2 = PRICE_STEPS[upperIdx - 1];
    const lo2 = PRICE_STEPS[upperIdx - 2];
    links.push({ label: `Caravans for Sale near $${lo2.toLocaleString()} to $${hi2.toLocaleString()}`, href: `/listings/?from_price=${lo2}&to_price=${hi2}` });
  }
  return links;
};

const fmtDate = (d: string) => {
  const dateOnly = d.split(" ")[0];
  const [y, m, day] = dateOnly.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mo = months[parseInt(m, 10) - 1];
  return mo ? `${mo} ${parseInt(day, 10)}, ${y}` : dateOnly;
};

function isNonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

/* ── Mosaic gallery ── */
function Gallery({ images, onOpen }: { images: string[]; onOpen: (index: number) => void }) {
  const extra = images.length - 3;

  return (
    <div className="pdd-gallery">
      <div className="pdd-gallery__mosaic">
        {/* Main large image */}
        <div className="pdd-gallery__mosaic-main" onClick={() => onOpen(0)}>
          {images[0]
            ? <Image src={images[0]} alt="Caravan" fill style={{ objectFit: "cover" }} unoptimized />
            : <div className="pdd-gallery__placeholder" />}
        </div>
        {/* 2-cell right grid */}
        <div className="pdd-gallery__mosaic-grid">
          {[1, 2].map(i => (
            <div key={i} className="pdd-gallery__mosaic-cell" onClick={() => onOpen(i)}>
              {images[i]
                ? <Image src={images[i]} alt="" fill style={{ objectFit: "cover" }} unoptimized />
                : <div className="pdd-gallery__placeholder" />}
              {i === 2 && extra > 0 && (
                <div className="pdd-gallery__more">+{extra} Photos</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar enquiry form — always open ── */
function EnquiryForm({ product }: { product: { id?: string | number; slug?: string; name?: string } }) {
  const { form, errors, touched, submitting, setField, onBlur, onSubmit } =
    useEnquiryForm({ id: product.id ?? product.slug ?? "", slug: product.slug, name: product.name ?? "" });

  const msgInit = useRef(false);
  useEffect(() => {
    if (!msgInit.current && product.name) {
      msgInit.current = true;
      setField("message", `Hi, I'm interested in your ${product.name}. Please contact me.`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pdd-sidebar__form">
      <div className="pdd-enquire-heading">Enquire Now</div>
      <form className="pdd-form" noValidate onSubmit={onSubmit}>
        <div className="pdd-form__item">
          <input placeholder="Your Name*" value={form.name}
            onChange={e => setField("name", e.target.value)} onBlur={() => onBlur("name")} />
          {touched.name && errors.name && <span className="pdd-form__err">{errors.name}</span>}
        </div>
        <div className="pdd-form__item">
          <input placeholder="Your Email*" type="email" value={form.email}
            onChange={e => setField("email", e.target.value)} onBlur={() => onBlur("email")} />
          {touched.email && errors.email && <span className="pdd-form__err">{errors.email}</span>}
        </div>
        <div className="pdd-form__item">
          <input placeholder="Your Phone*" inputMode="numeric" value={form.phone}
            onChange={e => setField("phone", e.target.value)} onBlur={() => onBlur("phone")} />
          {touched.phone && errors.phone && <span className="pdd-form__err">{errors.phone}</span>}
        </div>
        <textarea className="pdd-form__msg" rows={4}
          value={form.message}
          onChange={e => setField("message", e.target.value)} />
        <button type="submit" className="pdd-btn-send" disabled={submitting}>
          {submitting ? "Sending..." : "Send Enquiry"}
        </button>
        <p className="pdd-form__legal">
          By sending an enquiry, you agree to our{" "}
          <a href="/terms-conditions/" target="_blank">Terms of Use</a> and{" "}
          <a href="/privacy-policy/" target="_blank">Privacy Policy</a>.
        </p>
      </form>
    </div>
  );
}

/* ── Main component ── */
export default function ProductDetailDemo({ data, makeListings = [] }: Props) {
  const pd: ApiData  = data?.data ?? {};
  const product: ProductData = pd.product_details ?? {};
  const attributes: Attribute[] = Array.isArray(product.attribute_urls) ? product.attribute_urls : [];
  const blogPosts: BlogPost[]  = Array.isArray(pd.latest_blog_posts) ? pd.latest_blog_posts : [];

  const getAttr = (label: string) =>
    attributes.find(a => String(a?.label ?? "").toLowerCase() === label.toLowerCase())?.value ?? "";

  const related: ProductData[] = Array.isArray(pd.related) ? pd.related : [];

  const images: string[] = Array.isArray(product.image_url)
    ? product.image_url.filter(Boolean)
    : [];

  const rawCats: Category[] = Array.isArray(product.categories) ? product.categories
    : Array.isArray(pd.categories) ? pd.categories : [];
  const categoryNames: string[] = rawCats
    .map(c => typeof c === "string" ? c : (c?.name ?? c?.label ?? c?.value ?? ""))
    .filter(isNonEmpty);

  const reg  = parseAmt(product.regular_price);
  const sale = parseAmt(product.sale_price);
  const displayPrice = sale > 0 && sale < reg ? sale : reg;
  const isPOA = displayPrice === 0;
  const estMonthly = displayPrice > 0 ? Math.round(displayPrice / 240) : 0;

  const state    = getAttr("Location");
  const location = product.region?.value
    ? `${product.region.value.replace(/-/g, " ")}, ${state}`
    : state;

  /* Specs bar — shortened display values */
  const stateAbbr: Record<string, string> = {
    'victoria': 'VIC', 'new south wales': 'NSW', 'queensland': 'QLD',
    'south australia': 'SA', 'western australia': 'WA', 'tasmania': 'TAS',
    'northern territory': 'NT', 'australian capital territory': 'ACT',
  };
  const shortLocation = location
    ? location.replace(/,\s*(.+)$/, (_, s) => {
        const abbr = stateAbbr[s.toLowerCase().trim()];
        return abbr ? `, ${abbr}` : `, ${s}`;
      })
    : location;
  const shortCategory = categoryNames[0]?.replace(/\s+caravans?$/i, '').trim() ?? categoryNames[0];
  const shortSleeps   = getAttr("sleeps").replace(/\s+people?$/i, '').trim();
  const shortAxle     = getAttr("Axle Configuration").replace(/\s+axle$/i, '').trim();

  /* helper: find first matching attribute with value + url */
  const pickFull = (...labels: string[]): { value: string; url: string } => {
    for (const l of labels) {
      const attr = attributes.find(a => String(a?.label ?? "").toLowerCase() === l.toLowerCase());
      if (attr?.value) return { value: attr.value, url: attr.url ?? "" };
    }
    return { value: "", url: "" };
  };

  /* caravan details — single column with optional links */
  type DetailRow = { label: string; value: string; url: string };
  const detailRows: DetailRow[] = [
    { label: "Type",               ...(() => { const a = pickFull("Type"); if (a.value) return a; const cat = categoryNames[0] ?? ""; return cat ? { value: cat, url: `/listings/${slugify(cat.replace(/\s*caravans?\s*/gi, " ").trim())}-category/` } : { value: "", url: "" }; })() },
    { label: "Make",               ...pickFull("Make") },
    { label: "Model",              ...pickFull("Model") },
    { label: "Year",               ...pickFull("Years") },
    { label: "Condition",          ...pickFull("Conditions") },
    { label: "Length",             ...pickFull("Length") },
    { label: "Sleeping Capacity",  ...pickFull("sleeps", "Sleeping Capacity") },
    { label: "ATM",                ...pickFull("ATM") },
    { label: "Tare Mass",          ...pickFull("Tare Mass", "Tare") },
    { label: "Axle Configuration", ...pickFull("Axle Configuration", "Axle") },
    { label: "Ball Weight",        ...pickFull("Ball Weight") },
    { label: "Payload",            ...pickFull("Payload") },
    { label: "Brakes",             ...pickFull("Brakes") },
    { label: "Suspension",         ...pickFull("Suspension") },
    { label: "Stock Number",       ...pickFull("Stock Number", "Stock") },
    { label: "VIN",                ...pickFull("VIN") },
    { label: "Registration",       ...pickFull("Registration") },
    { label: "Colour",             ...pickFull("Colour", "Color") },
    { label: "Solar",              ...pickFull("Solar") },
    { label: "Battery",            ...pickFull("Battery") },
    { label: "Air Conditioner",    ...pickFull("Air Conditioner", "Air Con") },
    { label: "Water (Fresh)",      ...pickFull("Water (Fresh)", "Fresh Water") },
    { label: "Water (Grey)",       ...pickFull("Water (Grey)", "Grey Water") },
  ].filter(r => r.value);

  const locationCity  = product.region?.value?.replace(/-/g, " ") ?? "";
  const locationState = state;

  if (locationCity || locationState) {
    detailRows.push({
      label: "Location",
      value: [locationCity, locationState].filter(Boolean).join(", "),
      url:   locationState ? `/listings/${slugify(locationState)}-state/` : "",
    });
  }

  const half2     = Math.ceil(detailRows.length / 2);
  const leftRows  = detailRows.slice(0, half2);
  const rightRows = detailRows.slice(half2);

  /* related searches — built from attribute values */
  const make = getAttr("Make");
  /* strip trailing "Caravans" from make so labels don't duplicate (e.g. "Retreat Caravans") */
  const makeLabel = make.replace(/\s+caravans?$/i, "").trim() || make;
  const relatedSearches = [
    make && { label: `${make}`, href: `/listings/${slugify(make)}/` },
    make && state && { label: `${make} in ${state}`, href: `/listings/${slugify(make)}/?state=${slugify(state)}` },
    make && { label: `${makeLabel} Off Road Caravans`, href: `/listings/${slugify(make)}/?category=off-road` },
    ...(isPOA ? [] : getPriceRangeLinks(displayPrice)),
    make && locationCity && { label: `${make} in ${locationCity}`, href: `/listings/${slugify(make)}/?state=${slugify(state)}&region=${slugify(locationCity)}` },
    { label: `All Caravans for Sale`, href: `/listings/` },
  ].filter(Boolean) as { label: string; href: string }[];

  const [safeHtml, setSafeHtml] = useState("");
  useEffect(() => {
    if (product.description) {
      setSafeHtml(product.description.replace(/\\n/g, "\n").replace(/\n/g, "<br>"));
    }
  }, [product.description]);

  const [descOpen, setDescOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);
  const [checklistOpen, setChecklistOpen] = useState(false);

  if (!product.name) {
    return <div style={{ padding: "60px 24px", textAlign: "center", color: "#888" }}>Loading product…</div>;
  }

  const breadcrumb = [
    { label: "Home",            href: "/" },
    { label: "Caravans for Sale", href: "/listings/" },
    ...(state ? [{ label: state, href: `/listings/${slugify(state)}-state/` }] : []),
    ...(product.region?.value ? [{ label: product.region.value.replace(/-/g, " "), href: `/listings/${slugify(state)}-state/${product.region.slug ?? slugify(product.region.value)}/` }] : []),
    ...(categoryNames[0] ? [{ label: categoryNames[0], href: `/listings/${slugify(categoryNames[0].replace(/\s*caravan\s*/gi, " ").trim())}-category/` }] : []),
  ];

  return (
    <>
    <div className="pdd-page">
      <div className="pdd-container">

        {/* Breadcrumb */}
        <nav className="pdd-breadcrumb">
          {breadcrumb.map((b, i) => (
            <span key={i}>
              {i > 0 && <span className="pdd-breadcrumb__sep">›</span>}
              {b.href ? <Link href={b.href}>{b.label}</Link> : <span>{b.label}</span>}
            </span>
          ))}
        </nav>

        {/* Title */}
        <h1 className="pdd-title">{product.name}</h1>

        {/* Subtitle */}
        <div className="pdd-subtitle">
          <span>Have a similar caravan to sell?</span>
          <a href="/sell-my-caravan/" className="pdd-subtitle__link">List Your Caravan</a>
          <span className="pdd-subtitle__badge">$49 Until Sold</span>
        </div>

        {/* 2-col layout: content + sidebar */}
        <div className="pdd-layout">

          {/* ── LEFT: Gallery + content ── */}
          <div className="pdd-content">

            {/* Specs bar — inside left column, horizontal layout */}
            <div className="pdd-specs-bar">
              {shortCategory && (
                <div className="pdd-specs-bar__item">
                  <img src="/images/category.svg" width="20" height="20" alt="" />
                  <div className="pdd-specs-bar__text">
                    <span className="pdd-specs-bar__val">{shortCategory}</span>
                    <span className="pdd-specs-bar__lbl">Type</span>
                  </div>
                </div>
              )}
              {shortSleeps && (
                <div className="pdd-specs-bar__item">
                  <img src="/images/bed.svg" width="20" height="20" alt="" />
                  <div className="pdd-specs-bar__text">
                    <span className="pdd-specs-bar__val">{shortSleeps}</span>
                    <span className="pdd-specs-bar__lbl">Sleeps</span>
                  </div>
                </div>
              )}
              {shortAxle && (
                <div className="pdd-specs-bar__item">
                  <img src="/images/axle.svg" width="20" height="20" alt="" />
                  <div className="pdd-specs-bar__text">
                    <span className="pdd-specs-bar__val">{shortAxle}</span>
                    <span className="pdd-specs-bar__lbl">Axle</span>
                  </div>
                </div>
              )}
              {getAttr("Length") && (
                <div className="pdd-specs-bar__item">
                  <img src="/images/length.svg" width="20" height="20" alt="" />
                  <div className="pdd-specs-bar__text">
                    <span className="pdd-specs-bar__val">{getAttr("Length")}</span>
                    <span className="pdd-specs-bar__lbl">Length</span>
                  </div>
                </div>
              )}
              {shortLocation && (
                <div className="pdd-specs-bar__item">
                  <img src="/images/location.svg" width="20" height="20" alt="" />
                  <div className="pdd-specs-bar__text">
                    <span className="pdd-specs-bar__val">{shortLocation}</span>
                    <span className="pdd-specs-bar__lbl">Location</span>
                  </div>
                </div>
              )}
            </div>

            <Gallery images={images} onOpen={(i) => { setModalInitialIndex(i); setModalOpen(true); }} />

            {/* Caravan Details */}
            <section className="pdd-section">
              <h2 className="pdd-section__title">Caravan Details</h2>
              <div className="pdd-details-grid">
                <table className="pdd-details-table">
                  <tbody>
                    {leftRows.map(({ label, value, url }) => (
                      <tr key={label}>
                        <td className="pdd-details-table__key">{label}</td>
                        <td className="pdd-details-table__val">
                          {url ? <a href={url} className="pdd-details-link">{value}</a> : value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="pdd-details-table">
                  <tbody>
                    {rightRows.map(({ label, value, url }) => (
                      <tr key={label}>
                        <td className="pdd-details-table__key">{label}</td>
                        <td className="pdd-details-table__val">
                          {url ? <a href={url} className="pdd-details-link">{value}</a> : value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Description */}
            <section className="pdd-section">
              <h2 className="pdd-section__title">Description</h2>
              <div className={`pdd-desc-wrap${descOpen ? " pdd-desc-wrap--open" : ""}`}>
                {safeHtml ? (
                  <div className="pdd-desc" dangerouslySetInnerHTML={{ __html: safeHtml }} />
                ) : (
                  <p className="pdd-desc">No description available.</p>
                )}
                {!descOpen && <div className="pdd-desc-fade" />}
              </div>
              <button className="pdd-desc-toggle" onClick={() => setDescOpen(o => !o)}>
                {descOpen ? "Hide Content" : "View More"}
              </button>
            </section>

            <button className="pdd-btn-contact-inline" onClick={() => { setModalInitialIndex(0); setModalOpen(true); }}>
              Contact Seller
            </button>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <aside className="pdd-sidebar">
            <div className="pdd-sidebar__card">
              <div className="pdd-sidebar__prices">
                {sale > 0 && sale < reg ? (
                  <div className="pdd-sidebar__price-save">
                    <div className="pdd-sidebar__price-left">
                      <span className="pdd-sidebar__sale-label">Sales Price</span>
                      <span className="pdd-sidebar__sale-val">{fmt(displayPrice)}</span>
                      <span className="pdd-sidebar__was">{fmt(reg)}</span>
                    </div>
                    <div className="pdd-sidebar__price-right">
                      <span className="pdd-sidebar__save-label">Save</span>
                      <span className="pdd-sidebar__save-val">{fmt(reg - sale)}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="pdd-sidebar__sale-label">Sales Price</span>
                    <span className="pdd-sidebar__sale-val">{isPOA ? "POA" : fmt(displayPrice)}</span>
                  </>
                )}
                {/* <a href="#" className="pdd-sidebar__offer">Make An Offer</a> */}
              </div>

              <div className="pdd-sidebar__checklist-row">
                <button className="pdd-btn-checklist" onClick={() => setChecklistOpen(true)}>
                  Caravan Buyer Safety Checklist
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                </button>
              </div>

              <div className="pdd-sidebar__enquire-btn">
                <button
                  className="pdd-btn-enquire"
                  onClick={() => { setModalInitialIndex(0); setModalOpen(true); }}
                >
                  Contact Seller
                </button>
              </div>
            </div>

            <div className="pdd-sidebar__sell">
              <strong>Thinking of selling?</strong>
              <p>Get more eyes on your caravan today.</p>
              <a href="/sell-my-caravan/" className="pdd-btn-sell">Sell My Caravan</a>
            </div>
          </aside>
        </div>

        {/* ── Full-width banner ── */}
        <div className="pdd-banner">
          <div className="pdd-banner__text">
            <p className="pdd-banner__sub">DEDICATED TO REVOLUTIONISING</p>
            <p className="pdd-banner__main">YOUR CARAVAN BUYING EXPERIENCE</p>
            <div className="pdd-banner__features">
              <span>
                <span className="pdd-banner__icon-circle">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="10" width="22" height="9" rx="2"/><path d="M5 10V7a2 2 0 012-2h10a2 2 0 012 2v3"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></svg>
                </span>
                Australia&apos;s largest range
              </span>
              <span>
                <span className="pdd-banner__icon-circle">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </span>
                Trusted dealers
              </span>
              <span>
                <span className="pdd-banner__icon-circle">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </span>
                Safe &amp; secure platform
              </span>
            </div>
          </div>
          <a href="/listings/" className="pdd-banner__cta">FIND DEALS NOW</a>
        </div>

        {/* ── Similar Caravans ── */}
        {makeListings.length > 0 && (
          <section className="pdd-section pdd-similar">
            <h2 className="pdd-section__title">Similar Caravans</h2>
            <div className="pdd-similar__wrap">
              <div className="pdd-similar__grid">
                {makeListings.slice(0, 4).map((r, i) => {
                  const rName     = r.name ?? "";
                  const imgUrl    = r.image_url?.[0] || r.image || undefined;
                  const rPrice    = parseAmt(r.sale_price || r.regular_price);
                  const rLoc      = r.location ?? "";
                  const rCat      = r.categories?.[0] ?? "";
                  const isNew     = r.condition?.toLowerCase() === "new";
                  const isDealer  = r.seller_type !== "private";
                  return (
                    <a key={i} href={r.slug ? `/product/${r.slug}/` : "#"} className="pdd-similar__card">
                      <div className="pdd-similar__img">
                        {imgUrl
                          ? <Image src={imgUrl} alt={rName} fill style={{ objectFit: "cover" }} unoptimized />
                          : <div className="pdd-similar__img-placeholder" />
                        }
                        {rCat && <span className="pdd-similar__cat-chip">{rCat}</span>}
                      </div>
                      <div className="pdd-similar__body">
                        <p className="pdd-similar__name">{rName}</p>
                        <div className="pdd-similar__meta">
                          {rLoc && (
                            <span className="pdd-similar__meta-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              {rLoc}
                            </span>
                          )}
                          {r.condition && (
                            <span className="pdd-similar__meta-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                              {isNew ? "New" : "Used"}
                            </span>
                          )}
                          {r.seller_type && (
                            <span className="pdd-similar__meta-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                              {isDealer ? "Dealer" : "Private"}
                            </span>
                          )}
                        </div>
                        <p className="pdd-similar__price">{rPrice ? fmt(rPrice) : "POA"}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
              <div className="pdd-similar__viewall-col">
                {make && (
                  <a
                    href={`/listings/${slugify(make)}/${state ? `?state=${slugify(state)}` : ""}`}
                    className="pdd-similar__viewall-link"
                  >
                    View all {makeLabel} Caravans
                    {product.region?.value
                      ? <><br />in {product.region.value.replace(/-/g, " ")} &rsaquo;</>
                      : state
                      ? <><br />in {state} &rsaquo;</>
                      : <> &rsaquo;</>}
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Related Blogs + Related Searches ── */}
        <div className="pdd-related">
          {blogPosts.length > 0 && (
            <section className="pdd-related__blogs">
              <h2 className="pdd-section__title">Related Blogs</h2>
              <div className="pdd-blogs">
                {blogPosts.slice(0, 3).map((b, i) => (
                  <a key={i} href={`/${b.slug ?? ""}/`} className="pdd-blog">
                    {b.image && (
                      <div className="pdd-blog__img">
                        <Image src={b.image} alt={b.title} fill style={{ objectFit: "cover" }} unoptimized />
                      </div>
                    )}
                    <div className="pdd-blog__body">
                      <p className="pdd-blog__title">{b.title}</p>
                      
                      {b.date && (
                        <span className="pdd-blog__date">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ec7200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {fmtDate(b.date)}
                        </span>
                      )}
                    </div>
                    {/* <svg className="pdd-blog__arr" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg> */}
                  </a>
                ))}
              </div>
            </section>
          )}

          {relatedSearches.length > 0 && (
            <section className="pdd-related__searches">
              <h2 className="pdd-section__title">Related Searches</h2>
              <div className="pdd-searches">
                {relatedSearches.map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    className="pdd-search-link"
                  >
                    <span>{s.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

       

      </div>
    </div>

    {checklistOpen && (
      <div className="pdd-checklist-overlay" onClick={() => setChecklistOpen(false)}>
        <div className="pdd-checklist-modal" onClick={e => e.stopPropagation()}>
          <button className="pdd-checklist-close" onClick={() => setChecklistOpen(false)} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          {/* Header */}
          <div className="pdd-checklist-header">
            <div>
              <h2 className="pdd-checklist-title">Caravan Buyer Safety Checklist</h2>
              <p className="pdd-checklist-sub">Follow these steps to reduce the risk of scams when buying a caravan.</p>
            </div>
          </div>

          {/* Items card */}
          <div className="pdd-checklist-card">
            <p className="pdd-checklist-section">Before you buy</p>
            {[
              { n: 1, title: "Check for finance owing",    desc: "Run a PPSR search before paying." },
              { n: 2, title: "Verify the seller",          desc: "Confirm identity and speak directly with them." },
              { n: 3, title: "Inspect the caravan first",  desc: "Inspect in person or arrange an inspection." },
              { n: 4, title: "Use safe payment methods",   desc: "Avoid cryptocurrency or overseas transfers." },
              { n: 5, title: "Report suspicious listings", desc: "Report listings that appear suspicious." },
            ].map(item => (
              <div key={item.n} className="pdd-checklist-item">
                <span className="pdd-checklist-num">{item.n}</span>
                <div>
                  <p className="pdd-checklist-item-title">{item.title}</p>
                  <p className="pdd-checklist-item-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    )}

    {modalOpen && (
      <CaravanDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        images={images}
        initialIndex={modalInitialIndex}
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name ?? "",
          image: images[0] ?? "",
          price: displayPrice,
          regularPrice: product.regular_price ?? 0,
          salePrice: product.sale_price ?? 0,
          isPOA,
          location,
        }}
      />
    )}
    </>
  );
}
