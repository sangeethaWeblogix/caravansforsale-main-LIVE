import type { CSSProperties } from "react";

const SKEL: CSSProperties = {
  background: "#e8e8e8",
  borderRadius: 6,
  animation: "skeleton-pulse 1.8s ease-in-out infinite",
};

function Skel({ w, h, style }: { w?: number | string; h: number; style?: CSSProperties }) {
  return <div style={{ ...SKEL, width: w ?? "100%", height: h, ...style }} />;
}

export default function BlogLoading() {
  return (
    <>
      <style>{`@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.55}}`}</style>

      {/* Hero — matches .blog-hero: grid 1fr 1fr, height 420px */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: 420, overflow: "hidden" }}>
        {/* Left: dark bg with title skeleton */}
        <div style={{ background: "#000", display: "flex", alignItems: "center", padding: "48px 56px 48px 8%" }}>
          <div style={{ width: "100%" }}>
            <Skel h={36} style={{ background: "#333", marginBottom: 12 }} />
            <Skel h={28} w="75%" style={{ background: "#333", marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 20 }}>
              <Skel h={14} w={100} style={{ background: "#444", borderRadius: 4 }} />
              <Skel h={14} w={80} style={{ background: "#444", borderRadius: 4 }} />
            </div>
          </div>
        </div>
        {/* Right: image placeholder */}
        <div style={{ background: "#1a3a6b" }} />
      </div>

      {/* Browse section — matches .blog-browse-section */}
      <div style={{ background: "#f8f9fc", borderBottom: "1px solid #e4e8f0", padding: "28px 0 24px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 15px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, alignItems: "start" }}>
            {/* Left: TOC skeleton */}
            <div style={{ background: "#fff", border: "1px solid #e4e8f0", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#f0f2f8", padding: "14px 18px", borderBottom: "1px solid #e4e8f0" }}>
                <Skel h={16} w="60%" style={{ borderRadius: 4 }} />
              </div>
              <div style={{ padding: "8px 0" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ padding: "10px 18px", borderBottom: "1px solid #f4f5f8" }}>
                    <Skel h={13} w={`${70 - i * 8}%`} style={{ borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            </div>
            {/* Right: CTA + tabs skeleton */}
            <div>
              <div style={{ background: "#fff", border: "1px solid #e4e8f0", borderRadius: 10, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <Skel h={18} w="50%" style={{ marginBottom: 8 }} />
                  <Skel h={13} w="70%" />
                </div>
                <Skel h={38} w={160} style={{ borderRadius: 6, marginLeft: 20 }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {["Location", "Manufacturer", "Type"].map((_, i) => (
                  <Skel key={i} h={36} w={110} style={{ borderRadius: 6 }} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skel key={i} h={14} w={`${140 + (i % 3) * 30}px`} style={{ borderRadius: 4 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article section — matches .blog-article-layout: 1fr 300px */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 15px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 52, alignItems: "start" }}>
          {/* Main content */}
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skel key={i} h={16} w={i % 4 === 3 ? "65%" : "100%"} style={{ marginBottom: 12 }} />
            ))}
            <Skel h={200} style={{ margin: "28px 0", borderRadius: 8 }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skel key={i} h={16} w={i % 3 === 2 ? "55%" : "100%"} style={{ marginBottom: 12 }} />
            ))}
          </div>
          {/* Sidebar */}
          <div style={{ border: "1px solid #e4e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: "#0c1f3f", padding: "20px" }}>
              <Skel h={18} w="80%" style={{ background: "#1e3a60", borderRadius: 4, marginBottom: 10 }} />
              <Skel h={13} style={{ background: "#1e3a60", borderRadius: 4, marginBottom: 6 }} />
              <Skel h={13} w="85%" style={{ background: "#1e3a60", borderRadius: 4 }} />
            </div>
            <div style={{ padding: 20 }}>
              <Skel h={44} style={{ borderRadius: 6, marginBottom: 12 }} />
              <Skel h={44} style={{ borderRadius: 6 }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
