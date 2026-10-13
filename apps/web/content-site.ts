import type { BlogPost } from './src/blog-content';

export const SITE = 'https://app.open-geo.net';
const DOCS = 'https://jiangqiusuo.github.io/OpenGEO/docs/portal/';
const REPO = 'https://github.com/jiangqiusuo/OpenGEO';
const escape = (value: string) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const json = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
const dateValid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export function publishedPosts(posts: BlogPost[], today: string): BlogPost[] {
  if (!dateValid(today)) throw new Error('Invalid build date');
  const slugs = new Set<string>();
  for (const post of posts) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug)) throw new Error('Invalid or duplicate article slug');
    slugs.add(post.slug);
    if (post.status !== 'published' && post.status !== 'draft') throw new Error('Invalid publication status');
    if (post.status === 'draft') continue;
    if (!post.reviewedBy?.trim() || !post.title.trim() || !post.excerpt.trim() || !post.body.length || post.body.some((p) => !p.trim())) throw new Error('Published content must be reviewed and complete');
    if (!dateValid(post.publishedAt) || !dateValid(post.updatedAt) || post.updatedAt < post.publishedAt || (post.publishedAt <= today && post.updatedAt > today)) throw new Error('Invalid publication dates');
  }
  return posts.filter((p) => p.status === 'published' && p.publishedAt <= today).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
}

function layout(title: string, description: string, path: string, body: string, schema?: unknown, noindex = false): string {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · OpenGEO</title><meta name="description" content="${escape(description)}">${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${SITE}${path}">`}<meta property="og:type" content="${path.startsWith('/blog/') && path !== '/blog/' ? 'article' : 'website'}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${SITE}${path}"><meta name="twitter:card" content="summary"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/content.css"><link rel="alternate" type="application/rss+xml" title="OpenGEO 博客" href="/rss.xml">${schema ? `<script type="application/ld+json">${json(schema)}</script>` : ''}<script src="/public-site.js" defer></script></head><body><header><a class="brand" href="/"><img src="/logo-mark.svg" width="24" height="24" alt="">OpenGEO</a><nav aria-label="公开导航"><a href="/blog/">博客</a><a href="${DOCS}" data-event="docs_click">文档</a><a class="button" href="/" data-event="workbench_click">工作台预览</a></nav></header><main>${body}</main><footer><span>OpenGEO · 方法与工程</span><a href="/rss.xml">RSS</a><a href="/privacy/">隐私与测量设置</a><a href="${REPO}" data-event="github_click">GitHub ↗</a></footer></body></html>`;
}

export function generateContentSite(posts: BlogPost[], today: string): Map<string, string> {
  const published = publishedPosts(posts, today);
  const assets = new Map<string, string>();
  const blogSchema = { '@context': 'https://schema.org', '@type': 'Blog', name: 'OpenGEO 博客', url: `${SITE}/blog/`, inLanguage: 'zh-CN' };
  assets.set('blog/index.html', layout('GEO 方法与工程', '用可复查的证据理解 AI 可见度，阅读 OpenGEO 的方法与工程实践。', '/blog/', `<section class="intro"><p class="eyebrow">OPENGEO JOURNAL</p><h1>每一次观察，<br>都值得被复查。</h1><p>关于 AI 可见度、证据和工程实践的笔记。从固定问题开始，把结果放回完整的样本中理解。</p></section><section class="posts" aria-label="文章列表">${published.map((p) => `<article><p class="eyebrow">${escape(p.category)} · ${escape(p.publishedAt)}</p><h2><a href="/blog/${p.slug}/">${escape(p.title)}</a></h2><p>${escape(p.excerpt)}</p><a href="/blog/${p.slug}/">阅读文章 →</a></article>`).join('') || '<p>文章正在准备中。</p>'}</section><aside><h2>先在本地跑通一次监测。</h2><p>使用公开契约、Mock 与客户端，了解从请求到 Job 和 Evidence 的完整路径。</p><a href="${DOCS}" data-event="docs_click">查看快速开始 →</a></aside>`, blogSchema));
  for (const p of published) {
    const minutes = Math.max(1, Math.ceil(p.body.join('').length / 400));
    const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt, datePublished: p.publishedAt, dateModified: p.updatedAt, inLanguage: 'zh-CN', author: { '@type': 'Organization', name: 'OpenGEO' }, mainEntityOfPage: `${SITE}/blog/${p.slug}/` };
    assets.set(`blog/${p.slug}/index.html`, layout(p.title, p.excerpt, `/blog/${p.slug}/`, `<article class="article"><a href="/blog/">← 返回博客</a><p class="eyebrow">${escape(p.category)} · ${minutes} 分钟阅读</p><h1>${escape(p.title)}</h1><p class="subtitle">${escape(p.titleEn)}</p><p class="meta">发布 ${escape(p.publishedAt)} · 更新 ${escape(p.updatedAt)} · OpenGEO</p>${p.body.map((paragraph) => `<p>${escape(paragraph)}</p>`).join('')}<aside><h2>让结果可以复查</h2><p>记录问题、样本范围与证据，再比较变化。工作台目前为示例预览。</p><a href="/" data-event="workbench_click">查看工作台 →</a></aside></article>`, schema));
  }
  assets.set('privacy/index.html', layout('隐私与测量设置', '了解公开页面的测量范围，保存或撤回你的测量偏好。', '/privacy/', `<section class="article"><h1>隐私与测量设置</h1><p>当前公开页面未接入 GA4、Clarity 或其他第三方分析服务，也不会发送分析网络请求。工作台任务与 API Key 不属于公开页面测量范围。</p><p>你可以提前保存偏好。允许后，仅在本页浏览器内发出固定名称的事件；不记录输入内容、查询参数、来源地址或任务内容。未来接入第三方收集器需要重新更新这份说明和同意版本。</p><h2>你的选择</h2><p id="consent-status" role="status">未选择，默认不测量。</p><div class="choices"><button type="button" data-consent="granted">允许公开页面测量</button><button type="button" data-consent="denied">不允许 / 撤回同意</button></div><noscript><p>JavaScript 已关闭，不会进行测量，也无法保存偏好。</p></noscript><p>偏好只保存在当前浏览器的本地存储中。清理站点数据后恢复默认不测量；如果浏览器禁止存储，只在当前页面生效。</p></section>`));
  assets.set('404.html', layout('页面不存在', '这个页面不存在，返回博客或工作台继续浏览。', '/404.html', '<section class="intro"><p class="eyebrow">404</p><h1>没有找到这个页面。</h1><p><a href="/blog/">返回博客</a> · <a href="/">打开工作台</a></p></section>', undefined, true));
  const urls = [{ path: '/', date: undefined }, { path: '/blog/', date: published[0]?.updatedAt }, { path: '/privacy/', date: undefined }, ...published.map((p) => ({ path: `/blog/${p.slug}/`, date: p.updatedAt }))];
  assets.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${SITE}${u.path}</loc>${u.date ? `<lastmod>${u.date}</lastmod>` : ''}</url>`).join('')}</urlset>`);
  assets.set('rss.xml', `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>OpenGEO 博客</title><link>${SITE}/blog/</link><description>GEO 方法与工程实践</description><language>zh-CN</language>${published.map((p) => `<item><title>${escape(p.title)}</title><link>${SITE}/blog/${p.slug}/</link><guid isPermaLink="true">${SITE}/blog/${p.slug}/</guid><description>${escape(p.excerpt)}</description><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`);
  return assets;
}
