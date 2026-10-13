import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const script = readFileSync(new URL('../../apps/web/public/public-site.js', import.meta.url), 'utf8');
const key = 'opengeo:public-consent:v2';
const id = 'G-TEST123456';
function browser(stored: string | null, options: { path?: string; kind?: string; blocked?: boolean; search?: string; hash?: string; host?: string; id?: string; dnt?: string; gpc?: boolean; legacy?: boolean } = {}) {
  const events: unknown[] = [];
  const handlers: Record<string, () => void> = {};
  const status = { textContent: '' };
  const panel = { hidden: true };
  const storage = new Map<string, string>(stored ? [[options.legacy ? 'opengeo:public-consent:v1' : key, stored]] : []);
  const listeners: Record<string, (e: { key: string | null }) => void> = {};
  const appended: Array<{ src: string; onerror: () => void; remove: () => void; referrerPolicy: string }> = [];
  const deletedCookies: string[] = [];
  const reload = vi.fn();
  const controls = (values: string[], kind: string) => values.map((value) => ({ getAttribute: () => value, addEventListener: (_: string, callback: () => void) => { handlers[`${kind}:${value}`] = callback; } }));
  const window = {
    location: { pathname: options.path ?? '/blog/', search: options.search ?? '', hash: options.hash ?? '', hostname: options.host ?? 'app.open-geo.net', reload },
    navigator: { doNotTrack: options.dnt, globalPrivacyControl: options.gpc },
    localStorage: { getItem: (name: string) => { if (options.blocked) throw Error(); return storage.get(name) ?? null; }, setItem: (name: string, value: string) => { if (options.blocked) throw Error(); storage.set(name, value); }, removeItem: (name: string) => storage.delete(name) },
    dispatchEvent: (event: { detail: unknown }) => events.push(event.detail),
    addEventListener: (name: string, callback: typeof listeners[string]) => { listeners[name] = callback; },
    dataLayer: [] as unknown[][],
    [`ga-disable-${id}`]: false
  };
  const document = {
    title: 'Public article', body: { dataset: { publicPage: options.kind ?? 'blog_index' } },
    getElementById: (name: string) => name === 'consent-panel' ? panel : status,
    querySelector: () => ({ getAttribute: () => options.id ?? id }),
    querySelectorAll: (selector: string) => selector === 'button[data-copy-code]' ? [] : selector === '[data-consent]' ? controls(['granted', 'denied'], 'consent') : controls(['github_click', 'arbitrary_secret_event'], 'link'),
    createElement: () => ({ src: '', onerror: () => {}, remove: vi.fn(), referrerPolicy: '' }),
    head: { appendChild: (node: typeof appended[number]) => appended.push(node) }
  };
  Object.defineProperty(document, 'cookie', { get: () => `_ga=a; _ga_TEST123456=b; session=private`, set: (value: string) => deletedCookies.push(value) });
  runInNewContext(script, { window, document, CustomEvent: class { constructor(public name: string, public data: { detail: unknown }) {} get detail() { return this.data.detail; } } });
  return { events, handlers, storage, listeners, status, panel, appended, window, deletedCookies, reload };
}
describe('consent-gated public analytics', () => {
  it('does not load or send before consent, on denial, or with old v1 authorization', () => {
    for (const stored of [null, 'denied', 'invalid']) {
      const b = browser(stored); b.handlers['link:github_click']();
      expect(b.events).toHaveLength(0); expect(b.appended).toHaveLength(0);
    }
    expect(browser('granted', { legacy: true }).appended).toHaveLength(0);
  });
  it('starts once after explicit consent, advert consent stays denied and page data is sanitized', () => {
    const b = browser(null); b.handlers['consent:granted'](); b.handlers['consent:granted']();
    expect(b.appended).toHaveLength(1);
    expect(b.appended[0].src).toBe(`https://www.googletagmanager.com/gtag/js?id=${id}`);
    expect(b.appended[0].referrerPolicy).toBe('no-referrer');
    expect(Object.prototype.toString.call(b.window.dataLayer[0])).toBe('[object Arguments]');
    expect(Array.from(b.window.dataLayer[0])).toEqual(['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }]);
    const config = b.window.dataLayer.find((entry) => entry[0] === 'config')![2];
    expect(config).toMatchObject({ send_page_view: false, page_location: 'https://app.open-geo.net/blog/', page_referrer: '', allow_google_signals: false, allow_ad_personalization_signals: false });
    expect(b.events).toHaveLength(1);
  });
  it('only sends known clicks; revocation purges queued events, disables collection, cleans own cookies and reloads', () => {
    const b = browser('granted'); b.handlers['link:arbitrary_secret_event'](); b.handlers['link:github_click']();
    expect(b.events).toHaveLength(2);
    b.handlers['consent:denied'](); b.handlers['link:github_click']();
    expect(b.events).toHaveLength(2); expect(b.window[`ga-disable-${id}`]).toBe(true);
    expect(b.window.dataLayer.some((entry) => entry[0] === 'event')).toBe(false);
    expect(b.appended[0].remove).toHaveBeenCalled(); expect(b.reload).toHaveBeenCalledOnce();
    expect(b.deletedCookies).toHaveLength(4); expect(b.deletedCookies.join('')).not.toContain('session=');
  });
  it.each(['/', '/jobs/secret', '/v1/jobs/secret', '/privacy/', '/404.html', '/blog/not-an-article/'])('excludes private, settings and missing page %s', (path) => {
    const b = browser('granted', { path, kind: 'other' }); b.handlers['link:github_click']();
    expect(b.events).toHaveLength(0); expect(b.appended).toHaveLength(0);
  });
  it('cleans old analytics cookies when revoking from settings without loading the SDK there', () => {
    const b = browser('granted', { path: '/privacy/', kind: 'other' }); b.handlers['consent:denied']();
    expect(b.appended).toHaveLength(0); expect(b.deletedCookies).toHaveLength(4);
  });
  it.each([{ search: '?token=secret' }, { hash: '#secret' }, { dnt: '1' }, { gpc: true }, { blocked: true }])('fails closed for sensitive URL / privacy signal / blocked storage %j', (options) => {
    const b = browser('granted', options); b.handlers['link:github_click']();
    expect(b.appended).toHaveLength(0); expect(b.events).toHaveLength(0);
  });
  it('keeps development, preview hosts and invalid config free of third-party requests', () => {
    for (const options of [{ host: 'localhost' }, { host: 'preview.pages.dev' }, { id: '' }, { id: 'https://bad.example' }]) expect(browser('granted', options).appended).toHaveLength(0);
  });
  it('rejects grant when storage cannot save and keeps the page functional if SDK is blocked', () => {
    const blocked = browser(null, { blocked: true }); blocked.handlers['consent:granted']();
    expect(blocked.appended).toHaveLength(0); expect(blocked.status.textContent).toContain('禁止保存');
    const b = browser('granted'); b.appended[0].onerror(); b.handlers['link:github_click']();
    expect(b.window[`ga-disable-${id}`]).toBe(true); expect(b.status.textContent).toContain('加载失败');
  });
  it('withdraws on cross-tab deletion and unsafe history changes', () => {
    const b = browser('granted'); b.storage.clear(); b.listeners.storage({ key: null });
    expect(b.reload).toHaveBeenCalledOnce(); expect(b.window[`ga-disable-${id}`]).toBe(true);
    const c = browser('granted'); c.window.location.search = '?secret=private'; c.listeners.popstate({ key: null });
    expect(c.reload).toHaveBeenCalledOnce();
  });
});
