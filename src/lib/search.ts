import type { Complex } from '../data/gtfs'

/** Normalize for forgiving matching: lowercase, strip punctuation. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.\-/]/g, ' ')
    .replace(/\bst\b/g, 'street')
    .replace(/\bav\b/g, 'avenue')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Fuzzy-rank complexes against a query. Token-based so "14 union" matches
 * "14 St-Union Sq". Prefix matches outrank mid-string matches.
 */
export function searchComplexes(
  complexes: Complex[],
  query: string,
  limit = 40,
): Complex[] {
  const q = normalize(query)
  if (!q) return []
  const tokens = q.split(' ')

  const scored: { c: Complex; score: number }[] = []
  for (const c of complexes) {
    const name = normalize(c.name)
    let score = 0
    let matchedAll = true

    for (const tok of tokens) {
      const idx = name.indexOf(tok)
      if (idx === -1) {
        matchedAll = false
        break
      }
      // Word-boundary / start matches score higher.
      if (idx === 0) score += 3
      else if (name[idx - 1] === ' ') score += 2
      else score += 1
    }
    if (!matchedAll) continue

    // Bonus for whole-name prefix and shorter (more specific) names.
    if (name.startsWith(q)) score += 5
    score -= name.length * 0.01

    scored.push({ c, score })
  }

  scored.sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name))
  return scored.slice(0, limit).map((s) => s.c)
}
