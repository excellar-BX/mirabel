import config from "../config.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateString(value) {
  return typeof value === "string" && DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

// "YYYY-MM-DD" for the given instant in the app timezone.
export function dateStringInZone(date = new Date(), timeZone = config.timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Offset (ms) of the timezone from UTC at the given instant.
function zoneOffsetMs(timestamp, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(timestamp))
      .map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - timestamp;
}

// UTC instant of local midnight for "YYYY-MM-DD" in the app timezone.
export function startOfDayInZone(dateString, timeZone = config.timezone) {
  const utcMidnight = Date.parse(`${dateString}T00:00:00Z`);
  return new Date(utcMidnight - zoneOffsetMs(utcMidnight, timeZone));
}

// [start, end) range covering the given calendar day in the app timezone.
export function dayRangeInZone(dateString, timeZone = config.timezone) {
  const start = startOfDayInZone(dateString, timeZone);
  const next = new Date(Date.parse(`${dateString}T00:00:00Z`) + 86_400_000)
    .toISOString()
    .slice(0, 10);
  return { start, end: startOfDayInZone(next, timeZone) };
}
