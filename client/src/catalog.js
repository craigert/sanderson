// Shared catalog store: one-time data load, full-text search across worlds /
// books / characters / places / magic, and spoiler-safe state. Kept as a
// module-level singleton so every page and the command palette agree.
import { ref, computed } from 'vue';
import { PLANETS } from './data/cosmere.js';

export const books = ref([]);
export const series = ref([]);
export const characters = ref([]);
export const places = ref([]);
export const details = ref({});

let loaded = false;
let loading = null;

// Single static bundle baked from the catalog (see server/export-static.js).
export function loadCatalog() {
  if (loaded) return Promise.resolve();
  if (loading) return loading;
  loading = fetch('/data/catalog.json')
    .then(r => r.json())
    .then(data => {
      books.value = data.books || [];
      series.value = data.series || [];
      characters.value = data.characters || [];
      places.value = data.places || [];
      details.value = data.details || {};
      loaded = true;
    })
    .catch(() => { /* offline first load: search still covers static worlds & magic */ })
    .finally(() => { loading = null; });
  return loading;
}

export function seriesById(id) {
  return series.value.find(s => s.id === id) || null;
}

export function bookById(id) {
  return books.value.find(b => b.id === Number(id)) || null;
}

// Full book record merged with its characters & places
export function bookDetails(id) {
  const book = bookById(id);
  if (!book) return null;
  const d = details.value[id] || { characters: [], places: [] };
  return { ...book, characters: d.characters || [], places: d.places || [] };
}

function seriesName(id) {
  const s = seriesById(id);
  return s ? s.name : '';
}

// ── Reading log ──────────────────────────────────────────
const readStored = (() => {
  try { return JSON.parse(localStorage.getItem('cosmere-read-books') || '[]'); }
  catch { return []; }
})();
export const readBooks = ref(readStored);

export function isRead(id) {
  return readBooks.value.includes(Number(id));
}
export function toggleRead(id) {
  const n = Number(id);
  readBooks.value = isRead(n) ? readBooks.value.filter(x => x !== n) : [...readBooks.value, n];
  try { localStorage.setItem('cosmere-read-books', JSON.stringify(readBooks.value)); } catch { /* ignore */ }
}
export const readCount = computed(() => readBooks.value.length);

// ── Spoiler-safe ─────────────────────────────────────────
// Spoilers are scoped to each series' own reading order — progress in one
// series (or continuity) never veils another. A book is spoiled only when it
// comes later in ITS series than the furthest you've read there. Series whose
// volumes are independent (the standalones) never spoil one another, and a
// series you haven't started yet stays fully browsable.
function seriesIsSequential(seriesId) {
  const s = seriesById(seriesId);
  if (!s) return false;
  return !/standalone/i.test(s.name); // "Standalone Cosmere" volumes are independent
}

// Furthest volume (by series_order) you've read within a given series
export function furthestReadInSeries(seriesId) {
  let best = null;
  let bestOrder = -Infinity;
  for (const id of readBooks.value) {
    const b = bookById(id);
    if (b && b.series_id === seriesId && (b.series_order ?? -1) > bestOrder) {
      bestOrder = b.series_order ?? -1;
      best = b;
    }
  }
  return best;
}

export const spoilerActive = computed(() => readBooks.value.length > 0);

export function isSpoiled(bookOrId) {
  const book = typeof bookOrId === 'object' && bookOrId ? bookOrId : bookById(bookOrId);
  if (!book || book.series_order == null) return false;
  if (!seriesIsSequential(book.series_id)) return false;
  const furthest = furthestReadInSeries(book.series_id);
  if (!furthest) return false; // haven't started this series → nothing to spoil
  return book.series_order > (furthest.series_order ?? -1);
}

// ── Search ───────────────────────────────────────────────
export function search(q) {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const match = (text) => text && text.toLowerCase().includes(query);
  const out = [];

  for (const p of PLANETS) {
    if (match(p.name) || match(p.tagline) || match(p.system)) {
      out.push({ type: 'World', label: p.name, sub: p.system, to: { path: '/', query: { planet: p.id } } });
    }
    for (const m of (p.magic || [])) {
      if (match(m.name)) out.push({ type: 'Magic', label: m.name, sub: p.name, to: { path: '/', query: { planet: p.id } } });
    }
  }
  for (const b of books.value) {
    if (isSpoiled(b)) continue;
    if (match(b.title)) out.push({ type: 'Book', label: b.title, sub: seriesName(b.series_id), to: { path: '/book/' + b.id } });
  }
  for (const c of characters.value) {
    if (isSpoiled(c.book_id)) continue;
    if (match(c.name)) {
      const b = books.value.find(x => x.id === c.book_id);
      out.push({ type: 'Character', label: c.name, sub: b ? b.title : '', to: { path: '/book/' + c.book_id } });
    }
  }
  for (const pl of places.value) {
    if (isSpoiled(pl.book_id)) continue;
    if (match(pl.name)) {
      const b = books.value.find(x => x.id === pl.book_id);
      out.push({ type: 'Place', label: pl.name, sub: b ? b.title : '', to: { path: '/book/' + pl.book_id } });
    }
  }

  // Characters/places recur across volumes — keep the first (earliest) hit.
  const seen = new Set();
  const deduped = [];
  for (const r of out) {
    const key = `${r.type}|${r.label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }
  // Prefix matches rank first
  deduped.sort((a, b) => {
    const as = a.label.toLowerCase().startsWith(query) ? 0 : 1;
    const bs = b.label.toLowerCase().startsWith(query) ? 0 : 1;
    return as - bs;
  });
  return deduped.slice(0, 40);
}

// ── Command-palette open state (singleton) ───────────────
export const paletteOpen = ref(false);
export function openPalette() { loadCatalog(); paletteOpen.value = true; }
export function closePalette() { paletteOpen.value = false; }
