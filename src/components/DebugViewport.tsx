import { useEffect, useState } from 'react'

/**
 * TEMPORARY diagnostic overlay — shows live viewport metrics so we can see
 * exactly what's wrong on iOS PWA cold start vs. after an overscroll.
 * Remove once the height bug is understood.
 */
export function DebugViewport() {
  const [text, setText] = useState('')

  useEffect(() => {
    // Measure a CSS viewport unit by probing a hidden element.
    const probe = (unit: string) => {
      const d = document.createElement('div')
      d.style.cssText = `position:fixed;top:0;left:0;width:0;height:100${unit};visibility:hidden;pointer-events:none;`
      document.body.appendChild(d)
      const h = d.clientHeight
      d.remove()
      return h
    }
    const update = () => {
      const vv = window.visualViewport
      const app = document.querySelector('.app')
      setText(
        [
          `iH:${window.innerHeight}`,
          `vvH:${vv ? Math.round(vv.height) : '-'}`,
          `svh:${probe('svh')}`,
          `dvh:${probe('dvh')}`,
          `lvh:${probe('lvh')}`,
          `appH:${app ? Math.round(app.getBoundingClientRect().height) : '-'}`,
        ].join('  '),
      )
    }
    update()
    const id = setInterval(update, 200)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    return () => {
      clearInterval(id)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top)',
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'rgba(220,0,0,0.85)',
        color: '#fff',
        fontSize: '10px',
        lineHeight: '14px',
        padding: '2px 6px',
        fontFamily: 'ui-monospace, monospace',
        pointerEvents: 'none',
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  )
}
