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

// ── Spoiler-safe (reading-order aware) ───────────────────
// Spoilers follow the canonical Cosmere reading order, including cross-series
// dependencies. Every book has prerequisites — the volumes you should read
// first — and it stays veiled until all of them are marked read. Intra-series
// order is automatic (each volume needs the previous one in its series); the
// map below adds the cross-series gates from the recommended order.
const EXTRA_PREREQS = {
  // Mistborn Era 2 opens 300 years after Era 1 — finish Era 1 first
  'The Alloy of Law': ['The Hero of Ages'],
  // Secret History pulls the curtain back — read after Oathbringer (its intra
  // prerequisite, The Hero of Ages, is added automatically)
  'Mistborn: Secret History': ['Oathbringer'],
  // The post-Rhythm-of-War standalones
  'Tress of the Emerald Sea': ['Rhythm of War'],
  'Yumi and the Nightmare Painter': ['Rhythm of War'],
  // Far-future capstone — read late, before the newest Stormlight
  'The Sunlit Man': ['Rhythm of War', 'The Lost Metal'],
  'Wind and Truth': ['The Sunlit Man'],
};

function seriesIsSequential(seriesId) {
  const s = seriesById(seriesId);
  if (!s) return false;
  return !/standalone/i.test(s.name); // "Standalone Cosmere" volumes are independent
}

// Direct prerequisites: the previous volume in a sequential series plus any
// explicit cross-series gates. Chains resolve link by link (not transitive).
export function prereqsFor(bookOrId) {
  const book = typeof bookOrId === 'object' && bookOrId ? bookOrId : bookById(bookOrId);
  if (!book) return [];
  const result = [];
  if (seriesIsSequential(book.series_id) && book.series_order != null) {
    let prev = null;
    for (const b of books.value) {
      if (b.series_id === book.series_id && b.series_order != null && b.series_order < book.series_order) {
        if (!prev || b.series_order > prev.series_order) prev = b;
      }
    }
    if (prev) result.push(prev);
  }
  for (const title of (EXTRA_PREREQS[book.title] || [])) {
    const b = books.value.find(x => x.title === title);
    if (b && !result.includes(b)) result.push(b);
  }
  return result;
}

export function unreadPrereqs(bookOrId) {
  return prereqsFor(bookOrId).filter(b => !isRead(b.id));
}

// Safe to pick up next: unread, with every prerequisite already read
export function readyToRead(bookOrId) {
  const book = typeof bookOrId === 'object' && bookOrId ? bookOrId : bookById(bookOrId);
  if (!book || isRead(book.id)) return false;
  return unreadPrereqs(book).length === 0;
}

export const spoilerActive = computed(() => readBooks.value.length > 0);

export function isSpoiled(bookOrId) {
  if (readBooks.value.length === 0) return false; // no opt-in until you log a read
  const book = typeof bookOrId === 'object' && bookOrId ? bookOrId : bookById(bookOrId);
  if (!book || isRead(book.id)) return false;
  return unreadPrereqs(book).length > 0;
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
