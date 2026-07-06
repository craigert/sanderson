<template>
  <div class="codex-chart">
    <header class="chart-header">
      <div>
        <div class="chart-eyebrow">Being a chart of the known Shardworlds</div>
        <h1>The Worldhopper&rsquo;s Codex</h1>
      </div>
      <div class="chart-pills">
        <div class="pill" aria-label="Passport progress">
          PASSPORT &middot; {{ visited.length }} / {{ totalWorlds }} WORLDS
        </div>
        <button class="pill pill-btn palette-launch" @click="openPalette">&#9906; SEARCH <kbd>⌘K</kbd></button>
        <router-link to="/books" class="pill pill-btn">LIBRARY</router-link>
        <button
          class="pill pill-btn"
          :class="{ 'pill-on': soundEnabled }"
          :aria-pressed="soundEnabled"
          :title="soundEnabled ? 'Mute ambience' : 'Enable ambience & haptics'"
          @click="toggleSound"
        >{{ soundEnabled ? '♪ ON' : '♪ OFF' }}</button>
        <button class="pill pill-btn" @click="toggleTheme">{{ themeLabel }}</button>
      </div>
    </header>

    <div
      class="chart-viewport"
      :class="{ flying }"
      ref="viewportEl"
      @wheel.prevent="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <svg
        class="chart-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="group"
        aria-label="Chart of the known Shardworlds"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="neb-indigo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#3a3f9a" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#3a3f9a" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="neb-teal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#1f7a74" stop-opacity="0.42" />
            <stop offset="100%" stop-color="#1f7a74" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="neb-magenta" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#7a2f6a" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#7a2f6a" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="milky" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#aeb9d8" stop-opacity="0.16" />
            <stop offset="55%" stop-color="#aeb9d8" stop-opacity="0.05" />
            <stop offset="100%" stop-color="#aeb9d8" stop-opacity="0" />
          </radialGradient>
          <filter id="bloom" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <!-- Clips Canticle's terminator shadow to the planet disc -->
          <clipPath id="clip-canticle"><circle r="15" /></clipPath>
          <linearGradient id="terminator" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#000" stop-opacity="0" />
            <stop offset="42%" stop-color="#000" stop-opacity="0" />
            <stop offset="58%" stop-color="#000" stop-opacity="0.62" />
            <stop offset="100%" stop-color="#000" stop-opacity="0.62" />
          </linearGradient>
        </defs>

        <g :transform="`translate(${tx} ${ty}) scale(${scale})`">
          <rect x="-2400" y="-2400" width="6400" height="5800" class="chart-paper" />

          <!-- Nebulae & Milky Way (night sky depth) -->
          <g v-if="isDark" class="chart-nebulae" aria-hidden="true">
            <ellipse cx="800" cy="480" rx="2600" ry="560" transform="rotate(-24 800 480)" fill="url(#milky)" />
            <ellipse cx="300" cy="250" rx="620" ry="440" fill="url(#neb-indigo)" />
            <ellipse cx="1300" cy="760" rx="680" ry="520" fill="url(#neb-teal)" />
            <ellipse cx="900" cy="120" rx="520" ry="360" fill="url(#neb-magenta)" />
            <ellipse cx="2000" cy="520" rx="560" ry="440" fill="url(#neb-indigo)" />
          </g>

          <!-- Celestial graticule: bearing spokes + range rings + ecliptic -->
          <g class="chart-graticule" aria-hidden="true">
            <line v-for="(s, i) in graticuleSpokes" :key="'gs' + i" :x1="CENTER.x" :y1="CENTER.y" :x2="s.x" :y2="s.y" class="grat-spoke" />
            <circle v-for="(r, i) in graticuleRings" :key="'gr' + i" :cx="CENTER.x" :cy="CENTER.y" :r="r" class="grat-ring" />
            <ellipse class="grat-ecliptic" :cx="CENTER.x" :cy="CENTER.y" rx="1180" ry="450" :transform="`rotate(-18 ${CENTER.x} ${CENTER.y})`" />
          </g>

          <!-- Firmament: stars marked across the chart, cartographer-style -->
          <g class="chart-stars" aria-hidden="true">
            <template v-for="(s, i) in stars" :key="'st' + i">
              <g v-if="s.bright" :transform="`translate(${s.x} ${s.y})`" class="star-mark" :style="twStyle(s)">
                <line :x1="-s.r * 2.4" y1="0" :x2="s.r * 2.4" y2="0" />
                <line x1="0" :y1="-s.r * 2.4" x2="0" :y2="s.r * 2.4" />
                <circle :r="s.r * 0.7" />
              </g>
              <circle v-else :cx="s.x" :cy="s.y" :r="s.r" class="star-dot" :style="twStyle(s)" />
            </template>
          </g>

          <!-- Constellations -->
          <g class="chart-constellations" aria-hidden="true">
            <g v-for="con in constellations" :key="con.name">
              <polyline :points="con.line" class="con-line" />
              <circle v-for="(pt, i) in con.stars" :key="i" :cx="pt.x" :cy="pt.y" :r="pt.r" class="con-star" />
              <text :x="con.label.x" :y="con.label.y" text-anchor="middle" class="con-label">{{ con.name }}</text>
            </g>
          </g>

          <!-- Worldhopper routes -->
          <g v-for="c in connectionPaths" :key="c.key">
            <path
              :d="c.d"
              class="route-hit"
              @pointerenter="hoverRoute = c.key"
              @pointerleave="hoverRoute = null"
            />
            <path :d="c.d" :class="['route-line', { lit: routeLit(c) }]" />
            <text v-if="routeLit(c)" class="route-label" :x="c.mx" :y="c.my - 14" text-anchor="middle">
              {{ c.label }}
            </text>
            <!-- CSS motion path (not SMIL) so the dot departs the route's
                 start the moment the hover begins -->
            <g
              v-if="hoverRoute === c.key"
              class="route-dot"
              :style="{ offsetPath: `path('${c.d}')` }"
              aria-hidden="true"
            >
              <circle r="5" />
              <circle r="10" class="halo" />
            </g>
          </g>

          <!-- Worlds -->
          <g
            v-for="w in worldNodes"
            :key="w.id"
            :class="['world-node', { 'world-secret': w.id === 'seventeenth-shard' }]"
            :transform="`translate(${w.x} ${w.y})`"
            tabindex="0"
            role="button"
            :aria-label="`${w.name} — ${w.tagline}. Press Enter to open this world's page.`"
            @click="selectPlanet(w.planet)"
            @keydown.enter.prevent="selectPlanet(w.planet)"
            @keydown.space.prevent="selectPlanet(w.planet)"
            @pointerenter="hoverId = w.id"
            @pointerleave="hoverId = null"
          >
            <circle v-if="isDark" :r="w.r * 2.6" :fill="w.glow" class="world-bloom" filter="url(#bloom)" />
            <circle v-for="(o, i) in w.orbits" :key="'orb' + i" :r="o" class="moon-orbit" />
            <circle :r="w.rOuter" class="world-outer" />
            <circle :r="w.rMid" class="world-mid" stroke-dasharray="3 3" />
            <circle :r="w.r" :fill="w.fill" class="world-core" />

            <!-- Living-world ambient effects -->
            <template v-if="w.id === 'roshar'">
              <g class="life-highstorm" aria-hidden="true">
                <g>
                  <path :d="highstormArc(w.r)" />
                  <animateTransform v-if="motionOK" attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="15s" repeatCount="indefinite" />
                </g>
              </g>
              <g class="life-spren" aria-hidden="true">
                <g v-for="(sp, si) in spren" :key="si">
                  <circle :cx="w.r * sp.rad" cy="0" :r="sp.size" class="spren-mote" :style="sp.style" />
                  <animateTransform v-if="motionOK" attributeName="transform" type="rotate" :from="`${sp.from} 0 0`" :to="`${sp.to} 0 0`" :dur="sp.dur" repeatCount="indefinite" />
                </g>
              </g>
            </template>

            <g v-else-if="w.id === 'nalthis'" class="life-pulse" aria-hidden="true">
              <circle :r="w.r" class="pulse-ring" />
              <circle :r="w.r" class="pulse-ring d2" />
              <circle :r="w.r" class="pulse-ring d3" />
            </g>

            <template v-else-if="w.id === 'scadrial'">
              <g class="life-steel" aria-hidden="true">
                <line v-for="(l, li) in steelLines(w.r)" :key="li" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" />
              </g>
              <g class="life-ash" aria-hidden="true">
                <circle v-for="(a, ai) in ashFlecks" :key="ai" :cx="a.x" cy="0" :r="a.r" class="ash" :style="a.style" />
              </g>
            </template>

            <g v-else-if="w.id === 'sel'" class="life-aon" aria-hidden="true">
              <path :d="aonPath(w.r)" class="aon-stroke" />
            </g>

            <g v-else-if="w.id === 'detritus'" class="life-debris" aria-hidden="true">
              <g>
                <circle :r="w.r * 1.7" class="debris-ring" />
                <animateTransform v-if="motionOK" attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="44s" repeatCount="indefinite" />
              </g>
              <g>
                <circle :cx="w.r * 1.28" cy="0" r="1.7" class="fighter" />
                <animateTransform v-if="motionOK" attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="3.4s" repeatCount="indefinite" />
              </g>
            </g>

            <g v-else-if="w.id === 'komashi'" class="life-spirits" aria-hidden="true">
              <circle v-for="(m, mi) in spiritMotes" :key="mi" :cx="m.x" cy="0" :r="m.r" class="spirit" :style="m.style" />
            </g>

            <g v-else-if="w.id === 'canticle'" class="life-terminator" aria-hidden="true" clip-path="url(#clip-canticle)">
              <g>
                <rect x="-16" y="-16" width="32" height="32" fill="url(#terminator)" />
                <rect x="-1" y="-16" width="2" height="32" class="sun-edge" />
                <animateTransform v-if="motionOK" attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="26s" repeatCount="indefinite" />
              </g>
            </g>

            <!-- Moons, orbiting their world -->
            <g v-for="m in w.moons" :key="m.name">
              <g>
                <circle :cx="m.cx" :cy="m.cy" :r="m.r" :fill="m.color" class="moon">
                  <title>{{ m.name }}</title>
                </circle>
                <animateTransform v-if="motionOK" attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" :dur="m.dur" repeatCount="indefinite" />
              </g>
            </g>
            <g v-if="isVisited(w.id)" transform="rotate(-14)" class="world-stamp" aria-hidden="true">
              <circle :r="w.stampR" />
              <text y="5" text-anchor="middle">SEEN</text>
            </g>
            <text :y="w.labelY" text-anchor="middle" class="world-name">{{ w.name }}</text>
            <text :y="w.subY" text-anchor="middle" class="world-sub">{{ w.sub }}</text>
          </g>

          <!-- Easter egg: Hoid, hidden somewhere on the chart this session -->
          <g
            v-if="!hoidFound"
            class="hoid"
            :transform="`translate(${hoidSpot.x} ${hoidSpot.y})`"
            role="button"
            tabindex="0"
            aria-label="A mysterious wanderer"
            @click.stop="onFindHoid"
            @keydown.enter.prevent="onFindHoid"
          >
            <circle class="hoid-halo" r="16" />
            <g class="hoid-fig">
              <circle cy="-6" r="2.6" />
              <line x1="0" y1="-3.4" x2="0" y2="5" />
              <line x1="0" y1="5" x2="-3" y2="10" />
              <line x1="0" y1="5" x2="3" y2="10" />
              <line x1="-3" y1="-1" x2="3" y2="0.5" />
              <line class="hoid-staff" x1="4" y1="-8" x2="4" y2="10" />
            </g>
          </g>

          <text x="1480" y="948" text-anchor="end" class="chart-motto">here be spren, spores &amp; stranger things</text>
        </g>
      </svg>

      <transition name="toast-fade">
        <div v-if="toast" class="chart-toast" role="status">{{ toast }}</div>
      </transition>

      <!-- Meteors: screen-space streaks that cross the visible frame. The
           outer span sets the travel angle; the inner tail translates along
           that axis so head and trail stay aligned. -->
      <div v-if="isDark" class="meteors" aria-hidden="true">
        <span class="meteor m1"><i></i></span>
        <span class="meteor m2"><i></i></span>
        <span class="meteor m3"><i></i></span>
      </div>

      <!-- Compass rose: fixed to the frame's lower-left, outside pan/zoom -->
      <svg class="chart-compass" viewBox="0 0 100 116" width="100" height="116" aria-hidden="true">
        <g transform="translate(50 66)">
          <circle r="42" />
          <circle r="34" stroke-dasharray="2 4" class="thin" />
          <line x1="0" y1="-42" x2="0" y2="42" />
          <line x1="-42" y1="0" x2="42" y2="0" />
          <text y="-50" text-anchor="middle">N</text>
        </g>
      </svg>

      <!-- Map key: the outlying universes charted beyond the Cosmere -->
      <div class="chart-key" :class="{ collapsed: !keyOpen }">
        <button class="key-title" :aria-expanded="keyOpen" @click="keyOpen = !keyOpen">
          <span class="key-caret" aria-hidden="true">{{ keyOpen ? '▾' : '▸' }}</span>
          Key &middot; Beyond the Cosmere
        </button>
        <div v-show="keyOpen" class="key-entries">
          <button
            v-for="p in otherWorlds"
            :key="p.id"
            class="key-entry"
            @click="openWorld(p)"
            :title="`Chart ${p.name}`"
          >
            <span class="key-swatch" :style="{ background: p.colors.base }"></span>
            <span class="key-text">
              <span class="key-name">{{ p.name }}</span>
              <span class="key-region">{{ keySub(p) }}</span>
            </span>
          </button>
        </div>
      </div>

      <div class="chart-zoom" role="group" aria-label="Zoom controls">
        <button @click="zoomBy(1.25)" aria-label="Zoom in">+</button>
        <button @click="zoomBy(0.8)" aria-label="Zoom out">&minus;</button>
        <button @click="resetView" aria-label="Reset view">&#8634;</button>
      </div>

      <p class="chart-hint" aria-hidden="true">DRAG TO PAN &middot; PINCH OR SCROLL TO ZOOM &middot; HOVER A ROUTE TO FOLLOW THE WORLDHOPPER</p>
    </div>

    <transition name="spread-fade">
      <WorldSpread
        v-if="selected"
        :planet="selected"
        :books="selectedBooks"
        :series-map="seriesMap"
        :visited="isVisited(selected.id)"
        @close="closePanel"
        @toggle-visited="toggleVisited(selected.id)"
      />
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import WorldSpread from './WorldSpread.vue';
import { PLANETS, CONNECTIONS, SECRET_WORLD, planetsFor, planetById, booksForPlanet } from '../data/cosmere.js';
import { useTheme } from '../theme.js';
import { openPalette, loadCatalog, books as catalogBooks, series as catalogSeries } from '../catalog.js';
import { soundEnabled, toggleSound, playStamp, playChime } from '../sound.js';
import { hoidSpot, hoidFound, findHoid, secretUnlocked } from '../eggs.js';

