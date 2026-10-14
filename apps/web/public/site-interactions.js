/* global document, window */
(() => {
  'use strict';
  // Locale choice is functional preference, unrelated to analytics consent.
  document.querySelectorAll('a[data-locale]').forEach(link => link.addEventListener('click', () => {
    const locale = link.getAttribute('data-locale');
    if (!['zh-CN', 'en'].includes(locale)) return;
    try { window.localStorage.setItem('opengeo:site-locale:v1', locale); } catch { /* The explicit URL remains authoritative. */ }
  }));
  document.querySelectorAll('.locale-switcher').forEach(menu => {
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary')?.focus(); }
    });
    document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
  });
  const band = document.querySelector('[data-platform-band]');
  const disclosure = band?.querySelector('.platform-disclosure');
  if (!band || !disclosure) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const render = () => {
    band.classList.toggle('motion-ready', !motion.matches);
    band.classList.toggle('motion-paused', disclosure.open || document.hidden);
  };
  disclosure.addEventListener('toggle', render);
  disclosure.addEventListener('keydown', event => {
    if (event.key === 'Escape' && disclosure.open) { disclosure.open = false; disclosure.querySelector('summary')?.focus(); render(); }
  });
  document.addEventListener('visibilitychange', render);
  motion.addEventListener('change', render);
  render();
})();
