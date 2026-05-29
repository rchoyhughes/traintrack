#!/usr/bin/env node
/**
 * Preprocess MTA GTFS static data into compact JSON for TrainTrack.
 *
 * Outputs (to public/gtfs/):
 *   stations.json  — one entry per station, grouped by complex, with the
 *                    lines that serve it and its coordinates.
 *   shapes.json    — representative line geometry per route, for the map.
 *
 * Sources (downloaded to .gtfs-cache/ if not already present):
 *   - google_transit.zip  (stops, routes, trips, shapes)
 *   - Stations.csv        (complex IDs + line associations per station)
 *
 * Re-run any time the MTA updates its data (rarely):  npm run gtfs
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CACHE = join(ROOT, '.gtfs-cache')
const OUT = join(ROOT, 'public', 'gtfs')

const GTFS_ZIP_URL =
  'http://web.mta.info/developers/data/nyct/subway/google_transit.zip'
const STATIONS_CSV_URL =
  'http://web.mta.info/developers/data/nyct/subway/Stations.csv'

const COORD_PRECISION = 5

// ---- tiny CSV parser (handles quoted fields with embedded commas) ----
function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** Parse CSV into array of objects keyed by header row. */
function parseRecords(text) {
  const rows = parseCSV(text)
  const header = rows[0]
  return rows.slice(1).map((r) => {
    const obj = {}
    header.forEach((h, i) => {
      obj[h] = r[i] ?? ''
    })
    return obj
  })
}

const round = (n) => Number(Number(n).toFixed(COORD_PRECISION))

/**
 * Normalize a GTFS route_id to its public line label, matching the clean
 * vocabulary in Stations.csv "Daytime Routes":
 *   express variants  6X→6, 7X→7, FX→F
 *   shuttles          FS, GS, H → S
 */
function normalizeRoute(r) {
  if (r === 'FS' || r === 'GS' || r === 'H') return 'S'
  if (/^[1-9]X$|^FX$/.test(r)) return r.slice(0, -1)
  return r
}

// route comparator: numeric lines first (1,2,3…), then letters (A,B,C…).
function routeOrder(a, b) {
  const na = /^\d/.test(a)
  const nb = /^\d/.test(b)
  if (na !== nb) return na ? -1 : 1
  return na ? Number(a) - Number(b) : a.localeCompare(b)
}

// ---- ensure raw data is present ----
function ensureRawData() {
  mkdirSync(CACHE, { recursive: true })
  const zipPath = join(CACHE, 'gtfs.zip')
  const gtfsDir = join(CACHE, 'gtfs')
  const stationsPath = join(CACHE, 'Stations.csv')

  if (!existsSync(zipPath)) {
    console.log('Downloading GTFS feed…')
    execSync(`curl -sL -o "${zipPath}" "${GTFS_ZIP_URL}"`, { stdio: 'inherit' })
  }
  if (!existsSync(gtfsDir)) {
    console.log('Extracting GTFS feed…')
    execSync(`unzip -o "${zipPath}" -d "${gtfsDir}"`, { stdio: 'ignore' })
  }
  if (!existsSync(stationsPath)) {
    console.log('Downloading Stations.csv…')
    execSync(`curl -sL -o "${stationsPath}" "${STATIONS_CSV_URL}"`, {
      stdio: 'inherit',
    })
  }
  return { gtfsDir, stationsPath }
}

/**
 * Build the full set of routes that *ever* serve each station, across all
 * service periods (incl. late-night/weekend), by joining stop_times → trips.
 * Captures e.g. the late-night 4 at 51 St that "Daytime Routes" omits.
 * Returns Map<parentStopId, Set<normalizedRoute>>.
 */
function buildStationRoutes(gtfsDir) {
  // child stop_id -> parent station id (from stops.txt)
  const stops = parseRecords(readFileSync(join(gtfsDir, 'stops.txt'), 'utf8'))
  const parentOf = new Map()
  for (const s of stops) {
    parentOf.set(s.stop_id, s.parent_station || s.stop_id)
  }

  // trip_id -> route_id (from trips.txt)
  const trips = parseRecords(readFileSync(join(gtfsDir, 'trips.txt'), 'utf8'))
  const tripRoute = new Map()
  for (const t of trips) tripRoute.set(t.trip_id, t.route_id)

  // Stream stop_times.txt by column index (large, but no quoted fields).
  const text = readFileSync(join(gtfsDir, 'stop_times.txt'), 'utf8')
  const lines = text.split('\n')
  const header = lines[0].split(',')
  const tripIdx = header.indexOf('trip_id')
  const stopIdx = header.indexOf('stop_id')

  const byStop = new Map()
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const cols = line.split(',')
    const route = tripRoute.get(cols[tripIdx])
    if (!route) continue
    const parent = parentOf.get(cols[stopIdx]) ?? cols[stopIdx]
    let set = byStop.get(parent)
    if (!set) byStop.set(parent, (set = new Set()))
    set.add(normalizeRoute(route))
  }
  return byStop
}

