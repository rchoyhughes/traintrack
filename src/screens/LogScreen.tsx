import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { StationSearch } from '../components/StationSearch'
import { RouteBuilder } from '../components/RouteBuilder'
import { LineBullet } from '../components/LineBullet'
import { useComplexes } from '../data/useComplexes'
import { db } from '../db/db'
import { TAGS, type Tag, type Segment } from '../types'
import type { Complex } from '../data/gtfs'

type Step = 'origin' | 'destination' | 'route' | 'confirm'

interface CommonTrip {
  origin: string
  destination: string
  segments: Segment[]
  tag: Tag
  count: number
}

/** Most-frequent directional trips, with their most-common route + tag. */
function deriveCommonTrips(
  trips: { origin: string; destination: string; segments: Segment[]; tag: Tag }[],
): CommonTrip[] {
  const groups = new Map<
    string,
    { origin: string; destination: string; count: number; routes: Map<string, { segs: Segment[]; n: number }>; tags: Map<string, number> }
  >()
  for (const t of trips) {
    if (!t.origin || !t.destination) continue
    const key = `${t.origin}>${t.destination}`
    let g = groups.get(key)
    if (!g) {
      g = { origin: t.origin, destination: t.destination, count: 0, routes: new Map(), tags: new Map() }
      groups.set(key, g)
    }
    g.count++
    const sig = JSON.stringify(t.segments)
    const r = g.routes.get(sig)
    if (r) r.n++
    else g.routes.set(sig, { segs: t.segments, n: 1 })
    g.tags.set(t.tag, (g.tags.get(t.tag) ?? 0) + 1)
  }
  return [...groups.values()]
    .filter((g) => g.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((g) => {
      const route = [...g.routes.values()].sort((a, b) => b.n - a.n)[0]
      const tag = [...g.tags.entries()].sort((a, b) => b[1] - a[1])[0][0] as Tag
      return {
        origin: g.origin,
        destination: g.destination,
        segments: route.segs,
        tag,
        count: g.count,
      }
    })
}

/** Local datetime string for <input type="datetime-local">, defaulting to now. */
function nowLocal(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function LogScreen() {
  const complexes = useComplexes()
  const trips = useLiveQuery(() => db.trips.toArray())
  const [step, setStep] = useState<Step>('origin')
  const [origin, setOrigin] = useState<Complex | null>(null)
  const [destination, setDestination] = useState<Complex | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [tag, setTag] = useState<Tag>('commute')
  const [when, setWhen] = useState(nowLocal())
  const [saved, setSaved] = useState(false)

  const byId = useMemo(
    () => (complexes ? new Map(complexes.map((c) => [c.id, c])) : null),
    [complexes],
  )
  const commonTrips = useMemo(
    () => (trips ? deriveCommonTrips(trips) : []),
    [trips],
  )

  /** Prefill the whole trip from a common-trip card and jump to confirm. */
  function applyCommonTrip(ct: CommonTrip) {
    if (!byId) return
    const o = byId.get(ct.origin)
    const d = byId.get(ct.destination)
    if (!o || !d) return
    setOrigin(o)
    setDestination(d)
    setSegments(ct.segments)
    setTag(ct.tag)
    setWhen(nowLocal())
    setStep('confirm')
  }

  function reset() {
    setOrigin(null)
    setDestination(null)
    setSegments([])
    setTag('commute')
    setWhen(nowLocal())
    setStep('origin')
  }

  async function save() {
    if (!origin || !destination) return
    await db.trips.add({
      id: crypto.randomUUID(),
      timestamp: new Date(when).toISOString(),
      origin: origin.id,
      destination: destination.id,
      segments,
      tag,
    })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      reset()
    }, 1600)
  }

  return (
    <div className="screen">
      <header className="screen__header">
        <h1>Log a trip</h1>
      </header>
      <div className="screen__body">
        {saved && destination ? (
          <TripSaved destination={destination} segments={segments} />
        ) : (
          <>
        {(origin || destination) && step !== 'confirm' && (
          <div className="journey">
            <StationChip
              role="From"
              complex={origin}
              onClick={() => setStep('origin')}
            />
            <span className="journey__arrow">→</span>
            <StationChip
              role="To"
              complex={destination}
              onClick={() => origin && setStep('destination')}
            />
          </div>
        )}

        {step === 'origin' && !origin && commonTrips.length > 0 && byId && (
          <div className="common">
            <h2 className="common__title">Common trips</h2>
            {commonTrips.map((ct, i) => {
              const o = byId.get(ct.origin)
              const d = byId.get(ct.destination)
              if (!o || !d) return null
              return (
                <button key={i} className="common__card" onClick={() => applyCommonTrip(ct)}>
                  <span className="common__route">
                    <span className="common__stn">{o.name}</span>
                    <span className="common__arrow">→</span>
                    <span className="common__stn">{d.name}</span>
                  </span>
                  <span className="common__lines">
                    {ct.segments.map((s, j) => (
                      <LineBullet key={j} line={s.line} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {step === 'origin' && (
          <StationSearch
            label="Where did you start?"
            onSelect={(c) => {
              setOrigin(c)
              setStep('destination')
            }}
          />
        )}

        {step === 'destination' && (
          <StationSearch
            label="Where did you end up?"
            onSelect={(c) => {
              setDestination(c)
              setSegments([])
              setStep('route')
            }}
          />
        )}

        {step === 'route' && origin && destination && complexes && (
          <RouteBuilder
            origin={origin}
            destination={destination}
            complexes={complexes}
            onComplete={(segs) => {
              setSegments(segs)
              setStep('confirm')
            }}
          />
        )}

        {step === 'confirm' && origin && destination && (
          <div className="confirm">
            <RouteSummary
              origin={origin}
              destination={destination}
              segments={segments}
            />

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

            <div className="confirm__actions">
              <button className="btn btn--ghost" onClick={() => setStep('route')}>
                Back
              </button>
              <button className="btn" onClick={save}>
                Save trip
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}

/** Success animation shown briefly after a trip is logged. */
function TripSaved({
  destination,
  segments,
}: {
  destination: Complex
  segments: Segment[]
}) {
  return (
    <div className="saved">
      <svg className="saved__check" viewBox="0 0 52 52" aria-hidden="true">
        <circle className="saved__check-ring" cx="26" cy="26" r="23" />
        <path className="saved__check-mark" d="M15 27 l7 7 l15 -16" />
      </svg>
      <div className="saved__route">
        {segments.map((s, i) => (
          <span
            key={i}
            className="saved__bullet"
            style={{ animationDelay: `${0.35 + i * 0.09}s` }}
          >
            <LineBullet line={s.line} />
          </span>
        ))}
      </div>
      <p className="saved__text">Logged · {destination.name}</p>
    </div>
  )
}

function RouteSummary({
  origin,
  destination,
  segments,
}: {
  origin: Complex
  destination: Complex
  segments: Segment[]
}) {
  return (
    <div className="route-summary">
      <span className="route-summary__node">{origin.name}</span>
      {segments.map((s, i) => (
        <span key={i} className="route-summary__leg">
          <LineBullet line={s.line} />
        </span>
      ))}
      <span className="route-summary__node">{destination.name}</span>
    </div>
  )
}

function StationChip({
  role,
  complex,
  onClick,
}: {
  role: string
  complex: Complex | null
  onClick: () => void
}) {
  return (
    <button
      className={`chip${complex ? '' : ' chip--empty'}`}
      onClick={onClick}
      disabled={!complex && role === 'To'}
    >
      <span className="chip__role">{role}</span>
      {complex ? (
        <>
          <span className="chip__name">{complex.name}</span>
          <span className="chip__lines">
            {complex.lines.map((l) => (
              <LineBullet key={l} line={l} />
            ))}
          </span>
        </>
      ) : (
        <span className="chip__name chip__name--dim">Choose a station</span>
      )}
    </button>
  )
}
