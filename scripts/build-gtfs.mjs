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

// ---- build stations.json from Stations.csv ----
function buildStations(stationsPath) {
  const records = parseRecords(readFileSync(stationsPath, 'utf8'))
  const stations = records
    .filter((r) => r['GTFS Stop ID'])
    .map((r) => ({
      id: r['GTFS Stop ID'],
      complexId: r['Complex ID'],
      name: r['Stop Name'],
      borough: r['Borough'],
      lat: round(r['GTFS Latitude']),
      lon: round(r['GTFS Longitude']),
      // "Daytime Routes" is space-separated, e.g. "N W" or "4 5 6".
      lines: r['Daytime Routes'].trim().split(/\s+/).filter(Boolean),
    }))
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

  const stations = buildStations(stationsPath)
  writeFileSync(join(OUT, 'stations.json'), JSON.stringify(stations))
  console.log(`stations.json  — ${stations.length} stations`)

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
