import { useState } from 'react'
import { TabBar, type TabId } from './components/TabBar'
import { AppHeader } from './components/AppHeader'
import { MenuSheet } from './components/MenuSheet'
import { InstallPrompt } from './components/InstallPrompt'
import { LogScreen } from './screens/LogScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { MapScreen } from './screens/MapScreen'
import { StatsScreen } from './screens/StatsScreen'
import { AboutScreen } from './screens/AboutScreen'
import './App.css'

const INSTALL_DISMISSED = 'tt-install-dismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function App() {
  const [tab, setTab] = useState<TabId>('log')
  const [menuOpen, setMenuOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  // Show the install guide on a first web visit (not installed, not dismissed).
  const [installOpen, setInstallOpen] = useState(
    () => !isStandalone() && !localStorage.getItem(INSTALL_DISMISSED),
  )

  function closeInstall() {
    setInstallOpen(false)
    localStorage.setItem(INSTALL_DISMISSED, '1')
  }

  return (
    <div className="app">
      <AppHeader onMenu={() => setMenuOpen(true)} />

      <main className="app__content">
        {tab === 'log' && <LogScreen />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'map' && <MapScreen />}
        {tab === 'stats' && <StatsScreen />}
      </main>

      <TabBar active={tab} onChange={setTab} />

      {menuOpen && (
        <MenuSheet
          onClose={() => setMenuOpen(false)}
          onAbout={() => {
            setMenuOpen(false)
            setAboutOpen(true)
          }}
          onInstallHelp={() => {
            setMenuOpen(false)
            setInstallOpen(true)
          }}
        />
      )}

      {aboutOpen && <AboutScreen onClose={() => setAboutOpen(false)} />}
      {installOpen && <InstallPrompt onClose={closeInstall} />}
    </div>
  )
}

export default App
