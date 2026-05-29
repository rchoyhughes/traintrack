import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Drive the app height from JS. In an installed iOS PWA the CSS `dvh` unit
 * resolves to a stale (too-short) value on cold start, leaving dead space at
 * the bottom until something forces a relayout. Reading the real viewport
 * height into --app-height, and re-applying it across the events where iOS
 * settles the viewport, keeps the layout correct from launch.
 */
function setAppHeight() {
  const h = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${h}px`)
}
setAppHeight()
window.addEventListener('resize', setAppHeight)
window.addEventListener('orientationchange', setAppHeight)
window.addEventListener('load', setAppHeight)
window.visualViewport?.addEventListener('resize', setAppHeight)
// iOS standalone often only settles the viewport a beat after launch.
requestAnimationFrame(setAppHeight)
setTimeout(setAppHeight, 300)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
