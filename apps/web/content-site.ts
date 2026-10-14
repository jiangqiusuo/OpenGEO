import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { BlogBlock, BlogPost } from './src/blog-content';
import { MOCK_TO_JOB_SOURCE } from './example-source';
import { landingBody } from './landing-content';
import { HOME } from './homepage-content';
import { contentLayout } from './content-layout';
import { renderHomepage } from './homepage-layout';
import { englishPost } from './src/blog-translations';
import { englishAboutBody, englishPrivacyBody } from './english-content';
import { displayDate, localePath, type SiteLocale } from './site-i18n';

export const SITE = 'https://app.open-geo.net';
const DOCS = 'https://jiangqiusuo.github.io/OpenGEO/docs/portal/';
const REPO = 'https://github.com/jiangqiusuo/OpenGEO';
// A new HTML deployment must never reuse stale styles or consent/copy code.
const readPublicAssets = () => Object.fromEntries(['design-tokens.css', 'content.css', 'landing.css', 'home.css', 'site-controls.css', 'public-site.js', 'public-replay.js', 'site-interactions.js'].map((name) => {
  const source = readFileSync(new URL(name === 'design-tokens.css' ? './design-tokens.css' : `./public/${name}`, import.meta.url), 'utf8');
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 12);
  const extension = name.lastIndexOf('.');
  return [name, { path: `${name.slice(0, extension)}.${hash}${name.slice(extension)}`, source }];
}));
const escape = (value: string) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const dateValid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

function blockText(block: BlogBlock): string {
  if (typeof block === 'string') return block;
  if (!block || typeof block.text !== 'string' || !['heading', 'code'].includes(block.kind) || (block.kind === 'code' && !['bash', 'powershell', 'javascript', 'json'].includes(block.language))) throw new Error('Invalid blog block');
  return block.text;
}
function renderBlock(block: BlogBlock, index: number, locale: SiteLocale = 'zh-CN'): string {
  const text = escape(blockText(block));
  if (typeof block === 'string') return `<p>${text}</p>`;
  if (block.kind === 'heading') return `<h2 id="section-${index}">${text}</h2>`;
  // Package@version is not an email address. Preserve code through Cloudflare HTML rewriting.
  return `<div class="code-example"><div class="code-toolbar"><span>${block.language}</span><button type="button" data-copy-code="code-${index}" aria-label="${locale === 'en' ? 'Copy' : '复制'} ${block.language}">${locale === 'en' ? 'Copy' : '复制'}</button></div><pre><code id="code-${index}"><!--email_off-->${text}<!--/email_off--></code></pre></div>`;
}

export interface MeasurementConfig { ga4Id?: string; clarityId?: string; clarityUpload?: string; indexNowKey?: string; }
export function validateMeasurementConfig(config: MeasurementConfig): MeasurementConfig {
  // IndexNow ownership proof is published as a text asset, not used for application authentication.
  if (config.indexNowKey !== undefined && !/^[a-f0-9]{32}$/.test(config.indexNowKey)) throw new Error('Invalid IndexNow ownership key');
  if (config.ga4Id !== undefined && !/^G-[A-Z0-9]{6,15}$/.test(config.ga4Id)) throw new Error('Invalid GA4 measurement ID');
  if (config.clarityId !== undefined && !/^[a-z0-9]{6,20}$/.test(config.clarityId)) throw new Error('Invalid Clarity project ID');
  if (config.clarityUpload !== undefined && !/^https:\/\/[a-z0-9-]+\.clarity\.ms\/collect$/.test(config.clarityUpload)) throw new Error('Invalid Clarity upload URL');
  if (Boolean(config.clarityId) !== Boolean(config.clarityUpload)) throw new Error('Clarity configuration must include project and upload together');
  return config;
}

function replaySection(config: MeasurementConfig): string {
  const enabled = Boolean(config.clarityId);
  return `<h2>公开页录屏选择</h2><p>${enabled ? '本部署提供可选的 Microsoft Clarity 交互录屏。只有你单独允许后，才在符合条件的产品介绍和博客页面运行。' : '本部署尚未启用录屏服务；访问统计选择不会启用录屏。'}</p><p>录屏用于观察点击和滚动，正文和代码采用严格屏蔽，不传入账户或任务标识。Microsoft 仍可能处理公开页面地址、标题、设备与网络信息，并设置分析 Cookie，这不等于完全匿名。广告存储传递拒绝信号。</p><p>带查询参数或片段、有来源地址、嵌入其他网站、DNT/GPC 或无法保存选择的访问均不启用录屏。隐私页、工作台、任务、API、登录及不存在的页面不录屏。</p><p id="replay-status" role="status">未选择，默认不录屏。</p><div class="choices"><button type="button" data-replay-consent="granted"${enabled ? '' : ' disabled'}>允许公开页交互录屏</button><button type="button" data-replay-consent="denied">拒绝 / 撤回录屏</button></div><p>录屏选择单独保存在当前站点本地存储，版本为 v1，不继承 GA4 v2 选择。撤回时停止 SDK、清理本部署录屏 Cookie，并重载已运行 SDK 的页面；已经发出的请求和已上传数据无法由页面撤回。只有重新明确允许才恢复后续录屏。</p><p><a href="https://clarity.microsoft.com/privacy">Microsoft Clarity 隐私说明</a></p>`;
}

