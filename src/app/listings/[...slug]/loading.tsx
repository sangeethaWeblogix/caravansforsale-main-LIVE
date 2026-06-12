import type { CSSProperties } from "react";

const SKEL: CSSProperties = {
  background: "#e8e8e8",
  borderRadius: 6,
  animation: "skeleton-pulse 1.8s ease-in-out infinite",
};

function Skel({ w, h, style }: { w?: number | string; h: number; style?: CSSProperties }) {
  return <div style={{ ...SKEL, width: w ?? "100%", height: h, ...style }} />;
}

function CardSkel() {
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e4e4e4" }}>
      <Skel h={220} style={{ borderRadius: 0 }} />
      <div style={{ padding: "14px 16px 16px" }}>
        <Skel h={18} w="78%" />
        <div style={{ marginTop: 8 }}><Skel h={13} w="52%" /></div>
        <div style={{ marginTop: 12 }}><Skel h={22} w="36%" /></div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Skel h={24} w={66} style={{ borderRadius: 4 }} />
          <Skel h={24} w={66} style={{ borderRadius: 4 }} />
          <Skel h={24} w={66} style={{ borderRadius: 4 }} />
        </div>
        <div style={{ marginTop: 8 }}><Skel h={13} w="58%" /></div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Skel h={36} w="45%" style={{ borderRadius: 8 }} />
          <Skel h={36} w="45%" style={{ borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

export default function ListingsLoading() {
  return (
    <>
    <style>{`@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
    <section
      className="services product_listing new_listing section-padding pb-3 style-1"
      >

      <div className="container">
        {/* Filter bar */}
        <div style={{ display: "flex", gap: 10, padding: "12px 0", marginBottom: 16, flexWrap: "wrap" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skel key={i} h={36} w={100} style={{ borderRadius: 20 }} />
          ))}
        </div>

        <div className="row">
          {/* Main grid col-lg-9 */}
          <div className="col-lg-9">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Skel h={22} w={220} style={{ borderRadius: 4 }} />
              <Skel h={36} w={140} style={{ borderRadius: 6 }} />
            </div>
            <div className="row g-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="col-lg-6 col-sm-6 col-md-6">
                  <CardSkel />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar col-lg-3 desktop only */}
          <div className="col-lg-3 d-none d-lg-block">
            <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e4e4e4" }}>
              <div style={{ position: "relative" }}>
                <Skel h={240} style={{ borderRadius: 0 }} />
                <div style={{ ...SKEL, position: "absolute", top: 0, left: 0, right: 0, height: 30, borderRadius: 0 }} />
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
