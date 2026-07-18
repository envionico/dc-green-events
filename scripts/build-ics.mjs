/* ============================================================
   build-ics.mjs
   ------------------------------------------------------------
   Generates public/calendar.ics from public/data/events.json —
   a standard iCalendar feed containing every event, so visitors
   can SUBSCRIBE to the whole directory from Google Calendar,
   Apple Calendar, or Outlook (footer link "Subscribe to the
   calendar"). Runs automatically before every build, so the
   feed always matches the event data.

   Notes:
   • Uses the listed endTime when the organizer provided one,
     otherwise assumes ~2 hours.
   • Times are "floating" local times (no timezone suffix), so
     they land at the stated clock time for DC-area subscribers.
   • Lines are folded at 74 bytes per the iCalendar spec.
   ============================================================ */
import { readFileSync, writeFileSync } from "node:fs";

const events = JSON.parse(readFileSync("public/data/events.json", "utf8"));

const pad = (n) => String(n).padStart(2, "0");

function parseStartTime(s) {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(s || "");
  if (!m) return { h: 9, m: 0 };
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  return { h, m: min };
}

function stamps(e) {
  const start = parseStartTime(e.startTime);
  const startDt = new Date(e.date + "T00:00:00");
  startDt.setHours(start.h, start.m);
  const endDt = new Date(startDt);
  if (e.endTime) {
    const end = parseStartTime(e.endTime);
    endDt.setHours(end.h, end.m);
    if (endDt <= startDt) endDt.setDate(endDt.getDate() + 1);
  } else {
    endDt.setHours(startDt.getHours() + 2);
  }
  const fmt = (d) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  return { start: fmt(startDt), end: fmt(endDt) };
}

const esc = (s) =>
  String(s || "").replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");

// Fold lines longer than 74 bytes (continuation lines start with a space).
function fold(line) {
  const out = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}

const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

const lines = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//DC Green Events//Event Feed//EN",
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  "X-WR-CALNAME:DC Green Events",
  "X-WR-CALDESC:Environmental volunteer events across the Washington DC area",
];

for (const e of events) {
  const { start, end } = stamps(e);
  const loc = `${e.location.neighborhood} — ${e.location.address}`;
  const desc =
    `${e.description}\n\nOrganized by ${e.organization}.\nSign up: ${e.signupUrl}`;
  lines.push(
    "BEGIN:VEVENT",
    fold(`UID:dcgreen-${e.id}@dc-green-events`),
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    fold(`SUMMARY:${esc(e.title)}`),
    fold(`DESCRIPTION:${esc(desc)}`),
    fold(`LOCATION:${esc(loc)}`),
    fold(`URL:${esc(e.signupUrl)}`),
    "END:VEVENT"
  );
}

lines.push("END:VCALENDAR");
writeFileSync("public/calendar.ics", lines.join("\r\n") + "\r\n");
console.log(`✓ public/calendar.ics generated — ${events.length} events`);
