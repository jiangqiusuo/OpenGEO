/* global window, document, CustomEvent */
(() => {
  'use strict';
  // Code copying is independent of measurement consent.
  document.querySelectorAll('button[data-copy-code]').forEach((button) => button.addEventListener('click', async () => {
    const text = document.getElementById(button.getAttribute('data-copy-code'))?.textContent;
    if (!text) return;
    try { await window.navigator.clipboard.writeText(text); button.textContent = '已复制'; }
    catch { button.textContent = '无法复制，请手动选择'; }
  }));
  const key = 'opengeo:public-consent:v2';
  const id = document.querySelector('meta[name="opengeo-ga4-id"]')?.getAttribute('content') || '';
  const ga4Id = /^G-[A-Z0-9]{6,15}$/.test(id) ? id : '';
  const pageKind = document.body.dataset.publicPage;
  let consent = 'unknown';
  let storageAvailable = true;
  let initialized = false;
  let script;
  let viewed = false;
  let loadFailed = false;
  const publicPath = /^\/(?:about\/|blog\/(?:[a-z0-9-]+\/)?)$/;
  const events = new Set(['landing_view', 'blog_index_view', 'blog_article_view', 'docs_click', 'github_click', 'workbench_click']);
  const privacySignal = () => window.navigator?.globalPrivacyControl === true || window.navigator?.doNotTrack === '1';
  const publicPage = () => ['landing', 'blog_index', 'blog_article'].includes(pageKind) && publicPath.test(window.location.pathname);
  const safeContext = () => publicPage() && !window.location.search && !window.location.hash && !privacySignal() && storageAvailable;
  const collectorContext = () => safeContext() && ['app.open-geo.net', 'open-geo.net'].includes(window.location.hostname);
  const pageParams = () => ({ page_location: `https://app.open-geo.net${window.location.pathname}`, page_referrer: '', page_title: document.title, ignore_referrer: true });
  const read = () => {
    consent = 'unknown'; storageAvailable = true;
    try { const stored = window.localStorage.getItem(key); if (stored === 'granted' || stored === 'denied') consent = stored; }
    catch { storageAvailable = false; }
  };
  const clearCookies = () => {
    for (const entry of document.cookie.split(';')) {
      const name = entry.trim().split('=')[0];
      if (name !== '_ga' && name !== `_ga_${ga4Id.slice(2)}`) continue;
      const expired = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
      document.cookie = expired;
      document.cookie = `${expired}; Domain=${window.location.hostname}`;
    }
  };
  const stop = (reload) => {
    if (!ga4Id) return;
    window[`ga-disable-${ga4Id}`] = true;
    clearCookies();
    if (initialized) {
      window.dataLayer.length = 0;
      window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      script?.remove();
      if (reload) window.location.reload();
    }
  };
  const render = () => {
    const message = !storageAvailable ? '浏览器禁止保存选择，测量保持关闭。' : privacySignal() ? '浏览器已要求不跟踪，测量保持关闭。' : consent === 'granted' ? '已允许公开页面测量。' : consent === 'denied' ? '已拒绝测量。' : '未选择，默认不测量。';
    for (const name of ['consent-status', 'consent-notice']) {
      const status = document.getElementById(name);
      if (status) status.textContent = message + (loadFailed ? ' 分析脚本加载失败，页面仍可正常使用。' : '');
    }
    const panel = document.getElementById('consent-panel');
    if (panel) panel.hidden = !(ga4Id && collectorContext() && consent === 'unknown');
  };
  const start = () => {
    if (initialized || consent !== 'granted' || !ga4Id || !collectorContext()) return;
    initialized = true;
    window[`ga-disable-${ga4Id}`] = false;
    window.dataLayer = [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('js', new Date());
    window.gtag('config', ga4Id, { ...pageParams(), send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_domain: window.location.hostname, cookie_flags: 'SameSite=Lax;Secure' });
    script = document.createElement('script');
    script.async = true; script.referrerPolicy = 'no-referrer';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    script.onerror = () => { loadFailed = true; stop(false); render(); };
    document.head.appendChild(script);
    window.gtag('event', 'page_view', { ...pageParams(), send_to: ga4Id });
  };
  const track = (name) => {
    if (consent !== 'granted' || !safeContext() || !events.has(name)) return;
    window.dispatchEvent(new CustomEvent('opengeo:measurement-event', { detail: { name, path: window.location.pathname } }));
    if (initialized && !window[`ga-disable-${ga4Id}`]) window.gtag('event', name, { ...pageParams(), send_to: ga4Id });
  };
  const view = () => {
    if (viewed || consent !== 'granted' || !safeContext()) return;
    viewed = true;
    track(pageKind === 'landing' ? 'landing_view' : pageKind === 'blog_index' ? 'blog_index_view' : 'blog_article_view');
  };
  read(); render(); start(); view();
  document.querySelectorAll('[data-consent]').forEach((button) => button.addEventListener('click', () => {
    const value = button.getAttribute('data-consent');
    if (value !== 'granted' && value !== 'denied') return;
    consent = value;
    let saved = true;
    try { window.localStorage.setItem(key, value); storageAvailable = true; }
    catch {
      saved = false; storageAvailable = false;
      try { window.localStorage.removeItem(key); } catch { /* Collection stays disabled in this document. */ }
    }
    if (value === 'denied' || !saved) stop(saved);
    render();
    if (saved && value === 'granted') { start(); view(); }
  }));
  document.querySelectorAll('a[data-event]').forEach((link) => link.addEventListener('click', () => track(link.getAttribute('data-event'))));
  window.addEventListener('storage', (event) => {
    if (event.key !== key && event.key !== null) return;
    read(); render();
    if (consent !== 'granted' || !storageAvailable) stop(storageAvailable);
  });
  window.addEventListener('popstate', () => { if (!safeContext()) stop(true); });
})();
