# TrainTrack

A mobile-first PWA for logging and visualizing your journeys on the NYC subway.

See [`traintrack-spec.md`](./traintrack-spec.md) for the full design spec.

## Stack

- **React + TypeScript** (Vite)
- **PWA** via `vite-plugin-pwa`
- **Dexie** (IndexedDB) — all trip data is local-first, nothing stored server-side
- **Leaflet** — geographic subway map
- **D3** — visualizations computed live from local data

## Develop

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # typecheck + production build
npm run preview  # preview the production build
```

## Project layout

```
src/
  components/   LineBullet, TabBar
  data/         lines.ts — official MTA line colors
  db/           db.ts — Dexie schema + export/import
  screens/      Log, History, Map, Stats (one per tab)
  types.ts      Trip / Segment / Tag domain types
```

## Not yet wired up

- Bundled GTFS data (stations, complexes, shape polylines) — needed by Map + station search
- Google Directions proxy (route suggestions)
- App icons (`public/icon-192.png`, `public/icon-512.png`) referenced by the PWA manifest
