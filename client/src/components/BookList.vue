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
        <div class="chart-eyebrow">The collected works, catalogued</div>
        <h1>The Library</h1>
      </div>
      <div class="filter-toggles">
        <button :class="['filter-btn', { active: filter === 'all' }]" @click="filter = 'all'">All</button>
        <button :class="['filter-btn', { active: filter === 'cosmere' }]" @click="filter = 'cosmere'">Cosmere</button>
        <button :class="['filter-btn', { active: filter === 'non-cosmere' }]" @click="filter = 'non-cosmere'">Non-Cosmere</button>
      </div>
    </header>

    <p v-if="loading" class="status-message">Consulting the archives&hellip;</p>
    <p v-else-if="error" class="status-message error">{{ error }}</p>

    <div v-else class="books-grid">
      <template v-for="book in filteredBooks" :key="book.id">
        <!-- Spoiler-veiled: past the reader's marked furthest volume -->
        <div v-if="isVeiled(book)" class="book-card veiled" title="Beyond your marked progress">
          <div class="book-cover-wrapper">
            <div class="book-cover-placeholder veil-cover"><span aria-hidden="true">&#10022;</span></div>
          </div>
          <div class="book-info">
            <h3 class="veil-title">Beyond your voyage</h3>
            <p class="book-year">{{ book.published_year }}</p>
          </div>
        </div>

        <router-link v-else :to="'/book/' + book.id" class="book-card">
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
  openPalette, loadCatalog, isSpoiled, spoilerActive,
  books as catalogBooks, series as catalogSeries,
} from '../catalog.js';

const { toggleTheme, themeLabel } = useTheme();

function isVeiled(book) {
  return spoilerActive.value && isSpoiled(book);
}

const books = catalogBooks;
const seriesMap = computed(() =>
  Object.fromEntries(catalogSeries.value.map(s => [s.id, s.name]))
);
const loading = ref(true);
const error = ref(null);
const filter = ref('all');
const failedCovers = reactive({});

const filteredBooks = computed(() => {
  if (filter.value === 'cosmere') return books.value.filter(b => b.cosmere);
  if (filter.value === 'non-cosmere') return books.value.filter(b => !b.cosmere);
  return books.value;
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
