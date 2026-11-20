'use strict';
/* =========================================================================
   Memo — customization (themes, fonts, caret, sounds, effects)
   and gamification (XP, levels, daily quests, achievements, unlocks).
   Loaded before app.js; everything here is called at runtime only.
   ========================================================================= */

// ---------- Themes ----------
const LIGHT_GOOD = { good: '#1f9d55', goodSoft: '#d9f2e3', bad: '#d64545', badSoft: '#fbe0e0' };
const DARK_GOOD = { good: '#3ccf7a', goodSoft: '#17352a', bad: '#ff6b6b', badSoft: '#3d1f22' };
const THEMES = {
  light:    { name: 'Daylight', dark: false, accent: '#e8730c', bg: '#f7f5f0', panel: '#ffffff', panel2: '#f0ede6', text: '#1f2328', muted: '#6b6f76', border: '#e2ddd2', hidden: '#d9d4c7' },
  dark:     { name: 'Charcoal', dark: true, accent: '#ff9233', bg: '#16181c', panel: '#1f2228', panel2: '#272b33', text: '#e8e6e1', muted: '#9aa0a8', border: '#333842', hidden: '#3a3f49' },
  sepia:    { name: 'Sepia', dark: false, accent: '#a5531d', bg: '#f1e7d0', panel: '#fbf3e1', panel2: '#eadcbd', text: '#3b2f22', muted: '#7a6a55', border: '#d9c8a5', hidden: '#d5c39e' },
  paper:    { name: 'Paper', dark: false, accent: '#2563eb', bg: '#ffffff', panel: '#ffffff', panel2: '#f3f4f6', text: '#111827', muted: '#6b7280', border: '#e5e7eb', hidden: '#e5e7eb' },
  rose:     { name: 'Rose', dark: false, accent: '#e11d74', bg: '#fdf2f4', panel: '#ffffff', panel2: '#fae3e8', text: '#3a1d26', muted: '#94606f', border: '#f1cdd6', hidden: '#efc6d0' },
  mint:     { name: 'Mint', dark: false, accent: '#0d9488', bg: '#effaf6', panel: '#ffffff', panel2: '#dcf3ea', text: '#123128', muted: '#5b7d72', border: '#c7e8dc', hidden: '#c2e3d7' },
  midnight: { name: 'Midnight', dark: true, accent: '#7c8cff', bg: '#0f1226', panel: '#171b36', panel2: '#20264a', text: '#e6e8ff', muted: '#8d93c0', border: '#2a3160', hidden: '#323a6e' },
  forest:   { name: 'Forest', dark: true, accent: '#7bd88f', bg: '#0f1a14', panel: '#16241c', panel2: '#1e3127', text: '#e2efe6', muted: '#8fb39c', border: '#29402f', hidden: '#2f4a38' },
  ocean:    { name: 'Ocean', dark: true, accent: '#38bdf8', bg: '#0b1e2b', panel: '#11293a', panel2: '#183549', text: '#e0f0fb', muted: '#89aec6', border: '#21435a', hidden: '#28506a' },
  terminal: { name: 'Terminal', dark: true, accent: '#33ff66', bg: '#000000', panel: '#060b06', panel2: '#0f1a0f', text: '#33ff66', muted: '#1f9a3e', border: '#1b3a1b', hidden: '#143014', typeFont: 'lucida' },
  contrast: { name: 'High Contrast', dark: true, accent: '#ffd400', bg: '#000000', panel: '#000000', panel2: '#1a1a1a', text: '#ffffff', muted: '#d0d0d0', border: '#ffffff', hidden: '#4a4a4a' },
  sunset:   { name: 'Sunset', dark: true, accent: '#ff7a59', bg: '#22122a', panel: '#2f1838', panel2: '#3d2047', text: '#ffe9e0', muted: '#c79bb0', border: '#4c2a57', hidden: '#56305f', unlock: { level: 5 } },
  gold:     { name: 'Gold', dark: true, accent: '#f5b301', bg: '#17130a', panel: '#221c0e', panel2: '#2e2613', text: '#fbe9b7', muted: '#bfa66a', border: '#3d321a', hidden: '#463a1c', unlock: { level: 10 } },
  neon:     { name: 'Neon', dark: true, accent: '#ff2bd6', bg: '#0a0014', panel: '#120020', panel2: '#1c0530', text: '#f3e8ff', muted: '#a98bd0', border: '#2f0f4d', hidden: '#33114f', unlock: { level: 15 } }
};
const ACCENTS = ['#e8730c', '#ef4444', '#e11d74', '#a855f7', '#6366f1', '#2563eb', '#0ea5e9', '#14b8a6', '#22c55e', '#84cc16', '#eab308', '#78716c'];
const FONTS = {
  ui: { segoe: ['Segoe UI', '"Segoe UI", system-ui, sans-serif'], rounded: ['Rounded', '"Trebuchet MS", "Segoe UI", sans-serif'], serif: ['Serif', 'Georgia, serif'], mono: ['Mono', 'Consolas, monospace'] },
  read: { serif: ['Georgia', 'Georgia, "Times New Roman", serif'], book: ['Palatino', '"Palatino Linotype", "Book Antiqua", Palatino, serif'], garamond: ['Garamond', 'Garamond, "Times New Roman", serif'],
    sans: ['Segoe UI', '"Segoe UI", system-ui, sans-serif'], rounded: ['Trebuchet', '"Trebuchet MS", sans-serif'], verdana: ['Verdana', 'Verdana, sans-serif'], mono: ['Consolas', 'Consolas, monospace'], hand: ['Handwriting', '"Segoe Print", "Comic Sans MS", cursive'] },
  type: { consolas: ['Consolas', 'Consolas, "Cascadia Mono", monospace'], cascadia: ['Cascadia', '"Cascadia Code", "Cascadia Mono", Consolas, monospace'], courier: ['Courier', '"Courier New", Courier, monospace'],
    lucida: ['Lucida Console', '"Lucida Console", Monaco, monospace'], reading: ['Same as reading', 'var(--read-font)'] }
};
const CARETS = { line: 'Line', block: 'Block', underline: 'Underscore', box: 'Box' };

