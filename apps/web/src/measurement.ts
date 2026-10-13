const CONSENT_KEY = 'opengeo:measurement-consent';

export type MeasurementConsent = 'granted' | 'denied' | 'unknown';

export function getMeasurementConsent(): MeasurementConsent {
  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === 'granted' || value === 'denied' ? value : 'unknown';
}

export function setMeasurementConsent(value: Exclude<MeasurementConsent, 'unknown'>): void {
  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent('opengeo:measurement-consent', { detail: value }));
}

export function trackPublicEvent(name: string, properties: Record<string, string> = {}): void {
  if (getMeasurementConsent() !== 'granted') return;
  const event = { name, properties, path: window.location.pathname };
  window.dispatchEvent(new CustomEvent('opengeo:measurement-event', { detail: event }));
  const gtag = (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (gtag) gtag('event', name, properties);
}
