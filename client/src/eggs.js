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
// Scattered widely across the firmament — in the gaps between worlds and out
// in the empty dark — so he's genuinely a find.
const SPOTS = [
  { x: 1500, y: 200 }, { x: -250, y: 300 }, { x: 640, y: -350 },
  { x: 1650, y: 700 }, { x: 120, y: 980 }, { x: 1350, y: 980 },
  { x: 850, y: 1120 }, { x: -400, y: 750 }, { x: 1900, y: 1100 },
  { x: 2050, y: 400 }, { x: 500, y: 1150 }, { x: 1750, y: -150 },
  { x: -150, y: 1200 }, { x: 1050, y: 1500 }, { x: 250, y: -400 },
  { x: 1450, y: 1450 },
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
