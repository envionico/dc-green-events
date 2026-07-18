/* ============================================================
   validate-events.mjs
   ------------------------------------------------------------
   Runs automatically before every build (`npm run build`) and
   checks public/data/events.json for the mistakes that are easy
   to make when editing by hand:
     • missing required fields
     • malformed dates or sign-up links
     • unknown event types
     • duplicate ids
     • duplicate events (same title + date + time + address)
   If anything is wrong, the build STOPS with a clear message —
   so a broken list can never quietly go live.
   Run it on its own any time with:  npm run validate
   ============================================================ */
import { readFileSync } from "node:fs";

const VALID_TYPES = [
  "Tree Planting", "River/Stream Cleanup", "Park Cleanup",
  "Advocacy", "Education", "Other",
];

let events;
try {
  events = JSON.parse(readFileSync("public/data/events.json", "utf8"));
} catch (err) {
  console.error("✗ public/data/events.json is not valid JSON:", err.message);
  process.exit(1);
}

const errors = [];
const ids = new Map();
const dupeKeys = new Map();

events.forEach((e, i) => {
  const where = `event #${i + 1}${e.id ? ` (id ${e.id})` : ""}${e.title ? ` "${e.title}"` : ""}`;

  if (!e.id && e.id !== 0) errors.push(`${where}: missing id`);
  else if (ids.has(String(e.id))) errors.push(`${where}: duplicate id (also used by "${ids.get(String(e.id))}")`);
  else ids.set(String(e.id), e.title || "untitled");

  if (!e.title || !String(e.title).trim()) errors.push(`${where}: missing title`);
  if (!e.organization) errors.push(`${where}: missing organization`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || "")) errors.push(`${where}: date must be YYYY-MM-DD (got "${e.date}")`);
  if (!e.startTime) errors.push(`${where}: missing startTime`);
  if (!e.location || !e.location.address) errors.push(`${where}: missing location.address`);
  if (!/^https?:\/\//.test(e.signupUrl || "")) errors.push(`${where}: signupUrl must start with http(s) (got "${e.signupUrl}")`);
  if (!VALID_TYPES.includes(e.eventType)) errors.push(`${where}: eventType "${e.eventType}" is not one of: ${VALID_TYPES.join(", ")}`);

  // Duplicate detection: same title + date + time + address
  const key = [
    String(e.title || "").trim().toLowerCase(),
    e.date,
    e.startTime,
    String(e.location?.address || "").trim().toLowerCase(),
  ].join("|");
  if (dupeKeys.has(key)) {
    errors.push(`${where}: DUPLICATE of id ${dupeKeys.get(key)} — same title, date, time, and address`);
  } else {
    dupeKeys.set(key, e.id);
  }
});

if (errors.length > 0) {
  console.error(`✗ events.json has ${errors.length} problem(s):\n`);
  errors.forEach((msg) => console.error("  • " + msg));
  console.error("\nFix the issues above in public/data/events.json and build again.");
  process.exit(1);
}

console.log(`✓ events.json valid — ${events.length} events, no duplicates`);
