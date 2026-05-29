export type TabId = 'log' | 'history' | 'map' | 'stats'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'log', label: 'Log', icon: '＋' },
  { id: 'history', label: 'History', icon: '≣' },
  { id: 'map', label: 'Map', icon: '◍' },
  { id: 'stats', label: 'Stats', icon: '▦' },
]

/** Floating, translucent ("liquid glass") bottom navigation pill. */
export function TabBar({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <nav className="navbar">
      <div className="navbar__pill">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`navbar__item${active === tab.id ? ' is-active' : ''}`}
            onClick={() => onChange(tab.id)}
            aria-current={active === tab.id}
          >
            <span className="navbar__icon">{tab.icon}</span>
            <span className="navbar__label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