const { theme, toggleTheme, themeLabel } = useTheme();
const isDark = computed(() => theme.value === 'dark');

// Honour the OS "reduce motion" setting for the SMIL-driven ambient effects
// (moon orbits, highstorm, terminator) that CSS media queries can't reach.
const motionOK = ref(true);
if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionOK.value = !mq.matches;
  mq.addEventListener?.('change', e => { motionOK.value = !e.matches; });
}

// Roshar's highstorm: a luminous arc that sweeps around the planet
function highstormArc(r) {
  const rr = r + 11;
  const a0 = (-55 * Math.PI) / 180;
  const a1 = (55 * Math.PI) / 180;
  const x0 = (Math.cos(a0) * rr).toFixed(1), y0 = (Math.sin(a0) * rr).toFixed(1);
  const x1 = (Math.cos(a1) * rr).toFixed(1), y1 = (Math.sin(a1) * rr).toFixed(1);
  return `M ${x0} ${y0} A ${rr} ${rr} 0 0 1 ${x1} ${y1}`;
}

// Scadrial's drifting ashfall (node-local flecks, staggered)
const ashFlecks = [
  { x: -11, r: 1.4, style: { animationDuration: '3.2s', animationDelay: '0s' } },
  { x: -4, r: 1.0, style: { animationDuration: '4s', animationDelay: '1.1s' } },
  { x: 3, r: 1.6, style: { animationDuration: '3.6s', animationDelay: '0.6s' } },
  { x: 9, r: 1.1, style: { animationDuration: '4.4s', animationDelay: '1.8s' } },
  { x: 0, r: 1.2, style: { animationDuration: '3s', animationDelay: '2.3s' } },
];

