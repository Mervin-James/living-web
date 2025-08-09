"use client";

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

// Generate mock market data
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

// Generate mock intraday data
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

export function MarketPerformanceChart() {
  const data = generateMarketData();

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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

export function IntradayChart() {
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

export function SectorHeatmap() {
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

export function PortfolioAllocation() {
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

export function SparklineChart({ trend = "up" }: { trend?: "up" | "down" }) {
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

export function VolumeChart() {
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
