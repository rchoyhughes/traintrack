import { useState } from 'react'
import { TabBar, type TabId } from './components/TabBar'
import { LogScreen } from './screens/LogScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { MapScreen } from './screens/MapScreen'
import { StatsScreen } from './screens/StatsScreen'
import './App.css'

function App() {
  // Log loads by default (spec §6).
  const [tab, setTab] = useState<TabId>('log')

  return (
    <div className="app">
      <main className="app__content">
        {tab === 'log' && <LogScreen />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'map' && <MapScreen />}
        {tab === 'stats' && <StatsScreen />}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}

export default App