const LOOK_DEFAULTS = {
  theme: 'system', accent: '', uiFont: 'segoe', readFont: 'serif', typeFont: 'consolas',
  caretStyle: 'line', caretBlink: 'idle', caretSpeed: 'smooth', caretWidth: 3, caretColor: 'accent', caretCustom: '#ff3366',
  typeWidth: 'normal', typeLines: 4, liveStats: true, combo: true, confetti: true, sound: 'studio', soundVol: 0.8, errorSound: true, sfxOn: true,
  radius: 'normal', uiScale: 1, bg: 'plain', compact: false, reduceMotion: false
};
function S() { return DB.settings; }

function hexToRgb(h) { const m = h.replace('#', '').match(/.{2}/g); return m ? m.map(x => parseInt(x, 16)) : [0, 0, 0]; }
function readableOn(hex) { const [r, g, b] = hexToRgb(hex); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111' : '#fff'; }

function themeUnlocked(key) { const u = THEMES[key]?.unlock; return !u || level() >= u.level; }

function applyLook() {
  const s = S();
  let key = s.theme;
  if (key === 'system') key = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  if (!THEMES[key] || !themeUnlocked(key)) key = 'light';
  const th = THEMES[key];
  const g = th.dark ? DARK_GOOD : LIGHT_GOOD;
  const accent = s.accent || th.accent;
  const R = document.documentElement, st = R.style;
  R.dataset.theme = th.dark ? 'dark' : 'light';
  R.dataset.themeKey = key;
  const vars = { bg: th.bg, panel: th.panel, panel2: th.panel2, text: th.text, muted: th.muted, border: th.border, hidden: th.hidden,
    accent, 'accent-ink': readableOn(accent), good: g.good, 'good-soft': g.goodSoft, bad: g.bad, 'bad-soft': g.badSoft };
  for (const [k, v] of Object.entries(vars)) st.setProperty('--' + k, v);
  st.setProperty('--accent-soft', `color-mix(in srgb, ${accent} 18%, ${th.panel})`);
  st.setProperty('--reading', s.fontSize + 'px');
  st.setProperty('--ui-font', (FONTS.ui[s.uiFont] || FONTS.ui.segoe)[1]);
  st.setProperty('--read-font', (FONTS.read[s.readFont] || FONTS.read.serif)[1]);
  st.setProperty('--type-font', (FONTS.type[s.typeFont] || FONTS.type.consolas)[1]);
  st.setProperty('--rs', { sharp: 0.2, normal: 1, round: 1.7 }[s.radius] ?? 1);
  st.setProperty('--ty-max', { narrow: '680px', normal: '900px', wide: '1200px', full: '100%' }[s.typeWidth] || '900px');
  st.setProperty('--ty-lines', s.typeLines || 4);
  st.setProperty('--caret-w', (s.caretWidth || 3) + 'px');
  st.setProperty('--caret-t', { instant: '0s', smooth: '.1s', floaty: '.22s' }[s.caretSpeed] || '.1s');
  st.setProperty('--caret-color', s.caretColor === 'text' ? 'var(--text)' : s.caretColor === 'custom' ? s.caretCustom : 'var(--accent)');
  const b = document.body.classList;
  b.toggle('compact', !!s.compact);
  b.toggle('reduce-motion', !!s.reduceMotion);
  b.toggle('no-live', !s.liveStats);
  ['plain', 'gradient', 'dots', 'grid', 'waves'].forEach(x => b.toggle('bg-' + x, s.bg === x));
  if (window.native?.setZoom) window.native.setZoom(s.uiScale || 1);
}

// Classes applied to a typing caret element.
function caretClasses(extra = '') {
  const s = S();
  return `caret c-${s.caretStyle || 'line'} ${s.caretColor === 'rainbow' ? 'c-rainbow' : ''} ${s.caretBlink === 'always' ? 'blink-hard' : ''} ${extra}`;
}
// Position + size a caret over/beside a letter rect (all coords relative to its container).
function placeCaret(caret, x, y, w, h, atEnd) {
  const style = S().caretStyle || 'line';
  let cw = 'var(--caret-w)', ch = h + 'px', cy = y, cx = x - 1;
  if (style === 'block') { cw = w + 'px'; cx = x; }
  else if (style === 'underline') { cw = w + 'px'; ch = '3px'; cy = y + h - 4; cx = x; }
  else if (style === 'box') { cw = w + 'px'; cx = x; }
  caret.style.width = cw; caret.style.height = ch;
  caret.style.transform = `translate(${cx}px, ${cy}px)`;
}

// ---------- Sound: recorded keyboard packs + synthesized effects ----------
let AC = null, MASTER = null;
function audio() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      // master bus with a limiter so loud settings never distort
      const comp = AC.createDynamicsCompressor();
      comp.threshold.value = -6; comp.knee.value = 6; comp.ratio.value = 8; comp.attack.value = 0.001; comp.release.value = 0.08;
      MASTER = AC.createGain(); MASTER.connect(comp).connect(AC.destination);
    }
    if (AC.state === 'suspended') AC.resume();   // browsers/Electron may start audio suspended
    return AC;
  } catch { return null; }
}
const vol = () => Math.max(0, Math.min(1, S().soundVol ?? 0.8));
function tone({ type = 'sine', f = 440, f2, dur = 0.06, vol: v = 0.3, delay = 0 }) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(Math.min(1, v * 2 * vol()) + 0.0001, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(MASTER); o.start(t); o.stop(t + dur + 0.02);
}
function noise({ dur = 0.03, vol: v = 0.3, freq = 2500, q = 0.8, type = 'highpass', delay = 0 }) {
  const a = audio(); if (!a) return;
  const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + delay;
  src.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = Math.min(1.5, v * 2 * vol());
  src.connect(f).connect(g).connect(MASTER); src.start(t);
}

