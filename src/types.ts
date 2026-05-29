/** Core domain types for TrainTrack. See traintrack-spec.md §4. */

/** A predefined trip category. "other" is the catch-all. */
export type Tag =
  | 'commute'
  | 'exploring'
  | 'social'
  | 'errand'
  | 'travel'
  | 'other'

export const TAGS: Tag[] = [
  'commute',
  'exploring',
  'social',
  'errand',
  'travel',
  'other',
]

/**
 * One unbroken ride on a single line. A transfer is implicit: one segment's
 * `destination` is the next segment's `origin`.
 *
 * `origin` / `destination` are station *complex* ids (the unit the user
 * picks and the unit counted as "visited").
 * `line` is the route short name (e.g. "Q", "2", "7").
 */
export interface Segment {
  origin: string
  destination: string
  line: string
}

/** A single logged journey. Stored in IndexedDB. */
export interface Trip {
  /** UUID, generated at creation. */
  id: string
  /** ISO 8601. Defaults to now; backdating allowed. */
  timestamp: string
  segments: Segment[]
  tag: Tag
  notes?: string
}

/** A user-favorited station (GTFS stop / complex id). */
export interface Favorite {
  /** Station or complex id. */
  id: string
  /** When it was favorited (ISO 8601), for ordering. */
  addedAt: string
}
