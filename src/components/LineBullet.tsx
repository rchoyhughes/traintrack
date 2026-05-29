import { lineColor, bulletTextColor } from '../data/lines'

// Shuttles share the "S" bullet; Franklin Av and Rockaway Park add a
// subscript letter to distinguish them.
const SHUTTLE_SUB: Record<string, string> = { FS: 'F', H: 'R' }

/** The iconic circular MTA line bullet (e.g. the red "2", the blue "A"). */
export function LineBullet({ line }: { line: string }) {
  const code = line.toUpperCase()
  const sub = SHUTTLE_SUB[code]
  const label = sub ? 'S' : code
  return (
    <span
      className="bullet"
      style={{
        background: lineColor(line),
        color: bulletTextColor(line),
      }}
    >
      {label}
      {sub && <span className="bullet__sub">{sub}</span>}
    </span>
  )
}
