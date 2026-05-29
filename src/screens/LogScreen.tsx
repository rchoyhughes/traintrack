import { useState } from 'react'
import { StationSearch } from '../components/StationSearch'
import { LineBullet } from '../components/LineBullet'
import type { Complex } from '../data/gtfs'

type Step = 'origin' | 'destination' | 'route'

/**
 * Trip logging flow (spec §5). Step 1–2 (origin/destination) use the
 * station search. The route step (history → API suggestions → manual
 * builder) lands next, once the Directions proxy exists.
 */
export function LogScreen() {
  const [step, setStep] = useState<Step>('origin')
  const [origin, setOrigin] = useState<Complex | null>(null)
  const [destination, setDestination] = useState<Complex | null>(null)

  function reset() {
    setOrigin(null)
    setDestination(null)
    setStep('origin')
  }

  return (
    <div className="screen">
      <header className="screen__header">
        <h1>Log a trip</h1>
      </header>
      <div className="screen__body">
        {/* Selected stations as a journey summary. */}
        {(origin || destination) && (
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
              setStep('route')
            }}
          />
        )}

        {step === 'route' && origin && destination && (
          <div className="placeholder" style={{ paddingTop: 40 }}>
            <p className="placeholder__hint">
              {origin.name} → {destination.name}
            </p>
            <p className="placeholder__note">
              Route suggestions land next — for now the journey is captured.
            </p>
            <button className="btn" onClick={reset}>
              Start over
            </button>
          </div>
        )}
      </div>
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
