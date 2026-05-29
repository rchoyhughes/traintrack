import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Drive the app height from JS into --app-height. In an installed iOS PWA the
 * CSS `dvh` unit resolves stale on cold start, leaving dead space at the
 * bottom. We use window.innerHeight (the layout viewport) — NOT
 * visualViewport.height, which shrinks when the keyboard opens and would
 * collapse the app. innerHeight stays the full screen height with the
 * keyboard overlaying it. Re-apply across the events where iOS settles the
 * viewport (incl. pageshow for cold launch / restore from background).
 */
function setAppHeight() {
  document.documentElement.style.setProperty(
    '--app-height',
    `${window.innerHeight}px`,
  )
}
setAppHeight()
window.addEventListener('resize', setAppHeight)
window.addEventListener('orientationchange', setAppHeight)
window.addEventListener('load', setAppHeight)
window.addEventListener('pageshow', setAppHeight)
// iOS standalone often only settles the viewport a beat after launch.
requestAnimationFrame(setAppHeight)
setTimeout(setAppHeight, 300)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
