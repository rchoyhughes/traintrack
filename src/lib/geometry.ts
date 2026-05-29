import type { Shapes } from '../data/gtfs'

type Pt = [number, number] // [lat, lon]

/** Squared planar distance — fine for nearest-point over a small area. */
function dist2(a: Pt, b: Pt): number {
  const dlat = a[0] - b[0]
  const dlon = a[1] - b[1]
  return dlat * dlat + dlon * dlon
}

const R_MILES = 3958.8

/** Great-circle distance in miles between two [lat, lon] points. */
function haversineMiles(a: Pt, b: Pt): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R_MILES * Math.asin(Math.sqrt(h))
}

/** Total length in miles along a polyline (the real ridden track). */
export function pathMiles(coords: Pt[]): number {
  let m = 0
  for (let i = 1; i < coords.length; i++) m += haversineMiles(coords[i - 1], coords[i])
  return m
}

/** Index of the polyline point nearest to `p`, with its distance. */
function nearest(poly: Pt[], p: Pt): { idx: number; d: number } {
  let idx = 0
  let best = Infinity
  for (let i = 0; i < poly.length; i++) {
    const d = dist2(poly[i], p)
    if (d < best) {
      best = d
      idx = i
    }
  }
  return { idx, d: best }
}

/**
 * Given a line and the coordinates of the two stations a segment runs
 * between, return the span of the route's geometry actually ridden.
 *
 * shapes.json stores each route's full geometry (up to one polyline per
 * direction). We pick the polyline where both endpoints sit closest, then
 * slice between the nearest points to each station.
 */
export function snapSegment(
  shapes: Shapes,
  line: string,
  a: Pt,
  b: Pt,
): Pt[] | null {
  const polylines = shapes[line]
  if (!polylines?.length) return null

  const cands = polylines.map((poly) => {
    const na = nearest(poly, a)
    const nb = nearest(poly, b)
    return { poly, iA: na.idx, iB: nb.idx, fit: na.d + nb.d }
  })

  // Among polylines that fit the two endpoints comparably well, prefer the
  // most direct span (fewest points between). This picks the daytime bridge
  // over the night tunnel for a full-line N/Q ride, yet still chooses the
  // tunnel when an endpoint (e.g. Whitehall) only exists on that path.
  const bestFit = Math.min(...cands.map((c) => c.fit))
  const good = cands.filter((c) => c.fit <= bestFit * 1.5 + 1e-9)
  good.sort((x, y) => Math.abs(x.iB - x.iA) - Math.abs(y.iB - y.iA))

  const best = good[0]
  const lo = Math.min(best.iA, best.iB)
  const hi = Math.max(best.iA, best.iB)
  if (hi - lo < 1) return null
  return best.poly.slice(lo, hi + 1)
}
