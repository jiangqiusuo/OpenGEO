import { HOME, homeSchema } from './homepage-content';
import { homeMessage } from './homepage-messages';
import { renderHomepageBody } from './homepage-render';
import { languageAlternates } from './site-i18n';

type Assets = Record<string, { path: string; source: string }>;
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const json = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

export function renderHomepage(locale: 'zh-CN' | 'en', assets: Assets, ga4Id?: string): string {
  const en = locale === 'en';
  const title = homeMessage(locale, 'title');
  const description = homeMessage(locale, 'description');
  const url = `${HOME}${en ? '/en/' : '/'}`;
  const schema = { ...homeSchema, '@graph': homeSchema['@graph'].map(node => {
    if (node['@type'] === 'WebSite') return { ...node, inLanguage: ['zh-CN', 'en'] };
    if (node['@type'] === 'WebPage') return { ...node, '@id': `${url}#webpage`, url, name: title, description, inLanguage: locale };
    if (en && node['@type'] === 'SoftwareSourceCode') return { ...node, description: 'Open public contract, metrics, client, CLI, local Mock and read-only workbench preview.' };
    return node;
  }) };
  const alternates = languageAlternates(HOME, '/');
  const body = renderHomepageBody(locale);
  const consent = `<section class="home-privacy" id="analytics-settings" aria-label="${en ? 'Analytics settings' : '首页访问统计设置'}"><h2>${en ? 'Your analytics choice' : '首页访问统计选择'}</h2><p>${en ? 'Only after you allow it, Google Analytics records public-page views and fixed entry clicks. It may process device and network information and set analytics cookies. Advertising features stay off. Choices apply to this domain; app/blog consent is separate. Withdraw below at any time. Already sent data cannot be recalled.' : '仅在你允许后，Google Analytics 才记录公开页面访问和固定入口点击，可能处理设备、网络信息并设置分析 Cookie；广告功能关闭。选择仅适用于当前域名，app 与博客单独授权。随时可在下方撤回，已经发出的数据无法召回。'}</p><p id="consent-status" role="status"></p><div class="home-choices"><button type="button" data-consent="granted"${ga4Id ? '' : ' disabled'}>${en ? 'Allow analytics' : '允许访问统计'}</button><button type="button" data-consent="denied">${en ? 'Decline / withdraw' : '拒绝 / 撤回'}</button><a href="${en ? "/en/privacy/" : "/privacy/"}">${en ? 'Full privacy notice' : '完整隐私说明'}</a></div></section>`;
  const panel = `<aside id="consent-panel" class="home-consent" aria-label="${en ? 'Optional analytics' : '可选访问统计'}" hidden><div><strong>${en ? 'Optional public-page analytics' : '可选的公开页面访问统计'}</strong><p>${en ? 'Off by default. Allow Google Analytics to measure page views and entry clicks? You can withdraw in the footer.' : '默认关闭。是否允许 Google Analytics 记录页面访问与入口点击？可以随时在页脚撤回。'}</p><a href="${en ? "/en/privacy/" : "/privacy/"}">${en ? 'Privacy notice' : '隐私说明'}</a></div><div class="home-choices"><button type="button" data-consent="denied">${en ? 'Decline' : '不允许'}</button><button type="button" data-consent="granted">${en ? 'Allow analytics' : '允许访问统计'}</button></div><p id="consent-notice" role="status"></p></aside>`;
  // Only the versioned consent script is loaded. Clarity is deliberately absent.
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${url}">${alternates}<meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${HOME}/social-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${en ? 'OpenGEO: AI search visibility and answer evidence' : 'OpenGEO：AI 搜索可见度与回答证据'}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${HOME}/social-card.png"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/${assets['design-tokens.css'].path}"><link rel="stylesheet" href="/${assets['home.css'].path}"><link rel="alternate" type="application/rss+xml" title="OpenGEO Blog" href="https://app.open-geo.net/${en ? "en/" : ""}rss.xml"><link rel="stylesheet" href="/${assets['site-controls.css'].path}"><script type="application/ld+json">${json(schema)}</script>${ga4Id ? `<meta name="opengeo-ga4-id" content="${ga4Id}">` : ''}<script src="/${assets['public-site.js'].path}" defer></script><script src="/${assets['site-interactions.js'].path}" defer></script></head><body data-public-page="landing">${body}${consent}${panel}</body></html>`;
}
