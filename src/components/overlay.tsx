/* eslint-disable react-refresh/only-export-components --
   context provider + its hooks intentionally colocated */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

/**
 * Tracks whether any fullscreen overlay / sheet is open, so the app shell can
 * hide its header and nav pill. This matters on iOS: elements with
 * backdrop-filter (the frosted header and glass nav) get composited above
 * overlays regardless of z-index (a WebKit quirk), so they'd otherwise cover
 * an open overlay. Hiding them while an overlay is up sidesteps it entirely.
 */
const OverlayCtx = createContext<{
  open: boolean
  setOpen: (id: string, open: boolean) => void
}>({ open: false, setOpen: () => {} })

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set())
  const setOpen = useCallback((id: string, open: boolean) => {
    setIds((prev) => {
      const next = new Set(prev)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])
  return (
    <OverlayCtx.Provider value={{ open: ids.size > 0, setOpen }}>
      {children}
    </OverlayCtx.Provider>
  )
}

/** Call from an overlay component; registers it as open while mounted. */
export function useRegisterOverlay(id: string) {
  const { setOpen } = useContext(OverlayCtx)
  useEffect(() => {
    setOpen(id, true)
    return () => setOpen(id, false)
  }, [id, setOpen])
}

/** True while any overlay is open. */
export function useOverlayOpen() {
  return useContext(OverlayCtx).open
}
