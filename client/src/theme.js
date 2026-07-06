import { ref, computed } from 'vue';

const stored = localStorage.getItem('cosmere-codex-theme');
const theme = ref(stored === 'dark' ? 'dark' : 'light');

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.setItem('cosmere-codex-theme', theme.value);
  }
  // Dark theme is "Shadesmar" (the Cognitive Realm); light is the day chart
  const themeLabel = computed(() => (theme.value === 'light' ? 'SHADESMAR' : 'DAY CHART'));
  return { theme, toggleTheme, themeLabel };
}
