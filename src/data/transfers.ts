/**
 * Free out-of-system transfers (OOST): station pairs where you can transfer
 * without paying again, but which are NOT inside one fare-control complex.
 * Unlike complexes, you physically exit one station and walk to the other.
 *
 * Only two remain in the system that aren't already a named complex:
 *   - Lexington Av/63 St (M,Q) ↔ Lexington Av/59 St (N,R,W,4,5,6)
 *   - Junius St (3) ↔ Livonia Av (L)
 *
 * Keyed by MTA complex id.
 */
const OOST_PAIRS: [string, string][] = [
  ['223', '613'], // Lex Av/63 ↔ Lex Av/59
  ['349', '135'], // Junius St ↔ Livonia Av
]

const oostMap = new Map<string, string[]>()
for (const [a, b] of OOST_PAIRS) {
  oostMap.set(a, [...(oostMap.get(a) ?? []), b])
  oostMap.set(b, [...(oostMap.get(b) ?? []), a])
}

/** Complex ids reachable from `complexId` via a free out-of-station transfer. */
export function oostNeighbors(complexId: string): string[] {
  return oostMap.get(complexId) ?? []
}
