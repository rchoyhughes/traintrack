/**
 * Official MTA subway line colors. Lines sharing a trunk share a color
 * (e.g. A/C/E are all "IND Eighth Avenue" blue). Source: MTA branding.
 */
export const LINE_COLORS: Record<string, string> = {
  // IRT Broadway–Seventh Avenue
  '1': '#EE352E',
  '2': '#EE352E',
  '3': '#EE352E',
  // IRT Lexington Avenue
  '4': '#00933C',
  '5': '#00933C',
  '6': '#00933C',
  // IRT Flushing
  '7': '#B933AD',
  // IND Eighth Avenue
  A: '#0039A6',
  C: '#0039A6',
  E: '#0039A6',
  // IND Sixth Avenue
  B: '#FF6319',
  D: '#FF6319',
  F: '#FF6319',
  M: '#FF6319',
  // IND Crosstown
  G: '#6CBE45',
  // BMT Canarsie
  L: '#A7A9AC',
  // BMT Nassau Street
  J: '#996633',
  Z: '#996633',
  // BMT Broadway
  N: '#FCCC0A',
  Q: '#FCCC0A',
  R: '#FCCC0A',
  W: '#FCCC0A',
  // Shuttles (all the same gray; bullets differ by superscript)
  '0': '#808183', // 42 St Shuttle
  S: '#808183', // Franklin Av Shuttle
  H: '#808183', // Rockaway Park Shuttle
}

/** Every line in the system, in standard order. Used by the route builder's
 *  "show all lines" fallback for unusual reroutes. */
export const ALL_LINES: string[] = [
  '1', '2', '3', '4', '5', '6', '7',
  'A', 'C', 'E', 'B', 'D', 'F', 'M',
  'G', 'J', 'Z', 'L', 'N', 'Q', 'R', 'W',
  '0', 'S', 'H', // 42 St, Franklin Av, Rockaway Park shuttles
]

/** Untraveled / unknown segment color. */
export const DIM_GRAY = '#3a3a3a'

/** Look up a line's color, falling back to a neutral gray. */
export function lineColor(line: string): string {
  return LINE_COLORS[line.toUpperCase()] ?? '#808183'
}

/** Lines whose bullets use dark text instead of white (yellow trunk). */
const DARK_TEXT_LINES = new Set(['N', 'Q', 'R', 'W'])

export function bulletTextColor(line: string): string {
  return DARK_TEXT_LINES.has(line.toUpperCase()) ? '#000000' : '#FFFFFF'
}
