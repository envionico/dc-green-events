/* ============================================================
   import-ics.mjs — structured-feed importer (the safe automation)
   ------------------------------------------------------------
   Reads an iCalendar (.ics) feed — the one format organizers
   publish that is STRUCTURED and stable, unlike scraped HTML —
   and turns its events into pending-review candidates in
   public/data/pending-events.json. Nothing goes live: you still
   review each candidate (check the organizer, the link, add
   coordinates) and promote it into events.json yourself.

   Automatically skips events in the past and anything already in
   events.json or the pending queue (same title + date + time).

   Usage:
     node scripts/import-ics.mjs --url  https://…?format=ical --write
     node scripts/import-ics.mjs --file some-feed.ics        (dry run)
   Flags:
     --write        actually save candidates (default: dry-run)
     --org "Name"   default organizer label for candidates
   ============================================================ */
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const getFlag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const url = getFlag("--url");
const file = getFlag("--file");
const write = args.includes("--write");
const defaultOrg = getFlag("--org") || "Unknown — set during review";

if (!url && !file) {
  console.error('Usage: node scripts/import-ics.mjs (--url <ics-url> | --file <path>) [--write] [--org "Name"]');
  process.exit(1);
}

let raw;
if (file) raw = readFileSync(file, "utf8");
else {
  const res = await fetch(url, { headers: { "User-Agent": "dc-green-events-ics-import" }, redirect: "follow" });
  if (!res.ok) { console.error(`✗ fetch failed: HTTP ${res.status}`); process.exit(1); }
  raw = await res.text();
}
if (!raw.includes("BEGIN:VCALENDAR")) {
  console.error("✗ that response isn't an iCalendar feed (no BEGIN:VCALENDAR). If this was a ?format=ical URL, the site may not expose a feed.");
  process.exit(1);
}

const unfolded = raw.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
const blocks = unfolded.split("BEGIN:VEVENT").slice(1).map((b) => b.split("END:VEVENT")[0]);

const unesc = (s) => String(s || "").replace(/\\n/g, "\n").replace(/\\([,;\\])/g, "$1").trim();
const field = (block, name) => {
  const m = new RegExp(`^${name}[^:\\n]*:(.*)$`, "mi").exec(block);
  return m ? unesc(m[1]) : "";
};

function toDateTime(v) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(v.trim());
  if (!m) return null;
  const [, y, mo, d, h = "00", mi = "00", , z] = m;
  return z
    ? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi))
    : new Date(+y, +mo - 1, +d, +h, +mi);
}
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
const clock = (dt) => {
  let h = dt.getHours();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${pad(dt.getMinutes())} ${ap}`;
};

const live = JSON.parse(readFileSync("public/data/events.json", "utf8"));
let pending = [];
try { pending = JSON.parse(readFileSync("public/data/pending-events.json", "utf8")); } catch { /* fresh queue */ }
const key = (t, d, s) => [String(t).trim().toLowerCase(), d, s].join("|");
const seen = new Set([
  ...live.map((e) => key(e.title, e.date, e.startTime)),
  ...pending.map((e) => key(e.title, e.date, e.startTime)),
]);

const today = new Date(); today.setHours(0, 0, 0, 0);
const todayIso = new Date().toISOString().slice(0, 10);

let added = 0, dupes = 0, past = 0, skipped = 0;
for (const block of blocks) {
  const title = field(block, "SUMMARY");
  const start = toDateTime(field(block, "DTSTART"));
  if (!title || !start) { skipped++; continue; }
  if (start < today) { past++; continue; }

  const date = isoDate(start);
  const startTime = clock(start);
  if (seen.has(key(title, date, startTime))) { dupes++; continue; }

  const end = toDateTime(field(block, "DTEND"));
  const location = field(block, "LOCATION");
  const link = field(block, "URL");

  pending.push({
    id: "pending-ics-" + Math.random().toString(36).slice(2, 8),
    status: "pending-review",
    importedFrom: url || file,
    submittedOn: todayIso,
    title,
    organization: defaultOrg,
    date,
    startTime,
    endTime: end && end > start ? clock(end) : null,
    location: {
      neighborhood: location ? location.split(/[,—–-]/)[0].trim() : "",
      address: location || "",
    },
    eventType: "Other",
    signupUrl: link || url || "",
    description: field(block, "DESCRIPTION").slice(0, 600),
    sourceUrl: url || "",
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
  seen.add(key(title, date, startTime));
  added++;
  console.log(`  + candidate: ${date} ${startTime} — ${title}`);
}

console.log(`\n${added} new candidate(s) · ${dupes} already tracked · ${past} past · ${skipped} unparseable`);
if (write && added > 0) {
  writeFileSync("public/data/pending-events.json", JSON.stringify(pending, null, 2) + "\n");
  console.log("✓ written to public/data/pending-events.json — review before promoting to events.json");
} else if (!write) {
  console.log("(dry run — add --write to save candidates)");
}
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(process.env.GITHUB_OUTPUT, `candidates=${added}\n`, { flag: "a" });
}
