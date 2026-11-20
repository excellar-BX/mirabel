import { useMemo, useState } from "react";
import { Search, Download, Inbox, X, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import useFetch from "../lib/useFetch";
import { fmtDate, fmtLongDate, fmtTime } from "../lib/format";
import {
  Alert,
  Avatar,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Segmented,
  Skeleton,
  StatusBadge,
  TypeBadge,
} from "../components/ui";

const PAGE_SIZE = 25;

const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "staff", label: "Staff" },
  { value: "visitor", label: "Visitors" },
];

function toCsv(rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["Name", "ID number", "Type", "Status", "Entry point", "Date", "Time", "Timestamp (UTC)"];
  const lines = rows.map((l) =>
    [
      l.person?.name || "Deleted person",
      l.person?.idNumber,
      l.person?.type,
      l.person?.status,
      l.entryPoint,
      fmtDate(l.checkInTime),
      fmtTime(l.checkInTime),
      new Date(l.checkInTime).toISOString(),
    ]
      .map(esc)
      .join(",")
  );
  return [header.join(","), ...lines].join("\r\n");
}

function download(filename, text) {
  const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Logs() {
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");
  const params = useMemo(() => (date ? { date } : {}), [date]);
  const { data, error, loading, reload } = useFetch("/logs", params);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data || []).filter(
      (l) =>
        (!type || l.person?.type === type) &&
        (!q ||
          (l.person?.name || "").toLowerCase().includes(q) ||
          (l.person?.idNumber || "").toLowerCase().includes(q))
    );
  }, [data, type, query]);

  const hasFilters = date || type || query;

  // Pagination (resets to the first page whenever the filters change)
  const filterSig = `${date}|${type}|${query}`;
  const [pager, setPager] = useState({ sig: filterSig, page: 0 });
  const page = pager.sig === filterSig ? pager.page : 0;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const goTo = (p) => setPager({ sig: filterSig, page: p });

  return (
    <>
      <PageHeader
        title="Access logs"
        description={date ? `Check-ins on ${fmtLongDate(date + "T12:00:00")}` : "Every verified entry at the check-in desk"}
        actions={
          <Button
            icon={Download}
            disabled={!filtered.length}
            onClick={() => download(`access-log-${date || "recent"}.csv`, toCsv(filtered))}
          >
            Export CSV
          </Button>
        }
      />

      {error && (
        <Alert className="mb-4" icon={AlertCircle}>
          {error}{" "}
          <button className="underline" onClick={reload}>
            Retry
          </button>
        </Alert>
      )}

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center px-4 py-3 border-b border-line">
          <div className="md:w-64">
            <Input
              icon={Search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or ID…"
              aria-label="Search logs"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Segmented options={TYPE_OPTIONS} value={type} onChange={setType} />
            <div className="relative">
              <Input
                type="date"
                value={date}
                max={new Date().toLocaleDateString("en-CA")}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Filter by date"
                className="w-44"
              />
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                onClick={() => {
                  setDate("");
                  setType("");
                  setQuery("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="md:ml-auto text-xs text-subtle tabular-nums">
            {data ? `${filtered.length} record${filtered.length === 1 ? "" : "s"}` : ""}
          </p>
        </div>

        {!data || (loading && !filtered.length) ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No check-ins found"
            description={hasFilters ? "Nothing matches these filters." : "Verified entries from the desk will appear here."}
          />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="bg-surface-2 text-left text-xs text-muted">
                  <th className="font-medium px-4 py-2.5">Person</th>
                  <th className="font-medium px-4 py-2.5 hidden sm:table-cell">Type</th>
                  <th className="font-medium px-4 py-2.5 hidden md:table-cell">Current status</th>
                  <th className="font-medium px-4 py-2.5 hidden sm:table-cell">Entry point</th>
                  <th className="font-medium px-4 py-2.5 text-right">Date</th>
                  <th className="font-medium px-4 py-2.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageRows.map((l) => (
                  <tr key={l._id} className="hover:bg-surface-2/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <Avatar person={l.person} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-fg truncate">{l.person?.name || "Deleted person"}</p>
                          <p className="text-xs text-subtle font-mono">{l.person?.idNumber || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <TypeBadge type={l.person?.type} />
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      {l.person ? <StatusBadge status={l.person.status} /> : <span className="text-subtle">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-muted hidden sm:table-cell">{l.entryPoint || "—"}</td>
                    <td className="px-4 py-2.5 text-muted text-right tabular-nums whitespace-nowrap">
                      {fmtDate(l.checkInTime)}
                    </td>
                    <td className="px-4 py-2.5 text-fg text-right tabular-nums font-medium">{fmtTime(l.checkInTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-t border-line">
            <p className="text-xs text-subtle tabular-nums">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              {!date && data.length >= 200 && " · latest 200 shown, pick a date for a full day"}
            </p>
            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                <Button size="icon-sm" variant="ghost" aria-label="Previous page" disabled={page === 0} onClick={() => goTo(page - 1)}>
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-xs text-muted tabular-nums px-1">
                  {page + 1} / {pageCount}
                </span>
                <Button size="icon-sm" variant="ghost" aria-label="Next page" disabled={page >= pageCount - 1} onClick={() => goTo(page + 1)}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
