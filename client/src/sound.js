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

// A satisfying mechanical "ka-CHUNK" passport stamp, in four layers.
export function playStamp() {
  if (!soundEnabled.value) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;

  // 1) Sharp contact click — the stamp meeting the page
  const clickDur = 0.03;
  const cb = c.createBuffer(1, Math.floor(c.sampleRate * clickDur), c.sampleRate);
  const cd = cb.getChannelData(0);
  for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / cd.length, 2);
  const cs = c.createBufferSource(); cs.buffer = cb;
  const chp = c.createBiquadFilter(); chp.type = 'highpass'; chp.frequency.value = 1800;
  const cg = c.createGain(); cg.gain.value = 0.16;
  cs.connect(chp); chp.connect(cg); cg.connect(c.destination); cs.start(t);

  // 2) Deep thunk — the impact body
  const o = c.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(46, t + 0.14);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.34, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + 0.34);

  // 3) Woody mid knock — the 'chunk'
  const w = c.createOscillator(); w.type = 'triangle';
  w.frequency.setValueAtTime(330, t);
  w.frequency.exponentialRampToValueAtTime(150, t + 0.07);
  const wf = c.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 2;
  const wg = c.createGain();
  wg.gain.setValueAtTime(0.0001, t);
  wg.gain.exponentialRampToValueAtTime(0.17, t + 0.01);
  wg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  w.connect(wf); wf.connect(wg); wg.connect(c.destination);
  w.start(t); w.stop(t + 0.14);

  // 4) Faint spring rattle — the mechanism releasing
  const s = c.createOscillator(); s.type = 'square';
  s.frequency.setValueAtTime(520, t + 0.045);
  s.frequency.exponentialRampToValueAtTime(920, t + 0.16);
  const sg = c.createGain();
  sg.gain.setValueAtTime(0.0001, t + 0.045);
  sg.gain.exponentialRampToValueAtTime(0.028, t + 0.065);
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  s.connect(sg); sg.connect(c.destination);
  s.start(t + 0.045); s.stop(t + 0.2);

  vibrate([12, 25, 45]); // a press then a firm thunk
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
