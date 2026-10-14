import { localText, localePath, type SiteLocale } from './site-i18n';

/** Shared UI; opening preferences never grants measurement consent. */
export function cookieUi(locale: SiteLocale, configured: boolean): string {
  const t = (zh: string, en: string) => localText(locale, [zh, en]);
  const privacy = localePath('/privacy/', locale);
  const disabled = configured ? '' : ' disabled';
  return `<aside id="consent-panel" class="cookie-banner" aria-labelledby="cookie-banner-title" hidden>
    <div class="cookie-heading"><span class="cookie-symbol" aria-hidden="true">◌</span><strong id="cookie-banner-title">${t('由你决定如何统计', 'Your privacy, your choice')}</strong></div>
    <p>${t('可选的访问统计帮助我们改进公开页面。默认关闭；拒绝不会影响使用。', 'Optional analytics helps us improve public pages. It stays off until you allow it; declining does not affect your visit.')}</p>
    <div class="cookie-actions"><button type="button" data-consent="denied">${t('拒绝可选统计', 'Decline optional')}</button><button type="button" data-consent="granted"${disabled}>${t('允许访问统计', 'Allow analytics')}</button></div>
    <div class="cookie-links"><a href="${privacy}" data-cookie-settings>${t('自定义设置', 'Customize')}</a><a href="${privacy}">${t('隐私说明', 'Privacy notice')}</a></div><span id="consent-notice" class="cookie-sr-only" role="status"></span>
  </aside>
  <dialog id="analytics-settings" class="cookie-dialog" aria-labelledby="cookie-dialog-title" aria-describedby="cookie-dialog-description">
    <div class="cookie-dialog-head"><div><span class="cookie-kicker">OPENGEO · PRIVACY</span><h2 id="cookie-dialog-title">${t('Cookie 与隐私设置', 'Cookies and privacy')}</h2></div><button type="button" class="cookie-close" data-cookie-close aria-label="${t('关闭设置', 'Close settings')}" autofocus>×</button></div>
    <p id="cookie-dialog-description">${t('选择适合你的访问方式。设置仅适用于当前域名，随时可从页脚重新调整。', 'Choose what works for you. Preferences apply to this domain and can be changed from the footer at any time.')}</p>
    <div class="cookie-category"><div><h3>${t('必要的偏好存储', 'Essential preferences')}</h3><p>${t('保存你主动选择的语言和隐私偏好，不用于追踪。', 'Remembers the language and privacy choices you make. Not used for tracking.')}</p></div><span class="cookie-always">${t('始终启用', 'Always on')}</span></div>
    <div class="cookie-category"><div><label for="cookie-analytics">${t('访问统计', 'Analytics')}</label><p>${t('允许 Google Analytics 统计公开页面访问与入口点击，可能设置分析 Cookie 并处理设备与网络信息。广告功能保持关闭。', 'Allows Google Analytics to measure public-page views and entry clicks. Analytics cookies, device and network information may be processed. Advertising remains off.')}</p></div><input id="cookie-analytics" type="checkbox" role="switch"${disabled}></div>
    <p class="cookie-status" id="consent-status" role="status"></p>
    <p class="cookie-detail">${t('首页不运行交互录屏。app 与博客的录屏另行选择。撤回后停止后续统计，已发送的数据无法召回。', 'No session recording on the homepage. App and blog recording requires a separate choice. Withdrawal stops future analytics; previously sent data cannot be recalled.')}</p>
    <div class="cookie-dialog-actions"><button type="button" data-consent="denied">${t('拒绝可选统计', 'Decline optional')}</button><button type="button" class="cookie-save" data-cookie-save>${t('保存选择', 'Save preferences')}</button></div><a class="cookie-policy" href="${privacy}">${t('阅读完整隐私说明', 'Read the full privacy notice')} ↗</a>
  </dialog>`;
}
