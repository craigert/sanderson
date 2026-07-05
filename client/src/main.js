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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
