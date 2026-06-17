import type { CSSProperties } from "react";
import { headers } from "next/headers";
import { parseSlugToFilters } from "@/app/components/urlBuilder";

const SKEL: CSSProperties = {
  background: "linear-gradient(90deg, #ebebeb 25%, #f5f5f5 50%, #ebebeb 75%)",
  backgroundSize: "600px 100%",
  borderRadius: 6,
  animation: "shimmer 1.4s ease-in-out infinite",
};

function Skel({ w, h, style }: { w?: number | string; h: number; style?: CSSProperties }) {
  return <div style={{ ...SKEL, width: w ?? "100%", height: h, ...style }} />;
}

function CardSkel() {
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #ebebeb", background: "#fff" }}>
      <Skel h={210} style={{ borderRadius: 0 }} />
      <div style={{ padding: "12px 14px 14px" }}>
        <Skel h={16} w="80%" />
        <div style={{ marginTop: 8 }}><Skel h={13} w="50%" /></div>
        <div style={{ marginTop: 10 }}><Skel h={20} w="34%" /></div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Skel h={22} w={60} style={{ borderRadius: 4 }} />
          <Skel h={22} w={60} style={{ borderRadius: 4 }} />
          <Skel h={22} w={60} style={{ borderRadius: 4 }} />
        </div>
        <div style={{ marginTop: 8 }}><Skel h={13} w="55%" /></div>
      </div>
    </div>
  );
}

function tagStyle(active: boolean): CSSProperties {
  return {
    whiteSpace: "nowrap",
    cursor: "default",
    background: "#fff",
    border: active ? "1px solid #ddd" : "1px solid #ddd",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 15,
    fontFamily: "inherit",
  };
}

const CHIP: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: 20,
  padding: "4px 8px 4px 12px",
  fontSize: 13,
  color: "#333",
  whiteSpace: "nowrap",
};

