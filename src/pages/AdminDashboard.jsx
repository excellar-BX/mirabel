import { useEffect, useState, useRef, useCallback } from "react";
import { gsap } from "gsap";
import {
  Users,
  UserCheck,
  Contact,
  CalendarCheck,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Activity,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../lib/axios";

// ─── Constants ───────────────────────────────────────────────────────────────

const PERIODS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

const colorMap = {
  pink: {
    icon: "bg-pink-500/10 text-pink-400",
    value: "text-pink-400",
    border: "border-pink-500/20",
    glow: "group-hover:shadow-pink-500/10",
    badge: "bg-pink-500/10 text-pink-400",
    chart: "#f472b6",
  },
  green: {
    icon: "bg-green-500/10 text-green-400",
    value: "text-green-400",
    border: "border-green-500/20",
    glow: "group-hover:shadow-green-500/10",
    badge: "bg-green-500/10 text-green-400",
    chart: "#4ade80",
  },
  purple: {
    icon: "bg-purple-500/10 text-purple-400",
    value: "text-purple-400",
    border: "border-purple-500/20",
    glow: "group-hover:shadow-purple-500/10",
    badge: "bg-purple-500/10 text-purple-400",
    chart: "#c084fc",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-400",
    value: "text-amber-400",
    border: "border-amber-500/20",
    glow: "group-hover:shadow-amber-500/10",
    badge: "bg-amber-500/10 text-amber-400",
    chart: "#fbbf24",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate chart-ready data from raw logs array.
 * Backend returns logs with checkInTime timestamps.
 * We group them by day/hour depending on period.
 */
function buildCheckInSeries(logs = [], period) {
  if (!logs.length) return [];

  const now = new Date();

  if (period === "today") {
    // Group by hour 0-23
    const hours = Array.from({ length: 24 }, (_, i) => ({
      label: `${String(i).padStart(2, "0")}:00`,
      checkIns: 0,
    }));
    logs.forEach((log) => {
      const h = new Date(log.checkInTime).getHours();
      hours[h].checkIns += 1;
    });
    return hours;
  }

  if (period === "week") {
    // Last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return {
        label: d.toLocaleDateString("en-NG", { weekday: "short" }),
        date: d.toDateString(),
        checkIns: 0,
      };
    });
    logs.forEach((log) => {
      const logDate = new Date(log.checkInTime).toDateString();
      const slot = days.find((d) => d.date === logDate);
      if (slot) slot.checkIns += 1;
    });
    return days;
  }

  if (period === "month") {
    // Last 30 days grouped by week label
    const weeks = [
      { label: "Week 1", checkIns: 0, start: 1, end: 7 },
      { label: "Week 2", checkIns: 0, start: 8, end: 14 },
      { label: "Week 3", checkIns: 0, start: 15, end: 21 },
      { label: "Week 4", checkIns: 0, start: 22, end: 31 },
    ];
    logs.forEach((log) => {
      const day = new Date(log.checkInTime).getDate();
      const slot = weeks.find((w) => day >= w.start && day <= w.end);
      if (slot) slot.checkIns += 1;
    });
    return weeks;
  }

  return [];
}

