import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import {
  Users,
  User,
  Filter,
  ShieldCheck,
  ShieldOff,
  X,
  ChevronRight,
} from "lucide-react";
import api from "../lib/axios";
import IDCard from "../components/IDCard";

export default function People() {
  const [people, setPeople] = useState([]);
  const [filter, setFilter] = useState({ type: "", status: "" });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const headerRef = useRef(null);
  const listRef = useRef(null);
  const modalRef = useRef(null);

  const fetchPeople = async () => {
    setLoading(true);
    const params = {};
    if (filter.type) params.type = filter.type;
    if (filter.status) params.status = filter.status;
    const res = await api.get("/people", { params });
    setPeople(res.data);
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
    fetchPeople();
  }, [filter]);

  useEffect(() => {
    if (!loading && listRef.current) {
      const items = listRef.current.querySelectorAll(".person-row");
      gsap.fromTo(
        items,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.35, ease: "power2.out" }
      );
    }
  }, [loading, people]);

  useEffect(() => {
    if (selected && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.93, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.2)" }
      );
    }
  }, [selected]);

  const toggle = async (person) => {
    const action = person.status === "active" ? "revoke" : "activate";
    setToggling(true);
    await api.patch(`/people/${person._id}/${action}`);
    setToggling(false);
    fetchPeople();
    setSelected(null);
  };

  const filterOptions = [
    { key: "type", options: ["", "staff", "visitor"], placeholder: "All Types" },
    { key: "status", options: ["", "active", "revoked"], placeholder: "All Status" },
  ];

  return (
    <div>
      {/* Header */}
      <div ref={headerRef} className="mb-7">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-6 bg-pink-500 rounded-full" />
          <h1 className="text-2xl font-bold text-white">People</h1>
        </div>
        <p className="text-sm text-gray-500 ml-4">
          Manage staff and visitor records
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Filter size={13} />
          <span>Filter:</span>
        </div>
        {filterOptions.map(({ key, options, placeholder }) => (
          <select
            key={key}
            value={filter[key]}
            onChange={(e) => setFilter((p) => ({ ...p, [key]: e.target.value }))}
            className="bg-gray-900 border border-white/5 text-sm rounded-xl 
              px-3 py-2 outline-none capitalize text-gray-300 
              focus:ring-2 focus:ring-pink-500/40 cursor-pointer"
          >
            <option value="">{placeholder}</option>
            {options
              .filter((o) => o)
              .map((o) => (
                <option key={o} value={o}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </option>
              ))}
          </select>
        ))}

        {(filter.type || filter.status) && (
          <button
            onClick={() => setFilter({ type: "", status: "" })}
            className="text-xs text-gray-500 hover:text-white flex items-center gap-1 
              px-3 py-2 rounded-xl bg-gray-900 border border-white/5 transition-colors"
          >
            <X size={12} />
            Clear
          </button>
        )}

        <span className="ml-auto text-xs text-gray-600 font-medium">
          {people.length} record{people.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[68px] bg-gray-900 rounded-xl animate-pulse border border-white/5"
            />
          ))}
        </div>
      ) : people.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 rounded-2xl bg-gray-900 border border-white/5 mb-4">
            <Users size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">No people found</p>
          <p className="text-gray-600 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-2">
          {people.map((p) => (
            <div
              key={p._id}
              onClick={() => setSelected(p)}
              className="person-row bg-gray-900 border border-white/5 rounded-xl 
                px-5 py-4 flex items-center gap-4 cursor-pointer 
                hover:bg-gray-800/80 hover:border-white/10 transition-all duration-200 group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                {p.photo ? (
                  <img
                    src={`/uploads/${p.photo}`}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={16} className="text-gray-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{p.name}</p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">
                  {p.type}
                  {p.role ? ` · ${p.role}` : ""}
                  {p.department ? ` · ${p.department}` : ""}
                </p>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs text-gray-600 hidden sm:block">
                  {p.idNumber}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                    p.status === "active"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {p.status}
                </span>
                <ChevronRight
                  size={14}
                  className="text-gray-600 group-hover:text-gray-400 transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center 
            justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="space-y-3"
          >
            <IDCard person={selected} />

            <div className="flex gap-3">
              <button
                onClick={() => toggle(selected)}
                disabled={toggling}
                className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors 
                  flex items-center justify-center gap-2 disabled:opacity-50 ${
                    selected.status === "active"
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-green-600 hover:bg-green-500 text-white"
                  }`}
              >
                {selected.status === "active" ? (
                  <>
                    <ShieldOff size={15} />
                    Revoke ID
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    Activate ID
                  </>
                )}
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-3 rounded-xl font-medium text-sm 
                  bg-gray-800 hover:bg-gray-700 transition-colors 
                  flex items-center justify-center gap-2 text-gray-300"
              >
                <X size={15} />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}