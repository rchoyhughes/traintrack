/** Time-range lens shared by the Map, History, and Stats screens. */

export type TimeRange = 'all' | 'week' | 'month' | 'year'

/** Options in display order; "All time" leads since it's the default. */
export const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'week', label: 'Last week' },
  { id: 'month', label: 'Last month' },
  { id: 'year', label: 'Last year' },
]

/**
 * Earliest timestamp (ms) included by a range, or null for "all time".
 * Uses calendar arithmetic (a month back = same day last month) rather than
 * fixed day counts, so "last month" tracks month length.
 */
export function rangeCutoff(range: TimeRange, now: number = Date.now()): number | null {
  const d = new Date(now)
  switch (range) {
    case 'week':
      d.setDate(d.getDate() - 7)
      return d.getTime()
    case 'month':
      d.setMonth(d.getMonth() - 1)
      return d.getTime()
    case 'year':
      d.setFullYear(d.getFullYear() - 1)
      return d.getTime()
    case 'all':
      return null
  }
}

/** Trips at or after the range's cutoff. Returns the input as-is for "all". */
export function filterTripsByRange<T extends { timestamp: string }>(
  trips: T[],
  range: TimeRange,
): T[] {
  const cutoff = rangeCutoff(range)
  if (cutoff === null) return trips
  return trips.filter((t) => new Date(t.timestamp).getTime() >= cutoff)
}
