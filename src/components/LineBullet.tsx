import { lineColor, bulletTextColor } from '../data/lines'

// All three shuttles share the "S" bullet; Franklin (S) and Rockaway (H)
// add a superscript letter to distinguish them. 42 St shuttle is code "0".
const SHUTTLE_CODES = new Set(['0', 'S', 'H'])
const SHUTTLE_SUPS: Record<string, string> = { S: 'F', H: 'R' }

/** The iconic circular MTA line bullet (e.g. the red "2", the blue "A"). */
export function LineBullet({ line }: { line: string }) {
  const code = line.toUpperCase()
  const isShuttle = SHUTTLE_CODES.has(code)
  const sup = SHUTTLE_SUPS[code]
  const label = isShuttle ? 'S' : code
  return (
    <span
      className="bullet"
      style={{
        background: lineColor(line),
        color: bulletTextColor(line),
      }}
    >
      {label}
      {sup && <span className="bullet__sub">{sup}</span>}
    </span>
  )
}
