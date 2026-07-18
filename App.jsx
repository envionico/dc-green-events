import { useState, useEffect, useRef } from "react";
// Event data lives in public/data/events.json and is fetched at runtime,
// so the list can be updated without rebuilding the app. To add, edit, or
// remove an event you ONLY edit that file — never this one.

// Leaflet is NOT imported here: MapView loads it on demand the first
// time someone opens the Map view (code-splitting), so visitors who
// never open the map don't download it at all. The standalone preview
// sets window.L up front instead, and MapView uses whichever is there.

/* ============================================================
   openExternal — robust "open in new tab" for links
   ------------------------------------------------------------
   A plain <a target="_blank"> is correct HTML, but sandboxed
   embeds (preview iframes without popup permission) silently
   swallow the left-click while right-click -> "open in new tab"
   still works. This handler tries a popup and reports whether it
   worked. IMPORTANT: when the popup is blocked we deliberately
   do NOT navigate the current frame instead — sandboxed frames
   block that too and replace the whole app with a "content
   blocked" error page. The caller shows a copy-the-link fallback
   instead, which keeps the visitor in the app. Modified clicks
   (middle, ctrl/cmd/shift) are left to the browser so the real
   href keeps its native behavior.
   Returns true if the click was handled (or opened), false if
   the environment blocked it and the caller should offer the
   link another way.
   ============================================================ */
function openExternal(e, url) {
  if (e.defaultPrevented) return true;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return true;
  e.preventDefault();
  let popup = null;
  try { popup = window.open(url, "_blank", "noopener,noreferrer"); } catch { /* blocked */ }
  return !!popup;
}

/* ============================================================
   usePersistedState
   ------------------------------------------------------------
   Works like useState, but remembers the value in the browser's
   localStorage so a visitor's chosen view and filters are still
   there when they come back. Wrapped in try/catch because some
   sandboxed contexts (and private-mode browsers) block storage —
   in that case it simply behaves like a normal useState and the
   only thing lost is the "remember my settings" nicety.
   ============================================================ */
function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage unavailable — ignore */ }
  }, [key, value]);
  return [value, setValue];
}

/* ============================================================
   ICONS
   Small inline SVGs (from the Lucide icon set) so the app has
   no icon dependency and works fully offline.
   ============================================================ */
const Icon = {
  leaf: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>),
  search: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>),
  x: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>),
  list: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>),
  grid: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>),
  clock: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  pin: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>),
  cal: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>),
  arrow: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>),
  external: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>),
  download: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>),
  searchX: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>),
  directions: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>),
  calPlus: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M12 14v4"/><path d="M10 16h4"/></svg>),
  share: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>),
  map: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0zM15 5.764v15M9 3.236v15"/></svg>),
  bolt: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>),
};

/* ============================================================
   SITE CONFIG — edit these when you update the site.
   ------------------------------------------------------------
   LAST_UPDATED: change this to the date you last checked the
     organizers' pages and refreshed events.json. It shows in
     the footer so visitors know how current the list is.
   SUGGEST_EMAIL: where "Suggest an event" messages go. Replace
     with your own email (or swap the mailto: link in the footer
     for a Google Form URL if you'd rather collect them that way).
   ============================================================ */
const LAST_UPDATED = "2026-07-17"; // YYYY-MM-DD
const SUGGEST_EMAIL = "you@example.com"; // <-- change to your email

/* ============================================================
   CONFIG: event types + their accent colors
   ============================================================ */
const EVENT_TYPES = [
  { label: "All", tagClass: "" },
  { label: "Tree Planting", tagClass: "tag-tree" },
  { label: "River/Stream Cleanup", tagClass: "tag-river" },
  { label: "Park Cleanup", tagClass: "tag-park" },
  { label: "Advocacy", tagClass: "tag-advocacy" },
  { label: "Education", tagClass: "tag-education" },
  { label: "Other", tagClass: "tag-other" },
];

// Solid colors for calendar event chips, keyed by type.
const TYPE_COLORS = {
  "Tree Planting": "#2f7d4f",
  "River/Stream Cleanup": "#2b7d8c",
  "Park Cleanup": "#6a8b2f",
  "Advocacy": "#b26a2b",
  "Education": "#6a52a3",
  "Other": "#6b7280",
};

function tagClassFor(eventType) {
  const match = EVENT_TYPES.find((t) => t.label === eventType);
  return match ? match.tagClass : "tag-other";
}

/* ============================================================
   DATE HELPERS
   ============================================================ */
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Local-time Date from an ISO date string (avoids timezone drift).
function dateFromISO(isoDate) {
  return new Date(isoDate + "T00:00:00");
}

