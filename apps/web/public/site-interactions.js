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
  const control = band?.querySelector('[data-motion-toggle]');
  if (!band || !control) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const english = document.documentElement.lang === 'en';
  let paused = false;
  let motionRequested = false;
  const render = () => {
    const enabled = !motion.matches || motionRequested;
    band.classList.toggle('motion-ready', enabled);
    band.classList.toggle('motion-paused', paused || document.hidden);
    control.hidden = false;
    control.setAttribute('aria-pressed', String(paused));
    control.textContent = !enabled ? english ? 'Start carousel' : '开启轮播' : english ? paused ? 'Resume animation' : 'Pause animation' : paused ? '继续轮播' : '暂停轮播';
  };
  control.addEventListener('click', () => {
    if (motion.matches && !motionRequested) { motionRequested = true; paused = false; }
    else paused = !paused;
    render();
  });
  document.addEventListener('visibilitychange', render);
  motion.addEventListener('change', render);
  render();
})();
