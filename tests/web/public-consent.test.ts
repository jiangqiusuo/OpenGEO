import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const script = readFileSync(new URL('../../apps/web/public/public-site.js', import.meta.url), 'utf8');
const key = 'opengeo:public-consent:v2';
const id = 'G-TEST123456';
function browser(stored: string | null, options: { path?: string; kind?: string; blocked?: boolean; search?: string; hash?: string; host?: string; id?: string; dnt?: string; gpc?: boolean; legacy?: boolean; home?: boolean; english?: boolean; modal?: boolean } = {}) {
  const events: unknown[] = [];
  const handlers: Record<string, () => void> = {};
  const status = { textContent: '' };
  const panel = { hidden: true };
  const storage = new Map<string, string>(stored ? [[options.home ? 'opengeo:homepage-consent:v1' : options.legacy ? 'opengeo:public-consent:v1' : key, stored]] : []);
  const listeners: Record<string, (e: { key: string | null }) => void> = {};
  const appended: Array<{ src: string; onerror: () => void; remove: () => void; referrerPolicy: string }> = [];
  const deletedCookies: string[] = [];
  const reload = vi.fn();
  const analytics = { type: 'checkbox', checked: false, disabled: false };
  const modal = { open: false, showModal: vi.fn(() => { modal.open = true; }), close: vi.fn(() => { modal.open = false; }), addEventListener: vi.fn() };
  const cookieControl = (kind: string) => [{ addEventListener: (_: string, callback: (event: { preventDefault: () => void }) => void) => { handlers[kind] = () => callback({ preventDefault: vi.fn() }); } }];
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
    title: 'Public article', documentElement: { lang: options.english ? 'en' : 'zh-CN' }, body: { dataset: { publicPage: options.kind ?? 'blog_index' } },
    getElementById: (name: string) => options.modal && name === 'analytics-settings' ? modal : options.modal && name === 'cookie-analytics' ? analytics : name === 'consent-panel' ? panel : status,
    querySelector: () => ({ getAttribute: () => options.id ?? id }),
    querySelectorAll: (selector: string) => selector.startsWith('[data-cookie-') ? cookieControl(selector) : selector === 'button[data-copy-code]' ? [] : selector === '[data-consent]' ? controls(['granted', 'denied'], 'consent') : controls(['github_click', 'arbitrary_secret_event'], 'link'),
    createElement: () => ({ src: '', onerror: () => {}, remove: vi.fn(), referrerPolicy: '' }),
    head: { appendChild: (node: typeof appended[number]) => appended.push(node) }
  };
  Object.defineProperty(document, 'cookie', { get: () => `_ga=a; _ga_TEST123456=b; session=private`, set: (value: string) => deletedCookies.push(value) });
  runInNewContext(script, { window, document, CustomEvent: class { constructor(public name: string, public data: { detail: unknown }) {} get detail() { return this.data.detail; } } });
  return { events, handlers, storage, listeners, status, panel, appended, window, deletedCookies, reload, modal, analytics };
}
describe('consent-gated public analytics', () => {
  it.each([{ path: '/' }, { path: '/en/', english: true }, { path: '/', search: '?utm_source=test' }, { path: '/', hash: '#product' }])('shows first-visit choices even when URL-based collection is excluded: %j', options => {
    const b = browser(null, { host: 'open-geo.net', kind: 'landing', home: true, ...options });
    expect(b.panel.hidden).toBe(false);
    expect(b.appended).toHaveLength(0);
    b.handlers['consent:denied']();
    expect(b.panel.hidden).toBe(true);
    const returning = browser('denied', { host: 'open-geo.net', kind: 'landing', home: true, ...options });
    expect(returning.panel.hidden).toBe(true);
    expect(returning.appended).toHaveLength(0);
  });
  it('allows real first-visit UI on a fresh preview origin without enabling a collector there', () => {
    const b = browser(null, { host: 'fresh.opengeo-workbench.pages.dev', path: '/en/', kind: 'landing', modal: true });
    expect(b.panel.hidden).toBe(false);
    b.handlers['consent:granted']();
    expect(b.panel.hidden).toBe(true);
    expect(b.appended).toHaveLength(0);
    expect(b.events).toHaveLength(0);
  });
  it('opening preferences and closing unsaved edits does not grant consent or load analytics', () => {
    const b = browser(null, { modal: true });
    b.handlers['[data-cookie-settings]']();
    expect(b.modal.open).toBe(true);
    expect(b.analytics.checked).toBe(false);
    b.analytics.checked = true;
    b.handlers['[data-cookie-close]']();
    expect(b.storage.has(key)).toBe(false);
    expect(b.appended).toHaveLength(0);
    b.handlers['[data-cookie-settings]']();
    expect(b.analytics.checked).toBe(false);
    b.handlers['[data-cookie-save]']();
    expect(b.storage.get(key)).toBe('denied');
    expect(b.appended).toHaveLength(0);
  });
  it('saves explicit modal consent, restores it on reopening and withdraws through the same controls', () => {
    const b = browser(null, { modal: true });
    b.handlers['[data-cookie-settings]'](); b.analytics.checked = true;
    b.handlers['[data-cookie-save]']();
    expect(b.storage.get(key)).toBe('granted');
    expect(b.appended).toHaveLength(1);
    expect(b.modal.open).toBe(false);
    b.handlers['[data-cookie-settings]']();
    expect(b.analytics.checked).toBe(true);
    b.analytics.checked = false; b.handlers['[data-cookie-save]']();
    expect(b.storage.get(key)).toBe('denied');
    expect(b.reload).toHaveBeenCalledOnce();
    expect(b.deletedCookies).toHaveLength(4);
  });
  it.each([{ gpc: true }, { dnt: '1' }, { blocked: true }, { id: '' }])('modal cannot enable collection when privacy or configuration blocks it: %j', options => {
    const b = browser(null, { modal: true, ...options });
    b.handlers['[data-cookie-settings]']();
    expect(b.analytics.disabled).toBe(true);
    b.analytics.checked = true; b.handlers['[data-cookie-save]']();
    expect(b.storage.get(key)).not.toBe('granted');
    expect(b.appended).toHaveLength(0);
  });
  it('keeps English analytics on the app origin and withdraws root English privacy consent separately', () => {
    const app = browser('granted', { path: '/en/blog/cli-local-quickstart/', kind: 'blog_article', english: true });
    expect(app.appended).toHaveLength(1);
    expect(app.window.dataLayer.find(entry => entry[0] === 'config')![2]).toMatchObject({ page_location: 'https://app.open-geo.net/en/blog/cli-local-quickstart/' });
    const root = browser('granted', { host: 'open-geo.net', path: '/en/privacy/', kind: 'other', home: true, english: true });
    expect(root.appended).toHaveLength(0);
    root.handlers['consent:denied']();
    expect(root.storage.get('opengeo:homepage-consent:v1')).toBe('denied');
    expect(root.storage.has(key)).toBe(false);
  });
  it.each(['/', '/en/'])('requires a separate homepage opt-in at %s and sends the actual canonical origin', (path) => {
    const options = { host: 'open-geo.net', path, kind: 'landing', english: path === '/en/' };
    const prior = browser('granted', options);
    expect(prior.appended).toHaveLength(0);
    expect(prior.panel.hidden).toBe(false);
    prior.handlers['consent:granted']();
    expect(prior.storage.get('opengeo:homepage-consent:v1')).toBe('granted');
    expect(prior.appended).toHaveLength(1);
    const config = prior.window.dataLayer.find(entry => entry[0] === 'config')![2];
    expect(config).toMatchObject({ page_location: `https://open-geo.net${path}`, cookie_domain: 'open-geo.net' });
    prior.handlers['consent:denied']();
    expect(prior.reload).toHaveBeenCalledOnce();
    if (options.english) expect(prior.status.textContent).toContain('declined');
  });
  it.each(['/homepage/', '/en/', '/'])('does not measure the app fixture or the helper route at %s', (path) => {
    const host = path === '/homepage/' ? 'open-geo.net' : 'app.open-geo.net';
    expect(browser('granted', { host, path, kind: 'landing', home: true }).appended).toHaveLength(0);
  });
  it.each([{ search: '?utm_source=private' }, { hash: '#product' }, { gpc: true }, { dnt: '1' }, { blocked: true }])('keeps homepage measurement off for unsafe context %j', (options) => {
    const b = browser('granted', { host: 'open-geo.net', path: '/', kind: 'landing', home: true, ...options });
    expect(b.appended).toHaveLength(0);
    expect(b.events).toHaveLength(0);
  });
  it('withdraws the homepage choice from root privacy settings and propagates across tabs', () => {
    const settings = browser('granted', { host: 'open-geo.net', path: '/privacy/', kind: 'other', home: true });
    settings.handlers['consent:denied']();
    expect(settings.storage.get('opengeo:homepage-consent:v1')).toBe('denied');
    expect(settings.appended).toHaveLength(0);
    const home = browser('granted', { host: 'open-geo.net', path: '/', kind: 'landing', home: true });
    home.storage.set('opengeo:homepage-consent:v1', 'denied');
    home.listeners.storage({ key: 'opengeo:homepage-consent:v1' });
    expect(home.reload).toHaveBeenCalledOnce();
  });
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
