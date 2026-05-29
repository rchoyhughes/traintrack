/** About + privacy. Opened from the menu; full-screen overlay. */
export function AboutScreen({ onClose }: { onClose: () => void }) {
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
          your browser. Nothing is sent to a server, there are no accounts, and
          there is no analytics or tracking of any kind. We literally cannot see
          your trips — they never leave your phone.
        </p>

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
      </div>
    </div>
  )
}
