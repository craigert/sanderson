<template>
  <div class="codex-page book-page">
    <div class="page-topbar">
      <div class="topbar-left">
        <router-link to="/" class="codex-home">
          <span class="codex-home-mark" aria-hidden="true">&#10022;</span> The Worldhopper&rsquo;s Codex
        </router-link>
        <a href="#" class="back-link" @click.prevent="goBack">&larr; Back</a>
      </div>
      <div class="topbar-actions">
        <button class="pill pill-btn palette-launch" @click="openPalette">&#9906; <kbd>⌘K</kbd></button>
        <button class="pill pill-btn" @click="toggleTheme">{{ themeLabel }}</button>
      </div>
    </div>

    <p v-if="loading" class="status-message">Consulting the archives&hellip;</p>
    <p v-else-if="error" class="status-message error">{{ error }}</p>

    <div v-else-if="spoilerWall" class="book-sheet spoiler-wall">
      <div class="spoiler-wall-mark" aria-hidden="true">&#10022;</div>
      <h2>Here be spoilers</h2>
      <p>
        In the reading order, this comes after
        <strong>{{ neededTitles }}</strong> &mdash; which you haven&rsquo;t marked read yet. Its
        characters, places, and revelations lie beyond your voyage.
      </p>
      <div class="spoiler-wall-actions">
        <button class="pill pill-btn" @click="revealed = true">Reveal anyway</button>
        <router-link to="/books" class="pill pill-btn">Back to the Library</router-link>
      </div>
    </div>

    <div v-else-if="book" class="book-sheet">
      <!-- ── Hero ── -->
      <header class="book-hero">
        <img
          v-if="!coverFailed"
          :src="'/covers/' + book.id + '.jpg'"
          :alt="'Cover of ' + book.title"
          class="hero-cover"
          @error="coverFailed = true"
        />
        <div v-else class="hero-cover-tint" :style="{ background: tint }">
          <span class="tint-author">Brandon Sanderson</span>
          <span class="tint-title">{{ book.title }}</span>
        </div>

        <div class="hero-info">
          <div class="hero-chips">
            <router-link v-if="planet" :to="'/?planet=' + planet.id" class="chip chip-world" :title="'Open ' + planet.name + ' on the chart'">
              <span class="chip-dot" :style="{ background: glow }"></span>{{ planet.name }}
            </router-link>
            <span v-if="seriesName" class="chip">
              {{ seriesName }}<template v-if="book.series_order"> &middot; Book {{ book.series_order }}</template>
            </span>
            <span v-if="book.published_year" class="chip">{{ book.published_year }}</span>
            <span v-if="book.cosmere" class="chip chip-cosmere">COSMERE</span>
          </div>
          <h1>{{ book.title }}</h1>
          <p v-if="planet" class="hero-tagline">{{ planet.tagline }}</p>
          <p v-if="book.synopsis" class="hero-synopsis">{{ book.synopsis }}</p>
        </div>
      </header>

      <!-- ── Section chips ── -->
      <nav class="section-chips" aria-label="Book sections">
        <a v-if="characters.length" href="#characters" class="section-chip">CHARACTERS <span>{{ characters.length }}</span></a>
        <a v-if="magic.length" href="#magic" class="section-chip">MAGIC &amp; POWERS <span>{{ magic.length }}</span></a>
        <a v-if="places.length" href="#places" class="section-chip">PLACES <span>{{ places.length }}</span></a>
      </nav>

      <!-- ── Characters ── -->
      <section v-if="characters.length" id="characters" class="page-section">
        <h2>Dramatis Personae</h2>
        <div class="section-rule"></div>
        <div class="page-grid">
          <article v-for="char in characters" :key="char.id" class="page-card character-card">
            <div class="character-initial" :style="{ background: tint }" aria-hidden="true">{{ char.name.charAt(0) }}</div>
            <div>
              <div class="card-title">{{ char.name }}</div>
              <div class="card-body" v-if="char.description">{{ char.description }}</div>
            </div>
          </article>
        </div>
      </section>

      <!-- ── Magic ── -->
      <section v-if="magic.length" id="magic" class="page-section">
        <h2>Magic &amp; Powers</h2>
        <p v-if="planet" class="section-sub">The powers at work on {{ planet.name }}</p>
        <div class="section-rule"></div>
        <div class="page-grid">
          <article v-for="m in magic" :key="m.name" class="page-card magic-card" :style="{ borderLeftColor: glow }">
            <div class="card-title">{{ m.name }}</div>
            <div class="card-body">{{ m.blurb }}</div>
          </article>
        </div>
      </section>

      <!-- ── Places ── -->
      <section v-if="places.length" id="places" class="page-section">
        <h2>Notable Places</h2>
        <div class="section-rule"></div>
        <div class="page-grid">
          <article v-for="place in places" :key="place.id" class="page-card">
            <div v-if="place.type" class="place-type">{{ typeLabel(place.type) }}</div>
            <div class="card-title">{{ place.name }}</div>
            <div class="card-body" v-if="place.description">{{ place.description }}</div>
          </article>
        </div>
      </section>

      <!-- ── Also charted on this world ── -->
      <section v-if="siblings.length && planet" class="page-section siblings-section">
        <h2 class="siblings-title">Also charted on {{ planet.name }}</h2>
        <div class="section-rule"></div>
        <div class="sibling-buttons">
          <router-link v-for="sib in siblings" :key="sib.id" :to="'/book/' + sib.id" class="sibling-btn">
            {{ sib.title }}
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { planetForBook, booksForPlanet } from '../data/cosmere.js';
import { useTheme } from '../theme.js';
import {
  openPalette, loadCatalog, isSpoiled, spoilerActive, unreadPrereqs,
  bookDetails, seriesById, books as catalogBooks,
} from '../catalog.js';

