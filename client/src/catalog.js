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

// Publication order — the basis for "how far have you read"
const orderMap = computed(() => {
  const sorted = [...books.value].sort(
    (a, b) => (a.published_year - b.published_year) || (a.id - b.id)
  );
  const m = {};
  sorted.forEach((bk, i) => { m[bk.id] = i; });
  return m;
});

// ── Spoiler-safe ─────────────────────────────────────────
const stored = (() => {
  try { const v = localStorage.getItem('cosmere-spoiler-book'); return v ? Number(v) : null; }
  catch { return null; }
})();
export const spoilerBookId = ref(stored);

export function setSpoiler(id) {
  spoilerBookId.value = id;
  try {
    if (id == null) localStorage.removeItem('cosmere-spoiler-book');
    else localStorage.setItem('cosmere-spoiler-book', String(id));
  } catch { /* ignore */ }
}

export const spoilerActive = computed(() => spoilerBookId.value != null);

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
export const spoilerBook = computed(() => books.value.find(b => b.id === spoilerBookId.value) || null);

// A book is spoiled when it was published later than your marked furthest read.
export function isSpoiled(bookOrId) {
  if (spoilerBookId.value == null) return false;
  const id = typeof bookOrId === 'object' && bookOrId ? bookOrId.id : bookOrId;
  const om = orderMap.value;
  const bi = om[id];
  const fi = om[spoilerBookId.value];
  if (bi == null || fi == null) return false;
  return bi > fi;
}

// Books in reading order, for the spoiler picker
export const booksByOrder = computed(() =>
  [...books.value].sort((a, b) => (a.published_year - b.published_year) || (a.id - b.id))
);

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