// "Saturday, August 15, 2026"
function formatFullDate(isoDate) {
  const d = dateFromISO(isoDate);
  return d.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

// Pieces for the little date chip on each card.
function dateParts(isoDate) {
  const d = dateFromISO(isoDate);
  return { mon: MONTHS_SHORT[d.getMonth()], day: d.getDate(), dow: DOW_SHORT[d.getDay()] };
}

// "June 30, 2026" — used for the footer's last-updated line.
function formatUpdated(isoDate) {
  const d = dateFromISO(isoDate);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// Whole days from today (local midnight) to the event date.
function daysUntil(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const then = dateFromISO(isoDate);
  return Math.round((then - today) / 86400000);
}

// A short, human "when" label relative to today: "Today", "Tomorrow",
// "This weekend", "In 4 days", "Next week", "In 3 weeks", etc.
// Returns { label, urgent } — urgent=true for anything within a week,
// so the badge can be styled to stand out.
function relativeWhen(isoDate) {
  const d = daysUntil(isoDate);
  if (d < 0) return { label: "Past", urgent: false };
  if (d === 0) return { label: "Today", urgent: true };
  if (d === 1) return { label: "Tomorrow", urgent: true };
  // "This weekend" only if it truly falls in the current week's Sat/Sun —
  // we reuse the same window logic as the quick filter so the badge and
  // the filter can never disagree. (Without this, a Sunday viewing an
  // event the FOLLOWING Saturday would mislabel it "This weekend".)
  if (isInTimeWindow(isoDate, "This weekend")) return { label: "This weekend", urgent: true };
  if (d <= 6) return { label: `In ${d} days`, urgent: true };
  if (d <= 13) return { label: "Next week", urgent: false };
  if (d <= 27) return { label: `In ${Math.round(d / 7)} weeks`, urgent: false };
  const months = Math.round(d / 30);
  return { label: months <= 1 ? "In a month" : `In ${months} months`, urgent: false };
}

// "August 2026" key for grouping events by month in the list.
function monthKey(isoDate) {
  const d = dateFromISO(isoDate);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/* ============================================================
   TIME-WINDOW FILTERS ("This weekend" / "This week")
   ------------------------------------------------------------
   These answer the most common question for a volunteer events
   app — "what can I do this Saturday?" — with one tap.
     • This weekend = the upcoming Saturday and Sunday. (If it's
       already the weekend, it means today through Sunday.)
     • This week = today through the coming Sunday.
   Both are computed relative to the real "today".
   ============================================================ */
const TIME_WINDOWS = ["All dates", "This weekend", "This week"];

function isInTimeWindow(isoDate, window) {
  if (window === "All dates") return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = dateFromISO(isoDate);
  const dow = today.getDay(); // 0 Sun … 6 Sat

  if (window === "This week") {
    // Days remaining until (and including) the coming Sunday.
    const daysToSunday = dow === 0 ? 0 : 7 - dow;
    const end = new Date(today);
    end.setDate(today.getDate() + daysToSunday);
    return d >= today && d <= end;
  }

  if (window === "This weekend") {
    // The upcoming Saturday and Sunday. If today is already Sat/Sun,
    // the window is today through this Sunday.
    let satOffset;
    if (dow === 6) satOffset = 0;        // Saturday
    else if (dow === 0) satOffset = -0;  // Sunday (weekend already started)
    else satOffset = 6 - dow;            // days until Saturday
    const sat = new Date(today);
    sat.setDate(today.getDate() + (dow === 0 ? 0 : satOffset));
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + (dow === 0 ? 0 : 1));
    const start = dow === 0 ? today : sat;
    return d >= start && d <= sun;
  }

  return true;
}

/* ============================================================
   EXTERNAL LINKS — Google Calendar + map directions
   ============================================================ */
// A "add to Google Calendar" URL (most people's default calendar).
function googleCalendarUrl(event) {
  const { start: startStr, end: endStr } = eventTimeStamps(event);
  const loc = `${event.location.neighborhood} — ${event.location.address}`;
  const details = `${event.description}\n\nOrganized by ${event.organization}.\nSign up: ${event.signupUrl}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startStr}/${endStr}`,
    details,
    location: loc,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// A Google Maps directions link to the event's address.
function directionsUrl(event) {
  const q = encodeURIComponent(event.location.address);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

/* ============================================================
   AREA / "NEAR ME" GROUPING
   ------------------------------------------------------------
   These events don't carry GPS coordinates (they only have
   street addresses), and geocoding at runtime would need an
   API key and network calls — which breaks the "no backend,
   works offline" design. Instead we sort each event into a
   broad, recognizable DC-area zone based on its ADDRESS, which
   already contains the DC quadrant (NW/NE/SE/SW) or the MD/VA
   city. This auto-works for any new event you add — no manual
   tagging needed — and "which side of town" is how people here
   actually think about location.
   ============================================================ */
const AREAS = ["All areas", "NW DC", "NE DC", "SE / SW DC", "Maryland", "Virginia"];

function areaForEvent(event) {
  const a = (event.location.address || "");
  const lower = a.toLowerCase();

  // 1. Trust the trailing state/city in the address most. We look at the
  //    LAST comma-separated chunk (e.g. "Washington, DC" or "Hyattsville, MD")
  //    so a street name like "Virginia Ave NW" can't masquerade as Virginia.
  const tail = lower.split(",").slice(-2).join(",");
  const isDC = /washington|,\s*dc\b/.test(tail);

  if (!isDC) {
    if (/\bva\b|virginia|arlington|alexandria|mclean|fairfax/.test(tail)) return "Virginia";
    if (/\bmd\b|maryland|bladensburg|hyattsville|silver spring|college park|takoma|bethesda|greenbelt/.test(tail))
      return "Maryland";
  }

  // 2. Inside DC, use the quadrant that appears on the street line.
  if (/\bnw\b/.test(lower)) return "NW DC";
  if (/\bne\b/.test(lower)) return "NE DC";
  if (/\bse\b|\bsw\b/.test(lower)) return "SE / SW DC";

  // 3. Fallback: most unmarked DC waterfront sites are on the Anacostia (SE/SW).
  return "SE / SW DC";
}

/* ============================================================
   ADD TO CALENDAR (.ics)
   Builds a standard iCalendar file the browser downloads, so a
   visitor can add the event to Apple/Google/Outlook calendars.
   ============================================================ */
function parseStartTime(startTime) {
  // "9:00 AM" -> { h: 9, m: 0 }. Falls back to 9:00 if unparseable.
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(startTime || "");
  if (!m) return { h: 9, m: 0 };
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return { h, m: min };
}

// Which part of the day an event starts in — derived from the real start
// time, so the Morning/Afternoon/Evening filters are always factual.
function timeOfDayFor(event) {
  const { h } = parseStartTime(event.startTime);
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

// Start/end timestamps ("YYYYMMDDTHHMMSS", local floating time) for an
// event. Uses the listed endTime when the organizer provided one, and
// falls back to a ~2-hour estimate when they didn't. Real Date arithmetic
// throughout, so late starts roll past midnight correctly instead of
// producing an invalid "25:00".
function eventTimeStamps(event) {
  const start = parseStartTime(event.startTime);
  const p = (n) => String(n).padStart(2, "0");
  const stamp = (dt) =>
    `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}T${p(dt.getHours())}${p(dt.getMinutes())}00`;
  const startDt = dateFromISO(event.date);
  startDt.setHours(start.h, start.m);
  const endDt = new Date(startDt);
  if (event.endTime) {
    const end = parseStartTime(event.endTime);
    endDt.setHours(end.h, end.m);
    if (endDt <= startDt) endDt.setDate(endDt.getDate() + 1); // crosses midnight
  } else {
    endDt.setHours(startDt.getHours() + 2); // no listed end; assume ~2h
  }
  return { start: stamp(startDt), end: stamp(endDt) };
}

function downloadICS(event) {
  const { start: dtStart, end: dtEnd } = eventTimeStamps(event);
  const esc = (s) => String(s || "").replace(/[\\,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
  const loc = `${event.location.neighborhood} — ${event.location.address}`;
  const uid = `dcgreen-${event.id}-${event.date}@local`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DC Green Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${esc(event.title)}`,
    `DESCRIPTION:${esc(event.description + "\n\nOrganized by " + event.organization + ".\nSign up: " + event.signupUrl)}`,
    `LOCATION:${esc(loc)}`,
    `URL:${esc(event.signupUrl)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============================================================
   HERO ILLUSTRATION
   ------------------------------------------------------------
   A hand-drawn SVG of the DC riverside — two silhouetted tree
   lines with the Washington Monument rising between them, the
   river below with slowly drifting ripples, a lone canoeist (a
   nod to the paddle cleanups in this very directory), and a few
   birds. Pure inline SVG: no images to host, crisp at any size,
   and it recolors with the theme. Wave paths extend past the
   viewBox edges so the drift animation never shows a gap.
   ============================================================ */
function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {/* distant tree line + the Monument */}
      <g fill="#155c3c">
        <path d="M593 34 L600 20 L607 34 L604 112 L596 112 Z" />
        <ellipse cx="55" cy="116" rx="75" ry="26" />
        <ellipse cx="175" cy="110" rx="80" ry="30" />
        <ellipse cx="300" cy="118" rx="88" ry="25" />
        <ellipse cx="425" cy="110" rx="72" ry="30" />
        <ellipse cx="533" cy="118" rx="62" ry="23" />
        <ellipse cx="672" cy="114" rx="76" ry="27" />
        <ellipse cx="800" cy="118" rx="88" ry="25" />
        <ellipse cx="928" cy="110" rx="78" ry="30" />
        <ellipse cx="1055" cy="116" rx="82" ry="26" />
        <ellipse cx="1170" cy="112" rx="72" ry="28" />
        <rect y="116" width="1200" height="40" />
      </g>
      {/* near tree line, darker, with a few conifers */}
      <g fill="#093021">
        <ellipse cx="25" cy="148" rx="62" ry="22" />
        <ellipse cx="135" cy="144" rx="66" ry="26" />
        <path d="M243 104 L268 152 L218 152 Z" />
        <path d="M283 116 L304 154 L262 154 Z" />
        <ellipse cx="385" cy="148" rx="76" ry="24" />
        <ellipse cx="505" cy="152" rx="60" ry="20" />
        <ellipse cx="720" cy="150" rx="70" ry="23" />
        <path d="M918 106 L944 152 L892 152 Z" />
        <path d="M962 118 L983 154 L941 154 Z" />
        <ellipse cx="1080" cy="148" rx="72" ry="24" />
        <ellipse cx="1185" cy="152" rx="58" ry="20" />
        <rect y="146" width="1200" height="54" />
      </g>
      {/* the river */}
      <rect y="166" width="1200" height="34" fill="#0b4029" />
      <path className="wave w1" fill="rgba(207,227,214,0.12)"
        d="M-60 172 Q 0 166 60 172 T 180 172 T 300 172 T 420 172 T 540 172 T 660 172 T 780 172 T 900 172 T 1020 172 T 1140 172 T 1260 172 V200 H-60 Z" />
      <path className="wave w2" fill="rgba(207,227,214,0.10)"
        d="M-60 182 Q -15 177 30 182 T 120 182 T 210 182 T 300 182 T 390 182 T 480 182 T 570 182 T 660 182 T 750 182 T 840 182 T 930 182 T 1020 182 T 1110 182 T 1200 182 T 1290 182 V200 H-60 Z" />
      {/* canoeist */}
      <g fill="#071f14">
        <path d="M840 170 q 34 12 68 0 l -8 9 q -26 8 -52 0 Z" />
        <circle cx="872" cy="160" r="5.5" />
        <path d="M866 166 h 12 l 3 9 h -18 Z" />
        <path d="M856 178 L890 154" stroke="#071f14" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      {/* birds */}
      <g stroke="rgba(207,227,214,0.45)" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M968 38 q 7 -7 14 0 q 7 -7 14 0" />
        <path d="M1024 56 q 5 -5 10 0 q 5 -5 10 0" />
        <path d="M120 48 q 6 -6 12 0 q 6 -6 12 0" />
      </g>
    </svg>
  );
}

/* ============================================================
   TypeTag — the colored dot + label
   ============================================================ */
function TypeTag({ type }) {
  return (
    <span className={"tag " + tagClassFor(type)}>
      <span className="dot" />
      {type}
    </span>
  );
}

/* ============================================================
   EVENT CARD — one row in the list. Clicking opens the modal.
   ============================================================ */
function EventCard({ event, onOpen }) {
  const dp = dateParts(event.date);
  const when = relativeWhen(event.date);
  return (
    <article
      className="event-card"
      role="button"
      tabIndex={0}
      style={{ "--tc": TYPE_COLORS[event.eventType] || "#6b7280" }}
      onClick={() => onOpen(event)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(event); } }}
    >
      <div className="date-chip">
        <span className="mon">{dp.mon}</span>
        <span className="day">{dp.day}</span>
        <span className="dow">{dp.dow}</span>
      </div>

      <div className="card-main">
        <div className="card-head">
          <div>
            <h2>{event.title}</h2>
            <div className="event-org">{event.organization}</div>
          </div>
          <TypeTag type={event.eventType} />
        </div>

        <div className="event-meta">
          <span className={"when-badge" + (when.urgent ? " urgent" : "")}>{when.label}</span>
          <span className="meta-item"><Icon.clock /> {event.startTime}</span>
          <span className="meta-item"><Icon.pin /> {event.location.neighborhood}</span>
          {event.cost === "free" && <span className="free-chip">Free</span>}
        </div>

        <p className="event-desc">{event.description}</p>

        <span className="card-cta">View details &amp; sign up <Icon.arrow /></span>
      </div>
    </article>
  );
}

/* ============================================================
   MODAL — full event detail + sign-up actions
   ============================================================ */
function EventModal({ event, onClose }) {
  const [copied, setCopied] = useState(false);
  // When the viewing environment blocks pop-ups AND frame navigation
  // (e.g. sandboxed preview iframes), we can't open the link at all —
  // so we surface it with a copy button instead of dead-ending the user
  // on a "content blocked" page.
  const [blockedUrl, setBlockedUrl] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const copyBlocked = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2200);
    } catch { /* clipboard unavailable — the URL is shown and selectable */ }
  };

  // Try to open an external link; if the environment blocks it, show the
  // copy-the-link fallback (and attempt an automatic copy).
  const tryOpen = (e, url) => {
    if (!openExternal(e, url)) {
      setBlockedUrl(url);
      copyBlocked(url);
    }
  };

  // Close on Escape, lock body scroll, move focus into the modal, and
  // return focus to whatever opened it (usually the event card) on close.
  useEffect(() => {
    const opener = document.activeElement;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the close button so keyboard users start inside the dialog.
    const t = setTimeout(() => {
      const el = document.querySelector(".modal-close");
      if (el) el.focus();
    }, 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, [onClose]);

  if (!event) return null;

  const when = relativeWhen(event.date);
  const orgShort = event.organization.split(" ")[0];

  // Share: use the native share sheet on mobile; fall back to copying a
  // deep link to this event to the clipboard.
  const shareEvent = async () => {
    const url = `${window.location.origin}${window.location.pathname}#event=${event.id}`;
    const shareData = {
      title: event.title,
      text: `${event.title} — ${event.organization}, ${formatFullDate(event.date)}`,
      url,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch { /* clipboard blocked */ }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={event.title}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><Icon.x /></button>

        <div className="modal-body">
          <div className="modal-tagrow">
            <TypeTag type={event.eventType} />
            {when.label !== "Past" && (
              <span className={"when-badge" + (when.urgent ? " urgent" : "")}>{when.label}</span>
            )}
          </div>
          <h2>{event.title}</h2>
          <div className="modal-org">{event.organization}</div>

          {(event.cost === "free" || event.beginnerFriendly || event.kidFriendly ||
            event.metroAccessible || event.virtualOrInPerson) && (
            <div className="feature-badges">
              {event.cost === "free" && <span className="fbadge">Free</span>}
              {event.beginnerFriendly === true && <span className="fbadge">Beginner-friendly</span>}
              {event.kidFriendly === true && <span className="fbadge">Kid-friendly</span>}
              {event.metroAccessible === true && <span className="fbadge">Metro-accessible</span>}
              {event.virtualOrInPerson === "in-person" && <span className="fbadge quiet">In person</span>}
              {event.virtualOrInPerson === "virtual" && <span className="fbadge quiet">Virtual</span>}
            </div>
          )}

          <div className="modal-facts">
            <div className="modal-fact">
              <Icon.cal />
              <div>
                <div className="fact-label">Date</div>
                <div className="fact-value">{formatFullDate(event.date)}</div>
              </div>
            </div>
            <div className="modal-fact">
              <Icon.clock />
              <div>
                <div className="fact-label">Time</div>
                <div className="fact-value">
                  {event.startTime}
                  {event.endTime
                    ? ` – ${event.endTime}`
                    : <span className="fact-soft"> (end time not listed)</span>}
                </div>
              </div>
            </div>
            <div className="modal-fact">
              <Icon.pin />
              <div className="fact-grow">
                <div className="fact-label">Location <span className="fact-area">{areaForEvent(event)}</span></div>
                <div className="fact-value">{event.location.neighborhood} — {event.location.address}</div>
                <a className="fact-link" href={directionsUrl(event)} onClick={(e) => tryOpen(e, directionsUrl(event))} target="_blank" rel="noopener noreferrer">
                  <Icon.directions /> Get directions
                </a>
              </div>
            </div>
          </div>

          <p className="modal-desc">{event.description}</p>

          {/* Trust details: where this listing came from and how current it is */}
          <div className="trust-box">
            <div className="trust-row">
              <span className="trust-label">Registration</span>
              <span className="trust-value">
                {event.registrationStatus === "open" ? "Open" :
                 event.registrationStatus === "closed" ? "Closed" : "Unknown"}
                {event.lastChecked && <span className="fact-soft"> · as of {formatUpdated(event.lastChecked)}</span>}
              </span>
            </div>
            <div className="trust-row">
              <span className="trust-label">Source</span>
              <span className="trust-value">
                {event.sourceUrl ? (
                  <a href={event.sourceUrl} onClick={(e) => tryOpen(e, event.sourceUrl)} target="_blank" rel="noopener noreferrer">
                    Organizer&rsquo;s event listing
                  </a>
                ) : "—"}
                {event.lastChecked && <span className="fact-soft"> · checked {formatUpdated(event.lastChecked)}</span>}
              </span>
            </div>
            <div className="trust-row">
              <span className="trust-label">Verified</span>
              <span className="trust-value">
                {event.organizerVerified
                  ? "Confirmed by the organizer"
                  : "Independently tracked from the organizer's public listing"}
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <a className="btn-primary" href={event.signupUrl} onClick={(e) => tryOpen(e, event.signupUrl)} target="_blank" rel="noopener noreferrer">
              Sign up on {orgShort}&rsquo;s site <Icon.external />
            </a>
            <div className="btn-row">
              <a className="btn-secondary" href={googleCalendarUrl(event)} onClick={(e) => tryOpen(e, googleCalendarUrl(event))} target="_blank" rel="noopener noreferrer">
                <Icon.calPlus /> Google Calendar
              </a>
              <button className="btn-secondary" onClick={() => downloadICS(event)}>
                <Icon.download /> .ics file
              </button>
              <button className="btn-secondary" onClick={shareEvent}>
                {copied ? <><Icon.check /> Copied</> : <><Icon.share /> Share</>}
              </button>
            </div>
          </div>
          {blockedUrl && (
            <div className="link-fallback" role="status">
              <strong>This viewer blocks opening links directly.</strong>{" "}
              {linkCopied
                ? "The link is copied — paste it into a new browser tab."
                : "Copy it and paste into a new browser tab:"}
              <div className="link-fallback-row">
                <code>{blockedUrl}</code>
                <button className="btn-secondary" onClick={() => copyBlocked(blockedUrl)}>
                  {linkCopied ? <><Icon.check /> Copied</> : "Copy link"}
                </button>
              </div>
            </div>
          )}

          <p className="modal-hint">
            Sign-up opens {orgShort}&rsquo;s official registration page. Always confirm details there before you go.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAP VIEW — a real slippery map of the DMV with a pin per venue.
   ------------------------------------------------------------
   Uses Leaflet (bundled, no API key) with OpenStreetMap tiles.
   Leaflet isn't a React library, so we drive it imperatively
   through a ref inside useEffect: create the map once, then
   rebuild the markers whenever the filtered event list changes.
   Events at the same venue are grouped onto one pin whose detail
   popup lists them all.
   ============================================================ */
function MapView({ events, onOpen }) {
  const mapEl = useRef(null);   // the <div> the map mounts into
  const mapRef = useRef(null);  // the Leaflet map instance
  const layerRef = useRef(null); // layer group holding current markers
  const [ready, setReady] = useState(false);   // Leaflet loaded + map created
  const [mapFailed, setMapFailed] = useState(false);

  // Create the map once on mount — loading Leaflet on demand first.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // In the built site, Leaflet arrives here as its own lazy chunk the
      // first time the Map view opens. In the standalone preview window.L
      // is already set, so the import is skipped entirely.
      if (!window.L) {
        try {
          const mod = await import("leaflet");
          await import("leaflet/dist/leaflet.css");
          window.L = mod.default || mod;
        } catch {
          if (!cancelled) setMapFailed(true);
          return;
        }
      }
      if (cancelled || !mapEl.current || mapRef.current) return;
      const L = window.L;

      const map = L.map(mapEl.current, {
      center: [38.905, -76.98], // roughly central DMV / Anacostia
      zoom: 11,
      scrollWheelZoom: false,    // avoid hijacking page scroll; users can +/- or pinch
      zoomControl: true,
    });

    /* --------------------------------------------------------------
       BASEMAP PROVIDER CHAIN
       Different embedded viewers allow different tile servers, so we
       try the best-looking keyless providers in order and settle on
       the first one that actually loads:
         1. CARTO Voyager  — cleanest cartography, native retina tiles
         2. Esri World Topo — soft, terrain-shaded, very readable
         3. OpenStreetMap  — universal last resort
       Every non-retina provider uses detectRetina, which fetches
       finer-zoom tiles and renders them at higher density — that's
       what fixes the grainy look on modern screens.
       -------------------------------------------------------------- */
    const STREET_PROVIDERS = [
      {
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        options: {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        },
      },
      {
        // NOTE: Esri tile URLs use {z}/{y}/{x} order.
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        options: {
          attribution: "Tiles &copy; Esri — Esri, HERE, Garmin, OpenStreetMap contributors",
          maxZoom: 19,
          detectRetina: true,
        },
      },
      {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        options: {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          detectRetina: true,
        },
      },
    ];

    let streetLayer = null;
    // Try provider i; if several tiles fail before any succeeds, the server
    // is blocked/unreachable here — move on to the next provider.
    const tryProvider = (i) => {
      if (i >= STREET_PROVIDERS.length) return; // nothing left; keep last attempt
      const p = STREET_PROVIDERS[i];
      const layer = L.tileLayer(p.url, p.options);
      let loads = 0, fails = 0;
      layer.on("tileload", () => { loads++; });
      layer.on("tileerror", () => {
        fails++;
        if (fails >= 3 && loads === 0 && i + 1 < STREET_PROVIDERS.length) {
          map.removeLayer(layer);
          tryProvider(i + 1);
        }
      });
      layer.addTo(map);
      streetLayer = layer;
      map.__streetLayer = () => streetLayer;
    };
    tryProvider(0);

    /* --------------------------------------------------------------
       SATELLITE TOGGLE — real aerial imagery (Esri World Imagery,
       keyless). A small button on the map switches between the
       street basemap and satellite view. If the imagery server is
       blocked in this environment, the button reverts and labels
       itself unavailable instead of leaving a blank map.
       -------------------------------------------------------------- */
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Imagery &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
        maxZoom: 19,
      }
    );
    let satOn = false;
    let satFails = 0, satLoads = 0;
    const SatControl = L.Control.extend({
      options: { position: "topright" },
      onAdd() {
        const btn = L.DomUtil.create("button", "map-sat-toggle");
        btn.type = "button";
        btn.textContent = "Satellite";
        btn.setAttribute("aria-pressed", "false");
        L.DomEvent.disableClickPropagation(btn);
        btn.onclick = () => {
          satOn = !satOn;
          if (satOn) {
            if (streetLayer) map.removeLayer(streetLayer);
            satelliteLayer.addTo(map);
            btn.textContent = "Map";
          } else {
            map.removeLayer(satelliteLayer);
            if (streetLayer) streetLayer.addTo(map);
            btn.textContent = "Satellite";
          }
          btn.setAttribute("aria-pressed", String(satOn));
        };
        this._btn = btn;
        return btn;
      },
    });
    const satControl = new SatControl();
    satelliteLayer.on("tileload", () => { satLoads++; });
    satelliteLayer.on("tileerror", () => {
      satFails++;
      if (satFails >= 3 && satLoads === 0 && satOn) {
        // Imagery blocked here: revert to the street map, mark unavailable.
        satOn = false;
        map.removeLayer(satelliteLayer);
        if (streetLayer) streetLayer.addTo(map);
        const btn = satControl._btn;
        if (btn) {
          btn.textContent = "Satellite unavailable";
          btn.disabled = true;
        }
      }
    });
    satControl.addTo(map);

      // Enable wheel-zoom only after a click, so scrolling the page is smooth.
      map.on("click", () => map.scrollWheelZoom.enable());

      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Rebuild markers whenever the filtered events change (and once the map
  // has finished its on-demand load — that's what `ready` gates).
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;

    layer.clearLayers();

    // Group events by venue (lat,lng) so one pin can represent several.
    const byVenue = new Map();
    for (const ev of events) {
      const { lat, lng } = ev.location;
      if (typeof lat !== "number" || typeof lng !== "number") continue;
      const key = `${lat},${lng}`;
      if (!byVenue.has(key)) byVenue.set(key, { lat, lng, events: [] });
      byVenue.get(key).events.push(ev);
    }

    const bounds = [];
    for (const { lat, lng, events: venueEvents } of byVenue.values()) {
      bounds.push([lat, lng]);
      const primary = venueEvents[0];
      const color = TYPE_COLORS[primary.eventType] || "#6b7280";
      const count = venueEvents.length;

      // A custom teardrop pin (div icon) colored by event type. If a venue
      // has several events, show the count inside.
      const icon = L.divIcon({
        className: "map-pin-wrap",
        html: `<div class="map-pin" style="background:${color}"><span class="map-pin-num">${count > 1 ? count : ""}</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(layer);

      // Popup lists the events at this venue; clicking one opens the modal.
      const wrap = document.createElement("div");
      wrap.className = "map-popup";
      const loc = primary.location;
      wrap.innerHTML =
        `<div class="map-popup-venue">${loc.neighborhood}</div>` +
        `<div class="map-popup-addr">${loc.address}</div>`;
      const list = document.createElement("div");
      list.className = "map-popup-list";
      venueEvents
        .slice()
        .sort((a, b) => dateFromISO(a.date) - dateFromISO(b.date))
        .forEach((ev) => {
          const dp = dateParts(ev.date);
          const btn = document.createElement("button");
          btn.className = "map-popup-event";
          btn.innerHTML =
            `<span class="mpe-date" style="color:${TYPE_COLORS[ev.eventType] || "#6b7280"}">${dp.mon} ${dp.day}</span>` +
            `<span class="mpe-title">${ev.title}</span>`;
          btn.onclick = () => { onOpen(ev); map.closePopup(); };
          list.appendChild(btn);
        });
      wrap.appendChild(list);
      marker.bindPopup(wrap, { minWidth: 220, maxWidth: 280 });
    }

    // Fit the map to show all current pins (with a little padding).
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [events, onOpen, ready]);

  // The event types actually present in the current pins, for the legend.
  const typesShown = [...new Set(events.map((e) => e.eventType))];

  return (
    <div>
      <div className="map-wrap">
        <div ref={mapEl} className="map-canvas" aria-label="Map of event locations" />
        {!ready && !mapFailed && (
          <div className="map-empty"><span className="spinner" aria-hidden="true" /> Loading map…</div>
        )}
        {mapFailed && (
          <div className="map-empty">The map couldn&rsquo;t load here. The list and calendar views have all the same events.</div>
        )}
        {ready && events.length === 0 && (
          <div className="map-empty">No events match your filters.</div>
        )}
      </div>
      {typesShown.length > 0 && (
        <div className="map-legend">
          {typesShown.map((t) => (
            <span className="map-legend-item" key={t}>
              <span className="map-legend-dot" style={{ background: TYPE_COLORS[t] || "#6b7280" }} />
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUBMIT AN EVENT — a real form instead of a bare mailto link.
   ------------------------------------------------------------
   Validates the fields, then produces a structured "pending
   event" (matching the site's data schema, marked
   status: "pending-review") that the visitor sends by email or
   copies. Nothing goes live automatically: submissions land in
   the maintainer's inbox, get pasted into
   data/pending-events.json for review, and are only moved into
   events.json once the details check out. This site has no
   server by design, so email is the delivery channel — but the
   form does the structuring and validating a server would.
   ============================================================ */
function SubmitEventModal({ onClose }) {
  const [form, setForm] = useState({
    title: "", organization: "", date: "", startTime: "", endTime: "",
    neighborhood: "", address: "", eventType: "Other", signupUrl: "", description: "",
  });
  const [errors, setErrors] = useState({});
  const [submission, setSubmission] = useState(null); // the built JSON, post-validate
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const opener = document.activeElement;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, [onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Event name is required.";
    if (!form.organization.trim()) errs.organization = "Organization is required.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errs.date = "Use the date picker (YYYY-MM-DD).";
    if (!form.startTime.trim()) errs.startTime = "Start time is required.";
    if (!form.address.trim()) errs.address = "Address is required.";
    if (!/^https?:\/\//.test(form.signupUrl.trim())) errs.signupUrl = "Paste the full sign-up link (starting with http).";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const todayIso = new Date().toISOString().slice(0, 10);
    setSubmission({
      id: "pending-" + Date.now(),
      status: "pending-review",
      title: form.title.trim(),
      organization: form.organization.trim(),
      date: form.date,
      startTime: form.startTime.trim(),
      endTime: form.endTime.trim() || null,
      location: { neighborhood: form.neighborhood.trim() || form.address.split(",")[0].trim(), address: form.address.trim() },
      eventType: form.eventType,
      signupUrl: form.signupUrl.trim(),
      description: form.description.trim(),
      sourceUrl: form.signupUrl.trim(),
      submittedOn: todayIso,
      lastChecked: null,
      registrationStatus: "unknown",
      cost: "unknown",
      kidFriendly: null,
      metroAccessible: null,
      beginnerFriendly: null,
      virtualOrInPerson: "in-person",
      tags: [],
      organizerVerified: false,
    });
  };

  const submissionJson = submission ? JSON.stringify(submission, null, 2) : "";
  const mailtoHref = submission
    ? `mailto:${SUGGEST_EMAIL}?subject=${encodeURIComponent("Event submission: " + submission.title)}&body=${encodeURIComponent("New event submission for review:\n\n" + submissionJson + "\n")}`
    : "#";

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(submissionJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Submit an event">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><Icon.x /></button>
        <div className="modal-body">
          <h2>Submit an event</h2>

          {!submission ? (
            <>
              <p className="form-intro">
                Know a DC-area environmental event we&rsquo;re missing? Fill this
                in and it goes to the site maintainer for review — submissions
                are checked against the organizer&rsquo;s page before they&rsquo;re
                published.
              </p>
              <div className="form-grid">
                <label className="form-field">
                  <span>Event name *</span>
                  <input value={form.title} onChange={set("title")} />
                  {errors.title && <em className="form-error">{errors.title}</em>}
                </label>
                <label className="form-field">
                  <span>Organization *</span>
                  <input value={form.organization} onChange={set("organization")} />
                  {errors.organization && <em className="form-error">{errors.organization}</em>}
                </label>
                <div className="form-pair">
                  <label className="form-field">
                    <span>Date *</span>
                    <input type="date" value={form.date} onChange={set("date")} />
                    {errors.date && <em className="form-error">{errors.date}</em>}
                  </label>
                  <label className="form-field">
                    <span>Start time *</span>
                    <input placeholder="9:00 AM" value={form.startTime} onChange={set("startTime")} />
                    {errors.startTime && <em className="form-error">{errors.startTime}</em>}
                  </label>
                </div>
                <div className="form-pair">
                  <label className="form-field">
                    <span>End time</span>
                    <input placeholder="11:00 AM (if listed)" value={form.endTime} onChange={set("endTime")} />
                  </label>
                  <label className="form-field">
                    <span>Type</span>
                    <select value={form.eventType} onChange={set("eventType")}>
                      {EVENT_TYPES.filter((t) => t.label !== "All").map((t) => (
                        <option key={t.label} value={t.label}>{t.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="form-field">
                  <span>Address *</span>
                  <input placeholder="Park name, street, city, state" value={form.address} onChange={set("address")} />
                  {errors.address && <em className="form-error">{errors.address}</em>}
                </label>
                <label className="form-field">
                  <span>Neighborhood</span>
                  <input placeholder="e.g. Anacostia" value={form.neighborhood} onChange={set("neighborhood")} />
                </label>
                <label className="form-field">
                  <span>Sign-up link *</span>
                  <input placeholder="https://…" value={form.signupUrl} onChange={set("signupUrl")} />
                  {errors.signupUrl && <em className="form-error">{errors.signupUrl}</em>}
                </label>
                <label className="form-field">
                  <span>Short description</span>
                  <textarea rows={3} value={form.description} onChange={set("description")} />
                </label>
              </div>
              <div className="modal-actions">
                <button className="btn-primary" onClick={handleSubmit}>Review my submission</button>
              </div>
            </>
          ) : (
            <>
              <p className="form-intro">
                Here&rsquo;s your submission, formatted for review. Send it by
                email (opens your mail app, pre-filled) — or copy it if you&rsquo;d
                rather paste it somewhere else. It&rsquo;ll be checked against the
                organizer&rsquo;s page before publishing.
              </p>
              <pre className="submission-json">{submissionJson}</pre>
              <div className="modal-actions">
                <a className="btn-primary" href={mailtoHref}>Send by email <Icon.external /></a>
                <div className="btn-row">
                  <button className="btn-secondary" onClick={copyJson}>
                    {copied ? <><Icon.check /> Copied</> : <>Copy submission</>}
                  </button>
                  <button className="btn-secondary" onClick={() => setSubmission(null)}>Edit details</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CALENDAR VIEW — month grid
   ============================================================ */
function CalendarView({ events, onOpen }) {
  const startDate = events.length > 0 ? dateFromISO(events[0].date) : new Date();
  const [viewYear, setViewYear] = useState(startDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(startDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const eventsByDate = {};
  for (const ev of events) {
    (eventsByDate[ev.date] = eventsByDate[ev.date] || []).push(ev);
  }

  function changeMonth(delta) {
    setViewMonth((prev) => {
      const m = prev + delta;
      if (m < 0) { setViewYear((y) => y - 1); return 11; }
      if (m > 11) { setViewYear((y) => y + 1); return 0; }
      return m;
    });
    setSelectedDay(null);
  }

  // Jump the calendar back to the current month.
  function goToToday() {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setSelectedDay(null);
  }

  // Is the calendar currently showing a month other than the real one?
  const realNow = new Date();
  const notThisMonth = viewYear !== realNow.getFullYear() || viewMonth !== realNow.getMonth();

  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dayToStr = (day) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const selectedEvents = selectedDay ? eventsByDate[selectedDay] || [] : [];

  return (
    <div className="calendar">
      <div className="cal-head">
        <h2>{MONTHS_LONG[viewMonth]} <span className="cal-year">{viewYear}</span></h2>
        <div className="cal-nav">
          {notThisMonth && (
            <button className="cal-today" onClick={goToToday}>Today</button>
          )}
          <button onClick={() => changeMonth(-1)} aria-label="Previous month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button onClick={() => changeMonth(1)} aria-label="Next month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="cal-weekdays">
        {DOW_SHORT.map((wd) => (<div className="cal-weekday" key={wd}>{wd}</div>))}
      </div>

      <div className="cal-grid">
        {cells.map((day, i) => {
          if (day === null) return <div className="cal-cell empty" key={"b" + i} />;
          const dateStr = dayToStr(day);
          const dayEvents = eventsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          return (
            <div className={"cal-cell" + (isToday ? " today" : "")} key={dateStr}>
              <div className="cal-daynum">{day}</div>
              <div className="cal-events-wrap">
                {dayEvents.map((ev) => (
                  <button
                    className="cal-event"
                    key={ev.id}
                    style={{ background: TYPE_COLORS[ev.eventType] || "#6b7280" }}
                    title={ev.title}
                    onClick={() => { setSelectedDay(dateStr); onOpen(ev); }}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="cal-detail">
        {selectedDay && selectedEvents.length > 0 ? (
          <>
            <div className="cal-detail-head">{formatFullDate(selectedDay)}</div>
            <div className="event-list">
              {selectedEvents.map((ev) => (<EventCard event={ev} key={ev.id} onOpen={onOpen} />))}
            </div>
          </>
        ) : (
          <div className="cal-detail-empty">Select a highlighted day to see its events.</div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function App() {
  const [rawView, setView] = usePersistedState("dcge.view", "list");   // "list" | "calendar" | "map"
  const [rawType, setActiveType] = usePersistedState("dcge.type", "All");
  const [rawArea, setActiveArea] = usePersistedState("dcge.area", "All areas");
  // Guard against stale/invalid stored values (e.g. from an older version
  // of the site): anything unrecognized falls back to the default, so a
  // leftover value can never silently filter the list down to nothing.
  const view = ["list", "calendar", "map"].includes(rawView) ? rawView : "list";
  const activeType = EVENT_TYPES.some((t) => t.label === rawType) ? rawType : "All";
  const activeArea = AREAS.includes(rawArea) ? rawArea : "All areas";
  const [timeWindow, setTimeWindow] = useState("All dates"); // not persisted — time-relative
  const [search, setSearch] = useState("");
  const [openEvent, setOpenEvent] = useState(null); // event shown in modal
  const [submitOpen, setSubmitOpen] = useState(false); // "Submit an event" form

  // --- More filters ----------------------------------------------------
  const [moreOpen, setMoreOpen] = useState(false);
  const [flags, setFlags] = useState({
    free: false, kid: false, metro: false, beginner: false, regOpen: false,
  });
  const [timeOfDay, setTimeOfDay] = useState("Any");

  // --- Event data: fetched at runtime ----------------------------------
  // eventsData is null while loading. If the fetch fails (e.g. the
  // standalone preview opened from a file, where fetch is blocked), we
  // fall back to window.DCEVENTS when it's embedded in the page; only if
  // neither source works do we show the error state.
  const [eventsData, setEventsData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("data/events.json")
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((data) => { if (!cancelled) setEventsData(data); })
      .catch(() => {
        if (cancelled) return;
        if (Array.isArray(window.DCEVENTS)) setEventsData(window.DCEVENTS);
        else setLoadError(true);
      });
    return () => { cancelled = true; };
  }, []);

  // --- Duplicate detection (maintainer aid) -----------------------------
  // Flags likely duplicates (same title + date + time + address) in the
  // console so a copy-paste mistake in events.json gets noticed. The
  // validate script also fails the build on these; this catches the case
  // where the file is edited directly on the host without a build.
  useEffect(() => {
    if (!eventsData) return;
    const seen = new Map();
    for (const e of eventsData) {
      const key = [
        String(e.title).trim().toLowerCase(), e.date, e.startTime,
        String(e.location?.address || "").trim().toLowerCase(),
      ].join("|");
      if (seen.has(key)) {
        console.warn(`[DC Green Events] Possible duplicate event: "${e.title}" on ${e.date} (ids ${seen.get(key)} and ${e.id})`);
      } else seen.set(key, e.id);
    }
  }, [eventsData]);

  // --- Deep linking ---------------------------------------------------
  // On first load, if the URL is like ".../#event=12", open that event so
  // shared links land directly on it. Also respond to back/forward.
  useEffect(() => {
    if (!eventsData) return; // wait until events have loaded
    const openFromHash = () => {
      const m = /#event=(.+)$/.exec(window.location.hash);
      if (m) {
        const ev = eventsData.find((e) => String(e.id) === decodeURIComponent(m[1]));
        setOpenEvent(ev || null);
      } else {
        setOpenEvent(null);
      }
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [eventsData]);

  // Update the URL hash to reflect the open event, so links are shareable
  // and survive a refresh. Wrapped in try/catch because some embedded/
  // sandboxed contexts (e.g. preview iframes with an "about:srcdoc" origin)
  // block history.replaceState — in that case we fall back to setting the
  // hash directly, and if even that fails we just skip it. The app keeps
  // working either way; only the shareable-URL nicety is affected.
  const setHash = (hash) => {
    try {
      history.replaceState(null, "", hash || window.location.pathname + window.location.search);
    } catch {
      try { window.location.hash = hash ? hash.slice(1) : ""; } catch { /* ignore */ }
    }
  };

  // Open an event and reflect it in the URL.
  const openEventDeep = (ev) => {
    setOpenEvent(ev);
    if (ev) setHash(`#event=${encodeURIComponent(ev.id)}`);
  };
  // Close and clear the hash.
  const closeEvent = () => {
    setOpenEvent(null);
    setHash("");
  };

  // --- Loading / error states (all hooks are above this point) ----------
  if (loadError) {
    return (
      <div className="app-status" role="alert">
        <Icon.searchX />
        <strong>Couldn&rsquo;t load events</strong>
        <span>The event list didn&rsquo;t load. Check your connection and refresh the page.</span>
      </div>
    );
  }
  if (!eventsData) {
    return (
      <div className="app-status" aria-busy="true">
        <span className="spinner" aria-hidden="true" />
        <span>Loading events…</span>
      </div>
    );
  }

  // Today at midnight, for hiding past events.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // All upcoming events (past ones hidden) — used both to build the list and
  // to work out which area filters are worth showing.
  const upcoming = eventsData.filter((event) => dateFromISO(event.date) >= today);

  // Which areas actually have upcoming events? We only show area chips that
  // lead somewhere, so the filter never has dead options. "All areas" first.
  const areasWithEvents = AREAS.filter(
    (area) => area === "All areas" || upcoming.some((e) => areaForEvent(e) === area)
  );

  // How many upcoming events fall in each quick-filter window. Shown as a
  // live count on the chip — the buttons stay clickable even at zero (a
  // greyed-out button just reads as broken); clicking a zero window shows
  // a friendly empty state that points at the next event instead.
  const windowCounts = {};
  for (const w of TIME_WINDOWS) {
    windowCounts[w] = upcoming.filter((e) => isInTimeWindow(e.date, w)).length;
  }

  const visibleEvents = upcoming
    // Time-window quick filter ("All dates" shows everything).
    .filter((event) => isInTimeWindow(event.date, timeWindow))
    // Area filter ("All areas" shows everything).
    .filter((event) => activeArea === "All areas" || areaForEvent(event) === activeArea)
    // Type filter ("All" shows everything).
    .filter((event) => activeType === "All" || event.eventType === activeType)
    // Search across title, org, type, location, and description.
    .filter((event) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        event.title + " " + event.organization + " " + event.eventType + " " +
        event.location.neighborhood + " " + event.location.address + " " +
        event.description
      ).toLowerCase().includes(q);
    })
    // "More filters": each flag only matches events where the fact is
    // CONFIRMED (true / "free" / "open") — unknowns never match, so the
    // filters can't overstate what we know.
    .filter((ev) => !flags.free || ev.cost === "free")
    .filter((ev) => !flags.kid || ev.kidFriendly === true)
    .filter((ev) => !flags.metro || ev.metroAccessible === true)
    .filter((ev) => !flags.beginner || ev.beginnerFriendly === true)
    .filter((ev) => !flags.regOpen || ev.registrationStatus === "open")
    .filter((ev) => timeOfDay === "Any" || timeOfDayFor(ev) === timeOfDay)
    // Soonest first.
    .sort((a, b) => dateFromISO(a.date) - dateFromISO(b.date));

  // Group the sorted events by month, preserving order, for the list view.
  const groupedByMonth = [];
  for (const ev of visibleEvents) {
    const key = monthKey(ev.date);
    const last = groupedByMonth[groupedByMonth.length - 1];
    if (last && last.key === key) last.events.push(ev);
    else groupedByMonth.push({ key, events: [ev] });
  }

  const activeFlagCount =
    Object.values(flags).filter(Boolean).length + (timeOfDay !== "Any" ? 1 : 0);
  const hasFilters =
    activeType !== "All" || activeArea !== "All areas" ||
    timeWindow !== "All dates" || search.trim() !== "" || activeFlagCount > 0;
  const resetFilters = () => {
    setActiveType("All"); setActiveArea("All areas");
    setTimeWindow("All dates"); setSearch("");
    setFlags({ free: false, kid: false, metro: false, beginner: false, regOpen: false });
    setTimeOfDay("Any");
  };

  // The single soonest upcoming event overall (ignores active filters), for
  // the "Next up" pill in the header.
  const nextEvent = [...upcoming].sort((a, b) => dateFromISO(a.date) - dateFromISO(b.date))[0] || null;

  // Unique list of organizations, for the About section ("Casey Trees,
  // the Anacostia Watershed Society, and Potomac Conservancy").
  const orgNames = [...new Set(eventsData.map((e) => e.organization))];
  // Unique venues (by coordinates) for the hero stats row. Only events
  // with real coordinates count — virtual or location-TBA events would
  // otherwise register as a phantom "undefined" venue.
  const venueCount = new Set(
    eventsData
      .filter((e) => typeof e.location.lat === "number" && typeof e.location.lng === "number")
      .map((e) => `${e.location.lat},${e.location.lng}`)
  ).size;
  const orgList =
    orgNames.length <= 1
      ? orgNames[0] || ""
      : orgNames.slice(0, -1).join(", ") + ", and " + orgNames[orgNames.length - 1];

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to events</a>
      {/* ---------- Hero ---------- */}
      <header className="site-header">
        <div className="container">
          <div className="brand-row">
            <span className="brand-mark"><Icon.leaf /></span>
            <span className="brand-name">DC Green Events</span>
          </div>
          <h1>Volunteer for a <em className="hero-accent">greener</em> DC</h1>
          <p>
            River cleanups, tree plantings, nature tours, and advocacy across
            the DC area — real events from local organizations, gathered in
            one place.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">{upcoming.length}</span>
              <span className="stat-label">upcoming events</span>
            </div>
            <div className="stat">
              <span className="stat-num">{orgNames.length}</span>
              <span className="stat-label">organizations</span>
            </div>
            <div className="stat">
              <span className="stat-num">{venueCount}</span>
              <span className="stat-label">locations</span>
            </div>
          </div>
          {nextEvent && (
            <button
              className="next-up"
              onClick={() => openEventDeep(nextEvent)}
            >
              <span className="next-up-dot" />
              Next up: <strong>{relativeWhen(nextEvent.date).label.toLowerCase()}</strong>
              <span className="next-up-sep">·</span>
              {nextEvent.title}
              <Icon.arrow />
            </button>
          )}
        </div>
        <HeroArt />
      </header>

      {/* ---------- Sticky toolbar ---------- */}
      <div className="toolbar">
        <div className="container">
          <div className="search-wrap">
            <Icon.search />
            <input
              className="search-box"
              type="text"
              placeholder="Search events, organizations, or neighborhoods…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search events"
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                <Icon.x />
              </button>
            )}
          </div>

          {/* Quick time-window filters — the most common "when" intents */}
          <div className="quick-row">
            {TIME_WINDOWS.filter((w) => w !== "All dates").map((w) => {
              const active = timeWindow === w;
              return (
                <button
                  key={w}
                  className={"quick-btn" + (active ? " active" : "")}
                  aria-pressed={active}
                  onClick={() => setTimeWindow(active ? "All dates" : w)}
                >
                  <Icon.bolt /> {w}
                  <span className="quick-n">{windowCounts[w]}</span>
                </button>
              );
            })}
            {hasFilters && (
              <button className="quick-clear" onClick={resetFilters}>
                <Icon.x /> Clear filters
              </button>
            )}
          </div>

          <div className="filter-row">
            <div className="type-filters">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.label}
                  className={"type-btn" + (activeType === type.label ? " active" : "")}
                  aria-pressed={activeType === type.label}
                  onClick={() => setActiveType(type.label)}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="view-switch">
              <button
                className={view === "list" ? "active" : ""}
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
                aria-label="List view"
              >
                <Icon.list /> <span className="switch-label">List</span>
              </button>
              <button
                className={view === "calendar" ? "active" : ""}
                aria-pressed={view === "calendar"}
                onClick={() => setView("calendar")}
                aria-label="Calendar view"
              >
                <Icon.grid /> <span className="switch-label">Calendar</span>
              </button>
              <button
                className={view === "map" ? "active" : ""}
                aria-pressed={view === "map"}
                onClick={() => setView("map")}
                aria-label="Map view"
              >
                <Icon.map /> <span className="switch-label">Map</span>
              </button>
            </div>
          </div>

          {/* Area / "near me" filter — only shown if events span 2+ areas */}
          {areasWithEvents.length > 2 && (
            <div className="area-row">
              <span className="area-label"><Icon.pin /> Area</span>
              <div className="area-filters">
                {areasWithEvents.map((area) => (
                  <button
                    key={area}
                    className={"area-btn" + (activeArea === area ? " active" : "")}
                    aria-pressed={activeArea === area}
                    onClick={() => setActiveArea(area)}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* More filters: confirmed-fact toggles + time of day */}
          <div className="more-row">
            <button
              className={"more-toggle" + (moreOpen ? " open" : "")}
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
            >
              More filters
              {activeFlagCount > 0 && <span className="more-count">{activeFlagCount}</span>}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {moreOpen && (
              <div className="more-panel">
                <div className="more-group">
                  {[
                    ["free", "Free"],
                    ["regOpen", "Registration open"],
                    ["kid", "Kid-friendly"],
                    ["metro", "Metro-accessible"],
                    ["beginner", "Beginner-friendly"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      className={"flag-btn" + (flags[key] ? " active" : "")}
                      aria-pressed={flags[key]}
                      onClick={() => setFlags((f) => ({ ...f, [key]: !f[key] }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="more-group">
                  <span className="more-label">Starts</span>
                  {["Any", "Morning", "Afternoon", "Evening"].map((t) => (
                    <button
                      key={t}
                      className={"flag-btn" + (timeOfDay === t ? " active" : "")}
                      aria-pressed={timeOfDay === t}
                      onClick={() => setTimeOfDay(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="more-note">
                  Kid-friendly, metro, and beginner details are shown only when
                  confirmed from the organizer&rsquo;s listing, so these filters
                  match confirmed events only.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Main ---------- */}
      <main className="container" id="main-content">
        <p className="result-count" aria-live="polite">
          <strong>{visibleEvents.length}</strong>{" "}
          upcoming {visibleEvents.length === 1 ? "event" : "events"}
          {timeWindow !== "All dates" ? ` · ${timeWindow.toLowerCase()}` : ""}
          {activeType !== "All" ? ` · ${activeType}` : ""}
          {activeArea !== "All areas" ? ` · ${activeArea}` : ""}
          {search.trim() ? ` · “${search.trim()}”` : ""}
        </p>

        {view === "list" ? (
          visibleEvents.length > 0 ? (
            groupedByMonth.map((group) => (
              <section className="month-group" key={group.key}>
                <h2 className="month-heading">
                  {group.key}
                  <span className="month-count">{group.events.length}</span>
                </h2>
                <div className="event-list">
                  {group.events.map((event) => (
                    <EventCard event={event} key={event.id} onOpen={openEventDeep} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="empty-state">
              <Icon.searchX />
              <strong>No events found</strong>
              <span>
                {timeWindow !== "All dates" && nextEvent
                  ? `Nothing ${timeWindow.toLowerCase()} yet — the next event is ${formatFullDate(nextEvent.date)}.`
                  : "Nothing matches your current search and filters."}
              </span>
              <br />
              <button className="empty-reset" onClick={resetFilters}>Clear all filters</button>
            </div>
          )
        ) : view === "calendar" ? (
          <CalendarView events={visibleEvents} onOpen={openEventDeep} />
        ) : (
          <MapView events={visibleEvents} onOpen={openEventDeep} />
        )}
      </main>

      {/* ---------- About + Footer ---------- */}
      <footer className="site-footer">
        <div className="footer-inner">
          <section className="about">
            <h2>About this directory</h2>
            <p>
              DC Green Events is a community-maintained list of environmental
              volunteer opportunities across the Washington, DC area — river and
              park cleanups, tree plantings, guided nature tours, and advocacy.
              Events are gathered by hand from local organizations including{" "}
              {orgList}, so you can find your next event in one place instead of
              checking each group&rsquo;s site.
            </p>
            <p className="about-disclaimer">
              This is an independent directory, not affiliated with the
              organizations listed. Spots, times, and locations can change —
              always confirm details on the organizer&rsquo;s page before you go.
            </p>
          </section>

          <div className="footer-bar">
            <div className="footer-suggest">
              Know an event we&rsquo;re missing?{" "}
              <button className="footer-link-btn" onClick={() => setSubmitOpen(true)}>Submit an event</button>
              <span className="footer-dot">·</span>
              <a
                className="footer-link-btn"
                href="calendar.ics"
                title="Subscribe from Google Calendar, Apple Calendar, or Outlook (on the live site)"
              >
                Subscribe to the calendar
              </a>
            </div>
            <div className="footer-updated">
              <span className="dot-sep">Updated {formatUpdated(LAST_UPDATED)}</span>
              <span className="dot-sep">{eventsData.length} events tracked</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ---------- Modal ---------- */}
      {openEvent && <EventModal event={openEvent} onClose={closeEvent} />}
      {submitOpen && <SubmitEventModal onClose={() => setSubmitOpen(false)} />}
    </>
  );
}
