<template>
  <div class="codex" :data-theme="theme">
    <router-view />
    <CommandPalette />
  </div>
</template>

<script setup>
import { watchEffect, onMounted, onUnmounted } from 'vue';
import { useTheme } from './theme.js';
import CommandPalette from './components/CommandPalette.vue';
import { openPalette, paletteOpen } from './catalog.js';

const { theme } = useTheme();

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', theme.value);
});

// Global launcher: ⌘K / Ctrl-K anywhere, or "/" when not already typing.
function onKeydown(e) {
  const k = e.key.toLowerCase();
  if ((e.metaKey || e.ctrlKey) && k === 'k') {
    e.preventDefault();
    openPalette();
    return;
  }
  if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !paletteOpen.value) {
    const el = document.activeElement;
    const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    if (!typing) {
      e.preventDefault();
      openPalette();
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>