export function publishedPosts(posts: BlogPost[], today: string): BlogPost[] {
  if (!dateValid(today)) throw new Error('Invalid build date');
  const slugs = new Set<string>();
  for (const post of posts) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug)) throw new Error('Invalid or duplicate article slug');
    slugs.add(post.slug);
    if (post.status !== 'published' && post.status !== 'draft') throw new Error('Invalid publication status');
    if (post.status === 'draft') continue;
    if (!post.reviewedBy?.trim() || !post.title.trim() || !post.excerpt.trim() || !post.body.length || post.body.some((p) => !blockText(p).trim())) throw new Error('Published content must be reviewed and complete');
    if (!dateValid(post.publishedAt) || !dateValid(post.updatedAt) || post.updatedAt < post.publishedAt || (post.publishedAt <= today && post.updatedAt > today)) throw new Error('Invalid publication dates');
  }
  return posts.filter((p) => p.status === 'published' && p.publishedAt <= today).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
}

function layout(title: string, description: string, path: string, body: string, schema?: unknown, noindex = false, config: MeasurementConfig = {}, locale: SiteLocale = 'zh-CN', englishAvailable = true): string {
  return contentLayout(title, description, path, body, readPublicAssets(), schema, noindex, config, locale, englishAvailable);
}

export function generateContentSite(posts: BlogPost[], today: string, measurement: MeasurementConfig = {}): Map<string, string> {
  const config = validateMeasurementConfig(measurement);
  const published = publishedPosts(posts, today);
  const translated = published.map(englishPost).filter((p): p is BlogPost => Boolean(p));
  const assets = new Map<string, string>();
  const publicAssets = readPublicAssets();
  for (const asset of Object.values(publicAssets)) assets.set(asset.path, asset.source);
  if (config.indexNowKey) assets.set('indexnow-verification.txt', config.indexNowKey);
  assets.set('homepage/index.html', renderHomepage('zh-CN', publicAssets, config.ga4Id));
  assets.set('en/index.html', renderHomepage('en', publicAssets, config.ga4Id));
  assets.set('home-sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${HOME}/</loc></url><url><loc>${HOME}/en/</loc></url></urlset>`);
  assets.set('examples/mock-to-job.mjs', MOCK_TO_JOB_SOURCE);
  assets.set('about/index.html', layout('让 AI 可见度可以复查', 'OpenGEO 开源 GEO 工具：用公共契约、Client、CLI、Mock 和示例工作台，从问题到回答与证据建立可复查的观察流程。', '/about/', landingBody, { '@context': 'https://schema.org', '@type': 'WebPage', name: 'OpenGEO 产品介绍', url: `${SITE}/about/`, inLanguage: 'zh-CN' }, false, config));
  const blogSchema = { '@context': 'https://schema.org', '@type': 'Blog', name: 'OpenGEO 博客', url: `${SITE}/blog/`, inLanguage: 'zh-CN' };
  assets.set('blog/index.html', layout('GEO 方法与工程', '用可复查的证据理解 AI 可见度，阅读 OpenGEO 的方法与工程实践。', '/blog/', `<section class="intro"><p class="eyebrow">OPENGEO JOURNAL</p><h1>每一次观察，<br>都值得被复查。</h1><p>关于 AI 可见度、证据和工程实践的笔记。从固定问题开始，把结果放回完整的样本中理解。</p></section><section class="posts" aria-label="文章列表">${published.map((p) => `<article><p class="eyebrow">${escape(p.category)} · ${displayDate(p.publishedAt, 'zh-CN')}</p><h2><a href="/blog/${p.slug}/">${escape(p.title)}</a></h2><p>${escape(p.excerpt)}</p><a href="/blog/${p.slug}/">阅读文章 →</a></article>`).join('') || '<p>文章正在准备中。</p>'}</section><aside><h2>先在本地跑通一次监测。</h2><p>使用公开契约、Mock 与客户端，了解从请求到 Job 和 Evidence 的完整路径。</p><a href="${DOCS}" data-event="docs_click">查看快速开始 →</a></aside>`, blogSchema, false, config));
  for (const p of published) {
    const minutes = Math.max(1, Math.ceil(p.body.map(blockText).join('').length / 400));
    const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt, datePublished: p.publishedAt, dateModified: p.updatedAt, inLanguage: 'zh-CN', author: { '@type': 'Organization', name: 'OpenGEO' }, mainEntityOfPage: `${SITE}/blog/${p.slug}/` };
    assets.set(`blog/${p.slug}/index.html`, layout(p.title, p.excerpt, `/blog/${p.slug}/`, `<article class="article"><a href="/blog/">← 返回博客</a><p class="eyebrow">${escape(p.category)} · ${minutes} 分钟阅读</p><h1>${escape(p.title)}</h1><p class="meta">发布 ${escape(p.publishedAt)} · 更新 ${escape(p.updatedAt)} · OpenGEO</p>${p.body.map((block, i) => renderBlock(block, i)).join('')}${p.slug === 'partial-results-and-retries' ? `<p><a href="${REPO}/blob/main/docs/job-results.md">阅读结果处理指南</a></p>` : ''}${p.slug === 'mock-to-job-quickstart' ? '<p><a href="/examples/mock-to-job.mjs" download="mock-to-job.mjs">下载同一份示例脚本</a></p>' : ''}<aside><h2>让结果可以复查</h2><p>记录问题、样本范围与证据，再比较变化。工作台目前为示例预览。</p><a href="/" data-event="workbench_click">查看工作台 →</a></aside></article>`, schema, false, config, 'zh-CN', Boolean(englishPost(p))));
  }
  assets.set('privacy/index.html', layout('隐私与测量设置', '了解公开页面的测量范围，保存或撤回你的测量偏好。', '/privacy/', `<section class="article"><h1>隐私与测量设置</h1><p>${config.ga4Id ? '本部署已配置 Google Analytics 4。只有你明确允许访问测量后，才在首页、英文首页、产品介绍页和博客加载 Google 的分析脚本；拒绝或尚未选择时不会请求分析服务。' : '本部署未配置第三方分析服务。允许后只在浏览器内发出固定名称的公开页面事件，不发送分析网络请求。'}</p><p>测量包括公开页面地址与标题、页面访问，以及文档/GitHub/示例工作台入口的点击。Google 可能处理浏览器与设备信息、IP 地址，并在允许后设置分析 Cookie；这不等于完全匿名。广告用途、Google Signals 与广告个性化关闭。</p><p>工作台、任务详情、API、隐私设置和不存在的页面不接入分析。带查询参数或片段的访问不加载收集器，也不发送输入内容、API Key、客户或任务数据、来源地址。访问统计与录屏选择分别管理，原有访问统计授权不会自动授权录屏。</p><h2>访问统计选择</h2><p id="consent-status" role="status">未选择，默认不测量。</p><div class="choices"><button type="button" data-consent="granted">允许公开页面测量</button><button type="button" data-consent="denied">不允许 / 撤回同意</button></div><noscript><p>JavaScript 已关闭，不会进行测量，也无法保存偏好。</p></noscript><p>选择保存在当前浏览器和域名的本地存储中。首页使用独立授权，不继承 app 与博客的访问统计选择；在首页页脚可直接允许或撤回。禁止存储时不启用第三方测量。撤回会停止新的应用事件、清理本部署的分析 Cookie，并重新加载页面停止已加载的脚本；已经发送的数据不能由本页面撤回。浏览器的 Do Not Track 或 Global Privacy Control 信号也会阻止分析加载。</p><p>同意版本更新为 v2，旧版浏览器内事件的授权不会自动升级为第三方分析授权。清理站点数据后恢复默认关闭。</p><p>显式语言选择可保存在本地存储的 opengeo:site-locale:v1 中，只用于语言偏好，与统计和录屏授权无关。当前访问的语言 URL 始终优先，不根据 IP 强制跳转。</p>${replaySection(config)}<p>了解服务方处理方式：<a href="https://policies.google.com/privacy">Google 隐私政策</a>。</p></section>`, undefined, false, config));
  assets.set('404.html', layout('页面不存在', '这个页面不存在，返回博客或工作台继续浏览。', '/404.html', '<section class="intro"><p class="eyebrow">404</p><h1>没有找到这个页面。</h1><p><a href="/blog/">返回博客</a> · <a href="/">打开工作台</a></p></section>', undefined, true));
  assets.set('en/about/index.html', layout('Make AI visibility reviewable', 'Build reviewable AI search observations with the public OpenGEO contract, client, CLI and local Mock.', '/about/', englishAboutBody, { '@context': 'https://schema.org', '@type': 'WebPage', name: 'About OpenGEO', url: `${SITE}/en/about/`, inLanguage: 'en' }, false, config, 'en'));
  assets.set('en/blog/index.html', layout('GEO methods and engineering', 'Notes on AI visibility, evidence and practical OpenGEO workflows.', '/blog/', `<section class="intro"><p class="eyebrow">OPENGEO JOURNAL</p><h1>Every observation<br>deserves a closer look.</h1><p>Start with a fixed question and put each result back into its sample scope.</p></section><section class="posts" aria-label="Articles">${translated.map(p => `<article><p class="eyebrow">${escape(p.category)} · ${displayDate(p.publishedAt, 'en')}</p><h2><a href="/en/blog/${p.slug}/">${escape(p.title)}</a></h2><p>${escape(p.excerpt)}</p><a href="/en/blog/${p.slug}/">Read article →</a></article>`).join('') || '<p>Articles are being prepared.</p>'}</section><aside><h2>Run one local Job first.</h2><p>Use the Mock and client to understand questions, Jobs and evidence.</p><a href="${DOCS}" data-event="docs_click">Read the quickstart →</a></aside>`, { '@context': 'https://schema.org', '@type': 'Blog', name: 'OpenGEO Journal', url: `${SITE}/en/blog/`, inLanguage: 'en' }, false, config, 'en'));
  for (const p of translated) {
    const minutes = Math.max(1, Math.ceil(p.body.map(blockText).join(' ').split(/\s+/).length / 200));
    const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt, datePublished: p.publishedAt, dateModified: p.updatedAt, inLanguage: 'en', author: { '@type': 'Organization', name: 'OpenGEO' }, mainEntityOfPage: `${SITE}/en/blog/${p.slug}/` };
    assets.set(`en/blog/${p.slug}/index.html`, layout(p.title, p.excerpt, `/blog/${p.slug}/`, `<article class="article"><a href="/en/blog/">← Back to the journal</a><p class="eyebrow">${escape(p.category)} · ${minutes} min read</p><h1>${escape(p.title)}</h1><p class="meta">Published ${displayDate(p.publishedAt, 'en')} · Updated ${displayDate(p.updatedAt, 'en')} · OpenGEO</p>${p.body.map((block, i) => renderBlock(block, i, 'en')).join('')}${p.slug === 'partial-results-and-retries' ? `<p><a href="${REPO}/blob/main/docs/job-results.md">Read the Job results guide</a></p>` : ''}${p.slug === 'mock-to-job-quickstart' ? '<p><a href="/examples/mock-to-job.mjs" download="mock-to-job.mjs">Download the same example script</a></p>' : ''}<aside><h2>Make results reviewable.</h2><p>Keep the question, sample scope and evidence before comparing changes. The online workbench is a simulated preview, currently in Chinese.</p><a href="${SITE}/" data-event="workbench_click">Open the demo →</a></aside></article>`, schema, false, config, 'en'));
  }
  assets.set('en/privacy/index.html', layout('Privacy and measurement settings', 'Understand public-page measurement and save or withdraw your choices.', '/privacy/', englishPrivacyBody(Boolean(config.ga4Id), Boolean(config.clarityId)), undefined, false, config, 'en'));
  assets.set('en/404.html', layout('Page not found', 'Return to the journal or homepage to continue browsing.', '/404.html', '<section class="intro"><p class="eyebrow">404</p><h1>This page was not found.</h1><p><a href="/en/blog/">Back to the journal</a> · <a href="https://open-geo.net/en/">OpenGEO home</a></p></section>', undefined, true, {}, 'en'));
  const urls = [{ path: '/about/', date: undefined }, { path: '/blog/', date: published.map((p) => p.updatedAt).sort().at(-1) }, { path: '/privacy/', date: undefined }, ...published.map((p) => ({ path: `/blog/${p.slug}/`, date: p.updatedAt })), ...['/about/', '/blog/', '/privacy/'].map(path => ({ path: localePath(path, 'en'), date: undefined })), ...translated.map(p => ({ path: `/en/blog/${p.slug}/`, date: p.updatedAt }))];
  assets.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${SITE}${u.path}</loc>${u.date ? `<lastmod>${u.date}</lastmod>` : ''}</url>`).join('')}</urlset>`);
  assets.set('rss.xml', `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>OpenGEO 博客</title><link>${SITE}/blog/</link><description>GEO 方法与工程实践</description><language>zh-CN</language>${published.map((p) => `<item><title>${escape(p.title)}</title><link>${SITE}/blog/${p.slug}/</link><guid isPermaLink="true">${SITE}/blog/${p.slug}/</guid><description>${escape(p.excerpt)}</description><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`);
  assets.set('en/rss.xml', `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>OpenGEO Journal</title><link>${SITE}/en/blog/</link><description>GEO methods and engineering</description><language>en</language>${translated.map(p => `<item><title>${escape(p.title)}</title><link>${SITE}/en/blog/${p.slug}/</link><guid isPermaLink="true">${SITE}/en/blog/${p.slug}/</guid><description>${escape(p.excerpt)}</description><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`);
  return assets;
}
