import { useLayoutEffect, useRef, useState } from 'react'

export type TabId = 'log' | 'history' | 'map' | 'stats'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'log', label: 'Log', icon: '＋' },
  { id: 'history', label: 'History', icon: '≣' },
  { id: 'map', label: 'Map', icon: '◍' },
  { id: 'stats', label: 'Stats', icon: '▦' },
]

/** Floating "liquid glass" nav pill with a sliding active indicator. */
export function TabBar({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  const pillRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  })

  // Measure the active item so the indicator can slide to it.
  useLayoutEffect(() => {
    const el = itemRefs.current[active]
    const pill = pillRef.current
    if (el && pill) {
      const pr = pill.getBoundingClientRect()
      const er = el.getBoundingClientRect()
      setIndicator({ left: er.left - pr.left, width: er.width })
    }
  }, [active])

  return (
    <nav className="navbar">
      <div className="navbar__pill" ref={pillRef}>
        <span
          className="navbar__indicator"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
            opacity: indicator.width ? 1 : 0,
          }}
        />
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              itemRefs.current[tab.id] = el
            }}
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
