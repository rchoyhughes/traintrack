import { useState } from 'react'
import { useRegisterOverlay } from '../components/overlay'
import { analyticsEnabled, setAnalyticsEnabled } from '../posthog'

/** About + privacy. Opened from the menu; full-screen overlay. */
export function AboutScreen({ onClose }: { onClose: () => void }) {
  useRegisterOverlay('about')
  const [analytics, setAnalytics] = useState(analyticsEnabled)

  function toggleAnalytics() {
    const next = !analytics
    setAnalyticsEnabled(next)
    setAnalytics(next)
  }

  return (
    <div className="fullscreen">
      <div className="detail__bar">
        <button className="detail__back" onClick={onClose}>
          ← Back
        </button>
      </div>
      <div className="about">
        <h1 className="about__title">TrainTrack</h1>
        <p className="about__tagline">
          A personal record of your journeys on the NYC subway.
        </p>

        <h2 className="about__h2">Your data stays yours</h2>
        <p>
          Every trip you log is stored <strong>only on this device</strong>, in
          your browser. There are no accounts, and we do not receive your trip
          details — they never leave your phone.
        </p>

        <h2 className="about__h2">Usage analytics</h2>
        <p>
          Analytics are <strong>off until you turn them on</strong>. Turn them
          on and the app reports anonymous counts of actions like "a trip was
          logged" or "a backup was exported", so we can see which features get
          used. Each event carries counts and labels only, such as how many
          segments a trip had. Station names, routes, and times are never sent.
          Crash reports are sent too, so we can fix bugs. While the switch is
          off, the analytics code never starts and nothing is sent.
        </p>
        <div className="about__setting">
          <span className="about__setting-label">Share usage analytics</span>
          <button
            type="button"
            role="switch"
            aria-checked={analytics}
            className={`toggle${analytics ? ' toggle--on' : ''}`}
            onClick={toggleAnalytics}
          >
            <span className="toggle__knob" />
          </button>
        </div>

        <h2 className="about__h2">Back up your trips</h2>
        <p>
          Because your data lives on-device, clearing your browser data — or
          reinstalling — will erase it. Use <strong>Export data</strong> in the
          menu now and then to save a backup file you control, and{' '}
          <strong>Import data</strong> to restore it or move to a new device.
        </p>

        <h2 className="about__h2">About the map</h2>
        <p>
          Station, line, and route geometry come from the MTA's public GTFS
          data. Distances are measured along the actual track your trains
          travel.
        </p>

        <p className="about__foot">Made for the love of the subway. 🚇</p>
        <p className="about__version">Build {__APP_VERSION__}</p>
      </div>
    </div>
  )
}
