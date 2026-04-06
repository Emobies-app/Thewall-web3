"use client";

/**
 * TheWall Crypto Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the raw Alchemy HTML demo.
 *
 * Security improvements vs original:
 *  ✅  API key never exposed client-side — all Alchemy calls go through
 *      /api/prices  and  /api/alchemy-prices  (server-side routes)
 *  ✅  No localStorage key storage
 *  ✅  No CORS-exposed direct fetch to api.g.alchemy.com
 *
 * Chain identity (TheWall branding):
 *  BTC → Birth 🌟   ETH → Earth 🌍   SOL → Soul 🔮
 *  ARB → Orbit 🪐   MON → Moon  🌙
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend
);

// ── Chain Config ─────────────────────────────────────────────────────────────
const CHAINS = [
  { symbol: "BTC", name: "Birth",  icon: "🌟", tagline: "The Origin",      color: "#FFCC80", glow: "rgba(255,204,128,0.2)" },
  { symbol: "ETH", name: "Earth",  icon: "🌍", tagline: "The Foundation",  color: "#4FC3F7", glow: "rgba(79,195,247,0.2)"  },
  { symbol: "SOL", name: "Soul",   icon: "🔮", tagline: "Speed of Light",  color: "#B39DDB", glow: "rgba(179,157,219,0.2)" },
  { symbol: "ARB", name: "Orbit",  icon: "🪐", tagline: "Layer Beyond",    color: "#90CAF9", glow: "rgba(144,202,249,0.2)" },
  { symbol: "MON", name: "Moon",   icon: "🌙", tagline: "Rising Force",    color: "#80DEEA", glow: "rgba(128,222,234,0.2)" },
] as const;

type ChainSymbol = (typeof CHAINS)[number]["symbol"];
type TimeRange   = "7D" | "30D" | "90D" | "1Y";

const RANGE_DAYS: Record<TimeRange, number> = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 };

interface ChainPrice  { price: number; change24h: number }
interface HistPoint   { timestamp: number; price: number }

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = (n: number) =>
  n >= 1000 ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}` :
  n >= 1    ? `$${n.toFixed(2)}` :
              `$${n.toFixed(6)}`;

const fmtDate = (ts: number, range: TimeRange) =>
  new Date(ts).toLocaleDateString("en-US", range === "7D"
    ? { weekday: "short" }
    : { month: "short", day: "numeric" }
  );

// ── Component ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [prices,      setPrices]      = useState<Record<string, ChainPrice>>({});
  const [history,     setHistory]     = useState<HistPoint[]>([]);
  const [activeChain, setActiveChain] = useState(CHAINS[0]);
  const [range,       setRange]       = useState<TimeRange>("30D");
  const [priceLoading, setPriceLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);
  const [priceError,   setPriceError]   = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch current prices (/api/prices) ─────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    try {
      const res  = await fetch("/api/prices");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPrices(json.prices ?? json);
      setLastUpdated(new Date());
      setPriceError(false);
    } catch {
      setPriceError(true);
    } finally {
      setPriceLoading(false);
    }
  }, []);

  // ── Fetch historical (/api/alchemy-prices) ─────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setChartLoading(true);
    setHistory([]);
    try {
      const res = await fetch(
        `/api/alchemy-prices?chain=${activeChain.symbol}&range=${range}`
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      setHistory(json.prices ?? []);
    } catch {
      setHistory([]);
    } finally {
      setChartLoading(false);
    }
  }, [activeChain, range]);

  useEffect(() => {
    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchPrices]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Chart config ───────────────────────────────────────────────────────────
  const chain = activeChain;
  const chartData = {
    labels:   history.map(p => fmtDate(p.timestamp, range)),
    datasets: [{
      label:           `${chain.name} (${chain.symbol})`,
      data:            history.map(p => p.price),
      borderColor:     chain.color,
      backgroundColor: chain.glow,
      borderWidth:     2,
      pointRadius:     0,
      pointHoverRadius: 5,
      tension:         0.3,
      fill:            true,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0d1117",
        borderColor:     chain.color,
        borderWidth:     1,
        titleColor:      chain.color,
        bodyColor:       "#e6edf3",
        padding:         12,
        callbacks: {
          label: (ctx: any) => ` ${fmt(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid:  { color: "#161b22" },
        ticks: { color: "#8b949e", font: { size: 11, family: "'Space Mono', monospace" }, maxTicksLimit: 8 },
      },
      y: {
        position: "right" as const,
        grid:     { color: "#161b22" },
        ticks: {
          color:    "#8b949e",
          font:     { size: 11, family: "'Space Mono', monospace" },
          callback: (v: any) => fmt(v),
        },
      },
    },
  };

  // Price % change
  const activePrice   = prices[chain.symbol];
  const priceChange   = activePrice?.change24h ?? 0;
  const isUp          = priceChange >= 0;

  // Chart trend
  const trendUp = history.length > 1
    ? history[history.length - 1].price >= history[0].price
    : true;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .dash { min-height: 100vh; background: #010409; color: #e6edf3; font-family: 'Syne', sans-serif; padding-bottom: 60px; }

        /* ── Header ── */
        .hdr { display: flex; align-items: center; justify-content: space-between; padding: 28px 24px 20px; border-bottom: 1px solid #161b22; flex-wrap: wrap; gap: 12px; }
        .hdr-left h1 { font-size: clamp(20px, 5vw, 28px); font-weight: 800; letter-spacing: -.5px; }
        .hdr-left p  { font-family: 'Space Mono', monospace; font-size: 10px; color: #8b949e; margin-top: 4px; }
        .live-pill { display: flex; align-items: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 10px; color: #3fb950; }
        .live-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: #3fb950; animation: blink 2s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

        /* ── Price Cards ── */
        .cards-row { display: flex; gap: 1px; overflow-x: auto; scrollbar-width: none; background: #161b22; border-top: 1px solid #161b22; border-bottom: 1px solid #161b22; }
        .cards-row::-webkit-scrollbar { display: none; }
        .price-card { flex: 1; min-width: 140px; background: #0d1117; padding: 18px 16px; cursor: pointer; transition: background .15s; position: relative; }
        .price-card::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:var(--cc); opacity:0; transition:opacity .2s; }
        .price-card:hover { background: #111820; }
        .price-card.active { background: #111820; }
        .price-card.active::after { opacity:1; }
        .pc-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .pc-icon { font-size: 20px; }
        .pc-meta { }
        .pc-name { font-size: 13px; font-weight: 700; color: var(--cc); line-height: 1.1; }
        .pc-sym  { font-family: 'Space Mono', monospace; font-size: 9px; color: #8b949e; }
        .pc-price { font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 700; color: #e6edf3; }
        .pc-change { font-family: 'Space Mono', monospace; font-size: 10px; margin-top: 3px; }
        .pc-change.up { color: #3fb950; }
        .pc-change.dn { color: #f85149; }
        .skeleton { width: 80px; height: 18px; background: #21262d; border-radius: 4px; animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }

        /* ── Chart section ── */
        .chart-section { padding: 24px; }
        .chart-top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
        .chart-hero { }
        .chart-chain-label { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .chart-chain-label .icon { font-size: 26px; }
        .chart-chain-name { font-size: 22px; font-weight: 800; color: var(--active); }
        .chart-price { font-family: 'Space Mono', monospace; font-size: clamp(28px, 6vw, 48px); font-weight: 700; letter-spacing: -1px; color: var(--active); line-height: 1; }
        .chart-subrow { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
        .change-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; }
        .change-chip.up { background: #0d2a14; color: #3fb950; }
        .change-chip.dn { background: #2a0d0d; color: #f85149; }
        .trend-chip { font-family: 'Space Mono', monospace; font-size: 10px; color: #8b949e; }

        /* Range pills */
        .range-row { display: flex; gap: 4px; background: #161b22; border-radius: 10px; padding: 4px; align-self: flex-start; }
        .range-btn { padding: 5px 14px; border-radius: 7px; border: none; background: transparent; color: #8b949e; font-family: 'Space Mono', monospace; font-size: 11px; cursor: pointer; transition: all .15s; }
        .range-btn.active { background: var(--active); color: #010409; font-weight: 700; }

        /* Chart box */
        .chart-box { height: 260px; background: #0d1117; border: 1px solid #161b22; border-radius: 14px; padding: 16px; position: relative; overflow: hidden; }
        .chart-loading { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:#0d1117; font-family:'Space Mono',monospace; font-size:11px; color:#8b949e; border-radius:14px; }
        .chart-empty { height:100%; display:flex; align-items:center; justify-content:center; font-family:'Space Mono',monospace; font-size:11px; color:#30363d; }
        .chart-trend-line { position:absolute; top:0; left:0; right:0; height:2px; background: linear-gradient(90deg, transparent, var(--active), transparent); opacity:.4; }

        /* ── Security note ── */
        .sec-note { margin: 0 24px; padding: 12px 16px; background: #0d2a14; border: 1px solid #1a4a28; border-radius: 10px; display: flex; align-items: flex-start; gap: 10px; }
        .sec-note .icon { font-size: 14px; flex-shrink:0; margin-top:1px; }
        .sec-note p { font-family: 'Space Mono', monospace; font-size: 10px; color: #3fb950; line-height: 1.6; }

        /* ── Footer ── */
        .footer { margin: 32px 24px 0; padding-top: 20px; border-top: 1px solid #161b22; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .footer p { font-family: 'Space Mono', monospace; font-size: 10px; color: #8b949e; }
        .footer a { color: #4FC3F7; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
      `}</style>

      <div
        className="dash"
        style={{
          "--active": chain.color,
          "--active-glow": chain.glow,
        } as React.CSSProperties}
      >
        {/* ── Header ── */}
        <div className="hdr">
          <div className="hdr-left">
            <h1>🦋 TheWall Markets</h1>
            <p>
              {lastUpdated
                ? `Last sync ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : "Connecting to price feeds…"}
            </p>
          </div>
          <div className="live-pill">
            <span className="dot" />
            LIVE · 30s
          </div>
        </div>

        {/* ── Price Cards ── */}
        <div className="cards-row">
          {CHAINS.map((c) => {
            const p = prices[c.symbol];
            const chg = p?.change24h ?? 0;
            const up  = chg >= 0;
            const isActive = c.symbol === chain.symbol;
            return (
              <div
                key={c.symbol}
                className={`price-card${isActive ? " active" : ""}`}
                style={{ "--cc": c.color } as React.CSSProperties}
                onClick={() => setActiveChain(c)}
              >
                <div className="pc-top">
                  <span className="pc-icon">{c.icon}</span>
                  <div className="pc-meta">
                    <div className="pc-name">{c.name}</div>
                    <div className="pc-sym">{c.symbol}</div>
                  </div>
                </div>
                {priceLoading ? (
                  <div className="skeleton" />
                ) : (
                  <>
                    <div className="pc-price">{p ? fmt(p.price) : "—"}</div>
                    <div className={`pc-change ${up ? "up" : "dn"}`}>
                      {up ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Security note (replaces API key input) ── */}
        <div className="sec-note" style={{ marginTop: "20px" }}>
          <span className="icon">🔒</span>
          <p>
            Alchemy API key is never exposed client-side.
            All price feeds route through <strong>/api/prices</strong> and{" "}
            <strong>/api/alchemy-prices</strong> (server-side).
          </p>
        </div>

        {/* ── Chart Section ── */}
        <div className="chart-section">
          <div className="chart-top">
            <div className="chart-hero">
              <div className="chart-chain-label">
                <span className="icon">{chain.icon}</span>
                <span className="chart-chain-name">{chain.name}</span>
              </div>
              {priceLoading ? (
                <div className="skeleton" style={{ width: "160px", height: "44px" }} />
              ) : (
                <div className="chart-price">
                  {activePrice ? fmt(activePrice.price) : "—"}
                </div>
              )}
              <div className="chart-subrow">
                <span className={`change-chip ${isUp ? "up" : "dn"}`}>
                  {isUp ? "▲" : "▼"} {Math.abs(priceChange).toFixed(2)}% 24h
                </span>
                <span className="trend-chip">
                  {history.length > 1
                    ? `${range} trend: ${trendUp ? "↑ gaining" : "↓ declining"}`
                    : ""}
                </span>
              </div>
            </div>

            {/* Range selector */}
            <div className="range-row">
              {(Object.keys(RANGE_DAYS) as TimeRange[]).map((r) => (
                <button
                  key={r}
                  className={`range-btn${range === r ? " active" : ""}`}
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="chart-box">
            <div className="chart-trend-line" />
            {chartLoading ? (
              <div className="chart-loading">Loading {chain.name} history…</div>
            ) : history.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="chart-empty">No data for {chain.symbol} · {range}</div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="footer">
          <p>
            Powered by{" "}
            <a href="https://www.alchemy.com/prices" target="_blank" rel="noreferrer">
              Alchemy Prices API
            </a>{" "}
            · CEX & DEX aggregated feeds
          </p>
          <p>
            {priceError ? "⚠ Price feed offline" : `${CHAINS.length} chains · auto-refreshes every 30s`}
          </p>
        </div>
      </div>
    </>
  );
      }
