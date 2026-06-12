import type { CSSProperties } from "react";

const SKEL: CSSProperties = {
  background: "#e8e8e8",
  borderRadius: 6,
  animation: "skeleton-pulse 1.8s ease-in-out infinite",
};

function Skel({ w, h, style }: { w?: number | string; h: number; style?: CSSProperties }) {
  return <div style={{ ...SKEL, width: w ?? "100%", height: h, ...style }} />;
}

export default function ProductLoading() {
  return (
    <>
    <style>{`@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
    <main className="mx-auto">
      <section className="product caravan_dtt">
        <div className="container">
          <div className="content">
            <div className="row justify-content-center">

              {/* Left column — image gallery + details */}
              <div className="col-xl-8 col-lg-8 col-md-12">
                <div className="product-info left-info">
                  <div style={{ marginTop: 12 }}><Skel h={28} w="70%" style={{ borderRadius: 4 }} /></div>
                  <div style={{ marginTop: 12 }}><Skel h={420} style={{ borderRadius: 8 }} /></div>

                  {/* Thumbnails */}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skel key={i} h={60} w={80} style={{ borderRadius: 4, flexShrink: 0 }} />
                    ))}
                  </div>

                  {/* Specs */}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skel key={i} h={32} w={120} style={{ borderRadius: 6 }} />
                    ))}
                  </div>

                  {/* Description lines */}
                  <div style={{ marginTop: 16 }}><Skel h={16} /></div>
                  <div style={{ marginTop: 8 }}><Skel h={16} /></div>
                  <div style={{ marginTop: 8 }}><Skel h={16} w="80%" /></div>
                  <div style={{ marginTop: 8 }}><Skel h={16} /></div>
                  <div style={{ marginTop: 8 }}><Skel h={16} w="60%" /></div>
                </div>
              </div>

              {/* Right column — price + contact */}
              <div className="col-xl-4 col-lg-4 col-md-12">
                <div style={{ borderRadius: 8, border: "1px solid #e4e4e4", padding: 16, marginTop: 12 }}>
                  <Skel h={36} w="55%" style={{ borderRadius: 6 }} />
                  <div style={{ marginTop: 8 }}><Skel h={14} w="40%" /></div>
                  <div style={{ marginTop: 12 }}><Skel h={44} style={{ borderRadius: 6 }} /></div>
                  <div style={{ marginTop: 8 }}><Skel h={44} style={{ borderRadius: 6 }} /></div>

                  {/* Key specs */}
                  <div style={{ marginTop: 16 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <Skel h={16} w="40%" style={{ borderRadius: 4 }} />
                        <Skel h={16} w="35%" style={{ borderRadius: 4 }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
