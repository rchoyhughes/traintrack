/**
 * The geographic centerpiece (spec §7). Will render a Leaflet map with
 * GTFS shape polylines: ridden segments keep their line color and grow
 * bolder with frequency; untraveled segments stay dim gray; visited
 * stations light up.
 *
 * Placeholder until the GTFS preprocessing pipeline lands.
 */
export function MapScreen() {
  return (
    <div className="screen">
      <header className="screen__header">
        <h1>Map</h1>
      </header>
      <div className="screen__body placeholder">
        <p className="placeholder__note">
          Your personal map of the city — lit up by where you've been.
        </p>
        <p className="placeholder__note">
          Needs the bundled GTFS data (stations + shapes) to render.
        </p>
      </div>
    </div>
  )
}
