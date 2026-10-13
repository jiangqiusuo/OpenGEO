import { describe, expect, it } from 'vitest';
import { generateContentSite, publishedPosts, SITE } from '../../apps/web/content-site';
import { BLOG_POSTS } from '../../apps/web/src/blog-content';
import { MOCK_TO_JOB_SOURCE } from '../../apps/web/example-source';

const post = BLOG_POSTS[0];
const today = '2026-10-13';
describe('public content publishing boundaries', () => {
  it('preserves version-pinned CLI code for static readers through the CDN email exclusion', () => {
    const assets = generateContentSite(BLOG_POSTS, today);
    const html = assets.get('blog/cli-local-quickstart/index.html')!;
    const blocks = [...html.matchAll(/<code id="code-\d+">([\s\S]*?)<\/code>/g)].map((match) => match[1]);
    expect(blocks).toHaveLength(4);
    for (const block of blocks) {
      expect(block.startsWith('<!--email_off-->')).toBe(true);
      expect(block.endsWith('<!--/email_off-->')).toBe(true);
    }
    expect(html).toContain('--package=@sysiphus/cli@0.1.1');
    expect(html).not.toContain('data-cfemail');
  });
  it('keeps replay separately configured, masked and out of the 404 deployment', () => {
    const disabled = generateContentSite(BLOG_POSTS, today);
    expect(disabled.get('privacy/index.html')).toContain('data-replay-consent="granted" disabled');
    expect(disabled.get('about/index.html')).not.toContain('opengeo-clarity-id');
    const enabled = generateContentSite(BLOG_POSTS, today, { clarityId: 'test123456', clarityUpload: 'https://test.clarity.ms/collect' });
    const article = enabled.get('blog/mock-to-job-quickstart/index.html')!;
    expect(article).toContain('data-clarity-mask="true"');
    expect(article).toContain('name="referrer" content="no-referrer"');
    expect(article).toContain('name="opengeo-clarity-id" content="test123456"');
    expect(enabled.get('404.html')).not.toContain('opengeo-clarity-id');
    expect(enabled.get('privacy/index.html')).toContain('公开页录屏选择');
    expect(() => generateContentSite([], today, { clarityId: 'test123456' })).toThrow(/together/);
    expect(() => generateContentSite([], today, { clarityId: '<script>', clarityUpload: 'https://test.clarity.ms/collect' })).toThrow(/project ID/);
    expect(() => generateContentSite([], today, { clarityId: 'test123456', clarityUpload: 'https://private.example/collect' })).toThrow(/upload URL/);
  });
  it('references emitted content-versioned styles and scripts in every static page', () => {
    const assets = generateContentSite(BLOG_POSTS, today);
    for (const [name, html] of assets) {
      if (!name.endsWith('.html')) continue;
      const resources = [...html.matchAll(/(?:src|href)="\/([^"\s]+\.(?:css|js))"/g)].map((m) => m[1]);
      expect(resources.length).toBeGreaterThanOrEqual(2);
      expect(resources.filter((resource) => /^design-tokens\.[a-f0-9]{12}\.css$/.test(resource))).toHaveLength(1);
      for (const resource of resources) {
        expect(resource).toMatch(/\.[a-f0-9]{12}\.(?:css|js)$/);
        expect(assets.get(resource)?.length).toBeGreaterThan(0);
      }
    }
  });
  it('renders tutorial headings and escaped code from the exact downloadable executable', () => {
    const assets = generateContentSite(BLOG_POSTS, today);
    const html = assets.get('blog/mock-to-job-quickstart/index.html')!;
    expect(assets.get('examples/mock-to-job.mjs')).toBe(MOCK_TO_JOB_SOURCE);
    expect(html).toContain('data-copy-code=');
    expect(html).toContain('准备环境并启动 Mock</h2>');
    expect(html).toContain('download="mock-to-job.mjs"');
    expect(assets.get('rss.xml')).toContain(`${SITE}/blog/mock-to-job-quickstart/`);
    const unsafe = { ...post, body: [{ kind: 'code' as const, language: 'javascript' as const, text: '</code><script>bad()</script>' }] };
    expect(generateContentSite([unsafe], today).get(`blog/${post.slug}/index.html`)).toContain('&lt;/code&gt;&lt;script&gt;bad()&lt;/script&gt;');
  });
  it('renders a truthful static product introduction and keeps deployment IDs optional', () => {
    const assets = generateContentSite([post], today);
    expect(assets.get('about/index.html')).toContain('本地 Mock 无需 API Key');
    expect(assets.get('about/index.html')).toContain('示例预览');
    expect(assets.get('sitemap.xml')).toContain(`${SITE}/about/`);
    expect(assets.get('about/index.html')).not.toContain('opengeo-ga4-id');
    const enabled = generateContentSite([post], today, { ga4Id: 'G-TEST123456' });
    expect(enabled.get('about/index.html')).toContain('name="opengeo-ga4-id" content="G-TEST123456"');
    expect(enabled.get('privacy/index.html')).toContain('本部署已配置 Google Analytics 4');
    expect(enabled.get('404.html')).not.toContain('opengeo-ga4-id');
    expect(() => generateContentSite([post], today, { ga4Id: '"><script>' })).toThrow(/measurement ID/);
  });
  it('keeps drafts and future publications out of HTML, feed and sitemap', () => {
    const assets = generateContentSite([post, { ...post, slug: 'private-draft', status: 'draft', title: 'PRIVATE DRAFT' }, { ...post, slug: 'future-post', title: 'FUTURE POST', publishedAt: '2026-11-01', updatedAt: '2026-11-01' }], today);
    expect(assets.has('blog/private-draft/index.html')).toBe(false);
    expect(assets.has('blog/future-post/index.html')).toBe(false);
    expect([...assets.values()].join('')).not.toMatch(/PRIVATE DRAFT|FUTURE POST|private-draft|future-post/);
  });
  it.each(['../private', 'bad/slug', 'bad?query', 'BadSlug'])('rejects unsafe paths: %s', (slug) => {
    expect(() => publishedPosts([{ ...post, slug }], today)).toThrow(/slug/);
  });
  it('rejects duplicate slugs and unreviewed publications', () => {
    expect(() => publishedPosts([post, post], today)).toThrow(/slug/);
    expect(() => publishedPosts([{ ...post, reviewedBy: '' }], today)).toThrow(/reviewed/);
  });
  it.each(['2026-02-30', 'invalid', '2026-1-1'])('rejects invalid dates: %s', (publishedAt) => {
    expect(() => publishedPosts([{ ...post, publishedAt }], today)).toThrow(/dates/);
  });
  it('escapes HTML and prevents JSON-LD script termination', () => {
    const unsafe = { ...post, title: '</script><img src=x onerror=alert(1)>', body: ['<script>alert(1)</script>'] };
    const html = generateContentSite([unsafe], today).get(`blog/${post.slug}/index.html`)!;
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    const structured = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1];
    expect(JSON.parse(structured).headline).toBe(unsafe.title);
  });
  it('ships crawlable text without React, consistent URLs and a separate 404', () => {
    const assets = generateContentSite([post], today);
    const url = `${SITE}/blog/${post.slug}/`;
    const html = assets.get(`blog/${post.slug}/index.html`)!;
    expect(html).toContain(post.body[0]);
    expect(html).toContain(`<link rel="canonical" href="${url}">`);
    expect(assets.get('rss.xml')).toContain(`<link>${url}</link>`);
    expect(assets.get('sitemap.xml')).toContain(`<loc>${url}</loc>`);
    expect(assets.get('404.html')).toContain('name="robots" content="noindex"');
    expect(html).toContain('/privacy/');
    expect(html).not.toContain('docs.open-geo.net');
  });
});
