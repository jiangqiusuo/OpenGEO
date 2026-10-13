import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const script = readFileSync(new URL('../../apps/web/public/public-site.js', import.meta.url), 'utf8');
function browser(stored: string | null, path = '/blog/', blocked = false) {
  const events: unknown[] = [];
  const handlers: Record<string, () => void> = {};
  const status = { textContent: '' };
  const storage = new Map<string, string>(stored ? [['opengeo:public-consent:v1', stored]] : []);
  const listeners: Record<string, (e: { key: string | null }) => void> = {};
  const controls = (values: string[], kind: string) => values.map((value) => ({ getAttribute: () => value, addEventListener: (_: string, callback: () => void) => { handlers[`${kind}:${value}`] = callback; } }));
  runInNewContext(script, {
    window: {
      location: { pathname: path, search: '?token=secret', hash: '#private' },
      localStorage: { getItem: (key: string) => { if (blocked) throw Error(); return storage.get(key) ?? null; }, setItem: (key: string, value: string) => { if (blocked) throw Error(); storage.set(key, value); } },
      dispatchEvent: (event: { detail: unknown }) => events.push(event.detail),
      addEventListener: (key: string, callback: typeof listeners[string]) => { listeners[key] = callback; }
    },
    document: { getElementById: () => status, querySelectorAll: (selector: string) => selector === '[data-consent]' ? controls(['granted', 'denied'], 'consent') : controls(['github_click', 'arbitrary_secret_event'], 'link') },
    CustomEvent: class { constructor(public name: string, public data: { detail: unknown }) {} get detail() { return this.data.detail; } }
  });
  return { events, handlers, storage, listeners, status };
}
describe('static public consent adapter', () => {
  it('defaults to no events; respects denial', () => {
    for (const stored of [null, 'denied', 'invalid']) {
      const b = browser(stored); b.handlers['link:github_click'](); expect(b.events).toHaveLength(0);
    }
  });
  it('allows only known events and pathname; revocation stops events immediately', () => {
    const b = browser('granted'); b.handlers['link:arbitrary_secret_event']();
    b.handlers['link:github_click']();
    expect(b.events).toEqual([{ name: 'blog_index_view', path: '/blog/' }, { name: 'github_click', path: '/blog/' }]);
    b.handlers['consent:denied'](); b.handlers['link:github_click']();
    expect(b.events).toHaveLength(2);
  });
  it('does not collect task, API or workbench routes', () => {
    for (const path of ['/', '/jobs/secret', '/v1/jobs/secret', '/blog/../../jobs/secret']) {
      const b = browser('granted', path); b.handlers['link:github_click'](); expect(b.events).toHaveLength(0);
    }
  });
  it('fails closed when storage is blocked and reports session-only choice', () => {
    const b = browser('granted', '/privacy/', true);
    expect(b.events).toHaveLength(0);
    b.handlers['consent:granted'](); expect(b.status.textContent).toContain('仅在当前页面生效');
    b.handlers['consent:denied'](); b.handlers['link:github_click'](); expect(b.events).toHaveLength(0);
  });
  it('applies withdrawal and storage removal from another tab', () => {
    const b = browser('granted'); b.storage.clear(); b.listeners.storage({ key: null });
    b.handlers['link:github_click'](); expect(b.events).toHaveLength(1);
    expect(b.status.textContent).toContain('默认不测量');
  });
});
