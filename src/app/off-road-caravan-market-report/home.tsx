"use client";

import { useState } from "react";
import "./main.css";
import type { MarketReportData, TrendPoint } from "./page";

interface Props { data: MarketReportData }

/* ── Helpers ── */
const fmt     = (n: number) => n > 0 ? n.toLocaleString("en-AU") : "—";
const fmtPct  = (n: number) => n > 0 ? `${n.toFixed(1)}%` : "—";
const fmtAUD  = (n: number) => n > 0 ? `$${n.toLocaleString("en-AU")}` : "—";
const fmtKg   = (n: number) => n > 0 ? `${n.toLocaleString("en-AU")}kg` : "—";
const fmtK    = (n: number) => n > 0 ? `${(n / 1000).toFixed(0)}k` : "—";

/* ── Donut Chart (conic-gradient) ── */
function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="omr-donut omr-donut--empty" />;

  let cursor = 0;
  const stops = segments.map(seg => {
    const pct = (seg.value / total) * 100;
    const stop = `${seg.color} ${cursor.toFixed(1)}% ${(cursor + pct).toFixed(1)}%`;
    cursor += pct;
    return stop;
  });

  return (
    <div
      className="omr-donut"
      style={{ background: `conic-gradient(${stops.join(", ")})` }}
    />
  );
}

/* ── Horizontal Bar ── */
function HBar({ label, value, displayValue, max, color }: {
  label: string; value: number; displayValue: string; max: number; color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="omr-hbar">
      <div className="omr-hbar__label">{label}</div>
      <div className="omr-hbar__track">
        <div className="omr-hbar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="omr-hbar__value">{displayValue}</div>
    </div>
  );
}

/* ── Vertical Bar Chart ── */
function VBarChart({ data, maxVal }: { data: { label: string; value: number }[]; maxVal?: number }) {
  const max = maxVal ?? Math.max(...data.map(d => d.value), 1);
  return (
    <div className="omr-vbar-chart">
      {data.map((d, i) => (
        <div key={i} className="omr-vbar-col">
          <div className="omr-vbar-val">{fmtAUD(d.value)}</div>
          <div className="omr-vbar-track">
            <div className="omr-vbar-fill" style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
          <div className="omr-vbar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── SVG Line Chart ── */
function LineChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) return null;
  const W = 300, H = 100, PAD = { t: 8, r: 8, b: 24, l: 8 };
  const vals = data.map(d => d.total);
  const max = Math.max(...vals) * 1.05;
  const min = Math.min(...vals) * 0.9;
  const range = max - min || 1;
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;
  const pts = data.map((d, i) => {
    const x = PAD.l + (i / (data.length - 1)) * cw;
    const y = PAD.t + (1 - (d.total - min) / range) * ch;
    return { x, y, d };
  });
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length-1].x} ${PAD.t + ch} L ${pts[0].x} ${PAD.t + ch} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="omr-linechart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ec7200" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ec7200" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#lgrad)" />
      <path d={linePath} fill="none" stroke="#ec7200" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ec7200" />
      ))}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize="9" fill="#888">{p.d.label}</text>
      ))}
    </svg>
  );
}

/* ── FAQ accordion ── */
const FAQS = [
  { q: "How much does an off road caravan cost in Australia?",        a: "All prices shown are advertised asking prices from active marketplace listings on CaravansForSale.com.au. The median figures shown above represent the midpoint of current inventory and may not reflect the price of an individual caravan. Actual sale prices may differ." },
  { q: "Which state has the most off road caravans for sale?",        a: "The state breakdown table above shows current inventory by state. Victoria typically has the largest share of Australian off road caravan listings, followed by New South Wales and Queensland." },
  { q: "What is the most common off road caravan size?",              a: "The 18–20ft range is consistently one of the most common size categories in Australian off road caravan inventory, making it the most widely represented size class in current listings." },
  { q: "What is ATM and why does it matter for off road caravans?",   a: "ATM means Aggregate Trailer Mass — the maximum allowable laden weight of the caravan as rated by the manufacturer. ATM is a key figure when determining whether a tow vehicle is rated to tow a specific caravan. Always check a caravan's ATM against your tow vehicle's rated capacity before purchasing." },
  { q: "Are the prices in this report actual sale prices?",           a: "No. All prices shown are advertised asking prices from active marketplace listings. The final amount paid by a buyer may differ from the advertised asking price." },
  { q: "How often is the Off Road Caravan Market Report updated?",    a: "This report is refreshed regularly using active CaravansForSale.com.au marketplace data. The exact data snapshot date is noted at the top of the page." },
  { q: "Which off road caravan brands have the most listings?",       a: "The top brands by active inventory are listed in the brands table above. This measures marketplace availability on CaravansForSale.com.au rather than national manufacturer sales or industry ranking." },
  { q: "Are new or used off road caravans more common on the market?","a": "The new vs used breakdown at the top of this page shows the current split. In general, the Australian marketplace has a roughly even split between new and used off road caravan inventory." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`omr-faq-item${open ? " omr-faq-item--open" : ""}`} onClick={() => setOpen(!open)}>
      <div className="omr-faq-item__q">
        <span>{q}</span>
        <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"}`} />
      </div>
      {open && <div className="omr-faq-item__a">{a}</div>}
    </div>
  );
}

