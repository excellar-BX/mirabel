import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import {
  ScrollText,
  CalendarDays,
  User,
  Clock,
  DoorOpen,
  Tag,
  Inbox,
} from "lucide-react";
import api from "../lib/axios";

const fmt = (d) =>
  new Date(d).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const headerRef = useRef(null);
  const tableRef = useRef(null);

  const fetchLogs = async () => {
    setLoading(true);
    const params = {};
    if (date) params.date = date;
    const res = await api.get("/logs", { params });
    setLogs(res.data);
    setLoading(false);
  };

  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }
    );
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [date]);

  useEffect(() => {
    if (!loading && tableRef.current) {
      const rows = tableRef.current.querySelectorAll("tr.log-row");
      gsap.fromTo(
        rows,
        { opacity: 0, x: -12 },
        {
          opacity: 1,
          x: 0,
          duration: 0.35,
          stagger: 0.04,
          ease: "power2.out",
        }
      );
    }
  }, [loading, logs]);

  return (
    <div>
      {/* Header */}
      <div
        ref={headerRef}
        className="flex items-center justify-between mb-7 flex-wrap gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 bg-pink-500 rounded-full" />
            <h1 className="text-2xl font-bold text-white">Access Logs</h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">
            All check-in activity — filter by date
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-900 border border-white/5 rounded-xl px-3 py-2">
          <CalendarDays size={14} className="text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm outline-none text-gray-300"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-900 rounded-xl animate-pulse border border-white/5"
            />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 rounded-2xl bg-gray-900 border border-white/5 mb-4">
            <Inbox size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">No logs found</p>
          <p className="text-gray-600 text-sm mt-1">
            {date ? "No activity on this date" : "No check-ins recorded yet"}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          {/* Count badge */}
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">
              Showing {logs.length} record{logs.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
              <ScrollText size={11} />
              {date ? "Filtered" : "All time"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" ref={tableRef}>
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <User size={11} />
                      Person
                    </span>
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <Tag size={11} />
                      Type
                    </span>
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <DoorOpen size={11} />
                      Entry Point
                    </span>
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} />
                      Time
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className="log-row border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Person */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                          {log.person?.photo ? (
                            <img
                              src={`/uploads/${log.person.photo}`}
                              alt={log.person?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={14} className="text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {log.person?.name || "Unknown"}
                          </p>
                          <p className="text-xs font-mono text-gray-500">
                            {log.person?.idNumber}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${
                          log.person?.type === "staff"
                            ? "bg-pink-500/10 text-pink-400 border-pink-500/20"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        }`}
                      >
                        {log.person?.type || "—"}
                      </span>
                    </td>

                    {/* Entry Point */}
                    <td className="px-5 py-3.5 text-gray-400 text-sm">
                      {log.entryPoint || "—"}
                    </td>

                    {/* Time */}
                    <td className="px-5 py-3.5 text-gray-400 text-sm font-mono">
                      {fmt(log.checkInTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}