// Roshar's Stormlight spren — glowing motes on erratic little orbits
const spren = [
  { rad: 1.4, size: 1.9, dur: '7s', from: 0, to: 360, style: { animationDelay: '0s' } },
  { rad: 1.65, size: 1.4, dur: '11s', from: 360, to: 0, style: { animationDelay: '1.2s' } },
  { rad: 1.15, size: 1.6, dur: '5.5s', from: 120, to: 480, style: { animationDelay: '0.6s' } },
];

// Scadrial's Allomantic steel-lines — blue threads flashing out to the metals
function steelLines(r) {
  const out = [];
  for (let a = 0; a < 360; a += 45) {
    const rad = (a * Math.PI) / 180;
    const c = Math.cos(rad), s = Math.sin(rad);
    out.push({
      x1: +(c * r * 1.2).toFixed(1), y1: +(s * r * 1.2).toFixed(1),
      x2: +(c * r * 2.3).toFixed(1), y2: +(s * r * 2.3).toFixed(1),
    });
  }
  return out;
}

// Sel's AonDor — a glowing glyph that draws itself, then fades
function aonPath(r) {
  const u = +(r * 0.55).toFixed(1);
  return `M ${-u} ${-u} L ${u} ${-u} L ${u} ${u} L ${-u} ${u} Z ` +
    `M 0 ${-u} L 0 ${u} M ${-u} 0 L ${u} 0 M ${-u} ${-u} L ${u} ${u}`;
}

