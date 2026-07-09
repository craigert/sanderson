// Ambient soundscape + haptics, fully synthesized with the Web Audio API so
// there are no asset files and it works offline. Off by default; the single
// toggle governs both sound and vibration.
import { ref } from 'vue';

let ctx = null;
let hum = null;

function loadPref() {
  try { return localStorage.getItem('cosmere-sound') === 'on'; } catch { return false; }
}

export const soundEnabled = ref(loadPref());

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleSound() {
  soundEnabled.value = !soundEnabled.value;
  try { localStorage.setItem('cosmere-sound', soundEnabled.value ? 'on' : 'off'); } catch { /* ignore */ }
  if (soundEnabled.value) { ensureCtx(); startAmbience(); }
  else stopAmbience();
}

// ── Ambient bed: loop the "Between The Worlds" track, with the synthesized
// space hum as an automatic fallback if the file isn't present. ──
const TRACK_SRC = '/audio/Between The Worlds.mp3';
const TRACK_VOL = 0.5;
let track = null;
let fadeTimer = null;

function fadeTrack(to, ms) {
  if (!track) return;
  if (fadeTimer) clearInterval(fadeTimer);
  const from = track.volume;
  const steps = Math.max(1, Math.round(ms / 50));
  let i = 0;
  fadeTimer = setInterval(() => {
    i += 1;
    const v = from + (to - from) * (i / steps);
    track.volume = Math.min(1, Math.max(0, v));
    if (i >= steps) {
      clearInterval(fadeTimer);
      fadeTimer = null;
      if (to === 0) track.pause();
    }
  }, 50);
}

function startAmbience() {
  if (!track) {
    track = new Audio(encodeURI(TRACK_SRC));
    track.loop = true;
    track.preload = 'auto';
    // If the file is missing or unplayable, fall back to the synth hum
    track.addEventListener('error', () => { track = null; startSynthHum(); }, { once: true });
  }
  track.volume = 0;
  const p = track.play();
  if (p && p.catch) {
    p.then(() => fadeTrack(TRACK_VOL, 1500))
      .catch(() => { startSynthHum(); }); // autoplay blocked or load failed
  } else {
    fadeTrack(TRACK_VOL, 1500);
  }
}

function stopAmbience() {
  if (track) fadeTrack(0, 500);
  stopSynthHum();
}

// ── Synthesized space hum: detuned low drones under a slow breathing LFO ──
function startSynthHum() {
  const c = ensureCtx();
  if (!c || hum) return;

  const gain = c.createGain();
  gain.gain.value = 0;
  gain.connect(c.destination);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 240;
  filter.connect(gain);

  const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = 55;
  const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = 82.7; // ~fifth
  const o3 = c.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 110.3;
  o1.connect(filter); o2.connect(filter); o3.connect(filter);

  const lfo = c.createOscillator(); lfo.frequency.value = 0.06;
  const lfoGain = c.createGain(); lfoGain.gain.value = 0.014;
  lfo.connect(lfoGain); lfoGain.connect(gain.gain);

  [o1, o2, o3, lfo].forEach(o => o.start());
  gain.gain.setTargetAtTime(0.032, c.currentTime, 1.6); // very faint fade-in
  hum = { gain, oscs: [o1, o2, o3, lfo] };
}

function stopSynthHum() {
  if (!hum || !ctx) return;
  const { gain, oscs } = hum;
  gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  setTimeout(() => oscs.forEach(o => { try { o.stop(); } catch { /* already stopped */ } }), 900);
  hum = null;
}

// ── One-shot effects ──
export function playPageTurn() {
  if (!soundEnabled.value) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const dur = 0.26;
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buffer;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.7;
  bp.frequency.setValueAtTime(900, t);
  bp.frequency.exponentialRampToValueAtTime(3200, t + dur); // upward "flick"
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.1, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp); bp.connect(g); g.connect(c.destination);
  src.start(t);
}

// A firm, realistic passport stamp — a short "cha-thunk" built from impact
// noise (no tonal boing).
export function playStamp() {
  if (!soundEnabled.value) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;

  // Short filtered-noise burst helper (impacts are inharmonic, not tonal)
  function burst(dur, type, freq, q, gain, at = 0, curve = 1.6) {
    const n = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, curve);
    const src = c.createBufferSource(); src.buffer = n;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    const g = c.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(t + at);
  }

  // 1) Crisp contact tap
  burst(0.02, 'highpass', 2600, 0, 0.1, 0, 2.4);
  // 2) The woody/rubber knock — the "chunk"
  burst(0.07, 'bandpass', 480, 1.1, 0.24, 0.004, 1.4);

  // 3) Deep body thud — weight, quick decay
  const o = c.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + 0.22);

  vibrate([14, 30]);
}

// Ascending discovery chime (finding Hoid)
export function playChime() {
  if (!soundEnabled.value) return;
  const c = ensureCtx();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
  notes.forEach((f, i) => {
    const t = c.currentTime + i * 0.11;
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.55);
  });
  vibrate([18, 40, 18, 40, 30]);
}

export function vibrate(pattern) {
  if (!soundEnabled.value) return;
  try { navigator.vibrate?.(pattern); } catch { /* unsupported */ }
}

// If the pref was on from a previous visit, resume the hum on the first user
// gesture (autoplay policy blocks audio before any interaction).
if (typeof window !== 'undefined') {
  const kick = () => {
    if (soundEnabled.value) { ensureCtx(); startAmbience(); }
    window.removeEventListener('pointerdown', kick);
    window.removeEventListener('keydown', kick);
  };
  window.addEventListener('pointerdown', kick, { once: true });
  window.addEventListener('keydown', kick, { once: true });
}
