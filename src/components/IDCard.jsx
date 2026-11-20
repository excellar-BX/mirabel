import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { User } from "lucide-react";
import { photoUrl } from "../lib/axios";
import { BRAND } from "../lib/brand";
import { fmtCalendarDate } from "../lib/format";

/**
 * A printable, physical-style ID badge (CR80 portrait proportions).
 * Always rendered in light colours — it represents a printed card.
 */
export default function IDCard({ person, photoSrc, preview = false, className = "" }) {
  const canvasRef = useRef(null);
  const qrValue = person?.idNumber || "";

  useEffect(() => {
    if (!canvasRef.current || !qrValue) return;
    QRCode.toCanvas(canvasRef.current, qrValue, {
      width: 84,
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#0e1116", light: "#ffffff" },
    });
  }, [qrValue]);

  if (!person) return null;

  const isStaff = person.type !== "visitor";
  const photo = photoSrc || photoUrl(person);
  const revoked = person.status === "revoked";
  const band = isStaff ? "#1d3f91" : "#b2541b";

  return (
    <div
      className={`print-card relative w-[264px] aspect-[54/85.6] rounded-[14px] overflow-hidden bg-white text-[#0e1116] shadow-card ring-1 ring-black/[0.08] flex flex-col select-none ${className}`}
    >
      {/* Header band */}
      <div className="px-4 pt-3.5 pb-3 text-white flex items-start justify-between" style={{ background: band }}>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight truncate">{BRAND.cardTitle}</p>
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-white/70 mt-0.5">Identity card</p>
        </div>
        <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0" aria-hidden>
          <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.16)" />
          <path d="M9 22V10.5l7 7.5 7-7.5V22" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Photo + identity */}
      <div className="flex-1 flex flex-col items-center px-4 pt-4 text-center min-h-0">
        <div className="w-[92px] h-[110px] rounded-lg overflow-hidden bg-[#eef0f3] ring-1 ring-black/[0.06] flex items-center justify-center">
          {photo ? (
            <img src={photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={36} className="text-[#a7adb7]" />
          )}
        </div>
        <p className="mt-3 text-[15px] font-semibold leading-snug line-clamp-2 break-words">
          {person.name || (preview ? "Full name" : "—")}
        </p>
        <p className="text-[11.5px] text-[#555c69] mt-0.5 line-clamp-1">
          {isStaff
            ? [person.role, person.department].filter(Boolean).join(" · ") || (preview ? "Role · Department" : "")
            : person.purpose || (preview ? "Purpose of visit" : "")}
        </p>
        {!isStaff && (person.hostName || person.expectedDate) && (
          <p className="text-[10.5px] text-[#8b919c] mt-1 line-clamp-1">
            {person.hostName ? `Host: ${person.hostName}` : ""}
            {person.hostName && person.expectedDate ? " · " : ""}
            {person.expectedDate ? `Valid ${fmtCalendarDate(person.expectedDate)}` : ""}
          </p>
        )}
      </div>

      {/* ID + QR */}
      <div className="px-4 pb-3 pt-2 flex items-end justify-between gap-3">
        <div className="min-w-0 pb-0.5">
          <p className="text-[9px] uppercase tracking-[0.14em] text-[#8b919c]">ID number</p>
          <p className="font-mono text-[12.5px] font-semibold tracking-wide mt-0.5">
            {person.idNumber || "SCH-XXXXXXXX"}
          </p>
        </div>
        <div className="w-[84px] h-[84px] shrink-0 flex items-center justify-center">
          {person.idNumber ? (
            <canvas ref={canvasRef} className="w-[84px] h-[84px]" />
          ) : (
            <div className="w-full h-full rounded-md border border-dashed border-[#cfd3da] flex items-center justify-center text-[9px] text-[#8b919c] uppercase tracking-wider">
              QR
            </div>
          )}
        </div>
      </div>

      {/* Type strip */}
      <div
        className="h-7 flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white"
        style={{ background: revoked ? "#c6312f" : band }}
      >
        {revoked ? "Revoked" : isStaff ? "Staff" : "Visitor"}
      </div>
    </div>
  );
}