function buildTypeSplit(logs = []) {
  let staff = 0;
  let visitor = 0;
  logs.forEach((log) => {
    if (log.person?.type === "staff") staff += 1;
    else visitor += 1;
  });
  return [
    { name: "Staff", value: staff, color: "#60a5fa" },
    { name: "Visitors", value: visitor, color: "#c084fc" },
  ];
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">
        {payload[0].value}{" "}
        <span className="text-gray-400 font-normal">check-ins</span>
      </p>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-gray-400 mb-1">{payload[0].name}</p>
      <p className="text-sm font-bold text-white">{payload[0].value} entries</p>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, desc, index }) {
  const c = colorMap[color];
  const cardRef = useRef(null);
  const valueRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: index * 0.1, ease: "power3.out" }
    );
    if (value !== null && value !== undefined) {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: value,
        duration: 1.2,
        delay: index * 0.1 + 0.3,
        ease: "power2.out",
        onUpdate: () => {
          if (valueRef.current) {
            valueRef.current.textContent = Math.round(obj.val);
          }
        },
      });
    }
  }, [value, index]);

  return (
    <div
      ref={cardRef}
      className={`group relative bg-gray-900 border ${c.border} rounded-2xl p-5
        hover:bg-gray-900/80 transition-all duration-300
        hover:shadow-xl ${c.glow} cursor-default overflow-hidden`}
    >
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 ${c.icon}`} />

      <div className="relative flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${c.icon}`}>
          <Icon size={18} />
        </div>
        <div
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full 
            ${c.badge} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        >
          <ArrowUpRight size={11} />
          Live
        </div>
      </div>

      <div ref={valueRef} className={`text-3xl font-bold mb-1 ${c.value}`}>
        {value ?? "—"}
      </div>
      <p className="text-sm font-medium text-white mb-0.5">{label}</p>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  );
}

// ─── Quick Metric Row ─────────────────────────────────────────────────────────

