const LOCALE = "en-GB";

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" }) : "—";

export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" }) : "—";

export const fmtDateTime = (d) => (d ? `${fmtDate(d)}, ${fmtTime(d)}` : "—");

export const fmtLongDate = (d = new Date()) =>
  new Date(d).toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// Expected dates are stored as UTC midnight: format without timezone shift.
export const fmtCalendarDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(LOCALE, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

export function fmtRelative(d) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return fmtDate(d);
}

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

export const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);
