/**
 * Add-to-Home-Screen walkthrough. Shows automatically on first web visit
 * (when not already installed), and can be reopened from the menu. Also warns
 * that data is per-install, so trips don't silently get stranded.
 */
export function InstallPrompt({ onClose }: { onClose: () => void }) {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="install" onClick={(e) => e.stopPropagation()}>
        <h2 className="install__title">Add TrainTrack to your Home Screen</h2>
        <p className="install__lede">
          Install it for a full-screen, app-like experience that launches
          instantly — even underground.
        </p>

        {isIOS ? (
          <ol className="install__steps">
            <li>
              Tap the <strong>Share</strong> button (the square with an upward
              arrow) in Safari's toolbar.
            </li>
            <li>
              Scroll down and tap <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Tap <strong>Add</strong>, then open TrainTrack from your Home
              Screen.
            </li>
          </ol>
        ) : (
          <ol className="install__steps">
            <li>
              Open your browser's menu (often <strong>⋮</strong> or the share
              icon).
            </li>
            <li>
              Choose <strong>Install</strong> or <strong>Add to Home Screen</strong>.
            </li>
          </ol>
        )}

        <p className="install__note">
          Heads up: the installed app keeps its trips <strong>separately</strong>{' '}
          from this browser tab — they don't sync. Log your trips in the
          installed app, and use <strong>Export</strong> in the menu to back
          them up.
        </p>

        <button className="btn install__done" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  )
}
