import { useMemo, useState } from 'react'
import { LineBullet } from './LineBullet'
import { complexesOnLine, indexComplexes } from '../lib/route'
import type { Complex } from '../data/gtfs'
import type { Segment } from '../types'

/**
 * Guided manual route builder (spec §5 fallback). At each step: pick the
 * line you boarded, then where you got off — your destination (arrive) or a
 * transfer point on that line. Repeats until you reach the destination.
 */
export function RouteBuilder({
  origin,
  destination,
  complexes,
  onComplete,
}: {
  origin: Complex
  destination: Complex
  complexes: Complex[]
  onComplete: (segments: Segment[]) => void
}) {
  const byId = useMemo(() => indexComplexes(complexes), [complexes])
  const [segments, setSegments] = useState<Segment[]>([])
  const [line, setLine] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  // Where we currently are: destination of the last segment, or the origin.
  const current = segments.length
    ? byId.get(segments[segments.length - 1].destination)!
    : origin

  const destOnLine = line ? destination.lines.includes(line) : false

  // Transfer candidates on the chosen line (exclude where we are + the dest,
  // which gets its own "arrive" action).
  const transferStops = useMemo(() => {
    if (!line) return []
    const f = filter.trim().toLowerCase()
    return complexesOnLine(complexes, line)
      .filter((c) => c.id !== current.id && c.id !== destination.id)
      .filter((c) => !f || c.name.toLowerCase().includes(f))
  }, [line, filter, complexes, current.id, destination.id])

  function boardLine(l: string) {
    setLine(l)
    setFilter('')
  }

  function arrive() {
    if (!line) return
    onComplete([
      ...segments,
      { origin: current.id, destination: destination.id, line },
    ])
  }

  function transferAt(stop: Complex) {
    if (!line) return
    setSegments([
      ...segments,
      { origin: current.id, destination: stop.id, line },
    ])
    setLine(null)
    setFilter('')
  }

  function undo() {
    if (line) {
      setLine(null)
    } else if (segments.length) {
      setSegments(segments.slice(0, -1))
    }
  }

  return (
    <div className="builder">
      {/* Progress chain of completed segments. */}
      {segments.length > 0 && (
        <div className="builder__chain">
          <span className="builder__node">{origin.name}</span>
          {segments.map((s, i) => (
            <span key={i} className="builder__leg">
              <LineBullet line={s.line} />
              <span className="builder__node">
                {byId.get(s.destination)?.name}
              </span>
            </span>
          ))}
        </div>
      )}

      {!line ? (
        <div className="builder__step">
          <p className="builder__prompt">
            {segments.length === 0 ? 'Board at' : 'Transfer at'}{' '}
            <strong>{current.name}</strong> — which line?
          </p>
          <div className="builder__lines">
            {current.lines.map((l) => (
              <button
                key={l}
                className="builder__linebtn"
                onClick={() => boardLine(l)}
              >
                <LineBullet line={l} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="builder__step">
          <p className="builder__prompt">
            Riding the <LineBullet line={line} /> — where did you get off?
          </p>

          {destOnLine && (
            <button className="builder__arrive" onClick={arrive}>
              Arrive at {destination.name}
            </button>
          )}

          <input
            className="search__input"
            type="search"
            placeholder="Or transfer at…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <ul className="search__results">
            {transferStops.slice(0, 30).map((c) => (
              <li
                key={c.id}
                className="search__row"
                onClick={() => transferAt(c)}
              >
                <div className="search__info">
                  <span className="search__name">{c.name}</span>
                </div>
                <div className="search__lines">
                  {c.lines.map((l) => (
                    <LineBullet key={l} line={l} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(line || segments.length > 0) && (
        <button className="builder__undo" onClick={undo}>
          ← {line ? 'Change line' : 'Undo last leg'}
        </button>
      )}
    </div>
  )
}
