/** Top header: the TrainTrack wordmark + a menu button. */
export function AppHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="appbar">
      <span className="appbar__brand">TrainTrack</span>
      <button className="appbar__menu" onClick={onMenu} aria-label="Menu">
        •••
      </button>
    </header>
  )
}
