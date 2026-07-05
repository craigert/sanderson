<template>
  <div class="codex-page library">
    <div class="page-topbar">
      <div class="topbar-left">
        <router-link to="/" class="codex-home">
          <span class="codex-home-mark" aria-hidden="true">&#10022;</span> The Worldhopper&rsquo;s Codex
        </router-link>
      </div>
      <div class="topbar-actions">
        <button class="pill pill-btn palette-launch" @click="openPalette">&#9906; <kbd>⌘K</kbd></button>
        <button class="pill pill-btn" @click="toggleTheme">{{ themeLabel }}</button>
      </div>
    </div>

    <div class="book-sheet library-sheet">
    <header class="library-header">
      <div>
        <div class="chart-eyebrow">The collected works, catalogued &middot; {{ readCount }} of {{ books.length }} read</div>
        <h1>The Library</h1>
      </div>
      <div class="filter-toggles">
        <button :class="['filter-btn', { active: filter === 'all' }]" @click="filter = 'all'">All</button>
        <button :class="['filter-btn', { active: filter === 'cosmere' }]" @click="filter = 'cosmere'">Cosmere</button>
        <button :class="['filter-btn', { active: filter === 'non-cosmere' }]" @click="filter = 'non-cosmere'">Non-Cosmere</button>
        <button :class="['filter-btn', { active: unreadOnly }]" @click="unreadOnly = !unreadOnly">Unread</button>
      </div>
    </header>

    <p v-if="loading" class="status-message">Consulting the archives&hellip;</p>
    <p v-else-if="error" class="status-message error">{{ error }}</p>

    <div v-else class="books-grid">
      <template v-for="book in filteredBooks" :key="book.id">
        <router-link :to="'/book/' + book.id" :class="['book-card', { 'is-read': isRead(book.id) }]">
          <div class="book-cover-wrapper">
            <img
              v-if="!failedCovers[book.id]"
              :src="'/covers/' + book.id + '.jpg'"
              :alt="book.title"
              class="book-cover"
              loading="lazy"
              @error="failedCovers[book.id] = true"
            />
            <div v-else class="book-cover-placeholder">
              <span>{{ book.title }}</span>
            </div>
            <button
              class="read-toggle"
              :class="{ read: isRead(book.id) }"
              :aria-pressed="isRead(book.id)"
              :title="isRead(book.id) ? 'Read — click to unmark' : 'Mark as read'"
              @click.prevent.stop="toggleRead(book.id)"
            >&#10003;</button>
          </div>
          <div class="book-info">
            <h3>{{ book.title }}</h3>
            <p v-if="seriesMap[book.series_id]" class="book-series">
              {{ seriesMap[book.series_id] }}
              <span v-if="book.series_order"> &middot; Book {{ book.series_order }}</span>
            </p>
            <p class="book-year">{{ book.published_year }}</p>
            <span v-if="book.cosmere" class="cosmere-badge">COSMERE</span>
          </div>
        </router-link>
      </template>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useTheme } from '../theme.js';
import {
  openPalette, loadCatalog,
  books as catalogBooks, series as catalogSeries,
  isRead, toggleRead, readCount,
} from '../catalog.js';

const { toggleTheme, themeLabel } = useTheme();

const books = catalogBooks;
const seriesMap = computed(() =>
  Object.fromEntries(catalogSeries.value.map(s => [s.id, s.name]))
);
const loading = ref(true);
const error = ref(null);
const filter = ref('all');
const unreadOnly = ref(false);
const failedCovers = reactive({});

const filteredBooks = computed(() => {
  let list = books.value;
  if (filter.value === 'cosmere') list = list.filter(b => b.cosmere);
  else if (filter.value === 'non-cosmere') list = list.filter(b => !b.cosmere);
  if (unreadOnly.value) list = list.filter(b => !isRead(b.id));
  return list;
});

onMounted(async () => {
  try {
    await loadCatalog();
    if (!books.value.length) error.value = 'The archives are unreachable. Failed to load the library.';
  } catch {
    error.value = 'The archives are unreachable. Failed to load the library.';
  } finally {
    loading.value = false;
  }
});
</script>
