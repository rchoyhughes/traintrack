import { useEffect, useState } from 'react'
import { loadStations, groupComplexes, type Complex } from './gtfs'

let cache: Complex[] | null = null

/** Load and memoize the station complexes. Returns null while loading. */
export function useComplexes(): Complex[] | null {
  const [complexes, setComplexes] = useState<Complex[] | null>(cache)

  useEffect(() => {
    if (cache) return
    loadStations().then((stations) => {
      cache = groupComplexes(stations)
      setComplexes(cache)
    })
  }, [])

  return complexes
}
