import Dexie, { type EntityTable } from 'dexie'
import type { Trip, Favorite } from '../types'

/**
 * Local-first storage. All user data lives here in the browser —
 * nothing is sent to a server. See traintrack-spec.md §2.
 */
const db = new Dexie('traintrack') as Dexie & {
  trips: EntityTable<Trip, 'id'>
  favorites: EntityTable<Favorite, 'id'>
}

db.version(1).stores({
  // Indexed fields. `segments` is stored but not indexed (queried in-memory).
  trips: 'id, timestamp, tag',
  favorites: 'id, addedAt',
})

export { db }

/** Export the entire database as a JSON-serializable object (backup). */
export async function exportData() {
  const [trips, favorites] = await Promise.all([
    db.trips.toArray(),
    db.favorites.toArray(),
  ])
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    trips,
    favorites,
  }
}

/** Replace all local data with an imported backup. */
export async function importData(data: {
  trips: Trip[]
  favorites: Favorite[]
}) {
  await db.transaction('rw', db.trips, db.favorites, async () => {
    await db.trips.clear()
    await db.favorites.clear()
    await db.trips.bulkAdd(data.trips)
    await db.favorites.bulkAdd(data.favorites)
  })
}
