"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import Script from "next/script";
import Link from "next/link";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Chart Components
const generateMarketData = (days: number = 30) => {
  const data = [];
  let baseValue = 100;
  for (let i = 0; i < days; i++) {
    baseValue = baseValue + (Math.random() - 0.48) * 2;
    data.push({
      day: i + 1,
      value: parseFloat(baseValue.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 500000,
    });
  }
  return data;
};

const generateIntradayData = () => {
  const hours = ["9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "1:00", "1:30", "2:00", "2:30", "3:00", "3:30", "4:00"];
  let baseValue = 44000;
  return hours.map(hour => {
    baseValue = baseValue + (Math.random() - 0.45) * 100;
    return {
      time: hour,
      value: Math.floor(baseValue),
    };
  });
};

function MarketPerformanceChart() {
  const data = generateMarketData();

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" hide />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorValue)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function IntradayChart() {
  const data = generateIntradayData();

  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10 }}
          interval={2}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#2f75c5"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SectorHeatmap() {
  const sectors = [
    { name: "Technology", value: 2.5, color: "#10b981" },
    { name: "Healthcare", value: 1.8, color: "#10b981" },
    { name: "Finance", value: -0.5, color: "#ef4444" },
    { name: "Energy", value: 3.2, color: "#10b981" },
    { name: "Consumer", value: -1.2, color: "#ef4444" },
    { name: "Industrial", value: 0.8, color: "#10b981" },
    { name: "Materials", value: -0.3, color: "#ef4444" },
    { name: "Utilities", value: 0.5, color: "#10b981" },
    { name: "Real Estate", value: -1.8, color: "#ef4444" },
  ];

  return (
    <div className="grid grid-cols-3 gap-1">
      {sectors.map((sector) => (
        <div
          key={sector.name}
          className="relative aspect-square rounded"
          style={{
            backgroundColor: sector.value > 0
              ? `rgba(16, 185, 129, ${Math.min(Math.abs(sector.value) / 3, 1)})`
              : `rgba(239, 68, 68, ${Math.min(Math.abs(sector.value) / 3, 1)})`,
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
            <span className="text-[10px] font-medium text-gray-900">{sector.name}</span>
            <span className={`text-xs font-bold ${sector.value > 0 ? 'text-green-700' : 'text-red-700'}`}>
              {sector.value > 0 ? '+' : ''}{sector.value}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PortfolioAllocation() {
  const data = [
    { name: "US Stocks", value: 45, color: "#2f75c5" },
    { name: "Int'l Stocks", value: 20, color: "#4894b5" },
    { name: "Bonds", value: 25, color: "#0f5462" },
    { name: "Cash", value: 10, color: "#94a3b8" },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={70}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function SparklineChart({ trend = "up" }: { trend?: "up" | "down" }) {
  const data = Array.from({ length: 10 }, (_, i) => ({
    x: i,
    y: trend === "up"
      ? 50 + i * 3 + Math.random() * 10
      : 100 - i * 3 - Math.random() * 10
  }));

  return (
    <ResponsiveContainer width="100%" height={30}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Line
          type="monotone"
          dataKey="y"
          stroke={trend === "up" ? "#10b981" : "#ef4444"}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function VolumeChart() {
  const data = Array.from({ length: 20 }, (_, i) => ({
    day: i + 1,
    volume: Math.floor(Math.random() * 100) + 50,
  }));

  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Bar dataKey="volume" fill="#94a3b8" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Main Content Component
function MorningstarContent() {
  const markets = [
    { label: "DJIA", value: "44,176", change: "+206.97", percent: "(0.47%)", positive: true },
    { label: "S&P 500", value: "6,389", change: "+49.45", percent: "(0.78%)", positive: true },
    { label: "NASDAQ", value: "21,450", change: "+207.33", percent: "(0.98%)", positive: true },
    { label: "Morningstar US Market", value: "105.28", change: "+0.68", percent: "(0.65%)", positive: true },
  ];

  const marketMovers = [
    { name: "Newegg Commerce Inc", symbol: "NEGG", price: "$79.79", change: "+34.24%", positive: true },
    { name: "Jyong Biotech Ltd", symbol: "MENS", price: "$45.33", change: "+32.47%", positive: true },
    { name: "LegalZoom.com", symbol: "LZ", price: "$10.98", change: "+31.18%", positive: true },
    { name: "Astrana Health", symbol: "ASTH", price: "$28.08", change: "+30.85%", positive: true },
    { name: "GigaCloud Technology", symbol: "GCT", price: "$28.91", change: "+30.52%", positive: true },
  ];

  const featuredArticles = [
    {
      title: "2 Warren Buffett Stocks to Buy Before Berkshire Hathaway's 13F Filing",
      description: "Plus, which stocks Berkshire Hathaway might've bought and sold last quarter.",
      author: "Susan Dziubinski",
      image: "warren-buffett"
    },
    {
      title: "Investors Are Seeking Safety in Gold ETFs. Is It Working?",
      description: "Also, four top ETFs and how this speculative asset is faring against another popular hedge.",
      author: "Bryan Armour, CFA",
      image: "gold-etf"
    },
    {
      title: "How Healthy Is the US Economy? Here's What the Top Economic Indicators Say",
      description: "Margaret Giles breaks down the latest economic data and what it means for investors.",
      author: "Margaret Giles",
      image: "economy"
    },
  ];

  return (
    <div>
      {/* Markets ticker strip */}
      <section id="markets" className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold text-zinc-600">Markets</span>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 items-center mt-1">
            {markets.map((m) => (
              <div key={m.label} className="flex items-center gap-3" data-destination="true">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-600">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{m.value}</span>
                    <span className={`text-sm ${m.positive ? 'text-emerald-600' : 'text-red-600'} flex items-center gap-0.5`}>
                      {m.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {m.change} {m.percent}
                    </span>
                  </div>
                </div>
                <div className="w-16 h-8">
                  <SparklineChart trend={m.positive ? "up" : "down"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main market dashboard */}
      <section className="bg-[#f9f9f8] py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-destination="true">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">US Market Barometer</h2>
                <a className="text-[#be3c47] text-xs" href="#" data-destination="true">Markets ›</a>
              </div>
              <MarketPerformanceChart />
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-600">
                <span>Updated: Aug 8, 10:16 PM</span>
                <span className="text-emerald-600">+0.68%</span>
              </div>
            </div>

            <div className="lg:col-span-1 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-destination="true">
              <h3 className="text-base font-semibold mb-3">Market Sectors</h3>
              <SectorHeatmap />
              <p className="mt-3 text-xs text-zinc-600">Today's sector performance</p>
            </div>

            <div className="lg:col-span-1 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-destination="true">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">DJIA - Intraday</h3>
                <span className="text-xs text-emerald-600">+0.47%</span>
              </div>
              <IntradayChart />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-destination="true">
              <h3 className="text-sm font-semibold mb-2">Sample Portfolio Mix</h3>
              <PortfolioAllocation />
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" data-destination="true">
              <h3 className="text-sm font-semibold mb-2">Trading Volume</h3>
              <VolumeChart />
              <p className="text-xs text-zinc-600 mt-2">20-day volume trend</p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Movers section */}
      <section className="bg-white border-b border-zinc-200 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Market Movers</h2>
              <div className="flex gap-2">
                <button className="text-xs px-2 py-1 rounded bg-zinc-100 font-medium" data-destination="true">Gainers</button>
                <button className="text-xs px-2 py-1 rounded text-zinc-600" data-destination="true">Losers</button>
                <button className="text-xs px-2 py-1 rounded text-zinc-600" data-destination="true">Active</button>
              </div>
            </div>
            <div className="space-y-2">
              {marketMovers.map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2" data-destination="true">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8">
                      <SparklineChart trend="up" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{stock.symbol}</span>
                        <span className="text-sm">{stock.price}</span>
                      </div>
                      <span className="text-xs text-zinc-600">{stock.name}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${stock.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stock.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio CTA section */}
      <section id="portfolio" className="bg-white border-y border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PieChartIcon className="w-5 h-5 text-[#be3c47]" />
                <span className="text-sm font-medium text-[#be3c47]">Portfolio</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Know what you own and what puts you at risk.</h2>
              <p className="text-zinc-600 mb-6">Understand your portfolio holdings from all angles and get personalized notifications with Morningstar Investor.</p>
              <div className="flex gap-3">
                <button className="px-5 py-2.5 bg-[#be3c47] text-white font-medium rounded hover:bg-[#a8343e] transition-colors" data-destination="true">
                  Get 7 Days Free
                </button>
                <button className="px-5 py-2.5 border border-zinc-300 font-medium rounded hover:bg-zinc-50 transition-colors" data-destination="true">
                  Learn More
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 p-6 bg-gradient-to-br from-zinc-50 to-white" data-destination="true">
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">Your Portfolio Performance</h3>
                <MarketPerformanceChart />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-600">Total Value</span>
                  <p className="font-semibold">$125,430</p>
                </div>
                <div>
                  <span className="text-zinc-600">Today's Gain</span>
                  <p className="font-semibold text-emerald-600">+$1,234 (0.99%)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="bg-[#f9f9f8] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Featured</h2>
            <a href="#" className="text-[#be3c47] text-sm font-medium" data-destination="true">View All Articles ›</a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article, i) => (
              <article key={i} className="group rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow" data-destination="true">
                <div className="aspect-[16/9] bg-gradient-to-br from-zinc-200 to-zinc-300 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-12 h-12 text-zinc-400" />
                  </div>
                  {i === 0 && (
                    <div className="absolute top-2 left-2 bg-[#be3c47] text-white text-xs px-2 py-1 rounded">
                      Berkshire
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base mb-2 group-hover:text-[#be3c47] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-zinc-600 mb-3">{article.description}</p>
                  <p className="text-xs text-zinc-500">{article.author}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Company Earnings section */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Company Earnings</h2>
            <a href="#" className="text-[#be3c47] text-sm font-medium" data-destination="true">More ›</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { company: "Under Armour", symbol: "UAA", date: "Aug 8, 2025", status: "Beat", change: "+5.2%" },
              { company: "Trade Desk", symbol: "TTD", date: "Aug 8, 2025", status: "Miss", change: "-3.1%" },
              { company: "Energy Transfer", symbol: "ET", date: "Aug 8, 2025", status: "Meet", change: "+0.8%" },
              { company: "Amazon", symbol: "AMZN", date: "Aug 7, 2025", status: "Beat", change: "+7.3%" },
            ].map((earning) => (
              <div key={earning.symbol} className="rounded border border-zinc-200 p-4" data-destination="true">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-sm">{earning.company}</h4>
                    <p className="text-xs text-zinc-600">{earning.symbol}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${earning.status === 'Beat' ? 'bg-green-100 text-green-700' :
                    earning.status === 'Miss' ? 'bg-red-100 text-red-700' :
                      'bg-zinc-100 text-zinc-700'
                    }`}>
                    {earning.status}
                  </span>
                </div>
                <div className="w-full h-12">
                  <SparklineChart trend={earning.change.startsWith('+') ? "up" : "down"} />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-zinc-600">{earning.date}</span>
                  <span className={earning.change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}>
                    {earning.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More sections with charts */}
      <section className="bg-[#f9f9f8] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div id="funds">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Funds</h2>
                <a href="#" className="text-[#be3c47] text-sm" data-destination="true">View All ›</a>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4" data-destination="true">
                    <h3 className="font-semibold text-sm mb-1">Top-Performing Intermediate Core Bond Funds</h3>
                    <p className="text-xs text-zinc-600 mb-2">Funds from JPMorgan, Fidelity leading.</p>
                    <div className="h-12">
                      <SparklineChart trend={i % 2 === 0 ? "up" : "down"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="etfs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">ETFs</h2>
                <a href="#" className="text-[#be3c47] text-sm" data-destination="true">View All ›</a>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4" data-destination="true">
                    <h3 className="font-semibold text-sm mb-1">Gold ETFs See Record Inflows</h3>
                    <p className="text-xs text-zinc-600 mb-2">Investors seek safe haven assets.</p>
                    <div className="h-12">
                      <SparklineChart trend="up" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="stocks">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Stocks</h2>
                <a href="#" className="text-[#be3c47] text-sm" data-destination="true">View All ›</a>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4" data-destination="true">
                    <h3 className="font-semibold text-sm mb-1">Best Healthcare Stocks to Buy</h3>
                    <p className="text-xs text-zinc-600 mb-2">12 undervalued opportunities.</p>
                    <div className="h-12">
                      <SparklineChart trend={i === 1 ? "down" : "up"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Main Layout Component
function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9f9f8] text-[#0a0a0a] flex flex-col">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="inline-flex items-center gap-2" data-destination="true">
                <img
                  alt="Morningstar"
                  src="https://ext.same-assets.com/723266518/2018535412.svg"
                  className="h-6 w-auto"
                />
              </Link>
              <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
                <Link href="#portfolio" className="hover:text-[#be3c47]" data-destination="true">Portfolio</Link>
                <Link href="#funds" className="hover:text-[#be3c47]" data-destination="true">Funds</Link>
                <Link href="#etfs" className="hover:text-[#be3c47]" data-destination="true">ETFs</Link>
                <Link href="#stocks" className="hover:text-[#be3c47]" data-destination="true">Stocks</Link>
                <Link href="#bonds" className="hover:text-[#be3c47]" data-destination="true">Bonds</Link>
                <Link href="#markets" className="hover:text-[#be3c47]" data-destination="true">Markets</Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <button className="hidden sm:inline-flex rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50" data-destination="true">Sign in</button>
              <button className="inline-flex rounded-md bg-[#be3c47] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#a8343e]" data-destination="true">Subscribe</button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="mt-16 border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-sm text-zinc-600">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <p>© {new Date().getFullYear()} Morningstar clone for demo purposes.</p>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="#help" className="hover:text-[#be3c47]" data-destination="true">Help</Link>
              <Link href="#whats-new" className="hover:text-[#be3c47]" data-destination="true">What's New</Link>
              <Link href="#business" className="hover:text-[#be3c47]" data-destination="true">Business</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <Script crossOrigin="anonymous" src="//unpkg.com/same-runtime/dist/index.global.js" />
        <link rel="icon" href="https://ext.same-assets.com/723266518/2814407259.ico" />
        <Script src="/tracker.js" />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ClientBody>
          <LayoutShell>{children}</LayoutShell>
        </ClientBody>
      </body>
    </html>
  );
}