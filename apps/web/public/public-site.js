/* global window, document, CustomEvent */
(() => {
  'use strict';
  // Versioned consent applies only to this local event adapter; no collectors are loaded.
  const key = 'opengeo:public-consent:v1';
  let consent = 'unknown';
  const publicPath = /^\/(?:blog\/(?:[a-z0-9-]+\/)?|privacy\/)$/;
  const events = new Set(['blog_index_view', 'blog_article_view', 'docs_click', 'github_click', 'workbench_click']);
  const read = () => {
    try { const stored = window.localStorage.getItem(key); if (stored === 'granted' || stored === 'denied') consent = stored; }
    catch { /* Blocked storage defaults to no measurement. */ }
  };
  const track = (name) => {
    if (consent !== 'granted' || !publicPath.test(window.location.pathname) || !events.has(name)) return;
    window.dispatchEvent(new CustomEvent('opengeo:measurement-event', { detail: { name, path: window.location.pathname } }));
  };
  const render = (saved = true) => {
    const status = document.getElementById('consent-status');
    if (status) status.textContent = (consent === 'granted' ? '已允许公开页面测量。' : consent === 'denied' ? '已拒绝测量。' : '未选择，默认不测量。') + (saved ? '' : ' 浏览器禁止存储，本次选择仅在当前页面生效。');
  };
  read(); render();
  const view = () => track(window.location.pathname === '/blog/' ? 'blog_index_view' : 'blog_article_view');
  if (window.location.pathname.startsWith('/blog/')) view();
  document.querySelectorAll('[data-consent]').forEach((button) => button.addEventListener('click', () => {
    const value = button.getAttribute('data-consent');
    if (value !== 'granted' && value !== 'denied') return;
    consent = value;
    let saved = true;
    try { window.localStorage.setItem(key, value); } catch { saved = false; }
    render(saved);
  }));
  document.querySelectorAll('a[data-event]').forEach((link) => link.addEventListener('click', () => track(link.getAttribute('data-event'))));
  window.addEventListener('storage', (event) => {
    if (event.key !== key && event.key !== null) return;
    consent = 'unknown'; read(); render();
  });
})();
