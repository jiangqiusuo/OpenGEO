import { localText, localePath, type SiteLocale } from './site-i18n';

/** Shared UI; opening preferences never grants measurement consent. */
export function cookieUi(locale: SiteLocale, configured: boolean): string {
  const t = (zh: string, en: string) => localText(locale, [zh, en]);
  const privacy = localePath('/privacy/', locale);
  const disabled = configured ? '' : ' disabled';
  return `<aside id="consent-panel" class="cookie-banner" aria-labelledby="cookie-banner-title" hidden>
    <div class="cookie-copy"><div class="cookie-heading"><span class="cookie-symbol" aria-hidden="true">◌</span><strong id="cookie-banner-title">${t('Cookie 使用选择', 'Your Cookie choices')}</strong></div>
    <p>${t('我们保存必要的语言与隐私偏好。可选的访问统计默认关闭，由你决定是否开启。', 'We remember essential language and privacy preferences. Optional analytics stays off until you choose to enable it.')} <a href="${privacy}">${t('隐私说明', 'Privacy notice')}</a></p></div>
    <div class="cookie-actions"><button type="button" data-consent="granted"${disabled}>${t('全部接受', 'Accept all')}</button><button type="button" data-consent="denied">${t('仅必要', 'Necessary only')}</button><button type="button" data-cookie-settings>${t('自定义', 'Customize')}</button></div><span id="consent-notice" class="cookie-sr-only" role="status"></span>
  </aside>
  <dialog id="analytics-settings" class="cookie-dialog" aria-labelledby="cookie-dialog-title" aria-describedby="cookie-dialog-description">
    <div class="cookie-dialog-head"><div><span class="cookie-kicker">OPENGEO · PRIVACY</span><h2 id="cookie-dialog-title">${t('Cookie 与隐私设置', 'Cookies and privacy')}</h2></div><button type="button" class="cookie-close" data-cookie-close aria-label="${t('关闭设置', 'Close settings')}" autofocus>×</button></div>
    <p id="cookie-dialog-description">${t('选择适合你的访问方式。设置仅适用于当前域名，随时可从页脚重新调整。', 'Choose what works for you. Preferences apply to this domain and can be changed from the footer at any time.')}</p>
    <div class="cookie-category"><div><h3>${t('必要的偏好存储', 'Essential preferences')}</h3><p>${t('保存你主动选择的语言和隐私偏好，不用于追踪。', 'Remembers the language and privacy choices you make. Not used for tracking.')}</p></div><span class="cookie-always">${t('始终启用', 'Always on')}</span></div>
    <div class="cookie-category"><div><label for="cookie-analytics">${t('访问统计', 'Analytics')}</label><p>${t('允许 Google Analytics 统计公开页面访问与入口点击，可能设置分析 Cookie 并处理设备与网络信息。广告功能保持关闭。', 'Allows Google Analytics to measure public-page views and entry clicks. Analytics cookies, device and network information may be processed. Advertising remains off.')}</p></div><input id="cookie-analytics" type="checkbox" role="switch"${disabled}></div>
    <p class="cookie-status" id="consent-status" role="status"></p>
    <p class="cookie-detail">${t('首页不运行交互录屏。app 与博客的录屏另行选择。撤回后停止后续统计，已发送的数据无法召回。', 'No session recording on the homepage. App and blog recording requires a separate choice. Withdrawal stops future analytics; previously sent data cannot be recalled.')}</p>
    <div class="cookie-dialog-actions"><button type="button" data-consent="denied">${t('仅必要', 'Necessary only')}</button><button type="button" class="cookie-save" data-cookie-save>${t('保存选择', 'Save preferences')}</button></div><a class="cookie-policy" href="${privacy}">${t('阅读完整隐私说明', 'Read the full privacy notice')} ↗</a>
  </dialog>`;
}
