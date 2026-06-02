import { TIME_RANGES, type TimeRange } from '../lib/timeRange'

/**
 * Compact time-range dropdown for the Map / History / Stats headers. A native
 * <select> (styled to match) so mobile gets the platform picker for free.
 */
export function RangeFilter({
  value,
  onChange,
}: {
  value: TimeRange
  onChange: (range: TimeRange) => void
}) {
  return (
    <div className="range-filter">
      <select
        className="range-filter__select"
        value={value}
        onChange={(e) => onChange(e.target.value as TimeRange)}
        aria-label="Filter trips by time range"
      >
        {TIME_RANGES.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
      <span className="range-filter__chevron" aria-hidden="true">
        ▾
      </span>
    </div>
  )
}
