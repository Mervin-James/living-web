"use client";

import {
  MarketPerformanceChart,
  IntradayChart,
  SectorHeatmap,
  PortfolioAllocation,
  SparklineChart,
  VolumeChart
} from "./components/MarketCharts";
import { TrendingUp, TrendingDown, Activity, BarChart3, PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Home() {
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
              <div key={m.label} className="flex items-center gap-3">
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* US Market Barometer */}
            <div className="lg:col-span-1 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">US Market Barometer</h2>
                <a className="text-[#be3c47] text-xs" href="#">Markets ›</a>
              </div>
              <MarketPerformanceChart />
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-600">
                <span>Updated: Aug 8, 10:16 PM</span>
                <span className="text-emerald-600">+0.68%</span>
              </div>
            </div>

            {/* Market Sectors Heatmap */}
            <div className="lg:col-span-1 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold mb-3">Market Sectors</h3>
              <SectorHeatmap />
              <p className="mt-3 text-xs text-zinc-600">Today's sector performance</p>
            </div>

            {/* Market Movers */}
            <div className="lg:col-span-2 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Market Movers</h2>
                <div className="flex gap-2">
                  <button className="text-xs px-2 py-1 rounded bg-zinc-100 font-medium">Gainers</button>
                  <button className="text-xs px-2 py-1 rounded text-zinc-600">Losers</button>
                  <button className="text-xs px-2 py-1 rounded text-zinc-600">Active</button>
                </div>
              </div>
              <div className="space-y-2">
                {marketMovers.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2">
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

          {/* Additional Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* DJIA Intraday */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">DJIA - Intraday</h3>
                <span className="text-xs text-emerald-600">+0.47%</span>
              </div>
              <IntradayChart />
            </div>

            {/* Portfolio Allocation */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-2">Sample Portfolio Mix</h3>
              <PortfolioAllocation />
            </div>

            {/* Market Volume */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-2">Trading Volume</h3>
              <VolumeChart />
              <p className="text-xs text-zinc-600 mt-2">20-day volume trend</p>
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
                <PieChart className="w-5 h-5 text-[#be3c47]" />
                <span className="text-sm font-medium text-[#be3c47]">Portfolio</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Know what you own and what puts you at risk.</h2>
              <p className="text-zinc-600 mb-6">Understand your portfolio holdings from all angles and get personalized notifications with Morningstar Investor.</p>
              <div className="flex gap-3">
                <button className="px-5 py-2.5 bg-[#be3c47] text-white font-medium rounded hover:bg-[#a8343e] transition-colors">
                  Get 7 Days Free
                </button>
                <button className="px-5 py-2.5 border border-zinc-300 font-medium rounded hover:bg-zinc-50 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 p-6 bg-gradient-to-br from-zinc-50 to-white">
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
            <a href="#" className="text-[#be3c47] text-sm font-medium">View All Articles ›</a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article, i) => (
              <article key={i} className="group rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
            <a href="#" className="text-[#be3c47] text-sm font-medium">More ›</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { company: "Under Armour", symbol: "UAA", date: "Aug 8, 2025", status: "Beat", change: "+5.2%" },
              { company: "Trade Desk", symbol: "TTD", date: "Aug 8, 2025", status: "Miss", change: "-3.1%" },
              { company: "Energy Transfer", symbol: "ET", date: "Aug 8, 2025", status: "Meet", change: "+0.8%" },
              { company: "Amazon", symbol: "AMZN", date: "Aug 7, 2025", status: "Beat", change: "+7.3%" },
            ].map((earning) => (
              <div key={earning.symbol} className="rounded border border-zinc-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-sm">{earning.company}</h4>
                    <p className="text-xs text-zinc-600">{earning.symbol}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    earning.status === 'Beat' ? 'bg-green-100 text-green-700' :
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
            {/* Funds */}
            <div id="funds">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Funds</h2>
                <a href="#" className="text-[#be3c47] text-sm">View All ›</a>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
                    <h3 className="font-semibold text-sm mb-1">Top-Performing Intermediate Core Bond Funds</h3>
                    <p className="text-xs text-zinc-600 mb-2">Funds from JPMorgan, Fidelity leading.</p>
                    <div className="h-12">
                      <SparklineChart trend={i % 2 === 0 ? "up" : "down"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ETFs */}
            <div id="etfs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">ETFs</h2>
                <a href="#" className="text-[#be3c47] text-sm">View All ›</a>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
                    <h3 className="font-semibold text-sm mb-1">Gold ETFs See Record Inflows</h3>
                    <p className="text-xs text-zinc-600 mb-2">Investors seek safe haven assets.</p>
                    <div className="h-12">
                      <SparklineChart trend="up" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stocks */}
            <div id="stocks">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Stocks</h2>
                <a href="#" className="text-[#be3c47] text-sm">View All ›</a>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
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
