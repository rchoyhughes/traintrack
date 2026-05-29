import { LineBullet } from '../components/LineBullet'

/**
 * The default tab. Will hold the full logging flow (spec §5):
 * station autocomplete → route suggestions (history → API → manual) →
 * time picker → tag → save.
 */
export function LogScreen() {
  return (
    <div className="screen">
      <header className="screen__header">
        <h1>Log a trip</h1>
      </header>
      <div className="screen__body placeholder">
        <p className="placeholder__hint">
          Where did you go? Pick an origin and destination to begin.
        </p>
        <div className="placeholder__lines">
          {['1', 'A', 'Q', '7', 'L', 'G'].map((l) => (
            <LineBullet key={l} line={l} />
          ))}
        </div>
        <p className="placeholder__note">Station search coming next.</p>
      </div>
    </div>
  )
}