// Komashi's summoned spirits — pale motes rising and fading
const spiritMotes = [
  { x: -8, r: 1.5, style: { animationDuration: '4.5s', animationDelay: '0s' } },
  { x: 0, r: 1.8, style: { animationDuration: '5.2s', animationDelay: '1.4s' } },
  { x: 7, r: 1.3, style: { animationDuration: '4.8s', animationDelay: '0.7s' } },
  { x: -4, r: 1.4, style: { animationDuration: '5.6s', animationDelay: '2.2s' } },
];

const W = 1600;
const H = 1000;

const cosmereWorlds = planetsFor('cosmere');
const otherWorlds = planetsFor('other');
const totalWorlds = computed(() => PLANETS.length + (secretUnlocked.value ? 1 : 0));

const selected = ref(null);
const hoverRoute = ref(null);
const hoverId = ref(null);
const keyOpen = ref(localStorage.getItem('cosmere-key-open') !== '0');
watch(keyOpen, v => { try { localStorage.setItem('cosmere-key-open', v ? '1' : '0'); } catch {} });
const allBooks = catalogBooks; // shared catalog store
const seriesMap = computed(() =>
  Object.fromEntries(catalogSeries.value.map(s => [s.id, s.name]))
);

const selectedBooks = computed(() =>
  selected.value ? booksForPlanet(selected.value, allBooks.value) : []
);

