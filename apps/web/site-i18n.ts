export type SiteLocale = 'zh-CN' | 'en';
export const SITE_LOCALES: SiteLocale[] = ['zh-CN', 'en'];
export const localePath = (path: string, locale: SiteLocale) => `${locale === 'en' ? '/en' : ''}${path}`;
export const localText = (locale: SiteLocale, pair: readonly [string, string]) => pair[locale === 'en' ? 1 : 0];
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export const displayDate = (value: string, locale: SiteLocale) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00Z`));
export function languageLinks(locale: SiteLocale, path: string, englishAvailable = true): string {
  const globe = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg>';
  return `<details class="locale-switcher"><summary aria-label="${locale === 'en' ? 'Choose language' : '选择语言'}">${globe}<span>${locale === 'en' ? 'English' : '简体中文'}</span><span aria-hidden="true">⌄</span></summary><nav aria-label="Language">${SITE_LOCALES.filter(l => l !== 'en' || englishAvailable).map(l => `<a href="${localePath(path, l)}" lang="${l}" hreflang="${l}" data-locale="${l}"${l === locale ? ' aria-current="page"' : ''}>${l === 'en' ? 'English' : '简体中文'}</a>`).join('')}</nav></details>`;
}
export function languageAlternates(origin: string, path: string, englishAvailable = true): string {
  return `${SITE_LOCALES.filter(l => l !== 'en' || englishAvailable).map(l => `<link rel="alternate" hreflang="${l}" href="${origin}${localePath(path, l)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${origin}${path}">`;
}
