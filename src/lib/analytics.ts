declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, string | number | boolean> }) => void
  }
}

export function trackEvent(
  eventName: string,
  props?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') return
  try {
    window.plausible?.(eventName, props ? { props } : undefined)
  } catch {
    // Non-critical: analytics should never break UX
  }
}
