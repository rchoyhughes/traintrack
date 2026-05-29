import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { LineBullet } from '../components/LineBullet'

/**
 * List of past trips, newest first. Delete supported (no editing —
 * delete and re-log to fix). See spec §6.
 */
export function HistoryScreen() {
  const trips = useLiveQuery(() =>
    db.trips.orderBy('timestamp').reverse().toArray(),
  )

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
                <div className="trip-card__lines">
                  {trip.segments.map((seg, i) => (
                    <LineBullet key={i} line={seg.line} />
                  ))}
                </div>
                <div className="trip-card__meta">
                  <span className="trip-card__tag">{trip.tag}</span>
                  <time>{new Date(trip.timestamp).toLocaleString()}</time>
                </div>
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
