import { useEffect, useState } from 'react'

/**
 * TEMPORARY diagnostic overlay — shows live viewport metrics so we can see
 * exactly what's wrong on iOS PWA cold start vs. after an overscroll.
 * Remove once the height bug is understood.
 */
export function DebugViewport() {
  const [text, setText] = useState('')

  useEffect(() => {
    const update = () => {
      const vv = window.visualViewport
      const appH = getComputedStyle(document.documentElement)
        .getPropertyValue('--app-height')
        .trim()
      setText(
        [
          `iH:${window.innerHeight}`,
          `vvH:${vv ? Math.round(vv.height) : '-'}`,
          `vvTop:${vv ? Math.round(vv.offsetTop) : '-'}`,
          `clH:${document.documentElement.clientHeight}`,
          `bodyH:${document.body.clientHeight}`,
          `sY:${Math.round(window.scrollY)}`,
          `app:${appH}`,
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
