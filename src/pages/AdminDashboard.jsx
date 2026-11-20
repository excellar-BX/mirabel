import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, ArrowRight, Inbox, BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useFetch from "../lib/useFetch";
import { useCssVars } from "../lib/theme";
import { fmtLongDate, fmtRelative } from "../lib/format";
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Segmented,
  Skeleton,
  StatusBadge,
  TypeBadge,
} from "../components/ui";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "7 days" },
  { value: "month", label: "30 days" },
];

const localDateKey = (d) => new Date(d).toLocaleDateString("en-CA");

function periodParams(period) {
  if (period === "today") return { date: localDateKey(new Date()) };
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (period === "month" ? 29 : 6));
  return { since: since.toISOString() };
}

function buildSeries(logs, period) {
  if (period === "today") {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      label: `${String(h).padStart(2, "0")}:00`,
      short: String(h).padStart(2, "0"),
      value: 0,
    }));
    logs.forEach((l) => (hours[new Date(l.checkInTime).getHours()].value += 1));
    return hours;
  }
  const days = period === "month" ? 30 : 7;
  const out = [];
  const index = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = localDateKey(d);
    index[key] = out.length;
    out.push({
      key,
      label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
      short:
        period === "week"
          ? d.toLocaleDateString("en-GB", { weekday: "short" })
          : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      value: 0,
    });
  }
  logs.forEach((l) => {
    const i = index[localDateKey(l.checkInTime)];
    if (i !== undefined) out[i].value += 1;
  });
  return out;
}

/* ─────────────── KPI tile ─────────────── */

function Kpi({ label, value, sub, loading }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-[13px] text-muted">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-16 mt-2" />
      ) : (
        <p className="text-[28px] leading-9 font-semibold tracking-tight text-fg tabular-nums mt-1">{value}</p>
      )}
      <p className="text-xs text-subtle mt-1 h-4">{loading ? "" : sub}</p>
    </Card>
  );
}

/* ─────────────── Chart ─────────────── */

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface shadow-pop px-3 py-2">
      <p className="text-[11px] text-subtle">{d.label}</p>
      <p className="text-sm font-semibold text-fg tabular-nums">
        {d.value} <span className="font-normal text-muted">check-in{d.value === 1 ? "" : "s"}</span>
      </p>
    </div>
  );
}

function ActivityChart({ series, period }) {
  const c = useCssVars(["--series-1", "--line", "--fg-subtle", "--surface-2"]);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={series} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barCategoryGap={period === "month" ? 2 : "28%"}>
        <CartesianGrid vertical={false} stroke={c["--line"]} />
        <XAxis
          dataKey="short"
          tickLine={false}
          axisLine={{ stroke: c["--line"] }}
          tick={{ fill: c["--fg-subtle"], fontSize: 11 }}
          interval={period === "today" ? 2 : period === "month" ? 4 : 0}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fill: c["--fg-subtle"], fontSize: 11 }}
          width={44}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: c["--surface-2"] }} isAnimationActive={false} />
        <Bar dataKey="value" fill={c["--series-1"]} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─────────────── Composition ─────────────── */