const { toggleTheme, themeLabel } = useTheme();
const route = useRoute();
const router = useRouter();

// Spoiler interstitial: revealed per-book for this session only
const revealed = ref(false);

const book = ref(null);
const characters = ref([]);
const places = ref([]);
const seriesName = ref('');
const allBooks = ref([]);
const loading = ref(true);
const error = ref(null);
const coverFailed = ref(false);

function goBack() {
  if (window.history.state && window.history.state.back) {
    router.back();
  } else {
    router.push('/');
  }
}

const planet = computed(() => (book.value ? planetForBook(book.value) : null));
const magic = computed(() => planet.value?.magic || []);
const tint = computed(() => planet.value?.colors.base || '#3a2d1c');
const glow = computed(() => planet.value?.colors.glow || '#c9a84a');

const siblings = computed(() => {
  if (!planet.value || !book.value) return [];
  return booksForPlanet(planet.value, allBooks.value)
    .filter(b => b.id !== book.value.id && !(spoilerActive.value && isSpoiled(b)))
    .sort((a, b) => a.series_id - b.series_id || (a.series_order || 0) - (b.series_order || 0));
});

// Show the spoiler wall when this volume lies past the reader's marked progress
const spoilerWall = computed(() =>
  !!book.value && spoilerActive.value && isSpoiled(book.value) && !revealed.value
);
const neededTitles = computed(() => {
  if (!book.value) return '';
  const titles = unreadPrereqs(book.value).map(b => b.title);
  if (titles.length <= 1) return titles[0] || '';
  return titles.slice(0, -1).join(', ') + ' and ' + titles[titles.length - 1];
});

const TYPE_LABELS = {
  city: 'City',
  region: 'Region',
  landmark: 'Landmark',
  realm: 'Realm',
  world: 'World',
};
function typeLabel(type) {
  return TYPE_LABELS[type] || type;
}

async function load(id) {
  loading.value = true;
  error.value = null;
  coverFailed.value = false;
  revealed.value = false;
  try {
    await loadCatalog();
    const data = bookDetails(id);
    if (!data) {
      error.value = 'The archives are unreachable. Failed to load this volume.';
      return;
    }
    book.value = data;
    characters.value = data.characters || [];
    places.value = data.places || [];
    allBooks.value = catalogBooks.value;
    seriesName.value = seriesById(data.series_id)?.name || '';
  } catch (e) {
    error.value = 'The archives are unreachable. Failed to load this volume.';
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, (id) => {
  if (id) {
    load(id);
    window.scrollTo({ top: 0 });
  }
}, { immediate: true });
</script>
