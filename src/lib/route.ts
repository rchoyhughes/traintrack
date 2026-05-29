import type { Complex } from '../data/gtfs'

/** Map of complex id -> complex, for quick lookup. */
export function indexComplexes(complexes: Complex[]): Map<string, Complex> {
  return new Map(complexes.map((c) => [c.id, c]))
}

/** All complexes a given line serves, sorted by name. */
export function complexesOnLine(
  complexes: Complex[],
  line: string,
): Complex[] {
  return complexes
    .filter((c) => c.lines.includes(line))
    .sort((a, b) => a.name.localeCompare(b.name))
}