// ---- build stations.json from Stations.csv ----
function buildStations(stationsPath, stationRoutes) {
  const records = parseRecords(readFileSync(stationsPath, 'utf8'))
  const stations = records
    .filter((r) => r['GTFS Stop ID'])
    .map((r) => {
      const id = r['GTFS Stop ID']
      // "Daytime Routes" is space-separated, e.g. "N W" or "4 5 6".
      const lines = r['Daytime Routes'].trim().split(/\s+/).filter(Boolean)
      // Full union across all service periods (for the route builder).
      const all = stationRoutes.get(id)
      const allLines = all
        ? [...new Set([...all, ...lines])].sort(routeOrder)
        : lines
      return {
        id,
        complexId: r['Complex ID'],
        name: r['Stop Name'],
        borough: r['Borough'],
        lat: round(r['GTFS Latitude']),
        lon: round(r['GTFS Longitude']),
        lines,
        allLines,
      }
    })
  return stations
}

// ---- build shapes.json: representative geometry per route ----
function buildShapes(gtfsDir) {
  // shape_id -> { route, dir } from trips.txt
  const trips = parseRecords(readFileSync(join(gtfsDir, 'trips.txt'), 'utf8'))
  const shapeMeta = new Map()
  for (const t of trips) {
    if (t.shape_id && !shapeMeta.has(t.shape_id)) {
      shapeMeta.set(t.shape_id, {
        route: t.route_id,
        dir: t.direction_id,
      })
    }
  }

  // shape_id -> ordered [lat, lon] points from shapes.txt
  const shapeRows = parseRecords(
    readFileSync(join(gtfsDir, 'shapes.txt'), 'utf8'),
  )
  const points = new Map()
  for (const row of shapeRows) {
    const id = row.shape_id
    if (!points.has(id)) points.set(id, [])
    points.get(id).push({
      seq: Number(row.shape_pt_sequence),
      lat: round(row.shape_pt_lat),
      lon: round(row.shape_pt_lon),
    })
  }

  // Pick the longest shape per (route, direction) as representative geometry.
  // key: `${route}|${dir}` -> { len, coords }
  const best = new Map()
  for (const [id, pts] of points) {
    const meta = shapeMeta.get(id)
    if (!meta) continue
    pts.sort((a, b) => a.seq - b.seq)
    const coords = pts.map((p) => [p.lat, p.lon])
    const key = `${meta.route}|${meta.dir}`
    const prev = best.get(key)
    if (!prev || coords.length > prev.coords.length) {
      best.set(key, { route: meta.route, coords })
    }
  }

  // route_id -> array of polylines
  const byRoute = {}
  for (const { route, coords } of best.values()) {
    if (!byRoute[route]) byRoute[route] = []
    byRoute[route].push(coords)
  }
  return byRoute
}

// ---- main ----
function main() {
  const { gtfsDir, stationsPath } = ensureRawData()
  mkdirSync(OUT, { recursive: true })

  const stationRoutes = buildStationRoutes(gtfsDir)
  const stations = buildStations(stationsPath, stationRoutes)
  writeFileSync(join(OUT, 'stations.json'), JSON.stringify(stations))
  const extraLines = stations.filter(
    (s) => s.allLines.length > s.lines.length,
  ).length
  console.log(
    `stations.json  — ${stations.length} stations (${extraLines} with extra off-peak lines)`,
  )

  const shapes = buildShapes(gtfsDir)
  writeFileSync(join(OUT, 'shapes.json'), JSON.stringify(shapes))
  const polylineCount = Object.values(shapes).reduce(
    (n, arr) => n + arr.length,
    0,
  )
  console.log(
    `shapes.json    — ${Object.keys(shapes).length} routes, ${polylineCount} polylines`,
  )
}

main()