/* ── Main Component ── */
export default function Home({ data }: Props) {
  const { snapshot, states, lengths, atms, sleeps, brands, trend } = data;
  const { total_count, new_count, used_count, new_price_median, used_price_median, median_price } = snapshot;

  const newShare  = total_count > 0 ? ((new_count  / total_count) * 100).toFixed(1) : "0";
  const usedShare = total_count > 0 ? ((used_count / total_count) * 100).toFixed(1) : "0";
  const maxPrice  = Math.max(new_price_median, used_price_median, median_price);
  const topState  = states.length > 0 ? states[0] : null;
  const topBrands = brands.slice(0, 3).map(b => b.brand).filter(Boolean).join(", ");
  const atmAbove3k = atms.find(a => a.range.includes("3,000") || a.range.includes("3000"));

  const KEY_TAKEAWAYS = [
    total_count > 0 && {
      icon: "bi-check-circle",
      title: "Strong Inventory",
      text: `Over ${fmtK(total_count)} off road caravans are currently for sale across Australia.`,
    },
    (new_price_median > 0 && used_price_median > 0) && {
      icon: "bi-tag",
      title: "Price Gap",
      text: `New caravans are advertised at a median of ${fmtAUD(new_price_median)}, ${Math.round(((new_price_median - used_price_median) / used_price_median) * 100)}% higher than used.`,
    },
    lengths.length > 0 && lengths[0] && {
      icon: "bi-rulers",
      title: "Popular Size",
      text: `The ${lengths[1]?.range || "18–20ft"} range is the most common size, making up ${fmtPct(lengths[1]?.share ?? 0)} of current inventory.`,
    },
    atmAbove3k && {
      icon: "bi-speedometer2",
      title: "Weight Matters",
      text: `${fmtPct(atmAbove3k.share)} of listings with valid ATM data have an ATM of 3,000kg or more.`,
    },
    topState && {
      icon: "bi-geo-alt",
      title: "Top States",
      text: `${topState.state} has the most inventory, followed by ${states[1]?.state ?? "NSW"} and ${states[2]?.state ?? "QLD"}.`,
    },
  ].filter(Boolean) as { icon: string; title: string; text: string }[];

  return (
    <main>
      {/* ── Hero ── */}
      <section className="omr-hero">
        <div className="container">
          <div className="omr-hero__inner">
            <div className="omr-hero__content">
<h1 className="omr-hero__title">
                Australian Off Road Caravan<br />
                <span className="omr-hero__title--main">Market Report 2026</span>
              </h1>
              <p className="omr-hero__intel">CaravansForSale.com.au Marketplace Intelligence</p>
              
              <p className="omr-hero__desc">
                The <strong>Australian Off Road Caravan Market Report 2026</strong> analyses active off road caravan advertisements on CaravansForSale.com.au to provide a clearer picture of current marketplace supply, advertised asking prices, caravan sizes, ATM, sleeping capacities, brands and geographic availability across Australia.
              </p>
              <p className="omr-hero__desc">
                Rather than relying on manufacturer recommended retail prices or broad caravan-industry estimates, this report examines caravans currently being advertised by dealers and private sellers. The figures represent <strong>advertised marketplace inventory and asking prices</strong>, not confirmed transaction or sold prices.
              </p>
              <div className="omr-hero__meta">
                <span><i className="bi bi-calendar3" /> Published: 12 May 2026</span>
                <span className="omr-hero__meta-sep">|</span>
                <span><i className="bi bi-database" /> Data snapshot: 11 May 2026</span>
                <span className="omr-hero__meta-sep">|</span>
                <span><i className="bi bi-arrow-clockwise" /> Next update: June 2026</span>
              </div>
              <div className="omr-hero__btns">
                <a href="/listings/off-road-category/" className="omr-btn omr-btn--primary">
                  Browse Off Road Caravans for Sale <i className="bi bi-arrow-right" />
                </a>
                <a href="/off-road-caravans/" className="omr-btn omr-btn--outline-dark">
                  Explore Off Road Caravans <i className="bi bi-arrow-right" />
                </a>
              </div>
            </div>
            <div className="omr-hero__img-col">
              <img
                src="/images/off-road.webp"
                alt="Off Road Caravan"
                className="omr-hero__img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Market at a Glance ── */}
      <section className="omr-glance">
        <div className="container">
          <h2 className="omr-section-title text-center">Australian Off Road Caravan Market at a Glance</h2>
          {total_count > 0 && (
            <div className="omr-glance-intro">
              <p>The Australian off road caravan marketplace currently contains <strong>{fmt(total_count)} active listings</strong> on CaravansForSale.com.au, including <strong>{fmt(new_count)} new</strong> and <strong>{fmt(used_count)} used</strong> off road caravans.</p>
              {median_price > 0 && (
                <p>Among listings with valid advertised prices, the national median asking price is currently <strong>{fmtAUD(median_price)}</strong>.</p>
              )}
            </div>
          )}
          <div className="omr-snap-grid">
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/caravan_black.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{total_count > 0 ? `${fmt(total_count)}+` : "—"}</div>
              <div className="omr-snap-label">Total Active<br />Off Road Caravans</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/caravan_black.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{fmt(new_count)}</div>
              <div className="omr-snap-label">New Off Road<br />Caravans</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/caravan_black.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{fmt(used_count)}</div>
              <div className="omr-snap-label">Used Off Road<br />Caravans</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/good.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{fmtAUD(median_price)}</div>
              <div className="omr-snap-label">Median Advertised<br />Asking Price</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/dollar_au.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{fmtAUD(new_price_median)}</div>
              <div className="omr-snap-label">Median New<br />Asking Price</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/dollar_au.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{fmtAUD(used_price_median)}</div>
              <div className="omr-snap-label">Median Used<br />Asking Price</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/ruler.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{snapshot.common_length || "—"}</div>
              <div className="omr-snap-label">Most Common<br />Length</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/weight.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{fmtKg(snapshot.median_atm)}</div>
              <div className="omr-snap-label">Median ATM</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/double.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{snapshot.common_sleeps > 0 ? `${snapshot.common_sleeps} Berth` : "—"}</div>
              <div className="omr-snap-label">Most Common<br />Sleeping Capacity</div>
            </div>
          </div>
          <p className="omr-data-note">
            Data represents active listings on CaravansForSale.com.au at the stated snapshot date. Advertised prices are asking prices, not confirmed sale prices.
          </p>
        </div>
      </section>

      {/* ── Australia's Caravan Market Context ── */}
      <section className="omr-market-context">
        <div className="container">
          <h2 className="omr-section-title">Australia&apos;s Caravan Market in 2026</h2>
          <div className="omr-context-grid">
            <div className="omr-context-text">
              <p>Off road caravans form part of a substantial Australian caravan and camping market.</p>
              <p>Australians took <strong>17.3 million domestic caravan and camping trips during 2025</strong>, generating 57.9 million visitor nights and approximately <strong>$12.6 billion in expenditure</strong>. Regional Australia remains particularly important, with 87% of caravan and camping trips occurring in regional areas.</p>
              <p>Australia also continues to manufacture a substantial number of recreational vehicles. Australian manufacturers produced <strong>23,963 RVs during 2025</strong>, with towable vehicles accounting for 96% of production. Caravan production reached <strong>18,438 units</strong>, an increase of 7.3% from the previous year.</p>
              <p>These figures describe Australia&apos;s broader caravan and camping industry. The statistics throughout the remainder of this report relate specifically to <strong>off road caravan advertisements appearing on CaravansForSale.com.au</strong>.</p>
            </div>
            <div className="omr-context-stats">
              {[
                { icon: "bi-people",          val: "17.3M+",     label: "Overnight caravan trips taken in Australia each year" },
                { icon: "bi-currency-dollar", val: "$12.6B",     label: "Estimated annual Australian RV industry revenue" },
                { icon: "bi-graph-up-arrow",  val: "Growing",    label: "Off road segment share of the total caravan market" },
                { icon: "bi-map",             val: "All States", label: "Off road caravans listed across every Australian state &amp; territory" },
              ].map((s, i) => (
                <div key={i} className="omr-context-stat">
                  <div className="omr-context-stat__icon"><i className={`bi ${s.icon}`} /></div>
                  <div>
                    <div className="omr-context-stat__val">{s.val}</div>
                    <div className="omr-context-stat__label" dangerouslySetInnerHTML={{ __html: s.label }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How Many Off Road Caravans For Sale ── */}
      <section className="omr-supply-section">
        <div className="container">
          <div className="omr-supply-grid">
            {/* Left column */}
            <div className="omr-supply-left">
              <div className="omr-supply-heading-row">
                <div className="omr-supply-hero-icon">
                  <img src="/images/caravan_black.png" alt="" />
                </div>
                <h2 className="omr-supply-heading">
                  How Many Off Road Caravans Are for Sale
                  <span className="omr-supply-heading--orange">in Australia?</span>
                  <span className="omr-supply-heading__underline" />
                </h2>
              </div>
              {total_count > 0 ? (
                <>
                  <p className="omr-supply-intro">
                    At the latest marketplace snapshot, there are{" "}
                    <span className="omr-supply-count">{fmt(total_count)}</span>{" "}
                    active off road caravan advertisements on{" "}
                    <a href="/" className="omr-supply-link">CaravansForSale.com.au</a>.
                  </p>
                  <p className="omr-supply-of-these">Of these:</p>
                  <div className="omr-supply-stats">
                    <div className="omr-supply-stat">
                      <div className="omr-supply-stat__icon omr-supply-stat__icon--new"><i className="bi bi-tag-fill" /></div>
                      <span className="omr-supply-stat__num">{fmt(new_count)}</span>
                      <span className="omr-supply-stat__label">are new</span>
                    </div>
                    <div className="omr-supply-stat">
                      <div className="omr-supply-stat__icon omr-supply-stat__icon--used"><i className="bi bi-truck" /></div>
                      <span className="omr-supply-stat__num">{fmt(used_count)}</span>
                      <span className="omr-supply-stat__label">are used</span>
                    </div>
                    {total_count - new_count - used_count > 0 && (
                      <div className="omr-supply-stat">
                        <div className="omr-supply-stat__icon omr-supply-stat__icon--other"><i className="bi bi-question-circle" /></div>
                        <span className="omr-supply-stat__num">{fmt(total_count - new_count - used_count)}</span>
                        <span className="omr-supply-stat__label">have another or unspecified condition</span>
                      </div>
                    )}
                  </div>
                  <div className="omr-supply-callout">
                    <i className="bi bi-graph-up-arrow omr-supply-callout__icon" />
                    <p>This means new caravans currently account for approximately <strong>{newShare}%</strong> of classified off road inventory, while used caravans represent <strong>{usedShare}%</strong>.</p>
                  </div>
                </>
              ) : (
                <p className="omr-supply-intro">Off road caravans from private sellers and dealers across all Australian states and territories are listed on CaravansForSale.com.au.</p>
              )}
            </div>
            {/* Right column */}
            <div className="omr-supply-right">
              <div className="omr-supply-table-header">
                <i className="bi bi-bar-chart-fill omr-supply-table-header__icon" />
                <div>
                  <p className="omr-supply-table-header__title">New vs Used Off Road Caravan Supply</p>
                  <div className="omr-supply-table-header__underline" />
                </div>
              </div>
              <div className="omr-table-scroll">
                <table className="omr-table">
                  <thead>
                    <tr><th>Condition</th><th>Active Listings</th><th>Share of Classified Inventory</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="omr-badge omr-badge--new">New</span></td>
                      <td>{fmt(new_count)}</td>
                      <td>{fmtPct(parseFloat(newShare))}</td>
                    </tr>
                    <tr>
                      <td><span className="omr-badge omr-badge--used">Used</span></td>
                      <td>{fmt(used_count)}</td>
                      <td>{fmtPct(parseFloat(usedShare))}</td>
                    </tr>
                    {total_count - new_count - used_count > 0 && (
                      <tr>
                        <td>Other / Unknown</td>
                        <td>{fmt(total_count - new_count - used_count)}</td>
                        <td>—</td>
                      </tr>
                    )}
                    <tr className="omr-table-total">
                      <td><strong>Total</strong></td>
                      <td><strong>{fmt(total_count)}</strong></td>
                      <td><strong>{total_count > 0 ? "100%" : "—"}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="omr-supply-note">
                <i className="bi bi-info-circle omr-supply-note__icon" />
                <div>
                  <strong>Active marketplace listings only.</strong>
                  <p>Data from CaravansForSale.com.au at snapshot date.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* ── Charts Row 1: New/Used + Price + Trend ── */}
      <section className="omr-charts-row">
        <div className="container">
          <div className="omr-charts-3col">
            {/* New vs Used donut */}
            <div className="omr-chart-box">
              <h3 className="omr-chart-title">New vs Used Off Road Caravan Inventory</h3>
              <div className="omr-donut-wrap">
                <DonutChart segments={[
                  { value: new_count,  color: "#ec7200", label: "New"  },
                  { value: used_count, color: "#1e293b", label: "Used" },
                ]} />
                <div className="omr-donut-legend">
                  <div className="omr-donut-legend__item">
                    <span className="omr-donut-legend__dot" style={{ background: "#ec7200" }} />
                    <span>New {fmt(new_count)} ({newShare}%)</span>
                  </div>
                  <div className="omr-donut-legend__item">
                    <span className="omr-donut-legend__dot" style={{ background: "#1e293b" }} />
                    <span>Used {fmt(used_count)} ({usedShare}%)</span>
                  </div>
                  <div className="omr-donut-legend__item">
                    <span className="omr-donut-legend__dot" style={{ background: "#ccc" }} />
                    <span>Other/Unknown 0 (0.0%)</span>
                  </div>
                </div>
              </div>
              <div className="omr-chart-links">
                <a href="/listings/new-condition/off-road-category/" className="omr-chart-link">Browse New Off Road Caravans <i className="bi bi-arrow-right" /></a>
                <a href="/listings/used-condition/off-road-category/" className="omr-chart-link">Browse Used Off Road Caravans <i className="bi bi-arrow-right" /></a>
              </div>
            </div>

            {/* Median Price horizontal bars */}
            <div className="omr-chart-box">
              <h3 className="omr-chart-title">Median Asking Price Overview</h3>
              <div className="omr-hbar-list">
                <HBar label="All Off Road Caravans" value={median_price}        displayValue={fmtAUD(median_price)}        max={maxPrice} color="#1e293b" />
                <HBar label="New Off Road Caravans"  value={new_price_median}   displayValue={fmtAUD(new_price_median)}   max={maxPrice} color="#ec7200" />
                <HBar label="Used Off Road Caravans" value={used_price_median}  displayValue={fmtAUD(used_price_median)}  max={maxPrice} color="#3b82f6" />
              </div>
              <p className="omr-chart-note"><i className="bi bi-info-circle" /> How Prices Are Calculated</p>
            </div>

            {/* Trend line chart */}
            <div className="omr-chart-box">
              <h3 className="omr-chart-title">Active Listings Over Time (Total)</h3>
              {trend.length >= 2 ? (
                <>
                  <LineChart data={trend} />
                  <div className="omr-chart-links">
                    <a href="#trend" className="omr-chart-link">View Trend Analysis <i className="bi bi-arrow-right" /></a>
                  </div>
                </>
              ) : (
                <div className="omr-chart-empty">
                  <i className="bi bi-graph-up" />
                  <p>Historical trend data will appear here as marketplace snapshots are collected over time.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── How Much Do Off Road Caravans Cost ── */}
      <section className="omr-price-section">
        <div className="container">
          <h2 className="omr-section-title">How Much Do Off Road Caravans Cost?</h2>
          <p className="omr-section-intro">All prices are advertised asking prices from active CaravansForSale.com.au listings. Actual sale prices may differ. POA (Price on Application) listings are excluded from all price calculations.</p>
          <div className="omr-price-2col">
            <div>
              <h3 className="omr-subsection-title">New Off Road Caravan Prices</h3>
              <p>New off road caravans are predominantly listed by authorised dealers. The median advertised asking price for a new off road caravan is <strong>{fmtAUD(new_price_median)}</strong>.</p>
              <p>Entry-level new off road caravans typically start from around $50,000–$70,000 for basic models with standard off-road capability. Premium and full expedition builds can exceed $150,000–$200,000 for caravans with extensive off-grid systems, independent suspension and higher-spec builds.</p>
              {new_price_median > 0 && (
                <div className="omr-price-highlight">
                  <div className="omr-price-card">
                    <div className="omr-price-card__label">Median New Asking Price</div>
                    <div className="omr-price-card__val">{fmtAUD(new_price_median)}</div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="omr-subsection-title">Used Off Road Caravan Prices</h3>
              <p>Used off road caravans represent a significant portion of the marketplace. The median advertised asking price for a used off road caravan is <strong>{fmtAUD(used_price_median)}</strong>.</p>
              <p>Used pricing varies widely depending on age, condition, brand, specifications and maintenance history. Well-serviced, low-use caravans from premium builders retain value well; heavily-used caravans from smaller builders may depreciate significantly.</p>
              {used_price_median > 0 && (
                <div className="omr-price-highlight">
                  <div className="omr-price-card omr-price-card--used">
                    <div className="omr-price-card__label">Median Used Asking Price</div>
                    <div className="omr-price-card__val">{fmtAUD(used_price_median)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <h3 className="omr-subsection-title mt-4">New vs Used Off Road Caravan Price Comparison</h3>
          <div className="omr-table-scroll">
            <table className="omr-table">
              <thead>
                <tr><th>Metric</th><th>New Off Road Caravans</th><th>Used Off Road Caravans</th></tr>
              </thead>
              <tbody>
                <tr><td>Median Asking Price</td><td>{fmtAUD(new_price_median)}</td><td>{fmtAUD(used_price_median)}</td></tr>
                <tr><td>Active Listings</td><td>{fmt(new_count)}</td><td>{fmt(used_count)}</td></tr>
                <tr><td>Share of Inventory</td><td>{fmtPct(parseFloat(newShare))}</td><td>{fmtPct(parseFloat(usedShare))}</td></tr>
                <tr><td>Typical Sellers</td><td>Dealers &amp; manufacturers</td><td>Private sellers &amp; dealers</td></tr>
                <tr><td>Warranty</td><td>Manufacturer warranty (typically 1–3 yr)</td><td>As negotiated; typically none</td></tr>
                <tr><td>Customisation</td><td>Order to specification possible</td><td>As listed; limited post-purchase changes</td></tr>
              </tbody>
            </table>
          </div>
          <div className="omr-price-buy-grid mt-4">
            <div className="omr-buy-card">
              <h4 className="omr-buy-card__title"><i className="bi bi-star" /> Why Buy New</h4>
              <ul className="omr-buy-list">
                <li>Full manufacturer warranty on structure and appliances</li>
                <li>Latest build standards, safety features and technology</li>
                <li>Ability to order to specification (layout, options, colour)</li>
                <li>Known full history — no hidden wear or previous damage</li>
                <li>Finance options often available through dealers</li>
              </ul>
              <a href="/listings/new-condition/off-road-category/" className="omr-btn omr-btn--primary w-100 justify-content-center mt-3">Browse New Off Road Caravans <i className="bi bi-arrow-right" /></a>
            </div>
            <div className="omr-buy-card omr-buy-card--used">
              <h4 className="omr-buy-card__title"><i className="bi bi-tag" /> Why Buy Used</h4>
              <ul className="omr-buy-list">
                <li>Significant price advantage over new equivalents</li>
                <li>Immediate availability — no waiting for build or production slots</li>
                <li>Well-maintained caravans can be near-new condition</li>
                <li>Accessories and upgrades often included by the previous owner</li>
                <li>Lower depreciation exposure in the short term</li>
              </ul>
              <a href="/listings/used-condition/off-road-category/" className="omr-btn omr-btn--outline-dark w-100 justify-content-center mt-3">Browse Used Off Road Caravans <i className="bi bi-arrow-right" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Data Tables Row: States + Length + ATM ── */}
      <section className="omr-tables-row">
        <div className="container">
          <div className="omr-tables-3col">
            {/* By State */}
            <div className="omr-table-box">
              <h3 className="omr-table-title">Off Road Caravans by State</h3>
              {states.length > 0 ? (
                <div className="omr-table-scroll">
                  <table className="omr-table">
                    <thead><tr><th>State</th><th>Listings</th><th>Share</th><th>Median Price</th></tr></thead>
                    <tbody>
                      {states.map(s => (
                        <tr key={s.state}>
                          <td>{s.state}</td>
                          <td>{fmt(s.count)}</td>
                          <td>{fmtPct(s.share)}</td>
                          <td>{fmtAUD(s.median_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="omr-table-empty">No state data available.</div>}
              <a href="/listings/off-road-category/" className="omr-chart-link mt-3 d-inline-flex">Browse by State <i className="bi bi-arrow-right" /></a>
            </div>

            {/* By Length */}
            <div className="omr-table-box">
              <h3 className="omr-table-title">Off Road Caravan Prices by Length</h3>
              {lengths.length > 0 ? (
                <div className="omr-table-scroll">
                  <table className="omr-table">
                    <thead><tr><th>Length</th><th>Listings</th><th>Share*</th><th>Median Price</th></tr></thead>
                    <tbody>
                      {lengths.map(l => (
                        <tr key={l.range}>
                          <td>{l.range}</td>
                          <td>{fmt(l.count)}</td>
                          <td>{fmtPct(l.share)}</td>
                          <td>{fmtAUD(l.median_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="omr-table-empty">Length breakdown data not yet available.</div>}
              <a href="/listings/off-road-category/" className="omr-chart-link mt-3 d-inline-flex">View Size Guide <i className="bi bi-arrow-right" /></a>
            </div>

            {/* By ATM */}
            <div className="omr-table-box">
              <h3 className="omr-table-title">Off Road Caravans by ATM</h3>
              {atms.length > 0 ? (
                <div className="omr-table-scroll">
                  <table className="omr-table">
                    <thead><tr><th>ATM (kg)</th><th>Listings</th><th>Share*</th><th>Median Price</th></tr></thead>
                    <tbody>
                      {atms.map(a => (
                        <tr key={a.range}>
                          <td>{a.range}</td>
                          <td>{fmt(a.count)}</td>
                          <td>{fmtPct(a.share)}</td>
                          <td>{fmtAUD(a.median_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="omr-table-empty">ATM breakdown data not yet available.</div>}
              <a href="#atm-info" className="omr-chart-link mt-3 d-inline-flex">What is ATM? <i className="bi bi-info-circle" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Most Popular Sizes ── */}
      <section className="omr-sizes-section">
        <div className="container">
          <h2 className="omr-section-title">What Are the Most Popular Off Road Caravan Sizes?</h2>
          <div className="omr-sizes-grid">
            <div className="omr-sizes-text">
              <p>Off road caravan size is typically expressed as the length of the caravan body (excluding the drawbar). The most common size range in the Australian marketplace is <strong>{snapshot.common_length || "the 18–20ft range"}</strong>, which offers a balance of interior space, weight management and towability across a wide range of vehicles.</p>
              <p>Shorter caravans (under 16ft) are lighter and easier to tow, making them suitable for lighter tow vehicles. Larger caravans (over 20ft) offer more living space and storage but require higher-rated tow vehicles and are more challenging to manoeuvre on tight tracks.</p>
              <h3 className="omr-subsection-title">What Size Means for Buyers</h3>
              <div className="omr-size-guide">
                {[
                  { range: "Under 16ft", desc: "Lightweight build suited to standard SUVs and lighter tow vehicles. Limited storage, but highly manoeuvrable on tight tracks and remote terrain." },
                  { range: "16–18ft",    desc: "Growing segment. Good balance of weight and space, suited to mid-spec SUVs with appropriate tow ratings. Popular with couples." },
                  { range: "18–20ft",    desc: "The most common category in Australia. Full amenities, good clearance, requires a capable tow vehicle (typically 3,000kg+ tow rating)." },
                  { range: "20ft+",      desc: "Maximum interior space and storage. Requires a heavy-duty tow vehicle. Best suited to long-term travellers and families." },
                ].map((s, i) => (
                  <div key={i} className="omr-size-row">
                    <div className="omr-size-range">{s.range}</div>
                    <div className="omr-size-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              {lengths.length > 0 ? (
                <>
                  <h3 className="omr-subsection-title">Current Size Distribution</h3>
                  <div className="omr-hbar-list">
                    {lengths.map(l => (
                      <HBar key={l.range} label={l.range} value={l.count} displayValue={`${fmtPct(l.share)} · ${fmt(l.count)} listings`} max={Math.max(...lengths.map(x => x.count), 1)} color="#ec7200" />
                    ))}
                  </div>
                  <a href="/listings/off-road-category/" className="omr-chart-link mt-3 d-inline-flex">Browse by Size <i className="bi bi-arrow-right" /></a>
                </>
              ) : (
                <div className="omr-chart-empty">
                  <i className="bi bi-rulers" />
                  <p>Size distribution data will appear here when available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Charts Row 2: Sleeps + Price by Length + New vs Used Price ── */}
      <section className="omr-charts-row">
        <div className="container">
          <div className="omr-charts-3col">
            {/* Sleeping capacity donut */}
            <div className="omr-chart-box">
              <h3 className="omr-chart-title">Most Common Sleeping Capacity</h3>
              {sleeps.length > 0 ? (
                <>
                  <div className="omr-donut-wrap">
                    <DonutChart segments={[
                      { value: sleeps[0]?.count ?? 0, color: "#ec7200", label: sleeps[0]?.berths ?? "" },
                      { value: sleeps[1]?.count ?? 0, color: "#1e293b", label: sleeps[1]?.berths ?? "" },
                      { value: sleeps[2]?.count ?? 0, color: "#3b82f6", label: sleeps[2]?.berths ?? "" },
                      { value: sleeps[3]?.count ?? 0, color: "#10b981", label: sleeps[3]?.berths ?? "" },
                      { value: sleeps[4]?.count ?? 0, color: "#8b5cf6", label: sleeps[4]?.berths ?? "" },
                    ].filter(s => s.value > 0)} />
                    <div className="omr-donut-legend">
                      {[
                        { color: "#ec7200" }, { color: "#1e293b" }, { color: "#3b82f6" },
                        { color: "#10b981" }, { color: "#8b5cf6" },
                      ].map((c, i) => sleeps[i] ? (
                        <div key={i} className="omr-donut-legend__item">
                          <span className="omr-donut-legend__dot" style={{ background: c.color }} />
                          <span>{sleeps[i].berths} {fmt(sleeps[i].count)} ({fmtPct(sleeps[i].share)})</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                  <a href="/listings/off-road-category/" className="omr-chart-link">Browse Off Road Caravans by Sleeping Capacity <i className="bi bi-arrow-right" /></a>
                </>
              ) : <div className="omr-chart-empty"><i className="bi bi-moon-stars" /><p>Sleeping capacity data not yet available.</p></div>}
            </div>

            {/* Price by Length vertical bars */}
            <div className="omr-chart-box">
              <h3 className="omr-chart-title">Median Asking Price by Length</h3>
              {lengths.length > 0 ? (
                <>
                  <VBarChart data={lengths.map(l => ({ label: l.range.replace("ft", "ft").replace("Under ", "<").replace("and over", "+"), value: l.median_price }))} />
                  <a href="/listings/off-road-category/" className="omr-chart-link">View All Size Data <i className="bi bi-arrow-right" /></a>
                </>
              ) : <div className="omr-chart-empty"><i className="bi bi-bar-chart" /><p>Length price data not yet available.</p></div>}
            </div>

            {/* New vs Used price donut */}
            <div className="omr-chart-box">
              <h3 className="omr-chart-title">New vs Used Price Comparison</h3>
              <div className="omr-donut-wrap">
                <DonutChart segments={[
                  { value: new_price_median,  color: "#ec7200", label: "New"  },
                  { value: used_price_median, color: "#1e293b", label: "Used" },
                ]} />
                <div className="omr-donut-legend">
                  <div className="omr-donut-legend__item">
                    <span className="omr-donut-legend__dot" style={{ background: "#ec7200" }} />
                    <span>New Median {fmtAUD(new_price_median)}</span>
                  </div>
                  <div className="omr-donut-legend__item">
                    <span className="omr-donut-legend__dot" style={{ background: "#1e293b" }} />
                    <span>Used Median {fmtAUD(used_price_median)}</span>
                  </div>
                </div>
              </div>
              <a href="/listings/off-road-category/" className="omr-chart-link">Compare New vs Used <i className="bi bi-arrow-right" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* ── ATM and Weight Data ── */}
      <section className="omr-atm-section" id="atm-info">
        <div className="container">
          <h2 className="omr-section-title">ATM and Weight Data for Off Road Caravans</h2>
          <div className="omr-atm-grid">
            <div>
              <h3 className="omr-subsection-title">What Does ATM Mean?</h3>
              <p>ATM stands for <strong>Aggregate Trailer Mass</strong> — the maximum permissible laden weight of the caravan as specified by the manufacturer. It is one of the most important figures to check when purchasing an off road caravan.</p>
              <p>Your tow vehicle&apos;s rated tow capacity must be equal to or greater than the caravan&apos;s ATM to legally and safely tow it. ATM includes the caravan&apos;s tare weight (empty) plus all water, food, equipment and accessories you intend to carry.</p>
              <div className="omr-atm-callout">
                <i className="bi bi-exclamation-triangle-fill omr-atm-callout__icon" />
                <div><strong>Always check ATM before buying.</strong> A caravan with an ATM that exceeds your tow vehicle&apos;s rated capacity is illegal to tow and presents serious safety risks.</div>
              </div>
              <h3 className="omr-subsection-title mt-3">Key ATM Facts for Off Road Buyers</h3>
              <ul className="omr-method-list">
                <li>Most standard off road caravans have an ATM between 2,500kg and 3,500kg.</li>
                <li>Expedition-spec builds with full tanks and off-grid systems can exceed 4,000kg ATM.</li>
                <li>Popular tow vehicles for heavy off road caravans include LandCruiser 200/300, Ford Ranger Raptor and RAM 1500/2500.</li>
                <li>Not all listings include ATM — always verify directly with the seller or manufacturer.</li>
              </ul>
            </div>
            <div>
              <h3 className="omr-subsection-title">ATM Distribution Across Current Listings</h3>
              {atms.length > 0 ? (
                <>
                  <div className="omr-hbar-list">
                    {atms.map(a => (
                      <HBar key={a.range} label={`${a.range} kg`} value={a.count} displayValue={`${fmtPct(a.share)} · ${fmt(a.count)} listings`} max={Math.max(...atms.map(x => x.count), 1)} color="#1e293b" />
                    ))}
                  </div>
                  <p className="omr-data-note mt-2"><i className="bi bi-info-circle" /> Share based on listings with valid ATM data only.</p>
                </>
              ) : (
                <div className="omr-chart-empty">
                  <i className="bi bi-speedometer2" />
                  <p>ATM distribution data will appear here when available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Brands + Key Takeaways ── */}
      <section className="omr-brands-section">
        <div className="container">
          <div className="omr-brands-2col">
            {/* Brands table */}
            <div>
              <h2 className="omr-section-title">Top 10 Off Road Caravan Brands by Active Listings</h2>
              {brands.length > 0 ? (
                <div className="omr-table-scroll">
                  <table className="omr-table omr-table--brands">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Brand</th>
                        <th>Active Listings</th>
                        <th>Share of Inventory</th>
                        {brands.some(b => b.median_price > 0) && <th>Median Asking Price</th>}
                        {brands.some(b => b.median_atm   > 0) && <th>Median ATM</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {brands.map((b, i) => (
                        <tr key={b.brand}>
                          <td className="omr-rank">{i + 1}</td>
                          <td className="omr-brand-name">
                            <a href={`/listings/off-road-category/?make=${encodeURIComponent(b.brand)}`}>{b.brand}</a>
                          </td>
                          <td>{fmt(b.count)}</td>
                          <td>{fmtPct(b.share)}</td>
                          {brands.some(x => x.median_price > 0) && <td>{fmtAUD(b.median_price)}</td>}
                          {brands.some(x => x.median_atm   > 0) && <td>{fmtKg(b.median_atm)}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="omr-table-empty">Brand data not available.</div>}
              <a href="/listings/off-road-category/" className="omr-chart-link mt-3 d-inline-flex">View All Brands <i className="bi bi-arrow-right" /></a>
            </div>

            {/* Key Takeaways */}
            <div className="omr-takeaways">
              <h3 className="omr-takeaways__title">Key Takeaways</h3>
              {KEY_TAKEAWAYS.length > 0 ? KEY_TAKEAWAYS.map((t, i) => (
                <div key={i} className="omr-takeaway">
                  <div className="omr-takeaway__icon"><i className={`bi ${t.icon}`} /></div>
                  <div>
                    <div className="omr-takeaway__title">{t.title}</div>
                    <div className="omr-takeaway__text">{t.text}</div>
                  </div>
                </div>
              )) : (
                <p className="omr-takeaways__empty">Takeaways will appear once market data is available.</p>
              )}
              <a href="/listings/off-road-category/" className="omr-btn omr-btn--primary mt-4 d-inline-flex">
                Browse Off Road Caravans <i className="bi bi-arrow-right" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── What the Market Means for Buyers ── */}
      <section className="omr-buyers-section">
        <div className="container">
          <h2 className="omr-section-title">What the Current Off Road Caravan Market Means for Buyers</h2>
          <div className="omr-buyers-grid">
            <div className="omr-buyers-card">
              <div className="omr-buyers-card__icon"><i className="bi bi-search" /></div>
              <h3 className="omr-buyers-card__title">Researching the Market</h3>
              <p>With {total_count > 0 ? `over ${fmtK(total_count)} caravans` : "a broad selection of caravans"} currently for sale, buyers are in a strong position to compare options. Use the median price data above as a benchmark — caravans priced significantly above the median should offer clear justification in specification, brand or condition.</p>
              <p>Always compare like-for-like: a lower-priced caravan may have an older build date, higher use, or fewer off-grid systems than a higher-priced equivalent.</p>
            </div>
            <div className="omr-buyers-card">
              <div className="omr-buyers-card__icon"><i className="bi bi-cash-stack" /></div>
              <h3 className="omr-buyers-card__title">Understanding Price Ranges</h3>
              <p>The median figures in this report represent the midpoint of current supply. Half the inventory is priced above the median, half below. For buyers with a fixed budget, filtering listings by price range gives a realistic view of what is available in that bracket.</p>
              <p>New caravans at the median reflect the mid-market dealer offering. Used caravans at the median include well-maintained examples with meaningful remaining life expectancy.</p>
            </div>
            <div className="omr-buyers-card">
              <div className="omr-buyers-card__icon"><i className="bi bi-geo-alt" /></div>
              <h3 className="omr-buyers-card__title">Location and Availability</h3>
              <p>{topState ? `${topState.state} currently has the largest share of off road caravan inventory on CaravansForSale.com.au, followed by ${states[1]?.state ?? "NSW"} and ${states[2]?.state ?? "QLD"}.` : "Inventory is spread across all Australian states and territories."} If your preferred state has limited stock, consider purchasing interstate — many buyers purchase caravans from other states and arrange transport or self-collect.</p>
            </div>
            <div className="omr-buyers-card">
              <div className="omr-buyers-card__icon"><i className="bi bi-shield-check" /></div>
              <h3 className="omr-buyers-card__title">Buying Checklist</h3>
              <ul className="omr-buy-list">
                <li>Confirm ATM does not exceed your tow vehicle&apos;s rated capacity</li>
                <li>Request a pre-purchase inspection by an independent caravan technician</li>
                <li>Verify compliance plates, registration and ownership documentation</li>
                <li>Check water, power and gas systems are tested and working</li>
                <li>Confirm the caravan is free of finance encumbrances (PPSR search)</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-4">
            <a href="/listings/off-road-category/" className="omr-btn omr-btn--primary">Browse Off Road Caravans <i className="bi bi-arrow-right" /></a>
          </div>
        </div>
      </section>

      {/* ── Methodology & Limitations ── */}
      <section className="omr-method-section">
        <div className="container">
          <div className="omr-method-3col">
            {/* Methodology */}
            <div className="omr-method-block">
              <h3 className="omr-method-title">About the Data & Methodology</h3>
              <p className="omr-method-intro">This report is based on active off road caravan advertisements on CaravansForSale.com.au at the stated data snapshot. Statistics include listings with valid ATM data where indicated.</p>
              <ul className="omr-method-list">
                <li>Prices are advertised asking prices, not sale prices.</li>
                <li>POA, missing or invalid prices are excluded from price calculations.</li>
                <li>Duplicates are removed to ensure each caravan is counted once.</li>
                <li>Coverage rates are shown where data is incomplete.</li>
                <li>All figures update regularly as listings enter and leave the marketplace.</li>
              </ul>
              <a href="#faq" className="omr-chart-link">Read Full Methodology <i className="bi bi-arrow-right" /></a>
            </div>

            {/* Limitations */}
            <div className="omr-method-block">
              <h3 className="omr-method-title">Limitations</h3>
              <div className="omr-limit-list">
                {[
                  { icon: "bi-currency-dollar", text: "Advertised prices are not final sale prices." },
                  { icon: "bi-list-check",       text: "Not every listing includes complete specifications." },
                  { icon: "bi-database",         text: "Data reflects the marketplace, not national sales." },
                  { icon: "bi-person",           text: "Use these insights as a guide, not individual valuations." },
                ].map((l, i) => (
                  <div key={i} className="omr-limit-item">
                    <i className={`bi ${l.icon} omr-limit-icon`} />
                    <span>{l.text}</span>
                  </div>
                ))}
              </div>
              <a href="#faq" className="omr-chart-link">Full Limitations <i className="bi bi-arrow-right" /></a>
            </div>

            {/* Final CTA */}
            <div className="omr-cta-card">
              <h3 className="omr-cta-card__title">Ready to Find Your<br />Off Road Caravan?</h3>
              <p className="omr-cta-card__desc">
                Use real market data to make a smarter decision. Browse thousands of off road caravans
                from dealers and private sellers across Australia.
              </p>
              <a href="/listings/off-road-category/" className="omr-btn omr-btn--primary w-100 justify-content-center">
                Browse Off Road Caravans <i className="bi bi-arrow-right" />
              </a>
              <a href="/off-road-caravans/" className="omr-btn omr-btn--outline-light w-100 justify-content-center mt-2">
                Back to Off Road Caravans Hub <i className="bi bi-arrow-right" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="omr-faq-section" id="faq">
        <div className="container">
          <h2 className="omr-section-title text-center">Frequently Asked Questions About the Australian Off Road Caravan Market</h2>
          <div className="omr-faq-grid">
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── Explore CTA ── */}
      <section className="omr-explore-section">
        <div className="container">
          <h2 className="omr-section-title text-center">Explore the Australian Off Road Caravan Market</h2>
          <p className="omr-explore-desc">
            Market statistics can help you understand current prices and availability, but the right caravan will ultimately
            depend on your tow vehicle, travel plans, budget, preferred layout and required off-road capability.
          </p>
          <div className="omr-explore-links">
            <a href="/listings/off-road-category/"                className="omr-explore-link"><i className="bi bi-truck" /> Browse All Off Road Caravans for Sale</a>
            <a href="/listings/new-condition/off-road-category/"  className="omr-explore-link"><i className="bi bi-star" /> Browse New Off Road Caravans</a>
            <a href="/listings/used-condition/off-road-category/" className="omr-explore-link"><i className="bi bi-tag" /> Browse Used Off Road Caravans</a>
            <a href="/off-road-caravans/"                         className="omr-explore-link"><i className="bi bi-house" /> Explore Off Road Caravans Australia</a>
            <a href="/off-road-caravan-types/"                    className="omr-explore-link"><i className="bi bi-grid" /> Compare Off Road Caravan Types</a>
          </div>
          <div className="omr-explore-btns">
            <a href="/listings/off-road-category/" className="omr-btn omr-btn--primary">Browse Off Road Caravans <i className="bi bi-arrow-right" /></a>
            <a href="/off-road-caravans/"          className="omr-btn omr-btn--outline-dark">Back to Off Road Caravans Hub <i className="bi bi-arrow-right" /></a>
          </div>
        </div>
      </section>
    </main>
  );
}
