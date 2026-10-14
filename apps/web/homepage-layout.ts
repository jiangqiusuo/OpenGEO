import { cookieUi } from './cookie-ui';
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
  // Only the versioned consent script is loaded. Clarity is deliberately absent.
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${url}">${alternates}<meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${HOME}/social-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${en ? 'OpenGEO: AI search visibility and answer evidence' : 'OpenGEO：AI 搜索可见度与回答证据'}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${HOME}/social-card.png"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/${assets['design-tokens.css'].path}"><link rel="stylesheet" href="/${assets['home.css'].path}"><link rel="alternate" type="application/rss+xml" title="OpenGEO Blog" href="https://app.open-geo.net/${en ? "en/" : ""}rss.xml"><link rel="stylesheet" href="/${assets['site-controls.css'].path}"><script type="application/ld+json">${json(schema)}</script>${ga4Id ? `<meta name="opengeo-ga4-id" content="${ga4Id}">` : ''}<script src="/${assets['public-site.js'].path}" defer></script><script src="/${assets['site-interactions.js'].path}" defer></script></head><body data-public-page="landing">${body}${cookieUi(locale, Boolean(ga4Id))}</body></html>`;
}
