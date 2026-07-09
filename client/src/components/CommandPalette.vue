<template>
  <transition name="palette-fade">
    <div v-if="paletteOpen" class="palette-overlay" @click="close">
      <div class="palette" role="dialog" aria-label="Search the Cosmere" @click.stop>
        <div class="palette-input-row">
          <svg class="palette-icon ico-search" viewBox="0 0 16 16" aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.6" fill="none" stroke="currentColor" stroke-width="1.6" /><line x1="10.2" y1="10.2" x2="14.5" y2="14.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
          <input
            ref="inputEl"
            v-model="query"
            class="palette-input"
            placeholder="Search worlds, books, characters, magic…"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="choose(active)"
            @keydown.esc.prevent="close"
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
          </li>
        </ul>
        <p v-else-if="query" class="palette-empty">Nothing charted by that name.</p>
        <p v-else class="palette-empty">Try a world, a book, a character, a magic system&hellip;</p>

        <div class="palette-footer">
          <span class="palette-status">
            Spoiler-safe: <strong>{{ readCount ? 'on' : 'off' }}</strong>
            <span class="palette-status-hint">&middot; hides what&rsquo;s ahead in series you&rsquo;re reading</span>
          </span>
          <span class="palette-hints"><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate &middot; <kbd>&crarr;</kbd> open</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { paletteOpen, closePalette, search, readCount } from '../catalog.js';

const router = useRouter();
const inputEl = ref(null);
const listEl = ref(null);
const query = ref('');
const active = ref(0);

const rows = computed(() =>
  search(query.value).map((r, i) => ({
    key: `${r.type}:${r.label}:${i}`,
    tag: r.type,
    label: r.label,
    sub: r.sub,
    to: r.to,
  }))
);

watch(rows, () => { active.value = 0; });
watch(paletteOpen, (open) => {
  if (open) {
    query.value = '';
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
  closePalette();
  router.push(row.to);
}

function close() {
  closePalette();
}
</script>
