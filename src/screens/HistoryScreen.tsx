import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { LineBullet } from '../components/LineBullet'
import { TripDetail } from '../components/TripDetail'
import { useComplexes } from '../data/useComplexes'
import { loadShapes, type Shapes } from '../data/gtfs'

/**
 * List of past trips, newest first. Tap a trip for its detail (route
 * timeline + mini-map + mileage); delete removes it (no editing).
 */
export function HistoryScreen() {
  const trips = useLiveQuery(() =>
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

  const selected = trips?.find((t) => t.id === selectedId) ?? null

  if (selected && byId && shapes) {
    return (
      <div className="screen">
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
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="screen__header">
        <h1>History</h1>
      </header>
      <div className="screen__body">
        {trips === undefined ? (
          <p className="placeholder__note">Loading…</p>
        ) : trips.length === 0 ? (
          <p className="placeholder__note">
            No trips logged yet. Head to the Log tab to add your first.
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
                    <time>{new Date(trip.timestamp).toLocaleString()}</time>
                  </div>
                </button>
                <button
                  className="trip-card__delete"
                  onClick={() => db.trips.delete(trip.id)}
                  aria-label="Delete trip"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
