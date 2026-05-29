# TrainTrack — Design Spec

A mobile-first PWA for logging and visualizing your personal journeys on the NYC subway. Built out of curiosity about your own transit patterns — a game, not a chore. Log a trip in seconds, watch your personal map of the city light up over time.

---

## 1. Concept

You log a trip by picking an origin and destination station, then either selecting from suggested routes or building the route manually. Each logged trip becomes a data point you can slice and analyze. The fun emerges over time: which stations you've collected, which lines you've never touched, how far you've traveled underground, the neighborhoods you've explored versus neglected.

**Guiding principles:**
- **Local-first.** No accounts, no server-side storage of user data. Your trips live in your browser.
- **One interaction per trip.** Logging is a single, fast act. Not a time tracker, not a navigation tool.
- **Build the core solid, expand outward.** Follow curiosity, no rigid roadmap.
- **Feel like part of the system.** Helvetica, MTA line colors, geographic accuracy.

---

## 2. Architecture

```
┌─────────────────────────────────────────┐
│  Browser (PWA)                            │
│  ┌─────────────────────────────────────┐ │
│  │ React App                           │ │
│  │  - UI / tabs / map / stats          │ │
│  │  - Bundled GTFS JSON (stations,     │ │
│  │    shapes, complex lookup)          │ │
│  │  - Route suggestion logic           │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ IndexedDB (via Dexie)               │ │
│  │  - All trip data                    │ │
│  │  - Favorites                        │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ Service Worker                      │ │
│  │  - Caches app shell + GTFS data     │ │
│  └─────────────────────────────────────┘ │
└───────────────┬───────────────────────────┘
                │ HTTPS (only when fetching routes)
                ▼
┌─────────────────────────────────────────┐
│  Oracle Cloud (Always Free tier)          │
│  - Serves static React build              │
│  - Thin proxy → Google Directions API     │
│    (hides API key, 1 call per trip)       │
└─────────────────────────────────────────┘
```

**The server never stores user data.** Its only jobs are serving the static build and proxying routing requests so the Google API key isn't exposed in client code.

---

## 3. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| App type | PWA | Add-to-homescreen, app shell cached offline |
| Framework | React | Standard, huge ecosystem, mature integrations |
| Local DB | Dexie.js (IndexedDB) | Structured, queryable, reactive via `dexie-react-hooks` |
| Map | Leaflet + `react-leaflet` | Geographic, GTFS shapes as polylines |
| Visualizations | D3 | Computed live from IndexedDB |
| Routing | Google Directions API | `alternatives=true`, `transit_mode=subway`, proxied |
| Proxy | Express/Fastify, single endpoint | Forwards to Google, returns results |
| Hosting | Oracle Cloud Always Free | Static build + proxy on one box |

**Typography:** `"Helvetica Neue", Helvetica, Arial, sans-serif`. True Helvetica on Apple devices; Arial is a near-identical fallback elsewhere.

**Design language:** Official MTA line colors (e.g. 1 = `#EE352E`, A = `#0039A6`), circular line bullets, geographic map.

---

## 4. Data Model

### Trip (stored in IndexedDB)

```json
{
  "id": "uuid",
  "timestamp": "2026-05-25T14:30:00",
  "segments": [
    { "origin": "A41", "destination": "R31", "line": "Q" },
    { "origin": "R31", "destination": "D24", "line": "2" }
  ],
  "tag": "commute",
  "notes": ""
}
```

- **Each segment** is one unbroken ride on one line. Station IDs come from GTFS `stops.txt`.
- **A transfer is implicit:** when one segment's destination connects to the next segment's origin (same station or same complex).
- **`tag`** is one of: `commute`, `exploring`, `social`, `errand`, `travel`, `other`.

### Derived data (computed, never stored)

| Stat | How |
|------|-----|
| Stations visited | Flatten all segment origins + destinations, dedupe by complex |
| Lines ridden | Collect `line` from each segment |
| Transfer points | Where consecutive segments meet |
| Distance | Sum actual track geometry from `shapes.txt` along each segment |
| Trip complexity | `segments.length` |

### Bundled GTFS data (preprocessed to JSON at build time)

- Station names, coordinates, line associations
- Station complex lookup (which stop IDs belong to one physical complex)
- Shape polylines for map rendering + distance calculation

GTFS changes rarely (a few stations per decade). Rebundle and redeploy when it ever matters.

---

## 5. Core User Flow

1. **Open app** → Log tab loads by default.
2. **Pick origin + destination** via fuzzy station autocomplete (line/color context in results; favorites and recents surfaced first).
3. **Get route options**, ranked:
   1. **Your history** — "you've done this trip 12 times, here's how you usually go" (from IndexedDB, no API call)
   2. **API alternatives** — fresh suggestions from Google (real-time aware), 1 call
   3. **Manual builder** — step-by-step fallback (what line first → where you got off/transferred → next line), each step contextually narrowing options
4. **Confirm time** (defaults to now; backdating allowed via date/time picker).
5. **Pick a tag.**
6. **Save.** Trip lands in IndexedDB.

**Note on connectivity:** You typically have signal in stations and on aboveground portions. The single API call can wait until you're at a station or above ground. History-based suggestions work fully offline.

---

## 6. Navigation

Bottom tab bar (mobile-first):

- **Log** (default) — the trip logging flow
- **History** — list of past trips; tap to view, swipe/delete to remove (no editing — delete and re-log to fix)
- **Map** — the geographic centerpiece
- **Stats** — derived analytics

---

## 7. The Map

Geographic Leaflet map grounded in real station coordinates, emphasizing explored vs. unexplored neighborhoods.

- **Ridden segments:** keep their original MTA line color; grow **thicker and bolder** the more you've traveled them, **thinner and dimmer** for fewer rides.
- **Untraveled segments:** dim gray.
- **Visited stations:** light up (entered/exited only — passthrough doesn't count).
- **Transfers:** tracked separately; candidates for heatmap emphasis at hubs.
- **Smart default view:** center on most recent or most-frequented area rather than the whole system zoomed out. Pinch-to-zoom for exploration.

---

## 8. Stats

- **Headline:** top 3 most-visited stations, expandable to the full list.
- Other derived stats available: total trips, unique stations, lines ridden, cumulative distance ("you've traveled 847 miles underground this year"), transfer analysis, personal patterns (common pairs, peak days/times).

---

## 9. Backup & Portability

- **JSON export/import** button. User owns their data file.
- Important because IndexedDB can be evicted (notably iOS Safari after weeks of inactivity). Export is the safety net.

---

## 10. Parked for Later

- **Exploration score** — composite metric weighting coverage by uniqueness. Concept is appealing but undefined; revisit. For now, station/line coverage percentages stand on their own.
- **Cross-device sync** — currently each device is its own history. Could later add optional sync with user-held encryption key, server storing only opaque blobs.
- **Service disruption context** — correlating odd routes with MTA service alerts for narrative.
- **Temporal visualizations** — animated map showing usage evolving month-over-month.
- **Retroactive bulk import** — seeding history from memory or location timelines.
- **"Subway genome"** — a fingerprint visualization of transit identity.

---

## Open Questions / Future Decisions

- Self-host a Helvetica web font for pixel-perfect rendering on Android, or accept the Arial fallback? (Leaning: accept fallback.)
- Define the exploration score when revisited.
- Heatmap view as a toggle on the map vs. a separate visualization.
