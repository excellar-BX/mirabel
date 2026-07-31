import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import gsap from "gsap";
import { Building2, User, MapPin, Hash } from "lucide-react";

export default function IDCard({ person }) {
  const canvasRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { scale: 0.92, opacity: 0, y: 16 },
      { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" }
    );
  }, []);

  useEffect(() => {
    if (canvasRef.current && person?.idNumber) {
      QRCode.toCanvas(canvasRef.current, person.idNumber, {
        width: 88,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
    }
  }, [person?.idNumber]);

  if (!person) return null;

  const isStaff = person.type === "staff";
  const photoUrl = person.photo ? `/uploads/${person.photo}` : null;
  const isActive = person.status === "active";

  return (
    <div
      ref={cardRef}
      className={`w-72 rounded-2xl overflow-hidden shadow-2xl border ${
        isStaff ? "border-pink-500/30" : "border-purple-500/30"
      } bg-gray-900`}
    >
      {/* Header stripe */}
      <div
        className={`px-5 py-3.5 flex items-center justify-between ${
          isStaff
            ? "bg-gradient-to-r from-pink-700 to-pink-600"
            : "bg-gradient-to-r from-purple-700 to-purple-600"
        }`}
      >
        <div>
          <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium">
            School ID System
          </p>
          <p className="text-white font-bold text-sm capitalize mt-0.5">
            {person.type} Card
          </p>
        </div>
        <div className="p-2 bg-white/10 rounded-xl">
          {isStaff ? (
            <Building2 size={16} className="text-white" />
          ) : (
            <User size={16} className="text-white" />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex gap-4 items-start">
        {/* Photo */}
        <div
          className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 ${
            isStaff ? "border-pink-500/40" : "border-purple-500/40"
          } bg-gray-800 flex items-center justify-center`}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={person.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={26} className="text-gray-500" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate text-sm">{person.name}</p>

          {isStaff ? (
            <>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <MapPin size={10} />
                {person.role || "—"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{person.department || "—"}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 mt-0.5">{person.purpose || "—"}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Host: {person.hostName || "—"}
              </p>
            </>
          )}

          <span
            className={`inline-flex items-center gap-1 mt-2 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
              isActive
                ? "bg-green-500/15 text-green-400 border border-green-500/20"
                : "bg-red-500/15 text-red-400 border border-red-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? "bg-green-400" : "bg-red-400"
              }`}
            />
            {person.status}
          </span>
        </div>
      </div>

      {/* Footer — ID + QR */}
      <div className="bg-gray-950/60 px-5 py-3 flex items-center justify-between border-t border-white/5">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1 mb-1">
            <Hash size={9} />
            ID Number
          </p>
          <p className="font-mono text-xs text-white font-bold tracking-wide">
            {person.idNumber}
          </p>
        </div>
        <div className="rounded-lg overflow-hidden border border-white/10">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}