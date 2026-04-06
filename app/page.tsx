"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

// ── Chain Identity ──────────────────────────────────────────────────────────
// symbol matches the keys returned by /api/prices  { prices: { ETH: {...} } }
const CHAINS = [
  {
    id: "ethereum",
    symbol: "ETH",          // ← /api/prices key
    name: "Earth",
    tagline: "The Foundation",
    color: "#4FC3F7",
    glow: "rgba(79,195,247,0.35)",
    icon: "🌍",
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Soul",
    tagline: "Speed of Light",
    color: "#B39DDB",
    glow: "rgba(179,157,219,0.35)",
    icon: "🔮",
  },
  {
    id: "monad",
    symbol: "MON",           // placeholder — price: 0.00
    name: "Moon",
    tagline: "Rising Force",
    color: "#80DEEA",
    glow: "rgba(128,222,234,0.35)",
    icon: "🌙",
  },
  {
    id: "arbitrum",
    symbol: "ARB",
    name: "Orbit",
    tagline: "Layer Beyond",
    color: "#90CAF9",
    glow: "rgba(144,202,249,0.35)",
    icon: "🪐",
  },
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Birth",
    tagline: "The Origin",
    color: "#FFCC80",
    glow: "rgba(255,204,128,0.35)",
    icon: "🌟",
  },
];

// ── Types ───────────────────────────────────────────────────────────────────
// Matches /api/prices → { prices: { ETH: { price, change24h } } }
interface ChainPrice { price: number; change24h: number }
interface PriceData  { [symbol: string]: ChainPrice }

interface HistoricalPoint {
  timestamp: number;
  price: number;
}

