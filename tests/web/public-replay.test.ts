import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(new URL('../../apps/web/public/public-replay.js', import.meta.url), 'utf8');
const key = 'opengeo:public-replay:v1';
const id = 'test123456';
type Options = { path?: string; kind?: string; host?: string; search?: string; hash?: string; referrer?: string; dnt?: string; gpc?: boolean; blocked?: boolean; writeBlocked?: boolean; cookiesBlocked?: boolean; masked?: boolean; iframe?: boolean; id?: string; upload?: string; analytics?: string };
function browser(replay: string | null, options: Options = {}) {
  const storage = new Map<string, string>();
  if (replay) storage.set(key, replay);
  if (options.analytics) storage.set('opengeo:public-consent:v2', options.analytics);
  const listeners: Record<string, (e: { key: string | null }) => void> = {};
  const handlers: Record<string, () => void> = {};
  const status = { textContent: '' };
  const cookies: string[] = [];
  const appended: Array<{ src: string; referrerPolicy: string; onload: () => void; onerror: () => void; remove: ReturnType<typeof vi.fn> }> = [];
  const reload = vi.fn();
  const window = {
    location: { pathname: options.path ?? '/about/', hostname: options.host ?? 'app.open-geo.net', search: options.search ?? '', hash: options.hash ?? '', reload },
    navigator: { doNotTrack: options.dnt, globalPrivacyControl: options.gpc },
    self: {}, top: undefined as object | undefined,
    localStorage: {
      getItem: (k: string) => { if (options.blocked) throw Error('blocked'); return storage.get(k) ?? null; },
      setItem: (k: string, v: string) => { if (options.blocked || options.writeBlocked) throw Error('blocked'); storage.set(k, v); },
      removeItem: (k: string) => storage.delete(k)
    },
    addEventListener: (name: string, handler: typeof listeners[string]) => { listeners[name] = handler; },
    clarity: undefined as unknown as ((...args: unknown[]) => void) & { q?: unknown[][] }
  };
  window.top = options.iframe ? {} : window.self;
  const document = {
    referrer: options.referrer ?? '',
    body: { dataset: { publicPage: options.kind ?? 'landing' }, getAttribute: () => options.masked === false ? null : 'true' },
    querySelector: (selector: string) => ({ getAttribute: () => selector.includes('clarity-upload') ? options.upload ?? 'https://test.clarity.ms/collect' : options.id ?? id }),
    getElementById: () => status,
    querySelectorAll: () => ['granted', 'denied'].map((v) => ({ getAttribute: () => v, addEventListener: (_: string, fn: () => void) => { handlers[v] = fn; } })),
    createElement: () => ({ src: '', referrerPolicy: '', onload: () => {}, onerror: () => {}, remove: vi.fn() }),
    head: { appendChild: (node: typeof appended[number]) => appended.push(node) }
  };
  Object.defineProperty(document, 'cookie', { get: () => { if (options.cookiesBlocked) throw Error('blocked'); return '_clck=a; _clsk=b; _ga=c; session=private'; }, set: (value: string) => cookies.push(value) });
  runInNewContext(source, { window, document });
  const load = () => {
    const client = vi.fn();
    window.clarity = client;
    appended[0].onload();
    return client;
  };
  return { window, storage, handlers, listeners, appended, load, status, cookies, reload };
}