function QuickMetricRow({ stats, todayCount }) {
  const rowRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      rowRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.55, ease: "power3.out" }
    );
  }, []);

  const activeRate =
    stats?.totalStaff > 0
      ? Math.round((stats.activeStaff / stats.totalStaff) * 100)
      : 0;

  const metrics = [
    {
      label: "Staff Active Rate",
      value: `${activeRate}%`,
      icon: TrendingUp,
      sub: `${stats?.activeStaff ?? 0} of ${stats?.totalStaff ?? 0} active`,
    },
    {
      label: "Today's Activity",
      value: todayCount ?? 0,
      icon: Activity,
      sub: "Check-ins logged today",
    },
    {
      label: "Last Updated",
      value: new Date().toLocaleTimeString("en-NG", { timeStyle: "short" }),
      icon: Clock,
      sub: "Live data",
    },
  ];

  return (
    <div ref={rowRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.label}
            className="bg-gray-900 border border-white/5 rounded-2xl px-5 py-4 flex items-center gap-4"
          >
            <div className="p-2 rounded-xl bg-white/5 text-gray-400 shrink-0">
              <Icon size={16} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{m.label}</p>
              <p className="text-base font-bold text-white">{m.value}</p>
              <p className="text-xs text-gray-600">{m.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Chart Section ────────────────────────────────────────────────────────────

function ChartSection({ logs, period, setPeriod, loading }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      sectionRef.current,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.65, ease: "power3.out" }
    );
  }, []);

  const checkInSeries = buildCheckInSeries(logs, period);
  const typeSplit = buildTypeSplit(logs);
  const totalInPeriod = logs.length;
  const peak = checkInSeries.reduce(
    (max, d) => (d.checkIns > max.checkIns ? d : max),
    { label: "—", checkIns: 0 }
  );

  return (
    <div ref={sectionRef} className="mt-6 space-y-4">
      {/* Chart header + period filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <BarChart3 size={16} className="text-gray-400" />
            <h2 className="text-base font-semibold text-white">
              Check-in Activity
            </h2>
          </div>
          <p className="text-xs text-gray-500 ml-6">
            {totalInPeriod} total entries — peak at{" "}
            <span className="text-white font-medium">{peak.label}</span> (
            {peak.checkIns})
          </p>
        </div>

        {/* Period tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-900 border border-white/5 rounded-xl self-start sm:self-auto">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                period === p.value
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area / Bar chart — takes 2 cols */}
        <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-medium text-white">
              {period === "today"
                ? "Hourly Breakdown"
                : period === "week"
                ? "Daily Breakdown"
                : "Weekly Breakdown"}
            </p>
            <span className="text-xs text-gray-600 bg-gray-800 px-2.5 py-1 rounded-lg">
              {period === "today"
                ? "24h"
                : period === "week"
                ? "7 days"
                : "30 days"}
            </span>
          </div>

          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : totalInPeriod === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center gap-2">
              <BarChart3 size={28} className="text-gray-700" />
              <p className="text-sm text-gray-600">No data for this period</p>
            </div>
          ) : period === "today" ? (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={checkInSeries} margin={{ left: -20, right: 8 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff08"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="checkIns"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#3b82f6", stroke: "#1e40af" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={checkInSeries} margin={{ left: -20, right: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff08"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="checkIns"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart — 1 col */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
          <p className="text-sm font-medium text-white mb-1">Entry Split</p>
          <p className="text-xs text-gray-500 mb-5">Staff vs Visitors</p>

          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : totalInPeriod === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center gap-2">
              <Users size={28} className="text-gray-700" />
              <p className="text-sm text-gray-600">No entries yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={typeSplit}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {typeSplit.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="space-y-2 mt-2">
                {typeSplit.map((t) => (
                  <div key={t.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-xs text-gray-400">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {t.value}
                      </span>
                      <span className="text-xs text-gray-600">
                        {totalInPeriod > 0
                          ? `${Math.round((t.value / totalInPeriod) * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [todayCount, setTodayCount] = useState(null);
  const [logs, setLogs] = useState([]);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const headerRef = useRef(null);

  // Fetch stats + today count once
  const fetchStats = useCallback(async () => {
    const [statsRes, countRes] = await Promise.all([
      api.get("/people/stats"),
      api.get("/logs/today/count"),
    ]);
    setStats(statsRes.data);
    setTodayCount(countRes.data.count);
  }, []);

  // Fetch logs filtered by period — uses your existing GET /logs?date= endpoint
  // For week/month we pass no date and slice client-side from full log list
  const fetchLogs = useCallback(async (selectedPeriod) => {
    setChartLoading(true);
    try {
      const params = {};

      if (selectedPeriod === "today") {
        // Pass today's date to backend filter
        const today = new Date().toISOString().split("T")[0];
        params.date = today;
      }
      // For week/month: fetch all logs, filter client-side by date range
      const res = await api.get("/logs", { params });
      let data = res.data;

      if (selectedPeriod === "week") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        data = data.filter((l) => new Date(l.checkInTime) >= cutoff);
      }

      if (selectedPeriod === "month") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        data = data.filter((l) => new Date(l.checkInTime) >= cutoff);
      }

      setLogs(data);
    } finally {
      setChartLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
    );

    Promise.all([fetchStats(), fetchLogs(period)]).finally(() =>
      setLoading(false)
    );
  }, []);

  // Refetch logs when period changes
  useEffect(() => {
    fetchLogs(period);
  }, [period]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchLogs(period)]);
    setRefreshing(false);
  };

  const statCards = [
    {
      label: "Total Staff",
      value: stats?.totalStaff ?? null,
      icon: Users,
      color: "pink",
      desc: "Registered staff members",
    },
    {
      label: "Active Staff",
      value: stats?.activeStaff ?? null,
      icon: UserCheck,
      color: "green",
      desc: "Currently active IDs",
    },
    {
      label: "Total Visitors",
      value: stats?.totalVisitors ?? null,
      icon: Contact,
      color: "purple",
      desc: "All time visitors",
    },
    {
      label: "Check-ins Today",
      value: todayCount ?? null,
      icon: CalendarCheck,
      color: "amber",
      desc: "Scans logged today",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div ref={headerRef} className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 bg-pink-500 rounded-full" />
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">
            School ID system overview — real-time stats
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 
            border border-white/5 text-sm text-gray-400 hover:text-white 
            hover:bg-gray-800 transition-all disabled:opacity-40"
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin" : ""}
          />
          <span className="hidden sm:inline">
            {refreshing ? "Refreshing..." : "Refresh"}
          </span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} index={i} />
        ))}
      </div>

      {/* Quick Metrics */}
      {!loading && <QuickMetricRow stats={stats} todayCount={todayCount} />}

      {/* Skeleton for quick metrics */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-900 border border-white/5 rounded-2xl h-20 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Charts */}
      <ChartSection
        logs={logs}
        period={period}
        setPeriod={setPeriod}
        loading={chartLoading}
      />
    </div>
  );
}