// ── Passport ──
const visited = ref([]);
try {
  visited.value = JSON.parse(localStorage.getItem('cosmere-codex-visited') || '[]');
} catch { /* fresh passport */ }

function isVisited(id) {
  return visited.value.includes(id);
}
function toggleVisited(id) {
  const stamping = !isVisited(id);
  visited.value = stamping
    ? [...visited.value, id]
    : visited.value.filter(v => v !== id);
  localStorage.setItem('cosmere-codex-visited', JSON.stringify(visited.value));
  if (stamping) playStamp(); // wax-seal thunk + haptic buzz
}

// ── Selection ──
let lastFocused = null;
// For elements outside the pan surface (appendix buttons, deep links) —
// no drag guard, since their clicks can never be the tail end of a pan.
function openWorld(p) {
  flyToWorld(p);
}
function selectPlanet(p) {
  if (moved) return; // ignore the click that ends a drag
  flyToWorld(p);
}
function closePanel() {
  selected.value = null;
  // Ease the camera back to where it was before the fly-in
  if (motionOK.value && prevView) {
    animateView(prevView, 560, () => { prevView = null; });
  } else if (prevView) {
    tx.value = prevView.tx; ty.value = prevView.ty; scale.value = prevView.scale;
    prevView = null;
  }
  if (lastFocused && lastFocused.isConnected) lastFocused.focus();
}

