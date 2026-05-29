import { lineColor, bulletTextColor } from '../data/lines'

/** The iconic circular MTA line bullet (e.g. the red "2", the blue "A"). */
export function LineBullet({ line }: { line: string }) {
  return (
    <span
      className="bullet"
      style={{
        background: lineColor(line),
        color: bulletTextColor(line),
      }}
    >
      {line.toUpperCase()}
    </span>
  )
}
