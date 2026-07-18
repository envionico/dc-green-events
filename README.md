# 🌳 DC Green Events

A single-page website that gathers environmental volunteer and cleanup events
around Washington, DC into one clean, filterable directory. No backend, no
database, no accounts — all event data lives in one file you edit by hand.

**Features:**
- **List, month-calendar, and map views** — toggle at the top, and your choice
  is remembered next time you visit.
- **Quick filters** for "This weekend" and "This week" — the most common way
  people look for something to do.
- A real, pannable **map of the DMV** (Leaflet + OpenStreetMap, no API key)
  with a color-coded pin at each venue; click a pin to see that spot's events
  and open the details.
- **Events grouped by month**, each labeled with how soon it is ("Tomorrow",
  "This weekend", "In 2 weeks") so the next thing to do is obvious at a glance.
- A **"Next up" pointer** in the header jumps straight to the soonest event.
- **Search** by event, organization, or neighborhood; **filter by type**; and
  **filter by area** (NW / NE / SE-SW DC / Maryland), worked out automatically
  from each event's address. Your filters are remembered between visits too.
- The **calendar** highlights today and has a one-tap "Today" jump.
- **Past events hide automatically**, so the list never looks stale.
- Click any event for a detail panel with **Sign up** (opens the organizer's
  page), **Get directions** (Google Maps), **Add to Google Calendar**, **download
  .ics** (Apple/Outlook), and **Share** (a link straight to that event).
- **Shareable links** — every event has its own URL, so a shared link opens
  right on that event.
- Fully **responsive** and keyboard-accessible.

Built with **React + Vite**. Plain CSS. Deploys free.

---

## What's in here

```
dc-green-events/
├── index.html          ← page shell + font/PWA links (rarely touched)
├── package.json        ← project info + scripts
├── vite.config.js      ← build config (one setting matters for GitHub Pages)
├── public/             ← files served as-is (the "app" pieces)
│   ├── manifest.webmanifest  ← app name, colors, icons (for installing)
│   ├── sw.js                 ← offline support (bump CACHE_VERSION on redeploy)
│   └── icons/                ← home-screen app icons
├── scripts/
│   ├── validate-events.mjs   ← checks events.json before every build (dupes, typos)
│   └── build-ics.mjs         ← regenerates the subscribable calendar feed
└── src/
    ├── main.jsx        ← starts the app + registers offline support (don't touch)
    ├── App.jsx         ← all the page logic + layout: list, calendar, map (well-commented)
    └── index.css       ← all the styling + color theme

public/data/events.json         ← ⭐ YOUR EVENTS LIVE HERE — this is what you edit
public/data/pending-events.json ← submissions waiting for your review
public/calendar.ics             ← auto-generated feed (don't edit by hand)
```

---

## 1) Run it on your own computer

You don't need to know how to code, just follow these in order.

### Step 1 — Install Node.js (only needed once, ever)
Node is the engine that runs the project.

1. Go to **https://nodejs.org**
2. Download the big green **"LTS"** button and install it (click through the
   installer with all the default options).
3. To confirm it worked: open your **Terminal** (Mac: press Cmd+Space, type
   "Terminal", Enter) or **Command Prompt** (Windows: press the Start key, type
   "cmd", Enter), then type this and press Enter:
   ```
   node -v
   ```
   If you see a version number like `v22.x.x`, you're good.

### Step 2 — Open the project folder in the terminal
In the same terminal window, type `cd ` (c, d, then a space) and then drag the
project folder into the terminal window and press Enter. That moves you "into"
the folder. For example it might look like:
```
cd Desktop/dc-green-events
```

### Step 3 — Install the project's pieces (only needed once)
Type this and press Enter, then wait a minute while it downloads:
```
npm install
```

### Step 4 — Start the site
```
npm run dev
```
You'll see a line like `Local: http://localhost:5173/`.
**Hold Cmd (Mac) or Ctrl (Windows) and click that link**, or copy it into your
browser. The site is now running on your computer. 🎉

While it's running, any change you save to `events.json` shows up instantly in
the browser. To stop the site, click the terminal and press **Ctrl + C**.

---

## 2) Put it online for free (get a public link)

The easiest free option is **Netlify**. No command-line needed.

