/* ============================================================
   build-seo.mjs
   ------------------------------------------------------------
   Makes the site findable and shareable. Runs automatically
   before every build and:

   1. Injects schema.org Event structured data (JSON-LD) for every
      event into index.html — this is what makes the site eligible
      for Google's event rich results in search. Works immediately,
      no configuration needed.

   2. Once you've deployed and set "siteUrl" in site.config.json
      (e.g. "https://dcgreenevents.netlify.app"), it ALSO adds:
        • a canonical URL tag
        • og:url / og:image / twitter:image tags pointing at the
          bundled social-card.png (so shared links show a preview)
        • public/sitemap.xml, and a Sitemap line in robots.txt
      Until then those parts are skipped — absolute URLs can't be
      guessed, and wrong ones are worse than none.

   Everything is written between the <!--SEO:START/END--> markers
   in index.html, so re-running is always safe.
   ============================================================ */
import { readFileSync, writeFileSync } from "node:fs";

const events = JSON.parse(readFileSync("public/data/events.json", "utf8"));
let siteUrl = "";
try {
  siteUrl = (JSON.parse(readFileSync("site.config.json", "utf8")).siteUrl || "").replace(/\/+$/, "");
} catch { /* no config — structured data still works */ }

function parseStartTime(s) {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(s || "");
  if (!m) return { h: 9, m: 0 };
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  return { h, m: min };
}
const pad = (n) => String(n).padStart(2, "0");
const isoTime = (t) => { const { h, m } = parseStartTime(t); return `T${pad(h)}:${pad(m)}:00`; };

// --- schema.org Event list -------------------------------------------------
const items = events.map((e, i) => {
  const ev = {
    "@type": "Event",
    name: e.title,
    startDate: e.date + isoTime(e.startTime),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: e.location.neighborhood,
      address: e.location.address,
    },
    organizer: { "@type": "Organization", name: e.organization, url: e.sourceUrl || e.signupUrl },
    description: e.description,
    url: e.signupUrl,
  };
  if (e.endTime) ev.endDate = e.date + isoTime(e.endTime);
  if (e.cost === "free") {
    ev.isAccessibleForFree = true;
    ev.offers = { "@type": "Offer", price: "0", priceCurrency: "USD", url: e.signupUrl, availability: "https://schema.org/InStock" };
  }
  if (siteUrl) ev.image = `${siteUrl}/social-card.png`;
  return { "@type": "ListItem", position: i + 1, item: ev };
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "DC Green Events — environmental volunteer events in Washington, DC",
  numberOfItems: events.length,
  itemListElement: items,
};

// --- Assemble the injected block --------------------------------------------
const lines = [
  `<script type="application/ld+json">`,
  JSON.stringify(jsonLd),
  `</script>`,
];
if (siteUrl) {
  lines.push(
    `<link rel="canonical" href="${siteUrl}/" />`,
    `<meta property="og:url" content="${siteUrl}/" />`,
    `<meta property="og:image" content="${siteUrl}/social-card.png" />`,
    `<meta name="twitter:image" content="${siteUrl}/social-card.png" />`
  );
}
const block = lines.map((l) => "    " + l).join("\n");

let html = readFileSync("index.html", "utf8");
const re = /(<!--SEO:START-->)[\s\S]*?(<!--SEO:END-->)/;
if (!re.test(html)) {
  console.error("✗ SEO markers not found in index.html");
  process.exit(1);
}
html = html.replace(re, `$1\n${block}\n    $2`);
writeFileSync("index.html", html);

// --- robots.txt + sitemap.xml ------------------------------------------------
let robots = "User-agent: *\nAllow: /\n";
if (siteUrl) {
  robots += `Sitemap: ${siteUrl}/sitemap.xml\n`;
  const today = new Date().toISOString().slice(0, 10);
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url><loc>${siteUrl}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq></url>\n` +
    `</urlset>\n`;
  writeFileSync("public/sitemap.xml", sitemap);
}
writeFileSync("public/robots.txt", robots);

console.log(
  `✓ SEO: structured data for ${events.length} events injected` +
  (siteUrl ? `; canonical/social tags + sitemap for ${siteUrl}` : " (set siteUrl in site.config.json after deploying to add canonical/social tags + sitemap)")
);