interface HistoricalData {
  [chainId: string]: HistoricalPoint[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(6)}`;
}



// ── Main Component ──────────────────────────────────────────────────────────
export default function PricesPage() {
  const [prices, setPrices] = useState<PriceData>({});
  const [historical, setHistorical] = useState<HistoricalData>({});
  const [activeChain, setActiveChain] = useState(CHAINS[0]);
  const [loading, setLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"1D" | "7D" | "30D">("7D");

  // Fetch current prices
  const fetchCurrent = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // API: { prices: { ETH: { price, change24h }, … } }
      setPrices(json.prices ?? json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError("Live prices unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch historical prices
  const fetchHistorical = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await fetch(
        `/api/alchemy-prices?chain=${activeChain.symbol}&range=${range}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHistorical((prev) => ({
        ...prev,
        [`${activeChain.id}-${range}`]: data.prices ?? [],
      }));
    } catch {
      // silently fail — chart stays empty
    } finally {
      setHistLoading(false);
    }
  }, [activeChain, range]);

  useEffect(() => {
    fetchCurrent();
    const interval = setInterval(fetchCurrent, 30_000);
    return () => clearInterval(interval);
  }, [fetchCurrent]);

  useEffect(() => {
    fetchHistorical();
  }, [fetchHistorical]);

  // Chart data
  const histKey = `${activeChain.id}-${range}`;
  const histPoints: HistoricalPoint[] = historical[histKey] ?? [];

  const chartData = {
    labels: histPoints.map((p) => {
      const d = new Date(p.timestamp);
      return range === "1D"
        ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString([], { month: "short", day: "numeric" });
    }),
    datasets: [
      {
        label: `${activeChain.name} (${activeChain.symbol})`,
        data: histPoints.map((p) => p.price),
        borderColor: activeChain.color,
        backgroundColor: `${activeChain.color}18`,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0d1117",
        borderColor: activeChain.color,
        borderWidth: 1,
        titleColor: activeChain.color,
        bodyColor: "#e6edf3",
        padding: 12,
        callbacks: {
          label: (ctx: any) => ` ${fmt(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "#161b22", drawBorder: false },
        ticks: {
          color: "#8b949e",
          font: { size: 11, family: "'Space Mono', monospace" },
          maxTicksLimit: range === "1D" ? 8 : range === "7D" ? 7 : 10,
        },
      },
      y: {
        position: "right" as const,
        grid: { color: "#161b22", drawBorder: false },
        ticks: {
          color: "#8b949e",
          font: { size: 11, family: "'Space Mono', monospace" },
          callback: (v: any) => fmt(v),
        },
      },
    },
  };

  const activePriceData: ChainPrice | undefined = prices[activeChain.symbol];
  const priceChange = activePriceData?.change24h ?? 0;
  const isPositive = priceChange >= 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #010409;
          color: #e6edf3;
          font-family: 'Syne', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .prices-page {
          min-height: 100vh;
          background: #010409;
          padding: 0 0 80px 0;
        }

        /* ── Header ── */
        .page-header {
          padding: 32px 24px 24px;
          border-bottom: 1px solid #161b22;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .header-left h1 {
          font-size: clamp(22px, 5vw, 32px);
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #e6edf3 60%, #8b949e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .header-left p {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #8b949e;
          margin-top: 4px;
        }
        .live-dot {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #8b949e;
        }
        .live-dot span {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #3fb950;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        /* ── Chain Tabs ── */
        .chain-tabs {
          display: flex;
          gap: 8px;
          padding: 20px 24px 0;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .chain-tabs::-webkit-scrollbar { display: none; }

        .chain-tab {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid #21262d;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .chain-tab::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.2s;
          border-radius: 12px;
        }
        .chain-tab:hover { border-color: #30363d; }
        .chain-tab.active {
          border-color: var(--chain-color);
          background: var(--chain-bg);
        }
        .chain-tab.active::before { opacity: 1; }
        .chain-icon { font-size: 18px; line-height: 1; }
        .chain-info { text-align: left; }
        .chain-name {
          font-size: 13px;
          font-weight: 700;
          color: #e6edf3;
          display: block;
          line-height: 1.2;
        }
        .chain-tab.active .chain-name { color: var(--chain-color); }
        .chain-symbol {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #8b949e;
          display: block;
        }
        .chain-mini-price {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #8b949e;
          margin-left: auto;
        }
        .chain-tab.active .chain-mini-price { color: var(--chain-color); }

        /* ── Hero Price Card ── */
        .hero-section {
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          align-items: start;
        }
        .hero-price {
          font-size: clamp(36px, 8vw, 64px);
          font-weight: 800;
          letter-spacing: -2px;
          line-height: 1;
          color: var(--active-color, #e6edf3);
          text-shadow: 0 0 40px var(--active-glow, transparent);
          transition: color 0.3s, text-shadow 0.3s;
        }
        .hero-chain-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .hero-chain-label .icon { font-size: 28px; }
        .hero-chain-label .names {
          display: flex;
          flex-direction: column;
        }
        .hero-chain-label .chain-full {
          font-size: 18px;
          font-weight: 800;
          color: var(--active-color, #e6edf3);
        }
        .hero-chain-label .chain-tag {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #8b949e;
        }
        .change-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          margin-top: 10px;
        }
        .change-badge.pos { background: #0d2a14; color: #3fb950; }
        .change-badge.neg { background: #2a0d0d; color: #f85149; }

        /* Stats row */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          margin-top: 20px;
          background: #161b22;
          border-radius: 12px;
          overflow: hidden;
        }
        .stat-cell {
          background: #0d1117;
          padding: 14px 16px;
        }
        .stat-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .stat-val {
          font-size: 14px;
          font-weight: 700;
          color: #e6edf3;
        }

        /* ── Chart ── */
        .chart-section {
          padding: 0 24px;
        }
        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .chart-title {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .range-tabs {
          display: flex;
          gap: 2px;
          background: #161b22;
          border-radius: 8px;
          padding: 3px;
        }
        .range-btn {
          padding: 4px 12px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: #8b949e;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .range-btn.active {
          background: var(--active-color, #30363d);
          color: #010409;
          font-weight: 700;
        }
        .chart-wrap {
          height: 220px;
          border: 1px solid #161b22;
          border-radius: 12px;
          padding: 16px;
          background: #0d1117;
          position: relative;
        }
        .chart-loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #8b949e;
          background: #0d1117;
          border-radius: 12px;
        }
        .chart-empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #30363d;
        }

        /* ── All Chains Grid ── */
        .all-chains {
          padding: 32px 24px 0;
        }
        .section-title {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #8b949e;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 14px;
        }
        .chain-cards {
          display: flex;
          flex-direction: column;
          gap: 1px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #161b22;
        }
        .chain-card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: #0d1117;
          cursor: pointer;
          transition: background 0.15s;
          position: relative;
        }
        .chain-card::after {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 2px;
          background: var(--cc-color);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .chain-card:hover { background: #161b22; }
        .chain-card.active::after { opacity: 1; }
        .chain-card.active { background: #161b22; }
        .card-icon { font-size: 22px; width: 32px; text-align: center; }
        .card-info {}
        .card-name {
          font-size: 14px;
          font-weight: 700;
          color: #e6edf3;
        }
        .card-sym {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #8b949e;
        }
        .card-right { text-align: right; }
        .card-price {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          color: #e6edf3;
        }
        .card-change {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          margin-top: 2px;
        }
        .card-change.pos { color: #3fb950; }
        .card-change.neg { color: #f85149; }
        .card-skeleton {
          width: 60px;
          height: 14px;
          background: #21262d;
          border-radius: 4px;
          animation: shimmer 1.5s infinite;
          margin-left: auto;
        }
        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }

        /* ── Error Banner ── */
        .error-banner {
          margin: 16px 24px;
          padding: 12px 16px;
          background: #2a0d0d;
          border: 1px solid #f85149;
          border-radius: 8px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #f85149;
        }

        /* ── Divider ── */
        .divider { height: 1px; background: #161b22; margin: 24px 0; }
      `}</style>

      <div
        className="prices-page"
        style={
          {
            "--active-color": activeChain.color,
            "--active-glow": activeChain.glow,
          } as React.CSSProperties
        }
      >
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1>Market Prices</h1>
            <p>
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}`
                : "Fetching live data…"}
            </p>
          </div>
          <div className="live-dot">
            <span />
            LIVE
          </div>
        </div>

        {/* Error */}
        {error && <div className="error-banner">⚠ {error} — showing cached data</div>}

        {/* Chain Tabs */}
        <div className="chain-tabs">
          {CHAINS.map((chain) => {
            const p: ChainPrice | undefined = prices[chain.symbol];
            const isActive = chain.id === activeChain.id;
            return (
              <button
                key={chain.id}
                className={`chain-tab${isActive ? " active" : ""}`}
                style={
                  {
                    "--chain-color": chain.color,
                    "--chain-bg": `${chain.color}12`,
                  } as React.CSSProperties
                }
                onClick={() => setActiveChain(chain)}
              >
                <span className="chain-icon">{chain.icon}</span>
                <div className="chain-info">
                  <span className="chain-name">{chain.name}</span>
                  <span className="chain-symbol">{chain.symbol}</span>
                </div>
                <span className="chain-mini-price">
                  {p ? fmt(p.price) : "—"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hero Price */}
        <div className="hero-section">
          <div>
            <div className="hero-chain-label">
              <span className="icon">{activeChain.icon}</span>
              <div className="names">
                <span className="chain-full">{activeChain.name}</span>
                <span className="chain-tag">{activeChain.tagline}</span>
              </div>
            </div>

            {loading ? (
              <div
                style={{
                  width: "180px",
                  height: "52px",
                  background: "#161b22",
                  borderRadius: "8px",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            ) : (
              <div className="hero-price">
                {activePriceData ? fmt(activePriceData.price) : "—"}
              </div>
            )}

            <div
              className={`change-badge ${isPositive ? "pos" : "neg"}`}
            >
              {isPositive ? "▲" : "▼"}{" "}
              {Math.abs(priceChange).toFixed(2)}% 24h
            </div>

            {activePriceData && (
              <div className="stats-row">
                  <div className="stat-cell">
                    <div className="stat-label">Symbol</div>
                    <div className="stat-val">{activeChain.symbol}</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-label">Network</div>
                    <div className="stat-val">{activeChain.tagline}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="chart-section">
          <div className="chart-header">
            <span className="chart-title">Price History</span>
            <div className="range-tabs">
              {(["1D", "7D", "30D"] as const).map((r) => (
                <button
                  key={r}
                  className={`range-btn${range === r ? " active" : ""}`}
                  style={range === r ? { background: activeChain.color } : {}}
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-wrap">
            {histLoading ? (
              <div className="chart-loading">Loading chart…</div>
            ) : histPoints.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="chart-empty">No historical data available</div>
            )}
          </div>
        </div>

        {/* All Chains List */}
        <div className="all-chains">
          <p className="section-title">All Chains</p>
          <div className="chain-cards">
            {CHAINS.map((chain) => {
              const p: ChainPrice | undefined = prices[chain.symbol];
              const change = p?.change24h ?? 0;
              const pos = change >= 0;
              return (
                <div
                  key={chain.id}
                  className={`chain-card${
                    chain.id === activeChain.id ? " active" : ""
                  }`}
                  style={{ "--cc-color": chain.color } as React.CSSProperties}
                  onClick={() => setActiveChain(chain)}
                >
                  <span className="card-icon">{chain.icon}</span>
                  <div className="card-info">
                    <div className="card-name">{chain.name}</div>
                    <div className="card-sym">{chain.symbol}</div>
                  </div>
                  <div className="card-right">
                    {loading ? (
                      <div className="card-skeleton" />
                    ) : (
                      <>
                        <div className="card-price">
                          {p ? fmt(p.price) : "—"}
                        </div>
                        <div className={`card-change ${pos ? "pos" : "neg"}`}>
                          {pos ? "+" : ""}
                          {change.toFixed(2)}%
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
        }
