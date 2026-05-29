import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet'
import { useLiveQuery } from 'dexie-react-hooks'
import 'leaflet/dist/leaflet.css'
import { db } from '../db/db'
import {
  loadShapes,
  loadStations,
  groupComplexes,
  type Shapes,
  type Complex,
} from '../data/gtfs'
import { lineColor, DIM_GRAY } from '../data/lines'
import { snapSegment } from '../lib/geometry'

const NYC_CENTER: [number, number] = [40.7306, -73.9866]

interface RiddenSpan {
  key: string
  coords: [number, number][]
  color: string
  weight: number
}

/**
 * The geographic centerpiece (spec §7). The base network renders dim gray;
 * segments you've ridden light up in their line color and thicken with
 * frequency; stations you've entered or exited glow.
 */
export function MapScreen() {
  const [shapes, setShapes] = useState<Shapes | null>(null)
  const [complexes, setComplexes] = useState<Complex[] | null>(null)
  const trips = useLiveQuery(() => db.trips.toArray())

  useEffect(() => {
    loadShapes().then(setShapes)
    loadStations().then((s) => setComplexes(groupComplexes(s)))
  }, [])

  const byId = useMemo(
    () => (complexes ? new Map(complexes.map((c) => [c.id, c])) : null),
    [complexes],
  )

  // Aggregate ridden segments into frequency-weighted, snapped spans.
  const ridden = useMemo<RiddenSpan[]>(() => {
    if (!shapes || !byId || !trips) return []
    // key: line + unordered station pair -> ride count
    const counts = new Map<
      string,
      { line: string; a: string; b: string; n: number }
    >()
    for (const trip of trips) {
      for (const seg of trip.segments) {
        const pair = [seg.origin, seg.destination].sort().join('~')
        const key = `${seg.line}|${pair}`
        const e = counts.get(key)
        if (e) e.n++
        else counts.set(key, { line: seg.line, a: seg.origin, b: seg.destination, n: 1 })
      }
    }

    const spans: RiddenSpan[] = []
    for (const [key, { line, a, b, n }] of counts) {
      const ca = byId.get(a)
      const cb = byId.get(b)
      if (!ca || !cb) continue
      const coords = snapSegment(shapes, line, [ca.lat, ca.lon], [cb.lat, cb.lon])
      if (!coords) continue
      spans.push({
        key,
        coords,
        color: lineColor(line),
        weight: 3 + Math.min(n, 6) * 1.6, // thicker with more rides
      })
    }
    return spans
  }, [shapes, byId, trips])

  // Stations entered or exited (the "visited" set).
  const visited = useMemo(
    () => new Set((trips ?? []).flatMap((t) => [t.origin, t.destination])),
    [trips],
  )

  const loading = !shapes || !complexes

  return (
    <div className="screen">
      <header className="screen__header">
        <h1>Map</h1>
      </header>
      <div className="screen__body screen__body--bleed">
        {loading ? (
          <p className="placeholder__note" style={{ padding: 20 }}>
            Loading the system…
          </p>
        ) : (
          <MapContainer
            center={NYC_CENTER}
            zoom={11}
            className="map"
            preferCanvas
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap &copy; CARTO"
            />

            {/* Base network: dim gray. */}
            {Object.values(shapes).flatMap((polylines, r) =>
              polylines.map((coords, i) => (
                <Polyline
                  key={`base-${r}-${i}`}
                  positions={coords}
                  pathOptions={{ color: DIM_GRAY, weight: 1.5, opacity: 0.7 }}
                />
              )),
            )}

            {/* Ridden spans: line color, thicker with frequency. */}
            {ridden.map((s) => (
              <Polyline
                key={s.key}
                positions={s.coords}
                pathOptions={{
                  color: s.color,
                  weight: s.weight,
                  opacity: 0.95,
                  lineCap: 'round',
                }}
              />
            ))}

            {/* Stations: dim dots, visited ones glow. */}
            {complexes!.map((c) => {
              const v = visited.has(c.id)
              return (
                <CircleMarker
                  key={c.id}
                  center={[c.lat, c.lon]}
                  radius={v ? 4 : 1.5}
                  pathOptions={{
                    color: v ? '#fff' : DIM_GRAY,
                    fillColor: v ? '#fff' : '#666',
                    fillOpacity: v ? 1 : 0.5,
                    weight: v ? 1.5 : 0.5,
                  }}
                />
              )
            })}
          </MapContainer>
        )}
      </div>
    </div>
  )
}