function toTitle(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ListingsLoading() {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";

  const slugString = pathname.replace(/^\/listings\//, "").replace(/\/$/, "");
  const slugParts = slugString.split("/").filter(Boolean);
  const f = parseSlugToFilters(slugParts);

  const activeCategory  = !!f.category;
  const activeLocation  = !!(f.state || f.suburb);
  const activeCondition = !!f.condition;
  const activeMake      = !!f.make;
  const activePrice     = !!(f.from_price || f.to_price);
  const activeAtm       = !!(f.minKg || f.maxKg);

  const filterTags = [
    { label: "Caravan Type", active: activeCategory },
    { label: "Location",     active: activeLocation },
    { label: "Condition",    active: activeCondition },
    { label: "Make",         active: activeMake },
    { label: "Price",        active: activePrice },
    { label: "ATM",          active: activeAtm },
  ];

  // Active chips — same order as the real FilterSlider
  const chips: string[] = [];
  if (f.make)       chips.push(toTitle(f.make));
  if (f.model)      chips.push(toTitle(f.model));
  if (f.condition)  chips.push(f.condition.toLowerCase() === "new" ? "New" : "Used");
  if (f.category)   chips.push(toTitle(f.category));
  if (f.state)      chips.push(toTitle(f.state));
  if (f.region)     chips.push(toTitle(f.region));
  if (f.suburb)     chips.push(toTitle(f.suburb));
  if (f.from_price || f.to_price) {
    const from = f.from_price ? `$${Number(f.from_price).toLocaleString()}` : null;
    const to   = f.to_price   ? `$${Number(f.to_price).toLocaleString()}`   : null;
    chips.push(from && to ? `${from} – ${to}` : from ? `From ${from}` : `Upto ${to}`);
  }
  if (f.minKg || f.maxKg) {
    const from = f.minKg ? `${Number(f.minKg).toLocaleString()} kg` : null;
    const to   = f.maxKg ? `${Number(f.maxKg).toLocaleString()} kg` : null;
    chips.push(from && to ? `${from} – ${to}` : from ? `From ${from}` : `Upto ${to}`);
  }

  const activeCount = [activeCategory, activeLocation, activeCondition, activeMake, activePrice, activeAtm].filter(Boolean).length;

  const FILTER_BTN: CSSProperties = {
    cursor: "default",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 60,
    padding: "6px 14px",
    fontWeight: 500,
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontFamily: "inherit",
    position: "absolute",
    left: 0,
    top: 0,
  };

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}.active_filter{color:#ec7200;font-size:10px!important;position:relative;margin-left:4px}`}</style>

      {/* Search bar — static placeholder with correct active states + chips */}
      <div style={{
        padding: "12px",
        background: "#fff",
        position: "relative",
        boxShadow: "rgba(0,0,0,0.2) 0px 1px 3px",
        minHeight: 62,
      }}>
        <div className="container">
          {/* Filter tag row */}
          <div style={{ position: "relative" }}>
            <button style={FILTER_BTN}>
              {activeCount > 0 ? (
                <span style={{
                  color: "#fff",
                  width: 25,
                  height: 25,
                  background: "#ec7200",
                  borderRadius: 50,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                }}>
                  {activeCount}
                </span>
              ) : (
                <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
              )}
              {" "}Filters
            </button>
            <div style={{ paddingLeft: 122, display: "flex", gap: 10, alignItems: "center", overflow: "hidden" }}>
              {filterTags.map(({ label, active }) => (
                <button key={label} style={tagStyle(active)}>
                  {label}
                  {active && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                </button>
              ))}
            </div>
          </div>

          {/* Active chips row */}
          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, paddingTop: 12 }}>
              {chips.map((chip) => (
                <span key={chip} style={CHIP}>
                  {chip}
                  <span style={{ padding: "0 2px", fontSize: 17, color: "#888", lineHeight: 1 }}>×</span>
                </span>
              ))}
              <button style={{
                background: "none",
                border: "none",
                padding: "4px 2px",
                cursor: "default",
                fontSize: 13,
                color: "#f58333",
                textDecoration: "underline",
                fontFamily: "inherit",
              }}>
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="services product_listing new_listing bg-gray-100 section-padding pb-3 style-1">
        <div className="container">
          <div className="row">
            {/* Main col */}
            <div className="col-lg-9">
              {/* Title row — matches real LisitingContent structure exactly */}
              <div className="top-filter mb-10">
                <div className="row align-items-center">
                  <div className="col-lg-8 col-md-8 col-sm-8 col-12 show_count_wrapper">
                    <Skel h={24} w="70%" style={{ borderRadius: 4 }} />
                  </div>
                  <div className="col-lg-4 col-md-4 col-sm-4 col-12 d-flex justify-content-end">
                    <Skel h={36} w={160} style={{ borderRadius: 6 }} />
                  </div>
                </div>
              </div>

              <div className="row g-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="col-lg-6 col-sm-6 col-md-6">
                    <CardSkel />
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar desktop only */}
            <div className="col-lg-3 d-none d-lg-block">
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #ebebeb", background: "#fff" }}>
                <div style={{ position: "relative" }}>
                  <Skel h={230} style={{ borderRadius: 0 }} />
                  <div style={{ ...SKEL, position: "absolute", top: 0, left: 0, right: 0, height: 28, borderRadius: 0 }} />
                </div>
                <div style={{ padding: "14px 16px 16px" }}>
                  <Skel h={18} w="78%" />
                  <div style={{ marginTop: 8 }}><Skel h={13} w="52%" /></div>
                  <div style={{ marginTop: 12 }}><Skel h={22} w="36%" /></div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <Skel h={24} w={66} style={{ borderRadius: 4 }} />
                    <Skel h={24} w={66} style={{ borderRadius: 4 }} />
                  </div>
                  <div style={{ marginTop: 8 }}><Skel h={13} w="58%" /></div>
                  <div style={{ marginTop: 12 }}><Skel h={38} style={{ borderRadius: 6 }} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