### The one-time prep
1. Make a free account at **https://github.com** (this stores your code).
2. Put this project on GitHub. The simplest way:
   - On github.com click the **+** (top right) → **New repository**.
   - Name it `dc-green-events`, leave everything else default, click
     **Create repository**.
   - On the new page, click **"uploading an existing file"**, then drag in ALL
     the files and folders from this project (everything except the
     `node_modules` folder — you don't need to upload that). Click
     **Commit changes**.

### Deploy with Netlify
1. Make a free account at **https://netlify.com** (choose "Sign up with GitHub").
2. Click **Add new site → Import an existing project → GitHub**.
3. Pick your `dc-green-events` repository.
4. Netlify auto-detects Vite. Confirm these settings (they're usually filled in
   for you):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy**. After about a minute you'll get a public URL like
   `https://your-site-name.netlify.app`. That's your live website. Share it!

**Updating the live site later:** whenever you change `events.json` on GitHub
(edit it right in the browser on github.com and click "Commit changes"),
Netlify automatically rebuilds and updates your live site within a minute.

> **Vercel** works the same way (sign up at vercel.com with GitHub, import the
> repo, click Deploy) if you prefer it.

> **GitHub Pages** also works but needs one extra step: open `vite.config.js`
> and change the line `base: "/",` to `base: "/dc-green-events/",` (use your
> repo's exact name). Then in your GitHub repo go to **Settings → Pages** and
> set the source to **GitHub Actions → Vite**.

---

## 3) ⭐ How to add or change real events

This is the only file you'll normally touch: **`public/data/events.json`**.

It's a list of events between square brackets `[ ]`. Each event is a block
inside curly braces `{ }`. To add a new event, copy an existing block, paste it,
and change the values. **Keep the commas between blocks.**

Here is one event — copy this whole block and edit it:

```json
{
  "id": "9",
  "title": "Your Event Name Here",
  "organization": "Hosting Organization",
  "date": "2026-11-07",
  "startTime": "10:00 AM",
  "location": {
    "neighborhood": "Petworth",
    "address": "123 Example Ave NW, Washington, DC 20011"
  },
  "eventType": "Park Cleanup",
  "signupUrl": "https://example.org/signup",
  "description": "One or two sentences describing the event."
}
```

Rules to avoid breakage:
- **`id`** must be different for every event (just use the next number).
- **`date`** must be in `YYYY-MM-DD` format (year-month-day). Events with a date
  in the past are hidden automatically.
- **`eventType`** must be **exactly** one of these (it controls the colored tag):
  `"Tree Planting"`, `"River/Stream Cleanup"`, `"Park Cleanup"`,
  `"Advocacy"`, `"Education"`, `"Other"`.
- Keep all the quotation marks and the commas between events.
- Tip: paste your finished file into **https://jsonlint.com** to check for typos
  before publishing — it'll point to any missing comma or quote.

To change the site's title or description, open `src/App.jsx` and look for the
`<header>` section near the top (it's labeled with a comment).

To change colors, open `src/index.css` — every color is defined at the very top
under `:root` with a plain-English name.

---

## The safety net: validation, duplicates, and the calendar feed

Every `npm run build` now automatically:
1. **Validates `public/data/events.json`** — missing fields, bad dates, broken
   sign-up links, duplicate ids, and *duplicate events* (same title + date +
   time + address) all **stop the build with a clear message**, so a mistake
   can't quietly go live. Run it alone anytime: `npm run validate`.
2. **Regenerates `public/calendar.ics`** — a feed of every event that visitors
   can subscribe to from Google Calendar, Apple Calendar, or Outlook via the
   footer's "Subscribe to the calendar" link (works on the deployed site).

## Reviewing submitted events

The footer's "Submit an event" form validates a visitor's submission and emails
it to you (set `SUGGEST_EMAIL` in `src/App.jsx`) as ready-to-paste JSON marked
`"status": "pending-review"`. Nothing goes live automatically. Your review flow:
1. Paste the JSON from the email into `public/data/pending-events.json`.
2. Check the details against the organizer's page (especially the sign-up link).
3. If it's real: remove the `status` and `submittedOn` lines, give it the next
   free `id`, set `lastChecked` to today, add coordinates (`lat`/`lng`), and
   move it into `public/data/events.json`.
4. Build — the validator will catch anything you missed.

## About the newer event fields

Fields like `kidFriendly`, `metroAccessible`, and `endTime` are `null` for
events where the organizer's page didn't say — the site shows badges and
filters **only for confirmed facts**, never guesses. When you verify a detail
on an organizer's page, fill it in (`true`/`false`, or an end time like
`"11:00 AM"`) and it appears automatically.

## Keeping the site current (your every-few-weeks routine)

The site hides past events automatically, so it never shows stale listings — but
new events only appear when you add them. A quick routine keeps it fresh:

**1. Check these organizers' event pages** and copy any new DC-area events into
`public/data/events.json` (same format as the events already there):

- Casey Trees — https://caseytrees.org/get-involved/volunteer-events/
- Anacostia Watershed Society — https://www.anacostiaws.org/events/
- Potomac Conservancy — https://potomac.org/events
- Rock Creek Conservancy — https://www.rockcreekconservancy.org/calendar
- Anacostia Riverkeeper — https://www.anacostiariverkeeper.org/events-calendar/
- DOEE (DC gov) events — https://doee.dc.gov/events
- Kingman Island calendar (aggregates DOEE, Anacostia Riverkeeper, DC Bird
  Alliance, Kingman Rangers/WABA events with dates AND end times — the most
  reliably structured source found so far) — https://www.kingmanisland.com/calendar

When adding an event, double-check the **sign-up link goes to that specific
event**, not the org's homepage — that's the link people actually click.

**2. Update two values in `src/App.jsx`** (near the top, under "SITE CONFIG"):

- `LAST_UPDATED` — set to today's date (`"YYYY-MM-DD"`). This shows in the
  footer so visitors know how current the list is.
- `SUGGEST_EMAIL` — set to your email once, so the footer's "Suggest an event"
  link sends messages to you. (Prefer a form? Replace the `mailto:` link in the
  footer with your Google Form URL.)

**3. Redeploy.** If you're on Netlify/Vercel connected to GitHub, just commit
the change on github.com and it redeploys automatically in about a minute.

## Automating new events (once you're on GitHub)

Full auto-scraping would be a trap for this site — several sources load events
with JavaScript that scrapers can't read, and broken scrapers fail *silently*,
which poisons the trust this directory runs on. Instead, the project ships a
safer three-part pipeline (see `.github/workflows/update-events.yml`):

1. **Feed import (`npm run import:ics`)** — pulls structured iCalendar feeds
   into `pending-events.json` as review candidates, auto-skipping past events
   and anything already tracked. The weekly GitHub Action runs this for the
   Kingman Island calendar and opens a **pull request** with candidates for
   you to review, fix up, promote, and merge. Test whether a Squarespace site
   has a feed by opening `<site>/calendar?format=ical` in your browser.
2. **Source watching (`npm run check:sources`)** — fingerprints every
   organizer page weekly and opens an **issue** naming exactly which pages
   changed (and which new dates appeared), so you only hand-check pages that
   actually moved. Its baseline lives in `scripts/source-cache.json`.
3. **Auto-deploy** — with the repo connected to Netlify (section 2 above),
   merging a reviewed change deploys it automatically.

Nothing ever publishes itself: candidates stop in the pending queue, and the
build's validator blocks duplicates and bad data at the door. To turn this on,
push the project to GitHub — the workflow starts running Mondays (or on demand
from the Actions tab); its first run just records baselines.

## SEO & sharing (automatic)

Every build injects **schema.org structured data** for all your events into the
page — that's what makes the site eligible for Google's event rich results in
search. Nothing to configure; it regenerates from `public/data/events.json`.

**After you deploy**, do one thing: open `site.config.json` and set your real
address, e.g.

```json
{ "siteUrl": "https://dc-green-events.netlify.app" }
```

then build/redeploy once. That automatically adds the canonical URL tag, a
`sitemap.xml`, a `Sitemap:` line in `robots.txt`, and points shared-link
previews at the bundled `public/social-card.png` (a branded 1200×630 image —
replace that file to change the preview). Until `siteUrl` is set those parts
are skipped, because guessing absolute URLs would do more harm than good.

Bonus: printing the page (Ctrl/Cmd-P) produces a clean flyer-style event list —
the interactive chrome hides itself automatically.

## Installing it as an app (it's a PWA)

The site is a **Progressive Web App**, which means once it's deployed online
people can install it to their phone's home screen and it opens full-screen with
its own icon — and it works offline (it remembers the events you've already
loaded). There's nothing extra to set up: it's built in.

- **On iPhone (Safari):** open the site, tap the Share button, then
  "Add to Home Screen."
- **On Android (Chrome):** open the site, tap the ⋮ menu, then "Install app"
  (or you'll see an install prompt).

This only works on the real hosted https site — not from double-clicking the
`preview.html` file, because the offline part needs a real web server.

The pieces that make this work live in the `public/` folder: `manifest.webmanifest`
(the app's name, colors, and icons), the `icons/` images, and `sw.js` (the
"service worker" that handles offline). **One thing to remember:** whenever you
change the site and redeploy, open `public/sw.js` and bump `CACHE_VERSION`
(e.g. `"v1"` → `"v2"`). That tells returning visitors' phones to grab the new
version instead of the cached old one. The file has a comment explaining this.

To change the app icon, replace the PNGs in `public/icons/` with your own (keep
the same filenames and sizes).

## Optional: a social preview image

When someone shares your link in a text or on social media, you can make it show
a preview image. Add a 1200×630 PNG to the project, then in `index.html`
uncomment the `og:image`, `og:url`, and `twitter:image` tags and set them to the
image's full public URL (e.g. `https://your-site.netlify.app/social-card.png`).
Relative paths don't work for social previews — it has to be the full URL.
