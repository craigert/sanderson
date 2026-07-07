<template>
  <div class="spread-overlay" @click="$emit('close')">
    <div
      class="spread"
      role="dialog"
      :aria-label="planet.name + ' — world spread'"
      ref="spreadEl"
      tabindex="-1"
      @click.stop
      @keydown.esc="$emit('close')"
    >
      <button class="spread-close" @click="$emit('close')" aria-label="Close">&times;</button>

      <!-- Left page: the world -->
      <div class="spread-page spread-left">
        <div class="spread-system">{{ planet.system }}</div>
        <h2>{{ planet.name }}</h2>
        <p class="spread-tagline">{{ planet.tagline }}</p>
        <p class="spread-description">{{ planet.description }}</p>

        <template v-if="planet.shards.length">
          <h3 class="spread-rule-title">Resident Shards</h3>
          <p v-for="shard in planet.shards" :key="shard.name" class="spread-shard">
            <strong>{{ shard.name }}</strong> &mdash; <em>{{ shard.note }}</em>
          </p>
        </template>

        <h3 class="spread-rule-title spread-magic-title">
          {{ planet.universe === 'cosmere' ? 'Arts & Investiture' : 'Powers & Abilities' }}
        </h3>
        <p v-for="m in planet.magic" :key="m.name" class="spread-magic">
          <strong>{{ m.name }}.</strong> {{ m.blurb }}
        </p>

        <button
          class="stamp-btn"
          :class="{ stamped: visited }"
          @click="$emit('toggle-visited')"
        >
          {{ visited ? 'STAMPED — SEEN THIS WORLD' : 'STAMP MY PASSPORT' }}
        </button>
      </div>

      <!-- Right page: the books -->
      <div class="spread-page spread-right">
        <h3 class="spread-rule-title">Volumes Charted Here</h3>
        <div v-if="books.length" class="spread-books">
          <template v-for="book in sortedBooks" :key="book.id">
            <div v-if="veiled(book)" class="spread-book veiled" title="Beyond your marked progress">
              <div class="spread-book-cover tint veil"></div>
              <div class="spread-book-text">
                <span class="spread-book-title">Beyond your voyage</span>
                <span class="spread-book-meta">{{ book.published_year }}</span>
              </div>
            </div>
            <router-link v-else :to="'/book/' + book.id" class="spread-book">
              <img
                v-if="!failedCovers[book.id]"
                :src="'/covers/' + book.id + '.jpg'"
                alt=""
                class="spread-book-cover"
                loading="lazy"
                @error="failedCovers[book.id] = true"
              />
              <div v-else class="spread-book-cover tint" :style="{ background: planet.colors.base }"></div>
              <div class="spread-book-text">
                <span class="spread-book-title">
                  {{ book.title }}<span v-if="isNew(book)" class="spread-new">NEW</span>
                </span>
                <span class="spread-book-meta">{{ bookMeta(book) }}</span>
              </div>
              <span class="spread-book-arrow" aria-hidden="true">&rarr;</span>
            </router-link>
          </template>
        </div>
        <p v-else class="spread-blank">
          This page has been left blank by the cartographer. No published volumes chart this world&hellip; yet.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue';
import { isSpoiled, spoilerActive, isNewBook, markSeen } from '../catalog.js';

function veiled(book) {
  return spoilerActive.value && isSpoiled(book);
}

const props = defineProps({
  planet: { type: Object, required: true },
  books: { type: Array, default: () => [] },
  seriesMap: { type: Object, default: () => ({}) },
  visited: { type: Boolean, default: false },
});

defineEmits(['close', 'toggle-visited']);

const spreadEl = ref(null);
const failedCovers = reactive({});

// Snapshot which books were new when this spread opened, so the NEW tags stay
// put for this viewing, then mark them seen (clearing the map bubble).
const newIds = ref(new Set());
function isNew(book) {
  return newIds.value.has(book.id);
}

onMounted(() => {
  spreadEl.value?.focus();
  const fresh = props.books.filter(b => isNewBook(b.id)).map(b => b.id);
  if (fresh.length) {
    newIds.value = new Set(fresh);
    markSeen(fresh);
  }
});

const sortedBooks = computed(() =>
  [...props.books].sort(
    (a, b) => a.series_id - b.series_id || (a.series_order || 0) - (b.series_order || 0)
  )
);

function bookMeta(book) {
  const series = (props.seriesMap[book.series_id] || 'Standalone').toUpperCase();
  let vol = '';
  if (book.series_order) vol = Number.isInteger(book.series_order) ? ` · VOL. ${book.series_order}` : ' · NOVELLA';
  return `${series}${vol} · ${book.published_year}`;
}
</script>