describe('separate opt-in public replay', () => {
  it('does not inherit analytics consent or load before a separate grant', () => {
    for (const consent of [null, 'denied', 'invalid']) expect(browser(consent, { analytics: 'granted' }).appended).toHaveLength(0);
    const b = browser(null, { analytics: 'denied' }); b.handlers.granted(); b.handlers.granted();
    expect(b.appended).toHaveLength(1); expect(b.storage.get('opengeo:public-consent:v2')).toBe('denied');
    expect(b.window.clarity.q).toEqual([]); // Download alone cannot start or grant the SDK.
    expect(b.appended[0].referrerPolicy).toBe('no-referrer');
  });
  it('starts only after SDK load with initial tracking off, full text masked, and ads denied', () => {
    const b = browser('granted'); const client = b.load();
    expect(client.mock.calls).toEqual([
      ['start', { projectId: id, upload: 'https://test.clarity.ms/collect', track: false, content: false, cookies: [] }],
      ['consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }]
    ]);
    expect(client.mock.calls.flat()).not.toContain('identify');
  });
  it('revokes before a late SDK load without ever queuing start or consent grant', () => {
    const b = browser('granted'); b.handlers.denied(); const client = b.load();
    expect(b.window.clarity.q).toBeUndefined();
    expect(client).toHaveBeenCalledWith('stop');
    expect(client.mock.calls.some(([name]) => name === 'start' || name === 'consentv2')).toBe(false);
    expect(b.reload).toHaveBeenCalledOnce(); expect(b.storage.get(key)).toBe('denied');
  });
  it('stops loaded SDK without invoking cookie denial that schedules SDK restart', () => {
    const b = browser('granted'); const client = b.load(); client.mockClear(); b.handlers.denied();
    expect(client.mock.calls).toEqual([['stop']]); expect(b.reload).toHaveBeenCalledOnce();
    expect(b.cookies).toHaveLength(6); expect(b.cookies.join('')).toContain('Domain=open-geo.net');
    expect(b.cookies.join('')).not.toMatch(/_ga=|session=/);
    expect(browser('denied').appended).toHaveLength(0);
    const c = browser('granted', { cookiesBlocked: true }); const restricted = c.load(); restricted.mockClear();
    expect(() => c.handlers.denied()).not.toThrow(); expect(restricted).toHaveBeenCalledWith('stop'); expect(c.reload).toHaveBeenCalledOnce();
  });
  it.each([
    { path: '/', kind: 'other' }, { path: '/privacy/', kind: 'other' }, { path: '/jobs/private' }, { path: '/v1/jobs/private' },
    { path: '/blog/missing/', kind: 'other' }, { host: 'preview.pages.dev' }, { host: 'localhost' }, { search: '?key=private' },
    { hash: '#private' }, { referrer: 'https://example.test/private?token=private' }, { referrer: 'https://example.test/' },
    { dnt: '1' }, { gpc: true }, { blocked: true }, { masked: false }, { iframe: true }, { id: '' },
    { id: '"><script>' }, { upload: 'https://private.example/collect' }, { upload: '' }
  ])('fails closed for excluded context %j', (options) => {
    const b = browser('granted', options); b.handlers.granted(); expect(b.appended).toHaveLength(0);
  });
  it('handles storage save failures and script failure without restarting in the same document', () => {
    const b = browser(null, { writeBlocked: true }); b.handlers.granted(); expect(b.appended).toHaveLength(0);
    expect(b.status.textContent).toContain('无法保存');
    const c = browser('granted'); c.appended[0].onerror(); c.handlers.granted();
    expect(c.appended).toHaveLength(1); expect(c.status.textContent).toContain('加载失败'); expect(c.reload).toHaveBeenCalledOnce();
    const d = browser('granted', { writeBlocked: true }); const client = d.load(); client.mockClear(); d.handlers.denied();
    expect(client.mock.calls).toEqual([['stop']]); expect(d.storage.has(key)).toBe(false); expect(d.reload).not.toHaveBeenCalled();
  });
  it('rechecks URL at SDK completion and withdraws on cross-tab deletion or history changes', () => {
    const b = browser('granted'); b.window.location.hash = '#private'; const client = b.load();
    expect(client.mock.calls.some(([name]) => name === 'start')).toBe(false);
    const c = browser('granted'); c.load(); c.storage.clear(); c.listeners.storage({ key: null }); expect(c.reload).toHaveBeenCalledOnce();
    const d = browser('granted'); d.load(); d.window.location.search = '?private'; d.listeners.popstate({ key: null }); expect(d.reload).toHaveBeenCalledOnce();
  });
});
