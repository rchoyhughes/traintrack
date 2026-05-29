# TrainTrack

A mobile-first PWA for logging and visualizing your journeys on the NYC subway.
Live at **[traintrack.harmo.nyc](https://traintrack.harmo.nyc)**.

See [`traintrack-spec.md`](./traintrack-spec.md) for the full design spec and
build status.

## What it does

- **Log a trip** — pick origin + destination, build the route leg by leg
  (transfers, out-of-station transfers, off-peak service, and a reroute
  fallback all handled), tag it, and save. Re-log frequent trips in two taps
  from the "Common trips" shortcuts.
- **History** — browse trips; tap one for a detail view with a route timeline,
  a mini-map of the actual track, and the mileage. Edit a trip's time/tag.
- **Map** — a geographic map where the lines you've ridden glow in their MTA
  colors, thickening with frequency, over a dim base network.
- **Stats** — miles traveled, system/borough coverage, most-visited stations,
  line distribution, transfer hubs, and personal patterns.

Everything is **local-first**: trips live in your browser via IndexedDB.
Nothing is sent to a server, no accounts, no tracking. Export/import JSON
backups from the menu.

## Stack

- **React + TypeScript** (Vite), as a **PWA** (`vite-plugin-pwa`)
- **Dexie** (IndexedDB) — local-first trip storage
- **Leaflet** — geographic subway map
- Charts/visualizations are dependency-free CSS

## Develop

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # typecheck + production build
npm run preview  # preview the production build
npm run lint     # eslint
npm run gtfs     # rebuild bundled GTFS data from the MTA feed (rarely needed)
```

## GTFS data

Station, complex, line, and route-geometry data is preprocessed from the MTA's
public GTFS feed by `scripts/build-gtfs.mjs` into `public/gtfs/*.json`, which is
committed so the app builds without network access. Regenerate with
`npm run gtfs`. A scheduled GitHub Action also refreshes it monthly and opens a
PR if anything changed (review gate for the curated overrides).

## Project layout

```
src/
  components/   AppHeader, TabBar (nav pill), MenuSheet, InstallPrompt,
                LineBullet, StationSearch, RouteBuilder, TripDetail
  data/         gtfs.ts (loaders), lines.ts (MTA colors), complexNames.ts,
                transfers.ts (out-of-station transfers), useComplexes.ts
  db/           db.ts — Dexie schema + JSON export/import
  lib/          search, route, geometry (snapping + mileage), dataTransfer
  screens/      Log, History, Map, Stats, About
  types.ts      Trip / Segment / Tag domain types
```

## Deployment

Push to `main` → GitHub Actions builds and rsyncs `dist/` to the server
(`/var/www/traintrack`), served by nginx over HTTPS. See `.github/workflows/`.

## Not yet wired up

- Google Directions proxy for automatic route suggestions (manual builder
  covers everything today).
- App icons (`public/icon-192.png`, `public/icon-512.png`) referenced by the
  PWA manifest.
