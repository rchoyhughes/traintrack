import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useComplexes } from '../data/useComplexes'
import { loadShapes, type Shapes } from '../data/gtfs'
import { lineColor, ALL_LINES } from '../data/lines'
import { snapSegment, pathMiles } from '../lib/geometry'
import { LineBullet } from '../components/LineBullet'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const BOROUGHS: [string, string][] = [
  ['M', 'Manhattan'],
  ['Bk', 'Brooklyn'],
  ['Q', 'Queens'],
  ['Bx', 'Bronx'],
  ['SI', 'Staten Island'],
]

function fmtHour(h: number): string {
  const ampm = h < 12 ? 'AM' : 'PM'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr} ${ampm}`
}

export function StatsScreen() {
  const trips = useLiveQuery(() => db.trips.toArray())
  const complexes = useComplexes()
  const [shapes, setShapes] = useState<Shapes | null>(null)
  const [showAllStations, setShowAllStations] = useState(false)

  useEffect(() => {
    loadShapes().then(setShapes)
  }, [])

  const byId = useMemo(
    () => (complexes ? new Map(complexes.map((c) => [c.id, c])) : null),
    [complexes],
  )

  const stats = useMemo(() => {
    if (!trips || !byId || !complexes || !shapes) return null

    let miles = 0
    const stationVisits = new Map<string, number>()
    const lineRides = new Map<string, number>()
    const transferHubs = new Map<string, number>()
    const pairCounts = new Map<string, number>()
    const dow = new Array(7).fill(0)
    const hours = new Array(24).fill(0)
    const tagCounts = new Map<string, number>()

    for (const t of trips) {
      // Visited stations (entered/exited).
      for (const id of [t.origin, t.destination]) {
        stationVisits.set(id, (stationVisits.get(id) ?? 0) + 1)
      }
      // Common-route pair (undirected).
      const pair = [t.origin, t.destination].sort().join('~')
      pairCounts.set(pair, (pairCounts.get(pair) ?? 0) + 1)
      // Segments → lines, distance.
      t.segments.forEach((seg, i) => {
        lineRides.set(seg.line, (lineRides.get(seg.line) ?? 0) + 1)
        const a = byId.get(seg.origin)
        const b = byId.get(seg.destination)
        if (a && b) {
          const coords = snapSegment(shapes, seg.line, [a.lat, a.lon], [b.lat, b.lon])
          if (coords) miles += pathMiles(coords)
        }
        // Transfer hub = where one segment hands off to the next.
        if (i < t.segments.length - 1) {
          transferHubs.set(seg.destination, (transferHubs.get(seg.destination) ?? 0) + 1)
        }
      })
      const d = new Date(t.timestamp)
      dow[d.getDay()]++
      hours[d.getHours()]++
      tagCounts.set(t.tag, (tagCounts.get(t.tag) ?? 0) + 1)
    }

    const topStations = [...stationVisits.entries()]
      .map(([id, n]) => ({ complex: byId.get(id), n }))
      .filter((s) => s.complex)
      .sort((a, b) => b.n - a.n)

    const topTransfers = [...transferHubs.entries()]
      .map(([id, n]) => ({ complex: byId.get(id), n }))
      .filter((s) => s.complex)
      .sort((a, b) => b.n - a.n)
      .slice(0, 5)

    const lineList = [...lineRides.entries()]
      .map(([line, n]) => ({ line, n }))
      .sort((a, b) => b.n - a.n)

    const topPair = [...pairCounts.entries()].sort((a, b) => b[1] - a[1])[0]
    const [pa, pb] = topPair ? topPair[0].split('~') : [null, null]

    const busiestDay = dow.indexOf(Math.max(...dow))
    const busiestHour = hours.indexOf(Math.max(...hours))

    // Borough coverage: visited complexes / total complexes per borough.
    const visitedIds = new Set(stationVisits.keys())
    const boroughStats = BOROUGHS.map(([code, name]) => {
      const inBorough = complexes.filter((c) => c.borough === code)
      const visited = inBorough.filter((c) => visitedIds.has(c.id)).length
      return { code, name, visited, total: inBorough.length }
    })

    const tagList = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])

    return {
      trips: trips.length,
      miles,
      uniqueStations: stationVisits.size,
      totalStations: complexes.length,
      linesRidden: lineRides.size,
      transfers: [...transferHubs.values()].reduce((s, n) => s + n, 0),
      topStations,
      topTransfers,
      lineList,
      dow,
      busiestDay,
      busiestHour,
      tagList,
      boroughStats,
      topPair: topPair
        ? { a: byId.get(pa!), b: byId.get(pb!), n: topPair[1] }
        : null,
    }
  }, [trips, byId, complexes, shapes])

  if (!stats) {
    return (
      <div className="screen">
        <header className="screen__header">
          <h1>Stats</h1>
        </header>
        <div className="screen__body">
          <p className="placeholder__note">Crunching your trips…</p>
        </div>
      </div>
    )
  }

  if (stats.trips === 0) {
    return (
      <div className="screen">
        <header className="screen__header">
          <h1>Stats</h1>
        </header>
        <div className="screen__body">
          <p className="placeholder__note">
            Log some trips and your stats will appear here.
          </p>
        </div>
      </div>
    )
  }

  const stationPct = Math.round((stats.uniqueStations / stats.totalStations) * 100)
  const linePct = Math.round((stats.linesRidden / ALL_LINES.length) * 100)
  const shownStations = showAllStations
    ? stats.topStations
    : stats.topStations.slice(0, 3)
  const maxLine = stats.lineList[0]?.n ?? 1
  const maxDow = Math.max(...stats.dow)
  const maxTag = stats.tagList[0]?.[1] ?? 1

  return (
    <div className="screen">
      <header className="screen__header">
        <h1>Stats</h1>
      </header>
      <div className="screen__body stats">
        {/* Hero: total distance. */}
        <div className="stats__hero">
          <span className="stats__hero-value">{stats.miles.toFixed(1)}</span>
          <span className="stats__hero-unit">miles traveled</span>
        </div>

        {/* Headline grid. */}
        <div className="stat-grid">
          <Stat value={stats.trips} label="trips" />
          <Stat value={stats.uniqueStations} label="stations" />
          <Stat value={stats.linesRidden} label="lines" />
          <Stat value={stats.transfers} label="transfers" />
        </div>

        {/* Top stations. */}
        <Section title="Most-visited stations">
          {shownStations.map((s, i) => (
            <div className="stats__row" key={s.complex!.id}>
              <span className="stats__rank">{i + 1}</span>
              <span className="stats__row-name">{s.complex!.name}</span>
              <StationLines complex={s.complex!} />
              <span className="stats__row-val">{s.n}</span>
            </div>
          ))}
          {stats.topStations.length > 3 && (
            <button
              className="builder__more"
              onClick={() => setShowAllStations((v) => !v)}
            >
              {showAllStations
                ? 'Show less'
                : `Show all ${stats.topStations.length}`}
            </button>
          )}
        </Section>

        {/* Lines ridden. */}
        <Section title="Lines ridden">
          {stats.lineList.map(({ line, n }) => (
            <div className="stats__bar-row" key={line}>
              <LineBullet line={line} />
              <div className="stats__bar-track">
                <div
                  className="stats__bar-fill"
                  style={{
                    width: `${(n / maxLine) * 100}%`,
                    background: lineColor(line),
                  }}
                />
              </div>
              <span className="stats__row-val">{n}</span>
            </div>
          ))}
        </Section>

        {/* Transfer hubs. */}
        {stats.topTransfers.length > 0 && (
          <Section title="Top transfer hubs">
            {stats.topTransfers.map((s) => (
              <div className="stats__row" key={s.complex!.id}>
                <span className="stats__row-name">{s.complex!.name}</span>
                <StationLines complex={s.complex!} />
                <span className="stats__row-val">{s.n}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Patterns. */}
        <Section title="Your patterns">
          {stats.topPair && (
            <div className="stats__fact">
              <span className="stats__fact-label">Most common trip</span>
              <span className="stats__fact-value">
                {stats.topPair.a?.name} ↔ {stats.topPair.b?.name}
                <span className="stats__fact-sub"> · {stats.topPair.n}×</span>
              </span>
            </div>
          )}
          <div className="stats__fact">
            <span className="stats__fact-label">Busiest day</span>
            <span className="stats__fact-value">{DOW[stats.busiestDay]}</span>
          </div>
          <div className="stats__fact">
            <span className="stats__fact-label">Busiest time</span>
            <span className="stats__fact-value">
              {fmtHour(stats.busiestHour)}
            </span>
          </div>
          <div className="stats__dow">
            {stats.dow.map((n, i) => (
              <div className="stats__dow-col" key={i}>
                <div className="stats__dow-bar-track">
                  <div
                    className="stats__dow-bar"
                    style={{ height: `${maxDow ? (n / maxDow) * 100 : 0}%` }}
                  />
                </div>
                <span className="stats__dow-label">{DOW[i][0]}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* System coverage. */}
        <Section title="System coverage">
          <Meter
            label={`Stations · ${stats.uniqueStations} of ${stats.totalStations}`}
            pct={stationPct}
          />
          <Meter
            label={`Lines · ${stats.linesRidden} of ${ALL_LINES.length}`}
            pct={linePct}
          />
        </Section>

        {/* Borough coverage. */}
        <Section title="Borough coverage">
          {stats.boroughStats.map((b) => (
            <Meter
              key={b.code}
              label={`${b.name} · ${b.visited} of ${b.total}`}
              pct={b.total ? Math.round((b.visited / b.total) * 100) : 0}
            />
          ))}
        </Section>

        {/* Tags. */}
        <Section title="Trips by tag">
          {stats.tagList.map(([tag, n]) => (
            <div className="stats__bar-row" key={tag}>
              <span className="stats__tag-label">{tag}</span>
              <div className="stats__bar-track">
                <div
                  className="stats__bar-fill"
                  style={{ width: `${(n / maxTag) * 100}%`, background: '#fff' }}
                />
              </div>
              <span className="stats__row-val">{n}</span>
            </div>
          ))}
        </Section>
      </div>
    </div>
  )
}

/** Daytime line bullets for a station, for disambiguation. */
function StationLines({ complex }: { complex: { lines: string[] } }) {
  return (
    <span className="stats__row-lines">
      {complex.lines.map((l) => (
        <LineBullet key={l} line={l} />
      ))}
    </span>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="stats__section">
      <h2 className="stats__section-title">{title}</h2>
      {children}
    </section>
  )
}

function Meter({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="stats__meter">
      <div className="stats__meter-head">
        <span>{label}</span>
        <span className="stats__row-val">{pct}%</span>
      </div>
      <div className="stats__bar-track">
        <div className="stats__bar-fill" style={{ width: `${pct}%`, background: '#fff' }} />
      </div>
    </div>
  )
}
