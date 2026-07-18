/* ============================================================
   check-sources.mjs — the "did anything change?" robot
   ------------------------------------------------------------
   Fetches every organizer's events page, fingerprints the
   content, and compares against the last run — so instead of
   manually re-reading seven pages every few weeks, you get a
   report of exactly which ones changed (and which NEW dates
   appeared on them). It deliberately does NOT try to parse
   whole events out of arbitrary HTML: that breaks silently when
   sites redesign. Detection is robust; verification stays human.

   Usage:
     node scripts/check-sources.mjs            report changes
     node scripts/check-sources.mjs --update   accept current
                                               state as baseline
   Prints CHANGES=true/false (and writes it to GITHUB_OUTPUT
   when run inside GitHub Actions).
   ============================================================ */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const SOURCES = [
  { name: "Casey Trees", url: "https://caseytrees.org/get-involved/volunteer-events/" },
  { name: "Anacostia Watershed Society", url: "https://www.anacostiaws.org/events/" },
  { name: "Potomac Conservancy", url: "https://potomac.org/events" },
  { name: "Kingman Island calendar", url: "https://www.kingmanisland.com/calendar" },
  { name: "Anacostia Riverkeeper", url: "https://www.anacostiariverkeeper.org/events-calendar/" },
  { name: "Rock Creek Conservancy", url: "https://www.rockcreekconservancy.org/calendar" },
  { name: "DOEE (DC gov)", url: "https://doee.dc.gov/events" },
];

const CACHE_PATH = "scripts/source-cache.json";
const update = process.argv.includes("--update");
const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, "utf8")) : {};

function normalize(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function extractDates(text) {
  const re = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,?\s*\d{4})?\b|\b\d{4}-\d{2}-\d{2}\b/gi;
  return [...new Set((text.match(re) || []).map((d) => d.replace(/\s+/g, " ").trim()))];
}

let anyChanged = false;
const today = new Date().toISOString().slice(0, 10);

for (const { name, url } of SOURCES) {
  let text;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "dc-green-events-source-check (community events directory)" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    text = normalize(await res.text());
  } catch (err) {
    console.log(`⚠ ERROR      ${name} — couldn't fetch (${err.message}); check it by hand: ${url}`);
    continue;
  }

  const hash = createHash("sha256").update(text).digest("hex");
  const dates = extractDates(text);
  const prev = cache[url];

  if (!prev) {
    console.log(`● BASELINE   ${name} — first check recorded (${dates.length} date mentions)`);
    cache[url] = { hash, dates, checked: today };
    anyChanged = true;
  } else if (prev.hash !== hash) {
    const newDates = dates.filter((d) => !prev.dates.includes(d));
    anyChanged = true;
    console.log(`★ CHANGED    ${name} (last seen ${prev.checked})`);
    if (newDates.length) console.log(`             new date mentions: ${newDates.slice(0, 12).join(" · ")}`);
    console.log(`             review: ${url}`);
    if (update) cache[url] = { hash, dates, checked: today };
  } else {
    console.log(`  unchanged  ${name} (since ${prev.checked})`);
    if (update) cache[url].checked = today;
  }
}

if (update) {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
  console.log(`\n✓ baseline updated (${CACHE_PATH})`);
}

console.log(`\nCHANGES=${anyChanged}`);
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(process.env.GITHUB_OUTPUT, `changes=${anyChanged}\n`, { flag: "a" });
}
