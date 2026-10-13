/* global window, document */
(() => {
  'use strict';
  // Replay is a separate opt-in: existing analytics consent never grants it.
  const key = 'opengeo:public-replay:v1';
  const rawId = document.querySelector('meta[name="opengeo-clarity-id"]')?.getAttribute('content') || '';
  const id = /^[a-z0-9]{6,20}$/.test(rawId) ? rawId : '';
  const rawUpload = document.querySelector('meta[name="opengeo-clarity-upload"]')?.getAttribute('content') || '';
  const upload = /^https:\/\/[a-z0-9-]+\.clarity\.ms\/collect$/.test(rawUpload) ? rawUpload : '';
  const paths = /^\/(?:about\/|blog\/(?:[a-z0-9-]+\/)?)$/;
  let consent = 'unknown';
  let storageAvailable = true;
  let started = false;
  let stopped = false;
  let loadFailed = false;
  let script;
  const context = () => id && upload && ['app.open-geo.net', 'open-geo.net'].includes(window.location.hostname)
    && ['landing', 'blog_index', 'blog_article'].includes(document.body.dataset.publicPage)
    && paths.test(window.location.pathname) && !window.location.search && !window.location.hash
    && !document.referrer && window.navigator?.globalPrivacyControl !== true && window.navigator?.doNotTrack !== '1'
    && (!window.top || !window.self || window.top === window.self)
    && document.body.getAttribute('data-clarity-mask') === 'true' && storageAvailable;
  const allowed = () => consent === 'granted' && context();
  const read = () => {
    consent = 'unknown'; storageAvailable = true;
    try { const value = window.localStorage.getItem(key); if (value === 'granted' || value === 'denied') consent = value; }
    catch { storageAvailable = false; }
  };
  const clearCookies = () => {
    try {
      for (const entry of document.cookie.split(';')) {
        const name = entry.trim().split('=')[0];
        if (!['_clck', '_clsk'].includes(name)) continue;
        const expired = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
        document.cookie = expired;
        for (const domain of new Set([window.location.hostname, 'open-geo.net'])) document.cookie = `${expired}; Domain=${domain}`;
      }
    } catch { /* Cookie restrictions must not prevent stopping or reloading. */ }
  };
  const stop = (reload) => {
    stopped = started;
    if (started && typeof window.clarity === 'function') {
      // Pending loader commands must not grant consent after revocation.
      if (Array.isArray(window.clarity.q)) window.clarity.q.length = 0;
      window.clarity('stop');
      script?.remove();
    }
    clearCookies();
    if (started && reload) window.location.reload();
  };
  const render = () => {
    const status = document.getElementById('replay-status');
    if (status) status.textContent = !storageAvailable ? '无法保存录屏选择，录屏保持关闭。'
      : consent === 'denied' ? '已拒绝公开页录屏。'
      : consent === 'granted' ? id ? '已允许公开页录屏；仅在符合条件的公开页面运行。' : '录屏尚未启用，当前不会加载录屏服务。'
      : '未选择，默认不录屏。';
    if (status && loadFailed) status.textContent += ' 录屏脚本加载失败，页面仍可正常使用。';
  };
  const start = () => {
    if (started || !allowed()) return;
    started = true;
    window.clarity = function () { window.clarity.q.push(Array.from(arguments)); };
    window.clarity.q = [];
    script = document.createElement('script');
    script.async = true; script.referrerPolicy = 'no-referrer';
    // Pinned official SDK, without the hosted tag's automatic start/cookie-sync wrapper.
    script.src = 'https://scripts.clarity.ms/0.8.72-beta/clarity.js';
    script.onload = () => {
      if (!allowed() || stopped) { stop(false); render(); return; }
      try {
        window.clarity('start', { projectId: id, upload, track: false, content: false, cookies: [] });
        window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
      } catch { loadFailed = true; stop(false); render(); }
    };
    script.onerror = () => { loadFailed = true; stop(false); render(); };
    document.head.appendChild(script);
  };
  read(); render(); start();
  document.querySelectorAll('[data-replay-consent]').forEach((button) => button.addEventListener('click', () => {
    const value = button.getAttribute('data-replay-consent');
    if (!['granted', 'denied'].includes(value)) return;
    if (value === 'granted' && (!id || !upload)) { render(); return; }
    consent = value;
    let saved = true;
    try { window.localStorage.setItem(key, value); storageAvailable = true; }
    catch {
      saved = false; storageAvailable = false;
      try { window.localStorage.removeItem(key); } catch { /* Keep this document stopped. */ }
    }
    if (value === 'denied' || !saved) stop(saved);
    render();
    if (saved && value === 'granted') { if (stopped) window.location.reload(); else start(); }
  }));
  window.addEventListener('storage', (event) => {
    if (event.key !== key && event.key !== null) return;
    read(); render();
    if (!allowed()) stop(storageAvailable);
  });
  const checkContext = () => { if (!allowed()) stop(true); };
  window.addEventListener('popstate', checkContext);
  window.addEventListener('hashchange', checkContext);
})();
