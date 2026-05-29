import { useMemo, useState } from 'react'
import { LineBullet } from './LineBullet'
import { complexesOnLine, indexComplexes } from '../lib/route'
import { oostNeighbors } from '../data/transfers'
import type { Complex } from '../data/gtfs'
import type { Segment } from '../types'

/**
 * Guided manual route builder (spec §5 fallback). At each step: pick the
 * line you boarded, then where you got off — your destination (arrive) or a
 * transfer point on that line. Repeats until you reach the destination.
 *
 * Out-of-system transfers: at any boarding step you may also board a line at
 * an OOST-linked station (e.g. walk Lex Av/63 → Lex Av/59). The segment then
 * originates at the linked complex.
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
  // Where the in-progress segment boards (the current complex, or an
  // OOST-linked one if the user walked there).
  const [boardAt, setBoardAt] = useState<Complex | null>(null)
  const [filter, setFilter] = useState('')

  // Where we are now: destination of the last segment, or the trip origin.
  const current = segments.length
    ? byId.get(segments[segments.length - 1].destination)!
    : origin

  // OOST-linked complexes reachable from where we are.
  const oostLinks = useMemo(
    () =>
      oostNeighbors(current.id)
        .map((id) => byId.get(id))
        .filter(Boolean) as Complex[],
    [current.id, byId],
  )

  const destOnLine = line ? destination.allLines.includes(line) : false

  const transferStops = useMemo(() => {
    if (!line || !boardAt) return []
    const f = filter.trim().toLowerCase()
    return complexesOnLine(complexes, line)
      .filter((c) => c.id !== boardAt.id && c.id !== destination.id)
      .filter((c) => !f || c.name.toLowerCase().includes(f))
  }, [line, boardAt, filter, complexes, destination.id])

  function board(l: string, at: Complex) {
    setLine(l)
    setBoardAt(at)
    setFilter('')
  }

  function arrive() {
    if (!line || !boardAt) return
    onComplete([
      ...segments,
      { origin: boardAt.id, destination: destination.id, line },
    ])
  }

  function transferAt(stop: Complex) {
    if (!line || !boardAt) return
    setSegments([
      ...segments,
      { origin: boardAt.id, destination: stop.id, line },
    ])
    setLine(null)
    setBoardAt(null)
    setFilter('')
  }

  function undo() {
    if (line) {
      setLine(null)
      setBoardAt(null)
    } else if (segments.length) {
      setSegments(segments.slice(0, -1))
    }
  }

  return (
    <div className="builder">
      {segments.length > 0 && (
        <Chain origin={origin} segments={segments} byId={byId} />
      )}

      {!line ? (
        <div className="builder__step">
          <p className="builder__prompt">
            {segments.length === 0 ? 'Board at' : 'Transfer at'}{' '}
            <strong>{current.name}</strong> — which line?
          </p>
          <div className="builder__lines">
            {current.allLines.map((l) => (
              <button
                key={l}
                className="builder__linebtn"
                onClick={() => board(l, current)}
              >
                <LineBullet line={l} />
              </button>
            ))}
          </div>

          {oostLinks.map((link) => (
            <div key={link.id} className="builder__oost">
              <span className="builder__oost-label">
                ⇄ transfer to {link.name}
              </span>
              <div className="builder__lines">
                {link.allLines.map((l) => (
                  <button
                    key={l}
                    className="builder__linebtn"
                    onClick={() => board(l, link)}
                  >
                    <LineBullet line={l} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="builder__step">
          <p className="builder__prompt">
            Riding the <LineBullet line={line} /> from{' '}
            <strong>{boardAt!.name}</strong> — where did you get off?
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

/** Visual chain of the route so far, marking out-of-station transfer walks. */
function Chain({
  origin,
  segments,
  byId,
}: {
  origin: Complex
  segments: Segment[]
  byId: Map<string, Complex>
}) {
  let pos = origin.id
  return (
    <div className="builder__chain">
      <span className="builder__node">{origin.name}</span>
      {segments.map((s, i) => {
        const walked = s.origin !== pos
        const boardName = byId.get(s.origin)?.name
        pos = s.destination
        return (
          <span key={i} className="builder__leg">
            {walked && (
              <span className="builder__walk">⇄ {boardName}</span>
            )}
            <LineBullet line={s.line} />
            <span className="builder__node">
              {byId.get(s.destination)?.name}
            </span>
          </span>
        )
      })}
    </div>
  )
}