// ── Easter egg: finding Hoid ──
const toast = ref('');
let toastTimer = null;
function showToast(msg) {
  toast.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = ''; }, 5200);
}
function onFindHoid() {
  if (hoidFound.value) return;
  findHoid();
  playChime();
  showToast('✦ You found Hoid — the Seventeenth Shard reveals itself…');
  // Let the toast land and the node mount, then fly out to the reveal
  setTimeout(() => flyToWorld(SECRET_WORLD), 1000);
}

function onGlobalKeydown(e) {
  if (e.key === 'Escape' && selected.value) closePanel();
}
onMounted(() => window.addEventListener('keydown', onGlobalKeydown));
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown);
  cancelFly();
});

// ── Celestial graticule ──
// A polar coordinate net centred on the Cosmere: concentric range rings and
// radial bearing spokes (with a tilted ecliptic) — the framing of a star
// atlas rather than a land survey. Spokes run far enough to fill the pannable
// space in every direction.
const CENTER = { x: 800, y: 480 };
const graticuleRings = [];
for (let r = 220; r <= 3520; r += 220) graticuleRings.push(r);
const graticuleSpokes = [];
for (let a = 0; a < 360; a += 30) {
  const rad = (a * Math.PI) / 180;
  graticuleSpokes.push({ x: CENTER.x + Math.cos(rad) * 5200, y: CENTER.y + Math.sin(rad) * 5200 });
}

// ── Constellations (invented, out in the open sky beyond the worlds) ──
function conFrom(name, stars, label) {
  return { name, stars, label, line: stars.map(s => `${s.x},${s.y}`).join(' ') };
}
const constellations = [
  conFrom('Adonalsium’s Crown',
    [{ x: 180, y: -160, r: 2.6 }, { x: 380, y: -240, r: 3.2 }, { x: 600, y: -210, r: 2.4 }, { x: 800, y: -270, r: 3.0 }, { x: 980, y: -170, r: 2.6 }],
    { x: 590, y: -320 }),
  conFrom('The Worldbringer',
    [{ x: -460, y: 560, r: 2.8 }, { x: -300, y: 660, r: 3.2 }, { x: -360, y: 860, r: 2.4 }, { x: -180, y: 800, r: 2.6 }, { x: -120, y: 600, r: 2.4 }],
    { x: -300, y: 970 }),
  conFrom('The Traveler',
    [{ x: 1780, y: 1120, r: 2.6 }, { x: 1960, y: 1010, r: 3.0 }, { x: 2120, y: 1150, r: 2.4 }, { x: 2020, y: 1320, r: 2.8 }, { x: 1820, y: 1300, r: 2.4 }],
    { x: 1950, y: 1440 }),
];

// ── Firmament (deterministic starfield, stable across renders) ──
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const starRand = mulberry32(20240704);
const STAR_MIN = -2000, STAR_MAX_X = 3600, STAR_MAX_Y = 3000;
const stars = Array.from({ length: 300 }, () => {
  const bright = starRand() > 0.9;
  const hi = bright ? +(0.7 + starRand() * 0.3).toFixed(2) : +(0.45 + starRand() * 0.45).toFixed(2);
  const lo = +Math.max(0.08, hi - (0.25 + starRand() * 0.45)).toFixed(2);
  return {
    x: Math.round(STAR_MIN + starRand() * (STAR_MAX_X - STAR_MIN)),
    y: Math.round(STAR_MIN + starRand() * (STAR_MAX_Y - STAR_MIN)),
    r: bright ? +(2.2 + starRand() * 1.8).toFixed(2) : +(0.8 + starRand() * 1.7).toFixed(2),
    lo, hi, // twinkle floor/ceiling opacity
    dur: +(2.5 + starRand() * 3.5).toFixed(2),
    delay: +(starRand() * 5).toFixed(2),
    bright,
  };
});
// Per-star twinkle timing/amplitude, fed to the CSS keyframe via custom props
function twStyle(s) {
  return {
    '--tw-lo': s.lo,
    '--tw-hi': s.hi,
    animationDuration: `${s.dur}s`,
    animationDelay: `${s.delay}s`,
  };
}

