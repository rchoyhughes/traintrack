import { exportData, importData } from '../db/db'

/** Download all local data as a JSON backup file. */
export async function downloadBackup() {
  const data = await exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `traintrack-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Read a backup file and replace all local data with it. Returns the number
 * of trips imported. Throws on malformed input.
 */
export async function restoreBackup(file: File): Promise<number> {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!Array.isArray(data?.trips)) {
    throw new Error('Not a TrainTrack backup file.')
  }
  await importData({ trips: data.trips, favorites: data.favorites ?? [] })
  return data.trips.length
}