function Composition({ logs }) {
  const staff = logs.filter((l) => l.person?.type === "staff").length;
  const visitors = logs.length - staff;
  const total = logs.length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const rows = [
    { label: "Staff", value: staff, color: "bg-series-1" },
    { label: "Visitors", value: visitors, color: "bg-series-2" },
  ];
  return (
    <div className="px-5 pb-5">
      <div className="flex h-2.5 w-full gap-[2px] rounded-full overflow-hidden bg-surface-3">
        {total > 0 &&
          rows.map((r) =>
            r.value ? (
              <div
                key={r.label}
                className={r.color}
                style={{ width: `${(r.value / total) * 100}%` }}
                title={`${r.label}: ${r.value} (${pct(r.value)}%)`}
              />
            ) : null
          )}
      </div>
      <div className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-muted">
              <span className={`w-2.5 h-2.5 rounded-sm ${r.color}`} />
              {r.label}
            </span>
            <span className="tabular-nums text-fg font-medium">
              {r.value}
              <span className="text-subtle font-normal ml-2 inline-block w-9 text-right">{pct(r.value)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Page ─────────────── */

export default function AdminDashboard() {
  const [period, setPeriod] = useState("week");
  const params = useMemo(() => periodParams(period), [period]);

  const stats = useFetch("/people/stats");
  const today = useFetch("/logs/today/count");
  const periodLogs = useFetch("/logs", params);
  const recent = useFetch("/logs");

  const logs = useMemo(() => periodLogs.data || [], [periodLogs.data]);
  const series = useMemo(() => buildSeries(logs, period), [logs, period]);
  const peak = series.reduce((m, d) => (d.value > m.value ? d : m), { value: 0, label: "—" });

  const s = stats.data;
  const refreshing = stats.loading || today.loading || periodLogs.loading || recent.loading;
  const refresh = () => {
    stats.reload();
    today.reload();
    periodLogs.reload();
    recent.reload();
  };
  const error = stats.error || today.error || periodLogs.error || recent.error;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={fmtLongDate()}
        actions={
          <Button icon={RefreshCw} onClick={refresh} disabled={refreshing}>
            Refresh
          </Button>
        }
      />

      {error && <Alert className="mb-6">{error}</Alert>}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Check-ins today" value={today.data?.count ?? 0} sub="Since midnight" loading={!today.data} />
        <Kpi
          label="Active staff"
          value={s?.activeStaff ?? 0}
          sub={s ? `of ${s.totalStaff} registered` : ""}
          loading={!s}
        />
        <Kpi
          label="Visitors"
          value={s?.totalVisitors ?? 0}
          sub={s ? `${s.activeVisitors} with active passes` : ""}
          loading={!s}
        />
        <Kpi
          label="Revoked IDs"
          value={s ? s.totalStaff + s.totalVisitors - s.activeStaff - s.activeVisitors : 0}
          sub="Denied at the desk"
          loading={!s}
        />
      </div>

      {/* Activity + composition */}
      <div className="grid gap-4 lg:grid-cols-3 mt-4">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Check-ins"
            description={
              periodLogs.data
                ? `${logs.length} in period${peak.value ? ` · busiest ${peak.label} (${peak.value})` : ""}`
                : "Loading…"
            }
            actions={<Segmented size="sm" options={PERIODS} value={period} onChange={setPeriod} />}
          />
          <div className="px-3 pb-4">
            {!periodLogs.data ? (
              <Skeleton className="h-[260px] mx-2" />
            ) : logs.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No check-ins in this period"
                description="Activity will appear here as people are verified at the desk."
                className="h-[260px] py-0"
              />
            ) : (
              <ActivityChart series={series} period={period} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Who's coming in" description="Share of check-ins in the selected period" />
          {!periodLogs.data ? (
            <div className="px-5 pb-5 space-y-3">
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <Composition logs={logs} />
          )}
          <div className="border-t border-line px-5 py-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted">Registered staff</p>
              <p className="text-lg font-semibold tabular-nums text-fg mt-0.5">{s?.totalStaff ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Registered visitors</p>
              <p className="text-lg font-semibold tabular-nums text-fg mt-0.5">{s?.totalVisitors ?? "—"}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="mt-4">
        <CardHeader
          title="Recent check-ins"
          description="Latest verified entries"
          actions={
            <Link to="/admin/logs" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
              View all
              <ArrowRight size={14} />
            </Link>
          }
        />
        {!recent.data ? (
          <div className="px-5 pb-5 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : recent.data.length === 0 ? (
          <EmptyState icon={Inbox} title="No check-ins yet" description="Verified entries from the desk will show up here." />
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {recent.data.slice(0, 8).map((log) => (
              <li key={log._id} className="flex items-center gap-3 px-5 py-3">
                <Avatar person={log.person} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-fg truncate">{log.person?.name || "Deleted person"}</p>
                  <p className="text-xs text-subtle font-mono">{log.person?.idNumber || "—"}</p>
                </div>
                <div className="hidden sm:block w-24">
                  <TypeBadge type={log.person?.type} />
                </div>
                <div className="hidden md:block w-24">
                  {log.person && <StatusBadge status={log.person.status} />}
                </div>
                <p className="text-xs text-muted w-24 text-right tabular-nums">{fmtRelative(log.checkInTime)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
