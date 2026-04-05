'use client';

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const symbols = ['BTC', 'ETH', 'SOL'] as const;

interface PricePoint {
  timestamp: string;
  price: number;
}

export default function AlchemyPricesDashboard() {
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';
  const [currentPrices, setCurrentPrices] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<PricePoint[]>([]);
  const [selectedCoinIndex, setSelectedCoinIndex] = useState(0);
  const [timeRangeDays, setTimeRangeDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const symbol = symbols[selectedCoinIndex];

  // Fetch current prices
  const fetchCurrent = async () => {
    if (!alchemyKey) {
      setError('Alchemy API key not configured');
      return;
    }
    try {
      const res = await fetch(
        `https://api.g.alchemy.com/prices/v1/\( {alchemyKey}/tokens/by-symbol?symbols= \){symbols.join(',')}`
      );
      if (!res.ok) throw new Error('Failed to fetch current prices');
      const result = await res.json();
      setCurrentPrices(result.data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fetch historical prices
  const fetchHistorical = async (days: number) => {
    if (!alchemyKey) return;
    setLoading(true);
    setError('');

    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - days * 86400000).toISOString();

    try {
      const res = await fetch(`https://api.g.alchemy.com/prices/v1/${alchemyKey}/tokens/historical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          startTime,
          endTime,
          interval: '1d',
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch historical data');
      const result = await res.json();
      setHistoricalData(result.prices || result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrent();
    fetchHistorical(timeRangeDays);
  }, [alchemyKey, timeRangeDays, selectedCoinIndex]);

  // Chart data preparation
  const chartData = {
    labels: historicalData.map((pt) =>
      new Date(pt.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: `${symbol} Price (USD)`,
        data: historicalData.map((pt) => pt.price),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        borderWidth: 3,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => '$' + ctx.raw.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        },
      },
    },
    scales: {
      y: {
        ticks: { callback: (val: number) => '$' + val.toLocaleString() },
        grid: { color: '#f1f5f9' },
      },
      x: { grid: { color: '#f1f5f9' } },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight">Price Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time &amp; historical prices powered by Alchemy • Integrated in TheWall</p>
        </div>

        {/* Current Prices Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {currentPrices.length > 0 ? (
            currentPrices.map((token) => {
              const p = token.prices?.[0];
              if (!p) return null;
              return (
                <div key={token.symbol} className="bg-white rounded-3xl shadow-sm p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                      {token.symbol[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-2xl">{token.symbol}</div>
                      <div className="text-gray-500">USD</div>
                    </div>
                  </div>
                  <div className="mt-10">
                    <div className="text-5xl font-semibold tracking-tighter">
                      ${parseFloat(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-emerald-600 mt-3">
                      Updated: {new Date(p.lastUpdatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-12 text-gray-500">Loading current prices from Alchemy...</div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm">
            {[7, 30, 90, 365].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRangeDays(days)}
                className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  timeRangeDays === days ? 'bg-blue-600 text-white shadow' : 'hover:bg-gray-100'
                }`}
              >
                {days === 365 ? '1 Year' : `${days} Days`}
              </button>
            ))}
          </div>

          <div className="flex border-b border-gray-200">
            {symbols.map((sym, idx) => (
              <button
                key={sym}
                onClick={() => setSelectedCoinIndex(idx)}
                className={`px-10 py-4 font-semibold border-b-2 transition-all ${
                  selectedCoinIndex === idx
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-3xl shadow-sm p-10">
          <div className="h-[460px] relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="text-gray-500">Loading historical data from Alchemy...</div>
              </div>
            )}
            {error && <div className="text-red-600 text-center py-8">{error}</div>}
            {!loading && !error && <Line data={chartData} options={chartOptions} />}
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-gray-500">
          Data provided by Alchemy Prices API • Part of TheWall Web3 Wallet
        </div>
      </div>
    </div>
  );
}
