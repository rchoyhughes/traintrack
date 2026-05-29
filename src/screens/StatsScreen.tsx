import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

/**
 * Derived analytics, computed live from IndexedDB (spec §8).
 * Headline: top 3 most-visited stations (expandable). For now, a few
 * basic counts to prove the live-query pipeline works.
 */
export function StatsScreen() {
  const trips = useLiveQuery(() => db.trips.toArray())

  const tripCount = trips?.length ?? 0
  const lineCount = trips
    ? new Set(trips.flatMap((t) => t.segments.map((s) => s.line))).size
    : 0
  // Visited = stations entered or exited (trip origin/destination).
  const stationCount = trips
    ? new Set(trips.flatMap((t) => [t.origin, t.destination])).size
    : 0

  return (
    <div className="screen">
      <header className="screen__header">
        <h1>Stats</h1>
      </header>
      <div className="screen__body">
        <div className="stat-grid">
          <div className="stat">
            <span className="stat__value">{tripCount}</span>
            <span className="stat__label">trips</span>
          </div>
          <div className="stat">
            <span className="stat__value">{stationCount}</span>
            <span className="stat__label">stations</span>
          </div>
          <div className="stat">
            <span className="stat__value">{lineCount}</span>
            <span className="stat__label">lines</span>
          </div>
        </div>
        <p className="placeholder__note">
          More stats — distance, transfers, patterns — coming as data grows.
        </p>
      </div>
    </div>
  )
}