// Recorded keystroke packs (src/sounds.js). Decoded once into AudioBuffers.
const packBuffers = {}, packLoading = {}, packLast = {};
function loadPack(key) {
  if (packBuffers[key] || packLoading[key]) return packLoading[key];
  if (typeof SAMPLE_PACKS === 'undefined' || !SAMPLE_PACKS[key]) return;
  const a = audio(); if (!a) return;
  packLoading[key] = Promise.all(SAMPLE_PACKS[key].samples.map(b64 => {
    const bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Promise((res) => a.decodeAudioData(u8.buffer, res, () => res(null)));
  })).then(list => { packBuffers[key] = list.filter(Boolean); return packBuffers[key]; });
  return packLoading[key];
}
function playSample(key, { heavy = false } = {}) {
  const a = audio(); if (!a) return;
  const bufs = packBuffers[key];
  if (!bufs?.length) { loadPack(key); return; }
  let i = Math.floor(Math.random() * bufs.length);
  if (bufs.length > 1 && i === packLast[key]) i = (i + 1) % bufs.length;   // never the same hit twice in a row
  packLast[key] = i;
  const src = a.createBufferSource(), g = a.createGain();
  src.buffer = bufs[i];
  src.playbackRate.value = (heavy ? 0.9 : 1) * (0.96 + Math.random() * 0.08); // small natural variation
  g.gain.value = 1.6 * vol() * (heavy ? 1.15 : 0.92 + Math.random() * 0.16);
  src.connect(g).connect(MASTER); src.start();
}

const SOUNDS = {
  off: { name: 'Off' },
  clicky: { name: 'Clicky', rec: true, play: (o) => playSample('clicky', o) },
  studio: { name: 'Studio', rec: true, play: (o) => playSample('studio', o) },
  thock: { name: 'Thocky', rec: true, play: (o) => playSample('thock', o) },
  click: { name: 'Click', play: () => noise({ dur: 0.025, vol: 0.5, freq: 3000 }) },
  typewriter: { name: 'Typewriter', play: () => { noise({ dur: 0.045, vol: 0.6, freq: 1400, type: 'bandpass', q: 1.2 }); tone({ f: 110, dur: 0.05, vol: 0.25 }); } },
  mech: { name: 'Mechanical', play: () => { noise({ dur: 0.018, vol: 0.55, freq: 4200 }); noise({ dur: 0.03, vol: 0.35, freq: 600, type: 'lowpass', delay: 0.012 }); } },
  pop: { name: 'Pop', play: () => tone({ f: 700 + Math.random() * 80, f2: 260, dur: 0.07, vol: 0.35 }) },
  bubble: { name: 'Bubble', play: () => tone({ f: 380 + Math.random() * 200, f2: 900, dur: 0.06, vol: 0.25 }) },
  beep: { name: 'Beep', play: () => tone({ type: 'square', f: 880, dur: 0.03, vol: 0.08 }) },
  arcade: { name: 'Arcade', play: () => tone({ type: 'square', f: 300, f2: 950, dur: 0.05, vol: 0.08 }), unlock: { level: 6 } },
  piano: { name: 'Piano', play: () => { const n = [523, 587, 659, 784, 880][Math.floor(Math.random() * 5)]; tone({ type: 'triangle', f: n, dur: 0.18, vol: 0.25 }); }, unlock: { level: 12 } }
};
function soundUnlocked(k) { const u = SOUNDS[k]?.unlock; return !u || level() >= u.level; }
function keySound(opts) { const k = S().sound; if (k && k !== 'off' && soundUnlocked(k)) SOUNDS[k]?.play?.(opts); }
function warmSounds() { const k = S().sound; if (SOUNDS[k]?.rec) loadPack(k); }
// Mistake + celebration sounds have their own switch, so they work even with key sounds off.
function errSound() { if (S().sfxOn !== false && S().errorSound) tone({ type: 'sawtooth', f: 150, f2: 90, dur: 0.12, vol: 0.12 }); }
function sfx(kind) {
  if (S().sfxOn === false) return;
  if (kind === 'done') [523, 659, 784, 1046].forEach((f, i) => tone({ type: 'triangle', f, dur: 0.22, vol: 0.2, delay: i * 0.08 }));
  if (kind === 'level') [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone({ type: 'triangle', f, dur: 0.3, vol: 0.22, delay: i * 0.09 }));
  if (kind === 'ach') [880, 1175].forEach((f, i) => tone({ type: 'sine', f, dur: 0.25, vol: 0.2, delay: i * 0.1 }));
  if (kind === 'combo') tone({ type: 'triangle', f: 660, f2: 1320, dur: 0.12, vol: 0.18 });
}
// Browsers only allow audio after the first click/keypress: unlock + preload on the first gesture.
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => { audio(); warmSounds(); }, { once: true, capture: true }));

