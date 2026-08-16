import type { AnalyticsEventType } from './db/schema';

export async function trackEvent(
  eventType: AnalyticsEventType, 
  requestId?: string
) {
  try {
    let source = null;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      source = urlParams.get('utm_source') || urlParams.get('ref') || null;
    }

    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        eventType, 
        requestId,
        trafficSource: source
      })
    });
  } catch (e) {
    // Analytics should fail silently
    console.error('Failed to track event', e);
  }
}
