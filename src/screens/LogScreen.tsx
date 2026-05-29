import { useState } from 'react'
import { StationSearch } from '../components/StationSearch'
import { RouteBuilder } from '../components/RouteBuilder'
import { LineBullet } from '../components/LineBullet'
import { useComplexes } from '../data/useComplexes'
import { db } from '../db/db'
import { TAGS, type Tag, type Segment } from '../types'
import type { Complex } from '../data/gtfs'

type Step = 'origin' | 'destination' | 'route' | 'confirm'

/** Local datetime string for <input type="datetime-local">, defaulting to now. */
function nowLocal(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function LogScreen() {
  const complexes = useComplexes()
  const [step, setStep] = useState<Step>('origin')
  const [origin, setOrigin] = useState<Complex | null>(null)
  const [destination, setDestination] = useState<Complex | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [tag, setTag] = useState<Tag>('commute')
  const [when, setWhen] = useState(nowLocal())

  function reset() {
    setOrigin(null)
    setDestination(null)
    setSegments([])
    setTag('commute')
    setWhen(nowLocal())
    setStep('origin')
  }

  async function save() {
    await db.trips.add({
      id: crypto.randomUUID(),
      timestamp: new Date(when).toISOString(),
      segments,
      tag,
    })
    reset()
  }

  return (
    <div className="screen">
      <header className="screen__header">
        <h1>Log a trip</h1>
      </header>
      <div className="screen__body">
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
      </div>
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
