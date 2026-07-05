<template>
  <transition name="palette-fade">
    <div v-if="paletteOpen" class="palette-overlay" @click="close">
      <div class="palette" role="dialog" aria-label="Search the Cosmere" @click.stop>
        <div class="palette-input-row">
          <span class="palette-icon" aria-hidden="true">{{ mode === 'spoiler' ? '⛶' : '⌕' }}</span>
          <input
            ref="inputEl"
            v-model="query"
            class="palette-input"
            :placeholder="mode === 'spoiler' ? 'How far have you read? Pick your furthest volume…' : 'Search worlds, books, characters, magic…'"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="choose(active)"
            @keydown.esc.prevent="onEsc"
          />
          <kbd class="palette-kbd">esc</kbd>
        </div>

        <ul v-if="rows.length" class="palette-list" ref="listEl">
          <li
            v-for="(row, i) in rows"
            :key="row.key"
            :class="['palette-row', { active: i === active }]"
            @mouseenter="active = i"
            @click="choose(i)"
          >
            <span class="palette-tag" :data-type="row.tag">{{ row.tag }}</span>
            <span class="palette-label">{{ row.label }}</span>
            <span v-if="row.sub" class="palette-sub">{{ row.sub }}</span>
            <span v-if="row.check" class="palette-check" aria-hidden="true">&#10003;</span>
          </li>
        </ul>
        <p v-else-if="query" class="palette-empty">Nothing charted by that name.</p>
        <p v-else-if="mode === 'search'" class="palette-empty">
          Try a world, a book, a character&hellip; or set how far you&rsquo;ve read below.
        </p>

        <div class="palette-footer">
          <template v-if="mode === 'search'">
            <button class="palette-spoiler-btn" @click="enterSpoiler">
              Spoiler-safe: <strong>{{ spoilerBook ? spoilerBook.title : 'Off' }}</strong>
            </button>
            <span class="palette-hints"><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate &middot; <kbd>&crarr;</kbd> open</span>
          </template>
          <template v-else>
            <span class="palette-hints">Choose your furthest-read volume &mdash; later books get veiled.</span>
          </template>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  paletteOpen, closePalette, search,
  booksByOrder, spoilerBook, setSpoiler,
} from '../catalog.js';

const router = useRouter();
const inputEl = ref(null);
const listEl = ref(null);
const query = ref('');
const active = ref(0);
const mode = ref('search'); // 'search' | 'spoiler'

const searchRows = computed(() =>
  search(query.value).map((r, i) => ({
    key: `${r.type}:${r.label}:${i}`,
    tag: r.type,
    label: r.label,
    sub: r.sub,
    to: r.to,
  }))
);

const spoilerRows = computed(() => {
  const q = query.value.trim().toLowerCase();
  const list = booksByOrder.value.filter(b => !q || b.title.toLowerCase().includes(q));
  const rows = list.map(b => ({
    key: 'sp:' + b.id,
    tag: b.published_year ? String(b.published_year) : 'BOOK',
    label: b.title,
    sub: '',
    check: spoilerBook.value && spoilerBook.value.id === b.id,
    spoilerId: b.id,
  }));
  if (!q) {
    rows.unshift({ key: 'sp:off', tag: 'ALL', label: 'Off — show everything', sub: '', check: !spoilerBook.value, spoilerId: null });
  }
  return rows;
});

const rows = computed(() => (mode.value === 'search' ? searchRows.value : spoilerRows.value));

watch(rows, () => { active.value = 0; });
watch(paletteOpen, (open) => {
  if (open) {
    query.value = '';
    mode.value = 'search';
    active.value = 0;
    nextTick(() => inputEl.value?.focus());
  }
});

function move(delta) {
  const n = rows.value.length;
  if (!n) return;
  active.value = (active.value + delta + n) % n;
  nextTick(() => {
    const el = listEl.value?.children[active.value];
    el?.scrollIntoView({ block: 'nearest' });
  });
}

function choose(i) {
  const row = rows.value[i];
  if (!row) return;
  if (mode.value === 'spoiler') {
    setSpoiler(row.spoilerId);
    mode.value = 'search';
    query.value = '';
    nextTick(() => inputEl.value?.focus());
    return;
  }
  closePalette();
  router.push(row.to);
}

function enterSpoiler() {
  mode.value = 'spoiler';
  query.value = '';
  active.value = 0;
  nextTick(() => inputEl.value?.focus());
}

function onEsc() {
  if (mode.value === 'spoiler') {
    mode.value = 'search';
    query.value = '';
    return;
  }
  close();
}

function close() {
  closePalette();
}
</script>
