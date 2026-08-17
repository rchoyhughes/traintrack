import posthog from 'posthog-js'

const posthogKey = import.meta.env.VITE_POSTHOG_KEY
const posthogHost = import.meta.env.VITE_POSTHOG_HOST

/** Consent flag in localStorage. Analytics are opt-in, so absent means off. */
const CONSENT_KEY = 'traintrack:analytics'

if (!posthogKey) {
  if (import.meta.env.DEV) {
    throw new Error(
      'VITE_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_KEY is configured',
    )
  }
} else if (!posthogHost) {
  if (import.meta.env.DEV) {
    throw new Error(
      'VITE_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_HOST is configured',
    )
  }
}

const configured = Boolean(posthogKey && posthogHost)
let loaded = false

/**
 * Load PostHog. Called only after the user opts in, so nothing is fetched,
 * stored, or sent for a user who never turns analytics on.
 */
function load() {
  if (loaded || !configured) return
  posthog.init(posthogKey as string, {
    api_host: posthogHost,
    // Autocapture records the text of whatever the user clicks, which here
    // would include station names. Only the explicit capture() calls are sent.
    autocapture: false,
    // Session replay records the screen, station names included.
    disable_session_recording: true,
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
  })
  loaded = true
}

/** True when the user has opted in on this device. */
export function analyticsEnabled(): boolean {
  return localStorage.getItem(CONSENT_KEY) === 'on'
}

/** Turn analytics on or off. Takes effect immediately, no reload needed. */
export function setAnalyticsEnabled(on: boolean): void {
  localStorage.setItem(CONSENT_KEY, on ? 'on' : 'off')
  if (on) {
    load()
    if (loaded) posthog.opt_in_capturing({ captureEventName: false })
  } else if (loaded) {
    // reset() first: it clears the stored id and the consent state, so the
    // opt-out flag has to be written after it.
    posthog.reset()
    posthog.opt_out_capturing()
  }
}

/** Send an event. Dropped unless the user opted in. */
export function capture(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (!loaded || !analyticsEnabled()) return
  posthog.capture(event, properties)
}

if (analyticsEnabled()) load()
