import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLngBoundsExpression } from 'leaflet'
import { LineBullet } from './LineBullet'
import { snapSegment, pathMiles } from '../lib/geometry'
import { lineColor, DIM_GRAY } from '../data/lines'
import { db } from '../db/db'
import { useRegisterOverlay } from './overlay'
import { formatTripTime } from '../lib/datetime'
import { TAGS, type Tag } from '../types'
import type { Complex, Shapes } from '../data/gtfs'
import type { Trip } from '../types'
import posthog from '../posthog'

/** ISO → value for <input type="datetime-local"> in local time. */
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/** Detail view for a single logged trip: route timeline, mini-map, mileage. */
export function TripDetail({
  trip,
  byId,
  shapes,
  onClose,
  onDelete,
}: {
  trip: Trip
  byId: Map<string, Complex>
  shapes: Shapes
  onClose: () => void
  onDelete: () => void
}) {
  useRegisterOverlay('trip-detail')
  const [editing, setEditing] = useState(false)
  const [tag, setTag] = useState<Tag>(trip.tag)
  const [when, setWhen] = useState(toLocalInput(trip.timestamp))

  function startEdit() {
    setTag(trip.tag)
    setWhen(toLocalInput(trip.timestamp))
    setEditing(true)
  }

  async function saveEdits() {
    await db.trips.update(trip.id, {
      tag,
      timestamp: new Date(when).toISOString(),
    })
    posthog.capture('trip_updated', { tag })
    setEditing(false)
  }

  const spans = useMemo(
    () =>
      trip.segments
        .map((seg) => {
          const a = byId.get(seg.origin)
          const b = byId.get(seg.destination)
          if (!a || !b) return null
          const coords = snapSegment(
            shapes,
            seg.line,
            [a.lat, a.lon],
            [b.lat, b.lon],
          )
          return coords ? { seg, coords, color: lineColor(seg.line) } : null
        })
        .filter((s): s is NonNullable<typeof s> => s != null),
    [trip, byId, shapes],
  )

  const miles = useMemo(
    () => spans.reduce((m, s) => m + pathMiles(s.coords), 0),
    [spans],
  )

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    const pts = spans.flatMap((s) => s.coords)
    if (!pts.length) return null
    const lats = pts.map((p) => p[0])
    const lons = pts.map((p) => p[1])
    return [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ]
  }, [spans])

  const origin = byId.get(trip.origin)
  const destination = byId.get(trip.destination)

  return (
    <div className="fullscreen">
      <div className="detail__bar">
        <button className="detail__back" onClick={onClose}>
          ← Back
        </button>
        {editing ? (
          <div className="detail__baractions">
            <button className="detail__back" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="detail__save" onClick={saveEdits}>
              Save
            </button>
          </div>
        ) : (
          <div className="detail__baractions">
            <button className="detail__edit" onClick={startEdit}>
              Edit
            </button>
            <button className="detail__del" onClick={onDelete}>
              Delete
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="detail__edit-panel">
          <div className="confirm__field">
            <label className="confirm__label">Tag</label>
            <div className="tags">
              {TAGS.map((t) => (
                <button
                  key={t}
                  className={`tag${tag === t ? ' is-on' : ''}`}
                  onClick={() => setTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="confirm__field">
            <label className="confirm__label">When</label>
            <input
              className="search__input"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="detail__head">
          <span className="trip-card__tag">{trip.tag}</span>
          <time>{formatTripTime(trip.timestamp)}</time>
          <span className="detail__miles">{miles.toFixed(1)} mi</span>
        </div>
      )}

      {bounds && (
        <MapContainer
          bounds={bounds}
          boundsOptions={{ padding: [28, 28] }}
          className="detail__map"
          zoomControl={false}
          attributionControl={false}
          preferCanvas
          scrollWheelZoom={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {Object.values(shapes).flatMap((pls, r) =>
            pls.map((c, i) => (
              <Polyline
                key={`b-${r}-${i}`}
                positions={c}
                interactive={false}
                pathOptions={{ color: DIM_GRAY, weight: 1, opacity: 0.6 }}
              />
            )),
          )}
          {spans.map((s, i) => (
            <Polyline
              key={i}
              positions={s.coords}
              pathOptions={{
                color: s.color,
                weight: 5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          ))}
          {/* Origin & destination glow. */}
          {origin && (
            <CircleMarker
              center={[origin.lat, origin.lon]}
              radius={5}
              pathOptions={{ color: '#fff', fillColor: '#fff', fillOpacity: 1, weight: 2 }}
            />
          )}
          {destination && (
            <CircleMarker
              center={[destination.lat, destination.lon]}
              radius={5}
              pathOptions={{ color: '#fff', fillColor: '#fff', fillOpacity: 1, weight: 2 }}
            />
          )}
        </MapContainer>
      )}

      {/* Route timeline: board → ride → (transfer) → … → arrive. */}
      <ol className="detail__route">
        <li className="detail__stop">
          <span className="detail__dot detail__dot--end" />
          {origin?.name ?? trip.origin}
        </li>
        {trip.segments.map((seg, i) => {
          const prev = i === 0 ? trip.origin : trip.segments[i - 1].destination
          const walked = seg.origin !== prev
          const dest = byId.get(seg.destination)
          const isLast = i === trip.segments.length - 1
          return (
            <li key={i} className="detail__leg">
              {walked && (
                <span className="detail__walk">
                  ⇄ walk to {byId.get(seg.origin)?.name}
                </span>
              )}
              <span className="detail__ride">
                <LineBullet line={seg.line} />
              </span>
              <span className="detail__stop">
                <span
                  className={`detail__dot${isLast ? ' detail__dot--end' : ''}`}
                />
                {dest?.name ?? seg.destination}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
