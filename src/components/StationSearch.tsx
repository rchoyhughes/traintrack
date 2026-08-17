import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useComplexes } from '../data/useComplexes'
import { searchComplexes } from '../lib/search'
import { LineBullet } from './LineBullet'
import type { Complex } from '../data/gtfs'
import { capture } from '../posthog'

const BOROUGH: Record<string, string> = {
  M: 'Manhattan',
  Bk: 'Brooklyn',
  Bx: 'Bronx',
  Q: 'Queens',
  SI: 'Staten Island',
}

export function StationSearch({
  label,
  onSelect,
  autoFocus = false,
}: {
  label: string
  onSelect: (complex: Complex) => void
  /** Focus the input on mount. Off by default so opening the Log screen
      doesn't force the keyboard open; enabled for mid-flow steps the user
      reaches by tapping (e.g. the destination search). */
  autoFocus?: boolean
}) {
  const [query, setQuery] = useState('')
  const complexes = useComplexes()
  const favorites = useLiveQuery(() =>
    db.favorites.orderBy('addedAt').reverse().toArray(),
  )
  const favoriteIds = useMemo(
    () => new Set(favorites?.map((f) => f.id)),
    [favorites],
  )

  const results = useMemo(() => {
    if (!complexes) return []
    if (query.trim()) return searchComplexes(complexes, query)
    // Empty query: show favorites first.
    if (!favorites?.length) return []
    const byId = new Map(complexes.map((c) => [c.id, c]))
    return favorites.map((f) => byId.get(f.id)).filter(Boolean) as Complex[]
  }, [complexes, query, favorites])

  async function toggleFavorite(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const action = favoriteIds.has(id) ? 'removed' : 'added'
    if (action === 'removed') await db.favorites.delete(id)
    else await db.favorites.add({ id, addedAt: new Date().toISOString() })
    capture('favorite_toggled', { action })
  }

  return (
    <div className="search">
      <label className="search__label">{label}</label>
      <input
        className="search__input"
        type="search"
        inputMode="search"
        autoFocus={autoFocus}
        placeholder="Search stations…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {!complexes ? (
        <p className="placeholder__note">Loading stations…</p>
      ) : (
        <ul className="search__results">
          {!query.trim() && !results.length && (
            <li className="search__hint">
              Type a station name. Star stations to pin them here.
            </li>
          )}
          {results.map((c) => (
            <li
              key={c.id}
              className="search__row"
              onClick={() => onSelect(c)}
            >
              <button
                className={`search__star${favoriteIds.has(c.id) ? ' is-on' : ''}`}
                onClick={(e) => toggleFavorite(c.id, e)}
                aria-label="Toggle favorite"
              >
                {favoriteIds.has(c.id) ? '★' : '☆'}
              </button>
              <div className="search__info">
                <span className="search__name">{c.name}</span>
                <span className="search__borough">
                  {BOROUGH[c.borough] ?? c.borough}
                </span>
              </div>
              <div className="search__lines">
                {c.lines.map((l) => (
                  <LineBullet key={l} line={l} />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
