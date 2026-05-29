export type TabId = 'log' | 'history' | 'map' | 'stats'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'log', label: 'Log', icon: '＋' },
  { id: 'history', label: 'History', icon: '≣' },
  { id: 'map', label: 'Map', icon: '◍' },
  { id: 'stats', label: 'Stats', icon: '▦' },
]

export function TabBar({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tabbar__item${active === tab.id ? ' is-active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id}
        >
          <span className="tabbar__icon">{tab.icon}</span>
          <span className="tabbar__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
