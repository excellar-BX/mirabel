import { useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  Users,
  ChevronRight,
  ShieldOff,
  ShieldCheck,
  Printer,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import api from "../lib/axios";
import useFetch from "../lib/useFetch";
import { capitalize, fmtCalendarDate, fmtDate } from "../lib/format";
import IDCard from "../components/IDCard";
import {
  Alert,
  Avatar,
  Button,
  ButtonLink,
  Card,
  DetailList,
  Drawer,
  EmptyState,
  Input,
  PageHeader,
  Segmented,
  Select,
  Skeleton,
  StatusBadge,
  TypeBadge,
} from "../components/ui";

const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "staff", label: "Staff" },
  { value: "visitor", label: "Visitors" },
];

function PersonDrawer({ person, onClose, onChanged }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = async (kind, fn) => {
    setBusy(kind);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const toggleStatus = () =>
    run("status", async () => {
      const action = person.status === "active" ? "revoke" : "activate";
      const res = await api.patch(`/people/${person._id}/${action}`);
      onChanged(res.data);
    });

  const remove = () =>
    run("delete", async () => {
      await api.delete(`/people/${person._id}`);
      onChanged(null);
      onClose();
    });

  const isStaff = person.type === "staff";
  const details = [
    ["ID number", <span className="font-mono">{person.idNumber}</span>],
    ["Type", capitalize(person.type)],
    ["Status", <StatusBadge status={person.status} />],
    ...(isStaff
      ? [
          ["Role", person.role],
          ["Department", person.department],
        ]
      : [
          ["Purpose", person.purpose],
          ["Host", person.hostName],
          ["Scheduled date", person.expectedDate ? fmtCalendarDate(person.expectedDate) : "Any day"],
        ]),
    ["Registered", fmtDate(person.createdAt)],
  ];

  return (
    <Drawer
      open
      onClose={onClose}
      title={person.name}
      footer={
        confirmDelete ? (
          <div className="space-y-3">
            <p className="text-[13px] text-fg">
              Delete <span className="font-semibold">{person.name}</span> permanently? Their access history is kept.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" className="flex-1" loading={busy === "delete"} onClick={remove}>
                Delete permanently
              </Button>
              <Button className="flex-1" onClick={() => setConfirmDelete(false)} disabled={!!busy}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant={person.status === "active" ? "danger" : "success"}
              icon={person.status === "active" ? ShieldOff : ShieldCheck}
              className="flex-1"
              loading={busy === "status"}
              disabled={!!busy}
              onClick={toggleStatus}
            >
              {person.status === "active" ? "Revoke ID" : "Reactivate ID"}
            </Button>
            <Button icon={Printer} onClick={() => window.print()} disabled={!!busy}>
              Print
            </Button>
            <Button
              variant="danger-ghost"
              size="icon"
              title="Delete"
              aria-label="Delete person"
              onClick={() => setConfirmDelete(true)}
              disabled={!!busy}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )
      }
    >
      <div className="h-16 px-5 flex items-center justify-between border-b border-line shrink-0">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-fg truncate">{person.name}</p>
          <p className="text-xs text-subtle">{isStaff ? "Staff member" : "Visitor"}</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
          <X size={17} />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="bg-surface-2 border-b border-line py-7 flex justify-center">
          <IDCard person={person} />
        </div>
        <div className="px-5 py-4">
          {error && (
            <Alert icon={AlertCircle} className="mb-4">
              {error}
            </Alert>
          )}
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-subtle mb-1">Details</p>
          <DetailList items={details} />
        </div>
      </div>
    </Drawer>
  );
}

export default function People() {
  const { data, error, reload, loading } = useFetch("/people");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [overrides, setOverrides] = useState({});

  const people = useMemo(
    () => (data || []).filter((p) => overrides[p._id] !== null).map((p) => overrides[p._id] || p),
    [data, overrides]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter(
      (p) =>
        (!type || p.type === type) &&
        (!status || p.status === status) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.idNumber.toLowerCase().includes(q) ||
          (p.role || "").toLowerCase().includes(q) ||
          (p.department || "").toLowerCase().includes(q) ||
          (p.hostName || "").toLowerCase().includes(q))
    );
  }, [people, query, type, status]);

  const selected = people.find((p) => p._id === selectedId);
  const hasFilters = query || type || status;

  return (
    <>
      <PageHeader
        title="People"
        description={
          data
            ? `${people.length} registered · ${people.filter((p) => p.status === "active").length} active`
            : "Staff and visitor directory"
        }
        actions={
          <ButtonLink to="/admin/register" variant="primary" icon={UserPlus}>
            Register person
          </ButtonLink>
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
          <div className="md:w-72">
            <Input
              icon={Search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, ID, role, host…"
              aria-label="Search people"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Segmented options={TYPE_OPTIONS} value={type} onChange={setType} />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40" aria-label="Status">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setType("");
                  setStatus("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="md:ml-auto text-xs text-subtle tabular-nums">
            {data ? `${filtered.length} of ${people.length}` : ""}
          </p>
        </div>

        {/* Table */}
        {!data && loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasFilters ? "No matches" : "No one registered yet"}
            description={
              hasFilters
                ? "Try a different search or clear the filters."
                : "Register staff and visitors to issue ID cards."
            }
            action={
              !hasFilters && (
                <ButtonLink to="/admin/register" variant="primary" icon={UserPlus}>
                  Register person
                </ButtonLink>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="bg-surface-2 text-left text-xs text-muted">
                  <th className="font-medium px-4 py-2.5">Name</th>
                  <th className="font-medium px-4 py-2.5 hidden sm:table-cell">Type</th>
                  <th className="font-medium px-4 py-2.5 hidden md:table-cell">Details</th>
                  <th className="font-medium px-4 py-2.5">Status</th>
                  <th className="font-medium px-4 py-2.5 hidden lg:table-cell">Registered</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => setSelectedId(p._id)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedId(p._id)}
                    tabIndex={0}
                    className="cursor-pointer hover:bg-surface-2/60 focus-visible:bg-surface-2 outline-none transition-colors group"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <Avatar person={p} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-fg truncate">{p.name}</p>
                          <p className="text-xs text-subtle font-mono">{p.idNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <TypeBadge type={p.type} />
                    </td>
                    <td className="px-4 py-2.5 text-muted hidden md:table-cell max-w-[260px] truncate">
                      {p.type === "staff"
                        ? [p.role, p.department].filter(Boolean).join(" · ") || "—"
                        : [p.purpose, p.expectedDate && fmtCalendarDate(p.expectedDate)]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-2.5 text-muted hidden lg:table-cell tabular-nums">
                      {fmtDate(p.createdAt)}
                    </td>
                    <td className="px-2 py-2.5">
                      <ChevronRight size={16} className="text-subtle group-hover:text-fg transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <PersonDrawer
          key={selected._id}
          person={selected}
          onClose={() => setSelectedId(null)}
          onChanged={(updated) => setOverrides((o) => ({ ...o, [selected._id]: updated }))}
        />
      )}
    </>
  );
}