// Short sublabels for the outlying non-Cosmere worlds (their `system`
// strings are too long to sit under a planet).
const OTHER_SUB = {
  detritus: 'Cytoverse',
  newcago: 'Reckonerverse',
  'new-britannia': 'Rithmatist',
  randland: 'Wheel of Time',
};
function keySub(p) {
  return OTHER_SUB[p.id] || 'Beyond the Cosmere';
}

function toNode(p) {
  const r = Math.max(15, p.r * 0.5);
  const moons = (p.moons || []).map(m => {
    const orbit = m.dist * r;
    const rad = (m.angle * Math.PI) / 180;
    return {
      name: m.name,
      color: m.color,
      cx: +(Math.cos(rad) * orbit).toFixed(1),
      cy: +(Math.sin(rad) * orbit).toFixed(1),
      r: Math.max(2, m.r * 0.5),
      dur: `${Math.round(orbit * 0.5 + 8)}s`, // outer moons orbit slower
    };
  });
  const orbits = [...new Set((p.moons || []).map(m => +(m.dist * r).toFixed(1)))];
  return {
    id: p.id,
    planet: p,
    name: p.name,
    tagline: p.tagline,
    x: p.x, y: p.y,
    r, rMid: r + 6, rOuter: r + 11, stampR: r + 16,
    fill: p.colors.base,
    glow: p.colors.glow,
    moons,
    orbits,
    sub: p.universe === 'other'
      ? (OTHER_SUB[p.id] || 'Beyond the Cosmere')
      : p.system.replace('The ', '').replace(' System', ''),
    labelY: r + 34,
    subY: r + 52,
  };
}

// ── World node geometry (chart style: concentric rings) ──
// Cosmere worlds and the outlying other-universe worlds both render as nodes;
// only the Cosmere ones carry worldhopper routes (see CONNECTIONS).
const worldNodes = computed(() => {
  const list = [...cosmereWorlds, ...otherWorlds];
  if (secretUnlocked.value) list.push(SECRET_WORLD);
  return list.map(toNode);
});

