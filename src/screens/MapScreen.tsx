import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  loadShapes,
  loadStations,
  groupComplexes,
  type Shapes,
  type Complex,
} from '../data/gtfs'
import { lineColor, DIM_GRAY } from '../data/lines'

// Centered on Manhattan; covers most of the system at this zoom.
const NYC_CENTER: [number, number] = [40.7306, -73.9866]

/**
 * The geographic centerpiece (spec §7). Renders the GTFS network: line
 * geometry colored per route, station nodes as dots. Trip-based highlighting
 * (bolder = more rides, dim gray = untraveled) layers on next.
 */
export function MapScreen() {
  const [shapes, setShapes] = useState<Shapes | null>(null)
  const [complexes, setComplexes] = useState<Complex[] | null>(null)

  useEffect(() => {
    loadShapes().then(setShapes)
    loadStations().then((s) => setComplexes(groupComplexes(s)))
  }, [])

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
              attribution='&copy; OpenStreetMap &copy; CARTO'
            />
            {Object.entries(shapes).flatMap(([route, polylines]) =>
              polylines.map((coords, i) => (
                <Polyline
                  key={`${route}-${i}`}
                  positions={coords}
                  pathOptions={{
                    // Base network starts dim; ridden segments brighten later.
                    color: lineColor(route),
                    weight: 2,
                    opacity: 0.5,
                  }}
                />
              )),
            )}
            {complexes.map((c) => (
              <CircleMarker
                key={c.id}
                center={[c.lat, c.lon]}
                radius={2.5}
                pathOptions={{
                  color: DIM_GRAY,
                  fillColor: '#fff',
                  fillOpacity: 0.7,
                  weight: 0.5,
                }}
              />
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  )
}
