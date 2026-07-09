// Easter eggs: Hoid hides somewhere on the chart each session; finding him
// permanently unlocks the hidden Seventeenth Shard waypoint.
import { ref } from 'vue';

// ── The secret, unlocked forever once found ──
function loadUnlocked() {
  try { return localStorage.getItem('cosmere-secret') === '1'; } catch { return false; }
}
export const secretUnlocked = ref(loadUnlocked());
export function unlockSecret() {
  secretUnlocked.value = true;
  try { localStorage.setItem('cosmere-secret', '1'); } catch { /* ignore */ }
}

// ── Hoid's hiding spot: fixed for the session, fresh each new one ──
// A proper hunt: some spots camouflage him just off a world or tucked into a
// constellation, others strand him in the empty dark. He's faint either way.
const SPOTS = [
  // nestled just beyond a world's disc/label — easy to overlook
  { x: 965, y: 360 }, { x: 1120, y: 238 }, { x: 415, y: 622 },
  { x: 330, y: 300 }, { x: 1520, y: 1180 }, { x: 690, y: 690 },
  // hidden among the constellations
  { x: 500, y: -235 }, { x: -300, y: 620 }, { x: 1960, y: 1225 },
  // out in the open dark — the real find
  { x: 1500, y: 700 }, { x: 150, y: 900 }, { x: 700, y: -360 },
  { x: -260, y: 300 }, { x: 1780, y: 380 }, { x: 250, y: 1150 },
  { x: 860, y: 1120 }, { x: -430, y: 820 }, { x: 2050, y: 760 },
];

function pickSpot() {
  try {
    const saved = sessionStorage.getItem('cosmere-hoid');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  const spot = SPOTS[Math.floor(Math.random() * SPOTS.length)];
  try { sessionStorage.setItem('cosmere-hoid', JSON.stringify(spot)); } catch { /* ignore */ }
  return spot;
}
export const hoidSpot = pickSpot();

function loadFound() {
  try { return sessionStorage.getItem('cosmere-hoid-found') === '1'; } catch { return false; }
}
export const hoidFound = ref(loadFound());

export function findHoid() {
  hoidFound.value = true;
  try { sessionStorage.setItem('cosmere-hoid-found', '1'); } catch { /* ignore */ }
  unlockSecret();
}