// ── Route geometry ──
const connectionPaths = computed(() =>
  CONNECTIONS.map(c => {
    const a = planetById(c.from);
    const b = planetById(c.to);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const cx = mx + (-dy / len) * c.curve;
    const cy = my + (dx / len) * c.curve;
    return {
      key: `${c.from}-${c.to}`,
      from: c.from,
      to: c.to,
      label: c.label,
      d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`,
      mx: cx,
      my: cy,
    };
  })
);

function routeLit(c) {
  if (hoverRoute.value === c.key) return true;
  if (hoverId.value && (c.from === hoverId.value || c.to === hoverId.value)) return true;
  if (selected.value && (c.from === selected.value.id || c.to === selected.value.id)) return true;
  return false;
}

// ── Pan & zoom ──
const viewportEl = ref(null);
const scale = ref(1);
const tx = ref(0);
const ty = ref(0);
const MIN_SCALE = 0.2, MAX_SCALE = 4;

function resetView() {
  cancelFly();
  scale.value = 1; tx.value = 0; ty.value = 0;
}

// ── Cinematic camera ──
// The viewBox centre (800,500) maps to the viewport centre under the "slice"
// aspect ratio, so a world at map-point (x,y) is framed when
// tx = 800 - x*scale, ty = 500 - y*scale.
const flying = ref(false);
let rafId = null;
let prevView = null;

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function targetFor(p, s) {
  const k = Math.min(MAX_SCALE, s);
  return { scale: k, tx: 800 - p.x * k, ty: 500 - p.y * k };
}

function cancelFly() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  flying.value = false;
}

function animateView(target, dur, done) {
  cancelFly();
  const from = { tx: tx.value, ty: ty.value, scale: scale.value };
  let start = null;
  function step(ts) {
    if (start === null) start = ts;
    const t = dur <= 0 ? 1 : Math.min(1, (ts - start) / dur);
    const e = easeInOut(t);
    tx.value = from.tx + (target.tx - from.tx) * e;
    ty.value = from.ty + (target.ty - from.ty) * e;
    scale.value = from.scale + (target.scale - from.scale) * e;
    if (t < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      rafId = null;
      flying.value = false;
      done && done();
    }
  }
  rafId = requestAnimationFrame(step);
}

// Fly the camera into a world, then reveal its spread.
function flyToWorld(p) {
  lastFocused = document.activeElement;
  const target = targetFor(p, 2.4);
  if (!motionOK.value) {
    prevView = { tx: tx.value, ty: ty.value, scale: scale.value };
    tx.value = target.tx; ty.value = target.ty; scale.value = target.scale;
    selected.value = p;
    return;
  }
  prevView = { tx: tx.value, ty: ty.value, scale: scale.value };
  flying.value = true;
  animateView(target, 700, () => { selected.value = p; });
}

// preserveAspectRatio is "slice": the rendered scale is the MAX ratio, so
// the chart always fills its frame.
function viewK() {
  const rect = viewportEl.value.getBoundingClientRect();
  const k = Math.max(rect.width / W, rect.height / H);
  return { rect, k, ox: (rect.width - W * k) / 2, oy: (rect.height - H * k) / 2 };
}

function clientToMap(clientX, clientY) {
  const { rect, k, ox, oy } = viewK();
  return {
    x: (clientX - rect.left - ox) / k,
    y: (clientY - rect.top - oy) / k,
  };
}

function zoomAt(factor, clientX, clientY) {
  const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * factor));
  const applied = next / scale.value;
  if (applied === 1) return;
  const pt = clientToMap(clientX, clientY);
  tx.value = pt.x - (pt.x - tx.value) * applied;
  ty.value = pt.y - (pt.y - ty.value) * applied;
  scale.value = next;
}

function zoomBy(factor) {
  const rect = viewportEl.value.getBoundingClientRect();
  zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function onWheel(e) {
  cancelFly();
  zoomAt(e.deltaY < 0 ? 1.15 : 0.87, e.clientX, e.clientY);
}

const pointers = new Map();
let panStart = null;
let pinchStart = null;
let moved = false;

function onPointerDown(e) {
  if (e.target.closest('.spread, .chart-zoom, .chart-key')) return;
  cancelFly(); // a manual grab interrupts an in-progress fly-in
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  moved = false;
  if (pointers.size === 1) {
    panStart = { x: e.clientX, y: e.clientY, tx: tx.value, ty: ty.value };
  } else if (pointers.size === 2) {
    const [p1, p2] = [...pointers.values()];
    pinchStart = { dist: Math.hypot(p2.x - p1.x, p2.y - p1.y), scale: scale.value };
    panStart = null;
    // Capturing is safe here — a pinch is never a click
    for (const id of pointers.keys()) {
      try { viewportEl.value.setPointerCapture(id); } catch {}
    }
  }
}

function onPointerMove(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 2 && pinchStart) {
    const [p1, p2] = [...pointers.values()];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
    const target = pinchStart.scale * (dist / pinchStart.dist);
    zoomAt(target / scale.value, cx, cy);
    moved = true;
  } else if (pointers.size === 1 && panStart) {
    const { k } = viewK();
    const sdx = e.clientX - panStart.x;
    const sdy = e.clientY - panStart.y;
    // Screen-space threshold so a finger-tap wobble still counts as a click.
    // Capture only once a real drag starts — capturing at pointerdown would
    // retarget pointerup to the viewport and suppress world clicks entirely.
    if (!moved && (Math.abs(sdx) > 6 || Math.abs(sdy) > 6)) {
      moved = true;
      try { viewportEl.value.setPointerCapture(e.pointerId); } catch {}
    }
    tx.value = panStart.tx + sdx / k;
    ty.value = panStart.ty + sdy / k;
  }
}

function onPointerUp(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStart = null;
  if (pointers.size === 1) {
    const [p] = [...pointers.values()];
    panStart = { x: p.x, y: p.y, tx: tx.value, ty: ty.value };
  } else {
    panStart = null;
  }
}

const route = useRoute();

onMounted(async () => {
  // Deep link: /?planet=roshar frames that world and opens its spread
  const target = route.query.planet && planetById(route.query.planet);
  if (target) {
    const view = targetFor(target, 2.4);
    tx.value = view.tx; ty.value = view.ty; scale.value = view.scale;
    prevView = { tx: 0, ty: 0, scale: 1 };
    selected.value = target;
  }

  loadCatalog(); // populates the shared books/series store for the spreads
});
</script>
