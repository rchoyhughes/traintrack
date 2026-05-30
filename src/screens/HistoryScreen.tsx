import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { LineBullet } from '../components/LineBullet'
import { TripDetail } from '../components/TripDetail'
import { useComplexes } from '../data/useComplexes'
import { loadShapes, type Shapes } from '../data/gtfs'
import { formatTripTime } from '../lib/datetime'
import { RangeFilter } from '../components/RangeFilter'
import { filterTripsByRange, type TimeRange } from '../lib/timeRange'

/**
 * List of past trips, newest first. Tap a trip for its detail (route
 * timeline + mini-map + mileage); delete removes it (no editing).
 */
export function HistoryScreen({
  range,
  onRangeChange,
}: {
  range: TimeRange
  onRangeChange: (range: TimeRange) => void
}) {
  const allTrips = useLiveQuery(() =>
    db.trips.orderBy('timestamp').reverse().toArray(),
  )
  const complexes = useComplexes()
  const [shapes, setShapes] = useState<Shapes | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    loadShapes().then(setShapes)
  }, [])

  const byId = useMemo(
    () => (complexes ? new Map(complexes.map((c) => [c.id, c])) : null),
    [complexes],
  )

  const trips = useMemo(
    () => (allTrips ? filterTripsByRange(allTrips, range) : undefined),
    [allTrips, range],
  )

  const selected = trips?.find((t) => t.id === selectedId) ?? null

  return (
    <div className="screen">
      <header className="screen__header screen__header--row">
        <h1>History</h1>
        <RangeFilter value={range} onChange={onRangeChange} />
      </header>
      <div className="screen__body">
        {trips === undefined ? (
          <p className="placeholder__note">Loading…</p>
        ) : allTrips && allTrips.length === 0 ? (
          <p className="placeholder__note">
            No trips logged yet. Head to the Log tab to add your first.
          </p>
        ) : trips.length === 0 ? (
          <p className="placeholder__note">
            No trips in this range. Try a longer time span.
          </p>
        ) : (
          <ul className="trip-list">
            {trips.map((trip) => (
              <li key={trip.id} className="trip-card">
                <button
                  className="trip-card__main"
                  onClick={() => setSelectedId(trip.id)}
                >
                  <div className="trip-card__lines">
                    {trip.segments.map((seg, i) => (
                      <LineBullet key={i} line={seg.line} />
                    ))}
                  </div>
                  <div className="trip-card__meta">
                    <span className="trip-card__tag">{trip.tag}</span>
                    <time>{formatTripTime(trip.timestamp)}</time>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && byId && shapes && (
        <TripDetail
          trip={selected}
          byId={byId}
          shapes={shapes}
          onClose={() => setSelectedId(null)}
          onDelete={() => {
            db.trips.delete(selected.id)
            setSelectedId(null)
          }}
        />
      )}
    </div>
  )
}
