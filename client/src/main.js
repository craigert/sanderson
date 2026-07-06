import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.scss';
import { playPageTurn } from './sound.js';

// A soft page-turn on every route change (no-op unless sound is enabled)
let firstNav = true;
router.afterEach(() => {
  if (firstNav) { firstNav = false; return; }
  playPageTurn();
});

createApp(App).use(router).mount('#app');

// PWA: register the service worker in production builds only —
// in dev it would cache stale modules and fight with Vite HMR.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  // When a new worker takes control (after a deploy), reload once so the
  // fresh app + assets load — no manual hard-refresh needed.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !hadController) return;
    refreshing = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    // updateViaCache:'none' → the browser always revalidates sw.js, so updates
    // propagate promptly instead of being pinned by the HTTP cache.
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
  });
}
