import { useRef } from 'react'
import { downloadBackup, restoreBackup } from '../lib/dataTransfer'
import { useRegisterOverlay } from './overlay'
import posthog from '../posthog'

/** Bottom sheet opened from the header menu: data + About + install help. */
export function MenuSheet({
  onClose,
  onAbout,
  onInstallHelp,
}: {
  onClose: () => void
  onAbout: () => void
  onInstallHelp: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  useRegisterOverlay('menu')

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (
      !confirm(
        'Importing replaces all trips currently on this device. Continue?',
      )
    ) {
      e.target.value = ''
      return
    }
    try {
      const n = await restoreBackup(file)
      posthog.capture('backup_imported', { trip_count: n })
      alert(`Imported ${n} trip${n === 1 ? '' : 's'}.`)
      onClose()
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`)
    }
    e.target.value = ''
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grip" />
        <button
          className="sheet__item"
          onClick={async () => {
            await downloadBackup()
            posthog.capture('backup_exported')
          }}
        >
          <span className="sheet__icon">↑</span> Export data
        </button>
        <button
          className="sheet__item"
          onClick={() => fileRef.current?.click()}
        >
          <span className="sheet__icon">↓</span> Import data
        </button>
        <button className="sheet__item" onClick={onInstallHelp}>
          <span className="sheet__icon">＋</span> Add to Home Screen
        </button>
        <button className="sheet__item" onClick={onAbout}>
          <span className="sheet__icon">ⓘ</span> About &amp; privacy
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onImport}
        />
      </div>
    </div>
  )
}