// ---------- Confetti ----------
function confetti(power = 1) {
  if (!S().confetti || S().reduceMotion) return;
  const c = document.createElement('canvas'); c.className = 'confetti';
  c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const x = c.getContext('2d');
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const cols = [accent, '#ffd400', '#22c55e', '#38bdf8', '#e11d74', '#a855f7'];
  const N = Math.round(160 * power);
  const P = [...Array(N)].map(() => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35, vx: (Math.random() - .5) * 16, vy: -Math.random() * 15 - 4,
    s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[Math.floor(Math.random() * cols.length)] }));
  const t0 = performance.now();
  (function frame(t) {
    x.clearRect(0, 0, c.width, c.height);
    for (const p of P) { p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); }
    if (t - t0 < 3200) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

// ---------- Gamification ----------
const RANKS = [[1, 'Novice'], [3, 'Apprentice'], [5, 'Reciter'], [8, 'Wordsmith'], [12, 'Bard'], [16, 'Orator'], [20, 'Sage'], [25, 'Maestro'], [30, 'Legend'], [40, 'Immortal']];
const xpForLevel = (L) => 50 * (L - 1) * L;           // total XP needed to reach level L
function game() {
  const g = DB.game ||= {};
  g.xp ||= 0; g.ach ||= {}; g.quests ||= { date: '', list: [], modes: [] };
  g.stats = { sessions: 0, words: 0, perfect: 0, bestWpm: 0, bestCombo: 0, recordings: 0, quests: 0, reviews: 0, modes: {}, goalDays: {}, ...g.stats };
  return g;
}
function level(xp = game().xp) { let L = 1; while (xp >= xpForLevel(L + 1)) L++; return L; }
function rankOf(L) { let r = RANKS[0][1]; for (const [l, n] of RANKS) if (L >= l) r = n; return r; }
function levelProgress(xp = game().xp) { const L = level(xp), a = xpForLevel(L), b = xpForLevel(L + 1); return { L, into: xp - a, need: b - a, pct: (xp - a) / (b - a) * 100 }; }
const TEST_MODES = ['type', 'typefull', 'recite', 'weak'];
const FAM_MODES = ['read', 'initials', 'hide'];

const ACHIEVEMENTS = [
  { id: 'first_session', icon: '🎯', name: 'First Steps', desc: 'Finish your first practice session', test: g => g.stats.sessions >= 1 },
  { id: 'first_text', icon: '✍️', name: 'Author', desc: 'Add your own text to the library', test: (g, e) => e.type === 'text' },
  { id: 'streak3', icon: '🔥', name: 'On Fire', desc: 'Reach a 3-day streak', test: () => streak() >= 3 },
  { id: 'streak7', icon: '🗓️', name: 'Week Warrior', desc: 'Reach a 7-day streak', test: () => streak() >= 7 },
  { id: 'streak30', icon: '🏅', name: 'Unbreakable', desc: 'Reach a 30-day streak', test: () => streak() >= 30 },
  { id: 'perfect', icon: '💯', name: 'Flawless', desc: 'Score 100% on a test', test: g => g.stats.perfect >= 1 },
  { id: 'perfect5', icon: '👑', name: 'Perfectionist', desc: 'Score 100% on 5 tests', test: g => g.stats.perfect >= 5 },
  { id: 'wpm40', icon: '⚡', name: 'Quick Fingers', desc: 'Type 40+ wpm in a typing test', test: g => g.stats.bestWpm >= 40 },
  { id: 'wpm70', icon: '🚀', name: 'Speed Demon', desc: 'Type 70+ wpm in a typing test', test: g => g.stats.bestWpm >= 70 },
  { id: 'combo25', icon: '🔗', name: 'Chain Reaction', desc: 'Get a 25-word combo', test: g => g.stats.bestCombo >= 25 },
  { id: 'combo100', icon: '🌪️', name: 'Unstoppable', desc: 'Get a 100-word combo', test: g => g.stats.bestCombo >= 100 },
  { id: 'master1', icon: '🧠', name: 'By Heart', desc: 'Get a text to 90% mastery', test: () => DB.texts.some(t => t.mastery >= 90) },
  { id: 'master5', icon: '📚', name: 'Living Library', desc: 'Get 5 texts to 90% mastery', test: () => DB.texts.filter(t => t.mastery >= 90).length >= 5 },
  { id: 'allmodes', icon: '🧭', name: 'Explorer', desc: 'Try all 9 practice modes', test: g => Object.keys(g.stats.modes).length >= 9 },
  { id: 'words1k', icon: '⌨️', name: 'A Thousand Words', desc: 'Type 1,000 words in tests', test: g => g.stats.words >= 1000 },
  { id: 'words10k', icon: '📜', name: 'Scribe', desc: 'Type 10,000 words in tests', test: g => g.stats.words >= 10000 },
  { id: 'recorder', icon: '🎙️', name: 'On Air', desc: 'Record yourself reciting', test: g => g.stats.recordings >= 1 },
  { id: 'folders5', icon: '🗂️', name: 'Organizer', desc: 'Have 5 folders', test: () => allFolders().length >= 5 },
  { id: 'night', icon: '🦉', name: 'Night Owl', desc: 'Practice after 11 pm', test: (g, e) => e.type === 'session' && new Date().getHours() >= 23 },
  { id: 'early', icon: '🐦', name: 'Early Bird', desc: 'Practice before 7 am', test: (g, e) => e.type === 'session' && new Date().getHours() < 7 },
  { id: 'marathon', icon: '⏱️', name: 'Marathon', desc: 'Practice 60 minutes in one day', test: () => (DB.activity[todayKey()]?.seconds || 0) >= 3600 },
  { id: 'goal7', icon: '🎖️', name: 'Goal Getter', desc: 'Hit your daily goal on 7 days', test: g => Object.keys(g.stats.goalDays).length >= 7 },
  { id: 'quests10', icon: '📋', name: 'Quest Hunter', desc: 'Complete 10 daily quests', test: g => g.stats.quests >= 10 },
  { id: 'review5', icon: '🔁', name: 'Faithful', desc: 'Complete 5 reviews of due texts', test: g => g.stats.reviews >= 5 },
  { id: 'patched', icon: '🩹', name: 'Patched Up', desc: 'Clear 10 weak spots', test: g => (g.stats.weakCleared || 0) >= 10 },
  { id: 'level5', icon: '⭐', name: 'Rising Star', desc: 'Reach level 5', test: g => level(g.xp) >= 5 },
  { id: 'level10', icon: '🌟', name: 'Star Performer', desc: 'Reach level 10', test: g => level(g.xp) >= 10 },
  { id: 'level20', icon: '💫', name: 'Sage', desc: 'Reach level 20', test: g => level(g.xp) >= 20 }
];

const QUESTS = [
  { id: 'tests2', icon: '🧪', text: 'Complete 2 tests', target: 2, xp: 40, on: e => e.type === 'session' && TEST_MODES.includes(e.mode) ? 1 : 0 },
  { id: 'sessions3', icon: '🔁', text: 'Finish 3 practice sessions', target: 3, xp: 30, on: e => e.type === 'session' ? 1 : 0 },
  { id: 'minutes15', icon: '⏳', text: 'Practice for 15 minutes', target: 900, xp: 35, unit: 's', on: e => e.type === 'time' ? e.seconds : 0 },
  { id: 'score90', icon: '🎯', text: 'Score 90% or higher in any mode', target: 1, xp: 30, on: e => e.type === 'session' && e.score >= 0.9 ? 1 : 0 },
  { id: 'modes3', icon: '🧭', text: 'Try 3 different modes', target: 3, xp: 35, on: (e, q) => e.type === 'session' && !q.modes.includes(e.mode) ? (q.modes.push(e.mode), 1) : 0 },
  { id: 'words150', icon: '⌨️', text: 'Type 150 words in tests', target: 150, xp: 30, on: e => e.type === 'session' ? e.typedWords || 0 : 0 },
  { id: 'combo15', icon: '🔗', text: 'Reach a 15-word combo', target: 15, xp: 30, max: true, on: e => e.type === 'session' ? e.combo || 0 : 0 },
  { id: 'review1', icon: '⏰', text: 'Review a text that is due', target: 1, xp: 40, on: e => e.type === 'session' && e.wasDue ? 1 : 0 },
  { id: 'fam2', icon: '📖', text: 'Do 2 Familiarize activities', target: 2, xp: 20, on: e => e.type === 'session' && FAM_MODES.includes(e.mode) ? 1 : 0 },
  { id: 'weak1', icon: '🎯', text: 'Drill your weak spots once', target: 1, xp: 35, on: e => e.type === 'session' && e.mode === 'weak' ? 1 : 0 },
  { id: 'record1', icon: '🎙️', text: 'Record a recitation', target: 1, xp: 25, on: e => e.type === 'recording' ? 1 : 0 }
];
function todaysQuests() {
  const g = game(), k = todayKey();
  if (g.quests.date !== k) {
    const pick = shuffle(QUESTS, seededRand('q' + k)).slice(0, 3);
    g.quests = { date: k, modes: [], list: pick.map(q => ({ id: q.id, progress: 0, done: false })) };
    save();
  }
  return g.quests;
}

function awardXP(n, reason) {
  const g = game(); const before = level(g.xp);
  g.xp += Math.round(n); save();
  const after = level(g.xp);
  if (after > before) setTimeout(() => levelUp(before, after), 900);
  updateSidebar();
  return Math.round(n);
}
function unlocksAt(L) {
  const out = [];
  for (const [k, t] of Object.entries(THEMES)) if (t.unlock?.level === L) out.push(`🎨 ${t.name} theme`);
  for (const [k, s] of Object.entries(SOUNDS)) if (s.unlock?.level === L) out.push(`🔊 ${s.name} key sound`);
  if (L === CARET_RAINBOW_LEVEL) out.push('🌈 Rainbow cursor');
  return out;
}
const CARET_RAINBOW_LEVEL = 8;
function levelUp(from, to) {
  sfx('level'); confetti(1.4);
  const unl = []; for (let L = from + 1; L <= to; L++) unl.push(...unlocksAt(L));
  modal(`<div class="lvl-up"><div class="lvl-burst">LEVEL UP!</div><div class="lvl-num">${to}</div><div class="lvl-rank">${rankOf(to)}</div>
    ${unl.length ? `<div class="sub" style="margin:14px 0 6px">Unlocked</div>${unl.map(u => `<div class="unlock-item">${u}</div>`).join('')}` : ''}
    <button class="btn primary" style="margin-top:18px" data-close>Keep going →</button></div>`, (m, close) => m.querySelector('[data-close]').onclick = close);
}
// Toasts queue so a burst of unlocks never floods the screen (max 3 visible).
const toastQueue = [];
function pushGameToast(html, cls = '') {
  toastQueue.push({ html, cls }); pumpToasts();
}
function pumpToasts() {
  let host = $('#ach-host'); if (!host) { host = document.createElement('div'); host.id = 'ach-host'; document.body.appendChild(host); }
  while (toastQueue.length && host.children.length < 3) {
    const { html, cls } = toastQueue.shift();
    const el = document.createElement('div'); el.className = 'ach-toast ' + cls; el.innerHTML = html;
    host.appendChild(el); sfx('ach');
    setTimeout(() => el.classList.add('out'), 3600);
    setTimeout(() => { el.remove(); pumpToasts(); }, 4100);
  }
}
function achToast(a) {
  pushGameToast(`<span class="ai">${a.icon}</span><div><div class="at">Achievement unlocked</div><div class="an">${esc(a.name)}</div><div class="ad">${esc(a.desc)} · +50 XP</div></div>`);
}
function questToast(q, def) {
  pushGameToast(`<span class="ai">${def.icon}</span><div><div class="at">Daily quest complete</div><div class="an">${esc(def.text)}</div><div class="ad">+${def.xp} XP</div></div>`, 'quest');
}

// Central event hook. Returns XP gained for this event (including quest/achievement bonuses).
function gameEvent(type, d = {}) {
  const g = game(), e = { type, ...d };
  let gained = 0;
  if (type === 'session') {
    g.stats.sessions++; g.stats.modes[d.mode] = (g.stats.modes[d.mode] || 0) + 1;
    if (d.typedWords) g.stats.words += d.typedWords;
    if (TEST_MODES.includes(d.mode) && d.score >= 0.999) g.stats.perfect++;
    if (d.wpm && d.mode === 'typefull') g.stats.bestWpm = Math.max(g.stats.bestWpm, d.wpm);
    if (d.combo) g.stats.bestCombo = Math.max(g.stats.bestCombo, d.combo);
    if (d.wasDue) g.stats.reviews++;
    if (d.weakCleared) g.stats.weakCleared = (g.stats.weakCleared || 0) + d.weakCleared;
    const base = TEST_MODES.includes(d.mode) ? 25 : FAM_MODES.includes(d.mode) ? 10 : 15;
    const size = 1 + Math.min(d.words || 0, 400) / 150;
    const streakMul = 1 + Math.min(streak(), 10) * 0.05;
    let xp = base * (0.4 + d.score) * size * streakMul;
    if (d.score >= 0.999) xp += 15;
    if (d.wasDue) xp += 10;
    gained += awardXP(xp, 'session');
  }
  if (type === 'time') {
    const sec = DB.activity[todayKey()]?.seconds || 0;
    if (sec >= S().dailyGoal * 60 && !g.stats.goalDays[todayKey()]) {
      g.stats.goalDays[todayKey()] = 1; gained += awardXP(25, 'goal'); toast(`🎯 Daily goal reached! +25 XP`, 3000); sfx('ach');
    }
  }
  if (type === 'recording') { g.stats.recordings++; gained += awardXP(10, 'recording'); }
  if (type === 'text') gained += awardXP(5, 'text');
  // quests
  const Q = todaysQuests();
  for (const q of Q.list) {
    if (q.done) continue;
    const def = QUESTS.find(x => x.id === q.id); if (!def) continue;
    const v = def.on(e, Q);
    if (!v) continue;
    q.progress = def.max ? Math.max(q.progress, v) : q.progress + v;
    if (q.progress >= def.target) { q.done = true; g.stats.quests++; gained += awardXP(def.xp, 'quest'); questToast(q, def); }
  }
  // achievements
  for (const a of ACHIEVEMENTS) {
    if (g.ach[a.id]) continue;
    let ok = false; try { ok = a.test(g, e); } catch { }
    if (ok) { g.ach[a.id] = Date.now(); gained += awardXP(50, 'ach'); achToast(a); }
  }
  save();
  return gained;
}

// ---------- Profile view ----------
function viewProfile(main) {
  const g = game(), lp = levelProgress(), Q = todaysQuests();
  const got = ACHIEVEMENTS.filter(a => g.ach[a.id]).length;
  const nextUnlocks = []; for (let L = lp.L + 1; L <= lp.L + 12 && nextUnlocks.length < 4; L++) unlocksAt(L).forEach(u => nextUnlocks.push([L, u]));
  main.innerHTML = `
    <div class="profile-head card">
      ${ringHtml(lp.pct, `<div class="pl-num">${lp.L}</div>`, false)}
      <div style="flex:1"><div class="sub" style="margin:0">Level ${lp.L}</div><h1 style="margin:2px 0 6px">${rankOf(lp.L)}</h1>
        <div class="xpbar big"><div style="width:${lp.pct}%"></div></div>
        <div class="sub" style="margin:6px 0 0">${lp.into} / ${lp.need} XP to level ${lp.L + 1} · ${g.xp} XP total</div></div>
      <div class="ph-stats"><div><b>🔥 ${streak()}</b><span>streak</span></div><div><b>🏆 ${got}/${ACHIEVEMENTS.length}</b><span>badges</span></div><div><b>📋 ${g.stats.quests}</b><span>quests</span></div></div>
    </div>
    <h2>Daily quests <span class="sub" style="font-size:13px;font-weight:400">· new quests every day</span></h2>
    <div class="quests">${Q.list.map(q => { const d = QUESTS.find(x => x.id === q.id); if (!d) return '';
      const pr = Math.min(q.progress, d.target), show = d.unit === 's' ? `${Math.floor(pr / 60)}/${d.target / 60} min` : `${pr}/${d.target}`;
      return `<div class="card quest ${q.done ? 'done' : ''}"><span class="qi">${q.done ? '✅' : d.icon}</span><div style="flex:1"><div class="qt">${esc(d.text)}</div>
        <div class="progress" style="margin-top:6px"><div style="width:${pr / d.target * 100}%"></div></div></div><div class="qx">${show}<br><b>+${d.xp} XP</b></div></div>`; }).join('')}</div>
    <h2>Stats</h2>
    <div class="kpis">
      <div class="card kpi"><div class="v">${g.stats.sessions}</div><div class="l">Sessions</div></div>
      <div class="card kpi"><div class="v">${g.stats.bestWpm}</div><div class="l">Best WPM</div></div>
      <div class="card kpi"><div class="v">${g.stats.bestCombo}</div><div class="l">Best combo</div></div>
      <div class="card kpi"><div class="v">${g.stats.perfect}</div><div class="l">Perfect tests</div></div>
      <div class="card kpi"><div class="v">${g.stats.words}</div><div class="l">Words typed</div></div>
      <div class="card kpi"><div class="v">${bestStreak()}</div><div class="l">Best streak</div></div>
    </div>
    ${nextUnlocks.length ? `<h2>Coming up</h2><div class="card">${nextUnlocks.map(([L, u]) => `<div class="unlock-row"><span class="tag">Lv ${L}</span> ${u}</div>`).join('')}</div>` : ''}
    <h2>Achievements · ${got}/${ACHIEVEMENTS.length}</h2>
    <div class="ach-grid">${ACHIEVEMENTS.map(a => `<div class="ach ${g.ach[a.id] ? 'got' : ''}" title="${esc(a.desc)}">
      <div class="ach-ic">${g.ach[a.id] ? a.icon : '🔒'}</div><div class="ach-n">${esc(a.name)}</div><div class="ach-d">${esc(a.desc)}</div>
      ${g.ach[a.id] ? `<div class="ach-date">${new Date(g.ach[a.id]).toLocaleDateString()}</div>` : ''}</div>`).join('')}</div>`;
  animateRings(main);
}

// ---------- Customize view ----------
function viewCustomize(main) {
  const s = S(), L = level();
  const seg = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([v, l, lock]) => `<button data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}" ${lock ? 'disabled title="Unlocks at level ' + lock + '"' : ''}>${lock ? '🔒 ' : ''}${l}</button>`).join('')}</div>`;
  const tog = (id, on) => `<label class="switch"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span></span></label>`;
  const swatch = (k, t) => { const locked = t.unlock && L < t.unlock.level;
    return `<button class="theme-sw ${s.theme === k ? 'on' : ''}" data-theme="${k}" ${locked ? 'disabled' : ''} style="--sw-bg:${t.bg};--sw-panel:${t.panel};--sw-text:${t.text};--sw-acc:${t.accent};--sw-border:${t.border}">
      <div class="sw-prev"><div class="sw-side"></div><div class="sw-body"><div class="sw-line" style="width:70%"></div><div class="sw-line" style="width:45%"></div><div class="sw-dot"></div></div></div>
      <div class="sw-name">${locked ? '🔒 ' : ''}${t.name}${locked ? ` <small>Lv ${t.unlock.level}</small>` : ''}</div></button>`; };
  main.innerHTML = `<div class="row"><div><h1>Customize</h1><div class="sub">Make Memo yours. Everything applies instantly.</div></div><span class="spacer"></span>
      <button class="btn" id="resetlook">↺ Reset to defaults</button></div>
    <h2>Theme</h2>
    <div class="theme-grid">
      <button class="theme-sw ${s.theme === 'system' ? 'on' : ''}" data-theme="system" style="--sw-bg:linear-gradient(135deg,#f7f5f0 50%,#16181c 50%);--sw-panel:transparent;--sw-text:#888;--sw-acc:#e8730c;--sw-border:#888">
        <div class="sw-prev" style="background:var(--sw-bg)"><div class="sw-body"><div class="sw-dot"></div></div></div><div class="sw-name">Match Windows</div></button>
      ${Object.entries(THEMES).map(([k, t]) => swatch(k, t)).join('')}
    </div>
    <h2>Accent color</h2>
    <div class="card"><div class="row accent-row">
      <button class="acc-dot theme-acc ${!s.accent ? 'on' : ''}" data-acc="" title="Theme default">✦</button>
      ${ACCENTS.map(c => `<button class="acc-dot ${s.accent === c ? 'on' : ''}" data-acc="${c}" style="background:${c}"></button>`).join('')}
      <label class="acc-dot custom ${s.accent && !ACCENTS.includes(s.accent) ? 'on' : ''}" title="Custom color">🎨<input type="color" id="acccustom" value="${s.accent || '#e8730c'}"></label>
    </div></div>

    <h2>Typing cursor</h2>
    <div class="card cz">
      <div class="caret-grid">${Object.entries(CARETS).map(([k, n]) => `<button class="caret-card ${s.caretStyle === k ? 'on' : ''}" data-caret="${k}">
        <div class="cc-prev"><span>m</span><span class="cc-cur">e</span><span>mo</span><i class="caret c-${k} cc-car"></i></div><div>${n}</div></button>`).join('')}</div>
      <div class="cz-row"><div><b>Blinking</b><div class="desc">Block + "always" = classic command prompt</div></div>${seg('cblink', [['idle', 'When idle'], ['always', 'Always'], ['off', 'Never']], s.caretBlink)}</div>
      <div class="cz-row"><div><b>Movement</b><div class="desc">How the cursor glides between letters</div></div>${seg('cspeed', [['instant', 'Instant'], ['smooth', 'Smooth'], ['floaty', 'Floaty']], s.caretSpeed)}</div>
      <div class="cz-row"><div><b>Line thickness</b></div>${seg('cwidth', [[2, 'Thin'], [3, 'Normal'], [5, 'Thick']], s.caretWidth)}</div>
      <div class="cz-row"><div><b>Color</b></div><div class="row">${seg('ccolor', [['accent', 'Accent'], ['text', 'Text'], ['rainbow', 'Rainbow', L < CARET_RAINBOW_LEVEL ? CARET_RAINBOW_LEVEL : 0], ['custom', 'Custom']], s.caretColor)}
        <input type="color" id="ccustom" value="${s.caretCustom}" ${s.caretColor === 'custom' ? '' : 'class="hidden"'}></div></div>
      <div class="cz-preview"><div class="sub" style="margin:0 0 6px">Live preview</div><div class="typer demo" id="demo" data-vis="faint"><div class="ty-inner" id="demoin"></div></div></div>
    </div>

    <h2>Fonts</h2>
    <div class="card cz">
      <div class="cz-row"><div><b>Reading text</b></div><div class="font-row">${Object.entries(FONTS.read).map(([k, [n, f]]) => `<button class="font-card ${s.readFont === k ? 'on' : ''}" data-rf="${k}" style="font-family:${f}"><span>Aa</span>${n}</button>`).join('')}</div></div>
      <div class="cz-row"><div><b>Typing tests</b></div><div class="font-row">${Object.entries(FONTS.type).map(([k, [n, f]]) => `<button class="font-card ${s.typeFont === k ? 'on' : ''}" data-tf="${k}" style="font-family:${f.replace('var(--read-font)', 'inherit')}"><span>Aa</span>${n}</button>`).join('')}</div></div>
      <div class="cz-row"><div><b>Interface</b></div>${seg('uifont', Object.entries(FONTS.ui).map(([k, [n]]) => [k, n]), s.uiFont)}</div>
      <div class="cz-row"><div><b>Text size</b></div><div class="row"><input type="range" id="fs" min="14" max="44" value="${s.fontSize}"><span id="fsv">${s.fontSize}px</span></div></div>
    </div>

    <h2>Typing tests</h2>
    <div class="card cz">
      <div class="cz-row"><div><b>Text width</b></div>${seg('tywidth', [['narrow', 'Narrow'], ['normal', 'Normal'], ['wide', 'Wide'], ['full', 'Full']], s.typeWidth)}</div>
      <div class="cz-row"><div><b>Visible lines</b></div>${seg('tylines', [[3, '3'], [4, '4'], [5, '5'], [6, '6']], s.typeLines)}</div>
      <div class="cz-row"><div><b>Live stats</b><div class="desc">WPM, accuracy and timer while typing</div></div>${tog('livestats', s.liveStats)}</div>
      <div class="cz-row"><div><b>Combo counter</b><div class="desc">Count words in a row without mistakes</div></div>${tog('combo', s.combo)}</div>
      <div class="cz-row"><div><b>Confetti</b><div class="desc">Celebrate great scores and level-ups</div></div>${tog('confetti', s.confetti)}</div>
      <div class="cz-row"><div><b>Key sounds</b><div class="desc">Recorded keyboards, or synthesized sounds. Click one to hear it.</div></div><div class="sound-col">
        <div class="sound-row"><button class="chip ${s.sound === 'off' ? 'active' : ''}" data-snd="off">Off</button><span class="sound-lbl">🎙️ Recorded</span>${['clicky', 'studio', 'thock'].map(k => `<button class="chip ${s.sound === k ? 'active' : ''}" data-snd="${k}">${SOUNDS[k].name}</button>`).join('')}</div>
        <div class="sound-row"><span class="sound-lbl">🎛️ Synth</span>${Object.entries(SOUNDS).filter(([k, so]) => !so.rec && k !== 'off').map(([k, so]) => { const lock = so.unlock && L < so.unlock.level;
          return `<button class="chip ${s.sound === k ? 'active' : ''}" data-snd="${k}" ${lock ? `disabled title="Unlocks at level ${so.unlock.level}"` : ''}>${lock ? '🔒 ' : ''}${so.name}</button>`; }).join('')}</div></div></div>
      <div class="cz-row"><div><b>Volume</b></div><div class="row vol-row"><input type="range" id="vol" min="0" max="1" step="0.05" value="${s.soundVol}"><span id="volv">${Math.round(s.soundVol * 100)}%</span><button class="btn small" id="voltest">▶ Test</button></div></div>
      <div class="cz-row"><div><b>Sound effects</b><div class="desc">Finish chime, achievements and level-ups</div></div>${tog('sfxon', s.sfxOn !== false)}</div>
      <div class="cz-row"><div><b>Mistake sound</b><div class="desc">Plays when a word is submitted wrong</div></div>${tog('errsnd', s.errorSound)}</div>
    </div>

    <h2>Interface</h2>
    <div class="card cz">
      <div class="cz-row"><div><b>Corners</b></div>${seg('radius', [['sharp', 'Sharp'], ['normal', 'Rounded'], ['round', 'Extra round']], s.radius)}</div>
      <div class="cz-row"><div><b>Background</b></div>${seg('bgpat', [['plain', 'Plain'], ['gradient', 'Glow'], ['dots', 'Dots'], ['grid', 'Grid'], ['waves', 'Waves']], s.bg)}</div>
      <div class="cz-row"><div><b>Interface size</b></div>${seg('uiscale', [[0.9, 'Small'], [1, 'Normal'], [1.1, 'Large'], [1.25, 'Huge']], s.uiScale)}</div>
      <div class="cz-row"><div><b>Compact sidebar</b><div class="desc">Icons only</div></div>${tog('compact', s.compact)}</div>
      <div class="cz-row"><div><b>Reduce motion</b><div class="desc">Turn off animations</div></div>${tog('reducem', s.reduceMotion)}</div>
    </div>`;

  const set = (k, v, rerender = false) => { s[k] = v; save(); applyLook(); updateSidebar(); if (rerender) { const y = $('#main').scrollTop; go('customize'); $('#main').scrollTop = y; } };
  const bindSeg = (id, key, num = false, rerender = true) => $$(`#${id} button`).forEach(b => b.onclick = () => set(key, num ? +b.dataset.v : b.dataset.v, rerender));
  $$('.theme-sw').forEach(b => b.onclick = () => set('theme', b.dataset.theme, true));
  $$('[data-acc]').forEach(b => b.onclick = () => set('accent', b.dataset.acc, true));
  $('#acccustom').oninput = e => set('accent', e.target.value);
  $('#acccustom').onchange = () => set('accent', s.accent, true);
  $$('[data-caret]').forEach(b => b.onclick = () => set('caretStyle', b.dataset.caret, true));
  bindSeg('cblink', 'caretBlink'); bindSeg('cspeed', 'caretSpeed'); bindSeg('cwidth', 'caretWidth', true); bindSeg('ccolor', 'caretColor');
  $('#ccustom').oninput = e => set('caretCustom', e.target.value);
  $$('[data-rf]').forEach(b => b.onclick = () => set('readFont', b.dataset.rf, true));
  $$('[data-tf]').forEach(b => b.onclick = () => set('typeFont', b.dataset.tf, true));
  bindSeg('uifont', 'uiFont');
  $('#fs').oninput = e => { set('fontSize', +e.target.value); $('#fsv').textContent = e.target.value + 'px'; };
  bindSeg('tywidth', 'typeWidth'); bindSeg('tylines', 'typeLines', true);
  $('#livestats').onchange = e => set('liveStats', e.target.checked);
  $('#combo').onchange = e => set('combo', e.target.checked);
  $('#confetti').onchange = e => { set('confetti', e.target.checked); if (e.target.checked) confetti(0.6); };
  const demoKeys = () => { audio(); warmSounds(); const k = S().sound; const go = () => [0, 90, 170, 260, 330].forEach(t => setTimeout(() => keySound(), t));
    SOUNDS[k]?.rec ? Promise.resolve(loadPack(k)).then(go) : go(); };
  $$('[data-snd]').forEach(b => b.onclick = () => { set('sound', b.dataset.snd); $$('[data-snd]').forEach(x => x.classList.toggle('active', x === b)); demoKeys(); });
  let volT; $('#vol').oninput = e => { set('soundVol', +e.target.value); $('#volv').textContent = Math.round(e.target.value * 100) + '%'; clearTimeout(volT); volT = setTimeout(() => keySound(), 60); };
  $('#voltest').onclick = demoKeys;
  $('#sfxon').onchange = e => { set('sfxOn', e.target.checked); if (e.target.checked) sfx('done'); };
  $('#errsnd').onchange = e => { set('errorSound', e.target.checked); errSound(); };
  bindSeg('radius', 'radius'); bindSeg('bgpat', 'bg'); bindSeg('uiscale', 'uiScale', true);
  $('#compact').onchange = e => set('compact', e.target.checked);
  $('#reducem').onchange = e => set('reduceMotion', e.target.checked);
  $('#resetlook').onclick = async () => { if (!await confirmBox('Reset all customization to defaults?', 'Reset')) return; Object.assign(s, LOOK_DEFAULTS); save(); applyLook(); go('customize'); };

  // Live animated caret demo using the real caret settings.
  const demoText = 'Shall I compare thee to a summer day';
  const demoIn = $('#demoin');
  demoIn.innerHTML = `<div class="ty-line">${demoText.split('').map(c => c === ' ' ? '<span class="ts on"> </span>' : `<span class="l u">${c}</span>`).join('')}</div><div class="${caretClasses()}" id="democ"></div>`;
  const letters = $$('#demoin > .ty-line > span'), dc = $('#democ');
  let i = 0, pause = 0;
  const step = () => {
    if (pause > 0) { pause--; dc.classList.add('idle'); return; }
    dc.classList.remove('idle');
    if (i >= letters.length) { letters.forEach(l => l.classList.contains('l') && (l.className = 'l u')); i = 0; pause = 6; }
    const el = letters[i]; const ir = demoIn.getBoundingClientRect(), r = el.getBoundingClientRect();
    placeCaret(dc, r.left - ir.left, r.top - ir.top, r.width, r.height);
    if (el.classList.contains('l')) el.className = 'l ok';
    i++;
  };
  const iv = setInterval(step, 150); cleanup.push(() => clearInterval(iv));
  // caret previews in the style cards
  $$('.caret-card').forEach(card => { const cur = $('.cc-cur', card), car = $('.cc-car', card), pr = $('.cc-prev', card);
    requestAnimationFrame(() => { const a = pr.getBoundingClientRect(), r = cur.getBoundingClientRect(); const st = card.dataset.caret;
      let w = st === 'line' ? 3 : r.width, h = st === 'underline' ? 3 : r.height, y = r.top - a.top + (st === 'underline' ? r.height - 4 : 0);
      car.style.cssText = `width:${w}px;height:${h}px;transform:translate(${r.left - a.left - (st === 'line' ? 1 : 0)}px,${y}px)`; }); });
}
