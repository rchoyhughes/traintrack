import type { Complex } from '../data/gtfs'

/** Map of complex id -> complex, for quick lookup. */
export function indexComplexes(complexes: Complex[]): Map<string, Complex> {
  return new Map(complexes.map((c) => [c.id, c]))
}

/**
 * All complexes a given line serves (across all service periods), sorted by
 * name. Uses allLines so off-peak stops aren't excluded.
 */
export function complexesOnLine(
  complexes: Complex[],
  line: string,
): Complex[] {
  return complexes
    .filter((c) => c.allLines.includes(line))
    .sort((a, b) => a.name.localeCompare(b.name))
}
