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
const SPOTS = [
  { x: 1180, y: 520 }, { x: 250, y: 640 }, { x: 820, y: 250 },
  { x: 1400, y: 820 }, { x: 520, y: 880 }, { x: 980, y: 640 },
  { x: 1330, y: 360 }, { x: 170, y: 400 },
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
