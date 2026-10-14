import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { generateContentSite, SITE } from '../../apps/web/content-site';
import { BLOG_POSTS } from '../../apps/web/src/blog-content';
import { englishPost } from '../../apps/web/src/blog-translations';
import { SUPPORTED_PLATFORMS } from '../../apps/web/supported-platforms';

describe('complete public-language journeys', () => {
  it('pairs every translated page with the same content and reciprocal language links', () => {
    const assets = generateContentSite(BLOG_POSTS, '2026-10-14');
    const paths = ['/about/', '/blog/', '/privacy/', ...BLOG_POSTS.map(p => `/blog/${p.slug}/`)];
    for (const path of paths) {
      for (const prefix of ['', '/en']) {
        const html = assets.get(`${prefix}${path}index.html`.slice(1))!;
        expect(html).toContain(`rel="canonical" href="${SITE}${prefix}${path}"`);
        expect(html).toContain(`hreflang="zh-CN" href="${SITE}${path}"`);
        expect(html).toContain(`hreflang="en" href="${SITE}/en${path}"`);
        expect(html).toContain(`href="/en${path}" lang="en"`);
        expect(html).toContain(`href="${path}" lang="zh-CN"`);
      }
    }
    expect(assets.get('sitemap.xml')?.match(/<loc>/g)).toHaveLength(14);
    expect(assets.get('en/rss.xml')).toContain(`${SITE}/en/blog/cli-local-quickstart/`);
    expect(assets.get('en/privacy/index.html')).toContain('data-consent="denied"');
  });
  it('translates prose completely while preserving executable examples exactly', () => {
    for (const p of BLOG_POSTS) {
      const translated = englishPost(p)!;
      expect(translated).toBeDefined();
      const prose = translated.body.filter(b => typeof b === 'string' || b.kind !== 'code');
      expect(JSON.stringify(prose)).not.toMatch(/[\u4e00-\u9fff]/);
      expect(translated.body.filter(b => typeof b !== 'string' && b.kind === 'code')).toEqual(p.body.filter(b => typeof b !== 'string' && b.kind === 'code'));
      const stale = { ...p, updatedAt: '2026-10-14' };
      expect(englishPost(stale)).toBeUndefined();
      expect(englishPost({ ...p, body: p.body.map((b, i) => i === 0 ? 'Changed prose without updating the date' : b) })).toBeUndefined();
      const assets = generateContentSite([stale], '2026-10-14');
      expect(assets.has(`en/blog/${p.slug}/index.html`)).toBe(false);
      expect(assets.get(`blog/${p.slug}/index.html`)).not.toContain(`hreflang="en" href="${SITE}/en/blog/${p.slug}/"`);
    }
  });
  it('ships all platform names without JS and marks concept artwork honestly', () => {
    const html = generateContentSite(BLOG_POSTS, '2026-10-14').get('en/index.html')!;
    expect(SUPPORTED_PLATFORMS).toHaveLength(14);
    for (const platform of SUPPORTED_PLATFORMS) expect(html).toContain(platform.name[1]);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('AI-generated concept');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('width="960" height="640"');
  });
});

describe('optional site interactions', () => {
  it('honors reduced motion, manual pause, background tabs and keyboard escape without analytics', () => {
    const listeners: Record<string, () => void> = {};
    const classes = new Set<string>();
    const control = { hidden: true, textContent: '', setAttribute: vi.fn(), addEventListener: (_: string, fn: () => void) => { listeners.pause = fn; } };
    const focus = vi.fn();
    let escape: (event: { key: string }) => void = () => {};
    let choose: () => void = () => {};
    const menu = { open: true, contains: () => false, querySelector: () => ({ focus }), addEventListener: (_: string, fn: typeof escape) => { escape = fn; } };
    const media = { matches: true, addEventListener: (_: string, fn: () => void) => { listeners.motion = fn; } };
    const storage = new Map<string, string>();
    const document = {
      hidden: false, documentElement: { lang: 'en' },
      querySelectorAll: (selector: string) => selector === '.locale-switcher' ? [menu] : [{ getAttribute: () => 'en', addEventListener: (_: string, fn: () => void) => { choose = fn; } }],
      querySelector: () => ({ querySelector: () => control, classList: { toggle: (name: string, on: boolean) => on ? classes.add(name) : classes.delete(name) } }),
      addEventListener: (name: string, fn: () => void) => { listeners[name] = fn; }
    };
    const window = { matchMedia: () => media, localStorage: { setItem: (key: string, value: string) => storage.set(key, value) } };
    runInNewContext(readFileSync(new URL('../../apps/web/public/site-interactions.js', import.meta.url), 'utf8'), { document, window });
    expect(control.hidden).toBe(false); expect(classes.has('motion-ready')).toBe(false);
    expect(control.textContent).toBe('Start carousel');
    listeners.pause(); expect(classes.has('motion-ready')).toBe(true);
    expect(control.textContent).toBe('Pause animation');
    media.matches = false; listeners.motion();
    expect(control.hidden).toBe(false); expect(classes.has('motion-ready')).toBe(true);
    listeners.pause(); expect(classes.has('motion-paused')).toBe(true); expect(control.textContent).toBe('Resume animation');
    listeners.pause(); document.hidden = true; listeners.visibilitychange(); expect(classes.has('motion-paused')).toBe(true);
    document.hidden = false; listeners.visibilitychange(); expect(classes.has('motion-paused')).toBe(false);
    escape({ key: 'Escape' }); expect(menu.open).toBe(false); expect(focus).toHaveBeenCalledOnce();
    choose(); expect([...storage]).toEqual([['opengeo:site-locale:v1', 'en']]);
  });
  it('does not allow hover or button focus to prevent explicit resume', () => {
    const css = readFileSync(new URL('../../apps/web/public/home.css', import.meta.url), 'utf8');
    expect(css).not.toContain('.platform-band:focus-within .platform-track');
    expect(css).not.toContain('.platform-band:hover .platform-track');
    expect(css).toContain('platform-scroll 32s linear infinite');
  });
  it('localizes every section label and includes corresponding developer and availability content', () => {
    const assets = generateContentSite(BLOG_POSTS, '2026-10-14');
    const zh = assets.get('homepage/index.html')!;
    const en = assets.get('en/index.html')!;
    expect(zh).not.toMatch(/FROM VISIBILITY TO EVIDENCE|AI ANSWERS, ACROSS PLATFORMS|QUESTIONS, ANSWERED/);
    expect(zh).toContain('现在可用，接下来做什么。');
    expect(en).toContain('Available today. What comes next.');
    expect(en).toContain('https://app.open-geo.net/en/blog/cli-local-quickstart/');
    expect(zh).toContain('虚构品牌与回答');
    expect(en).toContain('Fictional brand and answer');
    for (const html of [zh, en]) expect(html).toContain('<code><!--email_off-->npm exec --yes --package=@sysiphus/cli@0.1.1 -- opengeo --help<!--/email_off--></code>');
  });
});
