'use strict';
/* =========================================================================
   Memo — memorize anything by heart.
   Single-file renderer: storage, text model, views and practice modes.
   ========================================================================= */

// ---------- utilities ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (key, n) => { const [y, m, d] = key.split('-').map(Number); return todayKey(new Date(y, m - 1, d + n)); };
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtMin = (sec) => sec < 60 ? `${Math.round(sec)}s` : sec < 3600 ? `${Math.round(sec / 60)} min` : `${(sec / 3600).toFixed(1)} h`;
const fmtDate = (key) => key ? new Date(key + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
function seededRand(seed) { let s = 0; for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function shuffle(arr, rnd = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function toast(msg, ms = 2400) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), ms);
}
function modal(html, onMount) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="modal-back"><div class="modal">${html}</div></div>`;
  const close = () => { root.innerHTML = ''; };
  $('.modal-back', root).addEventListener('mousedown', e => { if (e.target.classList.contains('modal-back')) close(); });
  onMount && onMount($('.modal', root), close);
  return close;
}
function confirmBox(msg, okLabel = 'OK', danger = false) {
  return new Promise(res => {
    modal(`<h2>${esc(msg)}</h2><div class="row"><span class="spacer"></span><button class="btn" data-a="no">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-a="yes">${esc(okLabel)}</button></div>`,
      (m, close) => { m.addEventListener('click', e => { const a = e.target.dataset.a; if (a) { close(); res(a === 'yes'); } }); });
  });
}

// ---------- storage ----------
const STORE_KEY = 'memo-data-v1';
const DEFAULT_SETTINGS = {
  theme: 'system', fontSize: 22, ttsRate: 1, ttsVoice: '', dailyGoal: 10, reminderTime: '',
  split: 'paragraph', typeHints: false, strictTyping: false, autoSpeakLines: false
};
const SAMPLES = [
  { title: 'Sonnet 18', folder: 'Poems', author: 'William Shakespeare', body:
`Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date;

Sometime too hot the eye of heaven shines,
And often is his gold complexion dimm'd;
And every fair from fair sometime declines,
By chance or nature's changing course untrimm'd;

But thy eternal summer shall not fade,
Nor lose possession of that fair thou ow'st;
Nor shall death brag thou wander'st in his shade,
When in eternal lines to time thou grow'st:

So long as men can breathe or eyes can see,
So long lives this, and this gives life to thee.` },
  { title: 'Psalm 23', folder: 'Scripture', author: 'King James Version', body:
`The Lord is my shepherd; I shall not want.
He maketh me to lie down in green pastures: he leadeth me beside the still waters.
He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.

Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.

Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.
Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the Lord for ever.` },
  { title: 'The Gettysburg Address', folder: 'Speeches', author: 'Abraham Lincoln', body:
`Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.

Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.

But, in a larger sense, we can not dedicate — we can not consecrate — we can not hallow — this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us — that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion — that we here highly resolve that these dead shall not have died in vain — that this nation, under God, shall have a new birth of freedom — and that government of the people, by the people, for the people, shall not perish from the earth.` }
];

function newText(fields = {}) {
  const now = Date.now();
  return { id: uid(), title: 'Untitled', author: '', folder: '', body: '', notes: '', favorite: false,
    created: now, updated: now, mastery: 0, hideLevel: 0, interval: 0, ease: 2.5, nextReview: null,
    lastPracticed: null, sessions: [], sectionMastery: {}, ...fields };
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const d = JSON.parse(raw); d.settings = { ...DEFAULT_SETTINGS, ...d.settings }; d.activity ||= {}; d.texts ||= []; return d; }
  } catch (e) { console.error(e); }
  return { texts: SAMPLES.map(s => newText(s)), settings: { ...DEFAULT_SETTINGS }, activity: {}, reminded: '' };
}
let DB = load();
let saveTimer;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => localStorage.setItem(STORE_KEY, JSON.stringify(DB)), 150); }
window.addEventListener('beforeunload', () => localStorage.setItem(STORE_KEY, JSON.stringify(DB)));
const getText = (id) => DB.texts.find(t => t.id === id);

// Voice recordings live in IndexedDB (binary audio).
const Rec = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('memo-recordings', 1);
      r.onupgradeneeded = () => { const s = r.result.createObjectStore('recs', { keyPath: 'id' }); s.createIndex('textId', 'textId'); };
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async tx(mode) { const db = await this.open(); return db.transaction('recs', mode).objectStore('recs'); },
  async add(rec) { const s = await this.tx('readwrite'); return new Promise(r => { s.put(rec).onsuccess = r; }); },
  async list(textId) { const s = await this.tx('readonly'); return new Promise(r => { const q = s.index('textId').getAll(textId); q.onsuccess = () => r(q.result.sort((a, b) => b.created - a.created)); }); },
  async del(id) { const s = await this.tx('readwrite'); return new Promise(r => { s.delete(id).onsuccess = r; }); },
  async delForText(textId) { for (const r of await this.list(textId)) await this.del(r.id); },
  async clear() { const s = await this.tx('readwrite'); return new Promise(r => { s.clear().onsuccess = r; }); }
};

// ---------- activity / streaks / spaced repetition ----------
function logActivity(seconds, session = false) {
  const k = todayKey(); const a = DB.activity[k] ||= { seconds: 0, sessions: 0 };
  a.seconds += seconds; if (session) a.sessions += 1; save(); updateSidebar();
}
function streak() {
  let n = 0, k = todayKey();
  if (!DB.activity[k]) k = addDays(k, -1); // today not done yet: streak still alive from yesterday
  while (DB.activity[k] && DB.activity[k].seconds > 0) { n++; k = addDays(k, -1); }
  return n;
}
function bestStreak() {
  const keys = Object.keys(DB.activity).filter(k => DB.activity[k].seconds > 0).sort();
  let best = 0, cur = 0, prev = null;
  for (const k of keys) { cur = prev && addDays(prev, 1) === k ? cur + 1 : 1; best = Math.max(best, cur); prev = k; }
  return best;
}
const isDue = (t) => t.nextReview && t.nextReview <= todayKey();
const dueTexts = () => DB.texts.filter(isDue);

const MODE_WEIGHT = { type: 1, typefull: 1.1, lines: 0.8, scramble: 0.6, quiz: 0.6, recite: 0.9, hide: 0.7 };
function recordSession(text, mode, score, seconds, scopeLabel, sectionKey) {
  score = clamp(score, 0, 1);
  text.sessions.push({ date: todayKey(), ts: Date.now(), mode, score: Math.round(score * 100), seconds: Math.round(seconds), scope: scopeLabel });
  // Mastery: weighted moving average, harder modes count for more.
  const w = (MODE_WEIGHT[mode] || 0.6) * 0.45;
  text.mastery = Math.round(clamp(text.mastery * (1 - w) + score * 100 * w, 0, 100));
  if (sectionKey != null) {
    const prev = text.sectionMastery[sectionKey] || 0;
    text.sectionMastery[sectionKey] = Math.round(prev * (1 - w) + score * 100 * w);
  }
  // SM-2 style scheduling.
  const q = score * 5;
  if (q >= 3) {
    text.interval = text.interval < 1 ? 1 : text.interval < 2 ? 3 : Math.round(text.interval * text.ease);
    text.ease = Math.max(1.3, text.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  } else { text.interval = 0; text.ease = Math.max(1.3, text.ease - 0.2); }
  text.nextReview = addDays(todayKey(), Math.max(1, text.interval));
  text.lastPracticed = todayKey();
  save(); logActivity(0, true);
}

// ---------- text model ----------
const WORD_RE = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;
function parseText(body, split = DB.settings.split) {
  const rawLines = body.replace(/\r/g, '').split('\n');
  // group into paragraphs by blank lines
  const paras = []; let cur = [];
  for (const l of rawLines) { if (l.trim() === '') { if (cur.length) paras.push(cur), cur = []; } else cur.push(l); }
  if (cur.length) paras.push(cur);
  let groups;
  if (split === 'line') groups = paras.flat().map(l => [l]);
  else if (split === 'lines4') { groups = []; const all = paras.flat(); for (let i = 0; i < all.length; i += 4) groups.push(all.slice(i, i + 4)); }
  else if (split === 'sentence') {
    groups = [];
    for (const p of paras) for (const l of p) {
      const sents = l.match(/[^.!?;:]+[.!?;:]+["'’”)]*\s*|[^.!?;:]+$/g) || [l];
      for (const s of sents) if (s.trim()) groups.push([s.trim()]);
    }
  } else groups = paras;

  const words = []; const sections = [];
  groups.forEach((g, si) => {
    const sec = { index: si, lines: [] };
    for (const lineStr of g) {
      const line = { tokens: [], text: lineStr, wordIdx: [] };
      let last = 0;
      for (const m of lineStr.matchAll(WORD_RE)) {
        if (m.index > last) line.tokens.push({ sep: lineStr.slice(last, m.index) });
        const wi = words.length;
        words.push({ s: m[0], n: norm(m[0]), sec: si, line: sec.lines.length });
        line.tokens.push({ w: wi }); line.wordIdx.push(wi);
        last = m.index + m[0].length;
      }
      if (last < lineStr.length) line.tokens.push({ sep: lineStr.slice(last) });
      sec.lines.push(line);
    }
    sections.push(sec);
  });
  return { sections, words };
}
const wordCount = (body) => (body.match(WORD_RE) || []).length;

// ---------- app state & navigation ----------
const state = { view: 'library', textId: null, folder: '__all', search: '', sort: 'recent', favOnly: false,
  mode: 'read', scope: 'all', cumulative: false };
let cleanup = []; // functions to run when leaving a view/mode
function runCleanup() { cleanup.forEach(f => { try { f(); } catch (e) { console.error(e); } }); cleanup = []; }

function go(view, extra = {}) {
  runCleanup(); stopSpeech();
  Object.assign(state, extra, { view });
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view || (view === 'text' || view === 'edit' || view === 'practice') && b.dataset.view === 'library'));
  const main = $('#main'); main.scrollTop = 0;
  ({ library: viewLibrary, review: viewReview, stats: viewStats, settings: viewSettings, help: viewHelp,
     text: viewText, edit: viewEdit, practice: viewPractice })[view](main);
  updateSidebar();
}

function updateSidebar() {
  const s = streak();
  $('#streak-pill').textContent = `🔥 ${s} day streak`;
  const sec = DB.activity[todayKey()]?.seconds || 0, goal = DB.settings.dailyGoal * 60;
  $('#goal-pill').innerHTML = `Today: ${fmtMin(sec)} / ${DB.settings.dailyGoal} min
    <div class="progress" style="margin-top:4px"><div style="width:${clamp(sec / goal * 100, 0, 100)}%"></div></div>`;
  const due = dueTexts().length, b = $('#due-badge');
  b.textContent = due; b.classList.toggle('hidden', !due);
}

function applyTheme() {
  let t = DB.settings.theme;
  if (t === 'system') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
  document.documentElement.style.setProperty('--reading', DB.settings.fontSize + 'px');
}

// ---------- Library ----------
function viewLibrary(main) {
  const folders = [...new Set(DB.texts.map(t => t.folder).filter(Boolean))].sort();
  main.innerHTML = `
    <div class="row"><div><h1>Library</h1><div class="sub">${DB.texts.length} texts · ${DB.texts.reduce((a, t) => a + wordCount(t.body), 0)} words</div></div>
      <span class="spacer"></span>
      <button class="btn" id="imp">⬆ Import .txt</button>
      <button class="btn primary" id="new">＋ New text</button></div>
    <div class="row lib-tools">
      <input type="search" id="q" placeholder="Search titles, authors, text…" value="${esc(state.search)}">
      <select id="sort">
        ${[['recent', 'Recently practiced'], ['updated', 'Recently edited'], ['title', 'Title A–Z'], ['mastery', 'Mastery (low first)'], ['due', 'Due for review']]
          .map(([v, l]) => `<option value="${v}" ${state.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <button class="btn ${state.favOnly ? 'on' : ''}" id="favonly">★ Favorites</button>
    </div>
    <div class="folder-chips">
      <button class="chip ${state.folder === '__all' ? 'active' : ''}" data-f="__all">All</button>
      ${folders.map(f => `<button class="chip ${state.folder === f ? 'active' : ''}" data-f="${esc(f)}">📁 ${esc(f)}</button>`).join('')}
      <button class="chip ${state.folder === '' ? 'active' : ''}" data-f="">Unfiled</button>
    </div>
    <div id="cards" class="grid"></div>`;
  const renderCards = () => {
    const q = state.search.toLowerCase();
    let list = DB.texts.filter(t => (state.folder === '__all' || t.folder === state.folder) && (!state.favOnly || t.favorite)
      && (!q || (t.title + ' ' + t.author + ' ' + t.body + ' ' + t.folder).toLowerCase().includes(q)));
    const by = { recent: (a, b) => (b.sessions.at(-1)?.ts || 0) - (a.sessions.at(-1)?.ts || 0) || b.updated - a.updated,
      updated: (a, b) => b.updated - a.updated, title: (a, b) => a.title.localeCompare(b.title),
      mastery: (a, b) => a.mastery - b.mastery, due: (a, b) => (a.nextReview || '9999').localeCompare(b.nextReview || '9999') };
    list.sort(by[state.sort]);
    $('#cards').innerHTML = list.length ? list.map(t => `
      <div class="card text-card" data-id="${t.id}">
        <button class="fav ${t.favorite ? 'on' : ''}" data-fav="${t.id}" title="Favorite">${t.favorite ? '★' : '☆'}</button>
        <div class="title">${esc(t.title)}</div>
        ${t.author ? `<div class="tag" style="align-self:flex-start">${esc(t.author)}</div>` : ''}
        <div class="preview">${esc(t.body.slice(0, 220))}</div>
        <div class="meta"><div class="progress"><div style="width:${t.mastery}%"></div></div>${t.mastery}%
          ${isDue(t) ? '<span class="tag due">Due</span>' : ''}</div>
        <div class="meta">${wordCount(t.body)} words${t.folder ? ' · 📁 ' + esc(t.folder) : ''}${t.lastPracticed ? ' · practiced ' + fmtDate(t.lastPracticed) : ''}</div>
      </div>`).join('')
      : `<div class="empty" style="grid-column:1/-1">No texts here yet.<br><br><button class="btn primary" id="new2">＋ Add your first text</button></div>`;
    $('#new2')?.addEventListener('click', () => go('edit', { textId: null }));
  };
  renderCards();
  $('#q').addEventListener('input', e => { state.search = e.target.value; renderCards(); });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; renderCards(); });
  $('#favonly').addEventListener('click', () => { state.favOnly = !state.favOnly; go('library'); });
  $$('.chip', main).forEach(c => c.addEventListener('click', () => { state.folder = c.dataset.f; go('library'); }));
  $('#new').addEventListener('click', () => go('edit', { textId: null }));
  $('#imp').addEventListener('click', importTxt);
  $('#cards').addEventListener('click', e => {
    const f = e.target.closest('[data-fav]');
    if (f) { const t = getText(f.dataset.fav); t.favorite = !t.favorite; save(); renderCards(); return; }
    const c = e.target.closest('.text-card'); if (c) go('text', { textId: c.dataset.id });
  });
  $('#q').focus();
}

async function importTxt() {
  const files = await pickFiles([{ name: 'Text', extensions: ['txt', 'md'] }], true, '.txt,.md');
  if (!files.length) return;
  for (const f of files) {
    const title = f.name.replace(/\.(txt|md)$/i, '');
    DB.texts.push(newText({ title, body: f.content.trim(), folder: state.folder !== '__all' ? state.folder : '' }));
  }
  save(); toast(`Imported ${files.length} text${files.length > 1 ? 's' : ''}`); go('library');
}
async function pickFiles(filters, multi, accept) {
  if (window.native) return window.native.openFile({ filters, multi });
  return new Promise(res => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; inp.multiple = multi;
    inp.onchange = async () => res(await Promise.all([...inp.files].map(async f => ({ name: f.name, content: await f.text() }))));
    inp.click();
  });
}
async function saveFile(defaultName, content, filters) {
  if (window.native) return window.native.saveFile({ defaultName, content, filters });
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content])); a.download = defaultName; a.click(); return true;
}

// ---------- Text detail ----------
function viewText(main) {
  const t = getText(state.textId); if (!t) return go('library');
  const P = parseText(t.body);
  const recent = t.sessions.slice(-8).reverse();
  main.innerHTML = `
    <div class="row"><button class="btn small" id="back">← Library</button></div>
    <div class="row" style="margin-top:14px"><div><h1>${esc(t.title)}</h1>
      <div class="sub">${t.author ? esc(t.author) + ' · ' : ''}${P.words.length} words · ${P.sections.length} parts${t.folder ? ' · 📁 ' + esc(t.folder) : ''}</div></div>
      <span class="spacer"></span>
      <button class="btn" id="edit">✎ Edit</button>
      <button class="btn" id="dup">⧉ Duplicate</button>
      <button class="btn" id="exp">⬇ Export</button>
      <button class="btn danger" id="del">🗑 Delete</button>
    </div>
    <div class="kpis">
      <div class="card kpi"><div class="v">${t.mastery}%</div><div class="l">Mastery</div></div>
      <div class="card kpi"><div class="v">${t.sessions.length}</div><div class="l">Practice sessions</div></div>
      <div class="card kpi"><div class="v">${t.nextReview ? (isDue(t) ? 'Today' : fmtDate(t.nextReview)) : '—'}</div><div class="l">Next review</div></div>
      <div class="card kpi"><div class="v">${fmtMin(t.sessions.reduce((a, s) => a + s.seconds, 0))}</div><div class="l">Time practiced</div></div>
    </div>
    <div class="row"><button class="btn primary" id="practice">▶ Practice whole text</button>
      <button class="btn" id="listen">🔊 Listen</button>
      <button class="btn" id="test">⌨ Test me</button></div>
    ${t.notes ? `<h2>Notes</h2><div class="card" style="white-space:pre-wrap">${esc(t.notes)}</div>` : ''}
    <h2>Parts</h2>
    <div class="card"><table class="list"><tr><th>#</th><th>Begins</th><th>Words</th><th>Mastery</th><th></th></tr>
      ${P.sections.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.lines[0]?.text.slice(0, 70))}${(s.lines[0]?.text.length || 0) > 70 ? '…' : ''}</td>
        <td>${s.lines.reduce((a, l) => a + l.wordIdx.length, 0)}</td><td>${t.sectionMastery[i] ?? 0}%</td>
        <td style="text-align:right"><button class="btn small" data-sec="${i}">Practice</button> <button class="btn small" data-cum="${i}" ${i ? '' : 'disabled'} title="Parts 1 to ${i + 1}">Build up</button></td></tr>`).join('')}
    </table></div>
    <h2>Recent sessions</h2>
    ${recent.length ? `<div class="card"><table class="list"><tr><th>Date</th><th>Mode</th><th>Scope</th><th>Score</th><th>Time</th></tr>
      ${recent.map(s => `<tr><td>${fmtDate(s.date)}</td><td>${esc(MODES[s.mode]?.label || s.mode)}</td><td>${esc(s.scope || 'Whole text')}</td><td>${s.score}%</td><td>${fmtMin(s.seconds)}</td></tr>`).join('')}</table></div>`
      : '<div class="sub">No sessions yet — start practicing!</div>'}`;
  $('#back').onclick = () => go('library');
  $('#edit').onclick = () => go('edit');
  $('#practice').onclick = () => go('practice', { mode: 'read', scope: 'all', cumulative: false });
  $('#listen').onclick = () => go('practice', { mode: 'read', scope: 'all', cumulative: false, autoplay: true });
  $('#test').onclick = () => go('practice', { mode: 'type', scope: 'all', cumulative: false });
  $$('[data-sec]').forEach(b => b.onclick = () => go('practice', { mode: 'read', scope: +b.dataset.sec, cumulative: false }));
  $$('[data-cum]').forEach(b => b.onclick = () => go('practice', { mode: 'read', scope: +b.dataset.cum, cumulative: true }));
  $('#dup').onclick = () => { const c = newText({ title: t.title + ' (copy)', author: t.author, folder: t.folder, body: t.body, notes: t.notes }); DB.texts.push(c); save(); go('text', { textId: c.id }); toast('Duplicated'); };
  $('#exp').onclick = () => saveFile(t.title.replace(/[\\/:*?"<>|]/g, '_') + '.txt', `${t.title}\n${t.author ? t.author + '\n' : ''}\n${t.body}\n`, [{ name: 'Text', extensions: ['txt'] }]).then(r => r && toast('Exported'));
  $('#del').onclick = async () => {
    if (!await confirmBox(`Delete “${t.title}”?`, 'Delete', true)) return;
    DB.texts = DB.texts.filter(x => x.id !== t.id); save(); Rec.delForText(t.id); toast('Deleted'); go('library');
  };
}

// ---------- Editor ----------
function viewEdit(main) {
  const t = state.textId ? getText(state.textId) : null;
  const folders = [...new Set(DB.texts.map(x => x.folder).filter(Boolean))];
  main.innerHTML = `
    <div class="editor">
      <h1>${t ? 'Edit text' : 'New text'}</h1>
      <label>Title<input id="title" value="${esc(t?.title || '')}" placeholder="e.g. The Road Not Taken"></label>
      <div class="row">
        <label style="flex:1">Author / source<input id="author" value="${esc(t?.author || '')}" placeholder="optional"></label>
        <label style="flex:1">Folder<input id="folder" list="folders" value="${esc(t?.folder || (state.folder !== '__all' ? state.folder : ''))}" placeholder="e.g. Poems, Lines, Verses">
          <datalist id="folders">${folders.map(f => `<option value="${esc(f)}">`).join('')}</datalist></label>
      </div>
      <label>Text — leave a blank line between parts (stanzas, paragraphs, scenes)
        <textarea id="body" placeholder="Paste or type what you want to memorize…">${esc(t?.body || '')}</textarea></label>
      <label>Notes (optional — meaning, context, cues)<textarea id="notes" style="min-height:70px">${esc(t?.notes || '')}</textarea></label>
      <div class="row"><span id="wc" class="sub" style="margin:0"></span><span class="spacer"></span>
        <button class="btn" id="paste">📋 Paste</button>
        <button class="btn" id="clean">🧹 Tidy spacing</button>
        <button class="btn" id="cancel">Cancel</button>
        <button class="btn primary" id="save">Save</button></div>
    </div>`;
  const body = $('#body');
  const upd = () => { const p = parseText(body.value); $('#wc').textContent = `${p.words.length} words · ${p.sections.length} parts`; };
  body.addEventListener('input', upd); upd();
  $('#paste').onclick = async () => { try { body.value += await navigator.clipboard.readText(); upd(); } catch { toast('Clipboard not available'); } };
  $('#clean').onclick = () => { body.value = body.value.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim(); upd(); };
  $('#cancel').onclick = () => t ? go('text') : go('library');
  $('#save').onclick = () => {
    const title = $('#title').value.trim() || body.value.trim().split('\n')[0].slice(0, 50) || 'Untitled';
    if (!body.value.trim()) return toast('Add some text to memorize first');
    const fields = { title, author: $('#author').value.trim(), folder: $('#folder').value.trim(), body: body.value.replace(/\r/g, '').trim(), notes: $('#notes').value, updated: Date.now() };
    let id;
    if (t) { Object.assign(t, fields); id = t.id; } else { const n = newText(fields); DB.texts.push(n); id = n.id; }
    save(); toast('Saved'); go('text', { textId: id });
  };
  (t ? body : $('#title')).focus();
}

// ---------- Speech (text-to-speech) ----------
let voicesCache = [];
function loadVoices() { voicesCache = speechSynthesis.getVoices(); }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function stopSpeech() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
function speak(str, { onBoundary, onEnd, rate } = {}) {
  stopSpeech();
  const u = new SpeechSynthesisUtterance(str);
  u.rate = rate || DB.settings.ttsRate;
  const v = voicesCache.find(v => v.name === DB.settings.ttsVoice); if (v) u.voice = v;
  if (onBoundary) u.onboundary = onBoundary;
  if (onEnd) u.onend = onEnd;
  speechSynthesis.speak(u);
  return u;
}

// ---------- Practice ----------
const MODES = {
  read: { label: '📖 Read & Listen', tip: 'Read the text and listen to it read aloud. Words light up as they are spoken.' },
  initials: { label: '🔤 First Letters', tip: 'Only the first letter of each word is shown. Recite it, then click any word to check.' },
  hide: { label: '🙈 Hide Words', tip: 'Hide more and more words as you improve. Click a hidden word to peek at it.' },
  type: { label: '⌨ Type Initials', tip: 'Type the first letter of each word, from memory. Wrong letters are counted as mistakes.' },
  typefull: { label: '✍ Type Words', tip: 'Type each full word from memory. Press space or Enter after each word.' },
  lines: { label: '🃏 Line Cards', tip: 'See one line, recall the next, then reveal and grade yourself.' },
  scramble: { label: '🔀 Unscramble', tip: 'The lines are shuffled — pick them in the right order.' },
  quiz: { label: '❓ Fill the Blank', tip: 'Pick the missing word from four choices.' },
  recite: { label: '🎙 Recite & Record', tip: 'Recite out loud while recording yourself, then play it back and check against the text.' }
};

function scopeInfo(P) {
  const n = P.sections.length;
  if (state.scope === 'all' || state.scope >= n) return { secs: P.sections, label: 'Whole text', key: null };
  if (state.cumulative) return { secs: P.sections.slice(0, state.scope + 1), label: `Parts 1–${state.scope + 1}`, key: null };
  return { secs: [P.sections[state.scope]], label: `Part ${state.scope + 1}`, key: state.scope };
}

function viewPractice(main) {
  const t = getText(state.textId); if (!t) return go('library');
  const P = parseText(t.body);
  main.innerHTML = `
    <div class="practice-head">
      <button class="btn small" id="back">← ${esc(t.title)}</button>
      <span class="spacer"></span>
      <label class="row" style="gap:6px;font-size:14px">Part
        <select id="scope"><option value="all">Whole text</option>
          ${P.sections.map((s, i) => `<option value="${i}" ${state.scope === i ? 'selected' : ''}>Part ${i + 1}: ${esc(s.lines[0]?.text.slice(0, 32))}</option>`).join('')}
        </select></label>
      <label class="row" style="gap:4px;font-size:14px" title="Practice all parts up to the selected one"><input type="checkbox" id="cum" ${state.cumulative ? 'checked' : ''}> Build up</label>
      <button class="btn small" id="prevp" title="Previous part">◀</button><button class="btn small" id="nextp" title="Next part">▶</button>
    </div>
    <div class="modes">${Object.entries(MODES).map(([k, m]) => `<button class="mode-btn ${state.mode === k ? 'active' : ''}" data-m="${k}" title="${esc(m.tip)}">${m.label}</button>`).join('')}</div>
    <div class="sub" style="margin-bottom:10px">${esc(MODES[state.mode].tip)}</div>
    <div id="stage"></div>`;
  $('#back').onclick = () => go('text');
  $('#scope').value = String(state.scope);
  $('#scope').onchange = e => go('practice', { scope: e.target.value === 'all' ? 'all' : +e.target.value });
  $('#cum').onchange = e => go('practice', { cumulative: e.target.checked });
  const step = d => { const cur = state.scope === 'all' ? -1 : state.scope; const nx = clamp(cur + d, 0, P.sections.length - 1); go('practice', { scope: nx }); };
  $('#prevp').onclick = () => step(-1); $('#nextp').onclick = () => step(1);
  $$('.mode-btn').forEach(b => b.onclick = () => go('practice', { mode: b.dataset.m }));

  // time tracking while practicing
  let last = Date.now();
  const tick = setInterval(() => { if (document.hasFocus()) logActivity((Date.now() - last) / 1000); last = Date.now(); }, 5000);
  cleanup.push(() => { clearInterval(tick); if (document.hasFocus()) logActivity((Date.now() - last) / 1000); });

  const scope = scopeInfo(P);
  const ctx = { t, P, scope, stage: $('#stage'), started: Date.now(),
    finish(score, extra = '') { const secs = (Date.now() - this.started) / 1000; recordSession(t, state.mode, score, secs, scope.label, scope.key); showDone(this, score, extra); } };
  PRACTICE[state.mode](ctx);
}

function scopeWords(scope) { return scope.secs.flatMap(s => s.lines.flatMap(l => l.wordIdx)); }
function scopeLines(scope) { return scope.secs.flatMap(s => s.lines); }

// Renders the scoped text as word spans. cls(wi) -> class string.
function renderReading(ctx, cls) {
  const { P, scope } = ctx;
  return `<div class="reading">${scope.secs.map((s, si) => (si ? '<div class="para-gap"></div>' : '') + s.lines.map(l =>
    `<div class="line">${l.tokens.map(tk => tk.sep != null ? esc(tk.sep)
      : `<span class="w ${cls(tk.w)}" data-w="${tk.w}"><span class="first">${esc(P.words[tk.w].s[0])}</span><span class="rest">${esc(P.words[tk.w].s.slice(1))}</span></span>`).join('')}</div>`).join('')).join('')}</div>`;
}
function setKeyHandler(fn) { window.addEventListener('keydown', fn); cleanup.push(() => window.removeEventListener('keydown', fn)); }

function showDone(ctx, score, extra) {
  const pct = Math.round(score * 100);
  const msg = pct >= 95 ? 'Perfect! You know this by heart. 🎉' : pct >= 80 ? 'Great job! Almost there.' : pct >= 50 ? 'Good progress — keep going.' : 'Keep practicing — it gets easier every time.';
  ctx.stage.insertAdjacentHTML('afterbegin', `<div class="card done-box" id="donebox"><div class="big">${pct}%</div><div style="font-size:18px;margin:8px 0">${msg}</div>
    <div class="sub">${extra} Mastery now ${ctx.t.mastery}% · next review ${fmtDate(ctx.t.nextReview)}</div>
    <div class="row" style="justify-content:center"><button class="btn primary" id="again">↻ Try again</button>
    ${state.scope !== 'all' && state.scope < ctx.P.sections.length - 1 ? '<button class="btn" id="nextpart">Next part ▶</button>' : ''}
    <button class="btn" id="harder">Harder mode ⬆</button></div></div>`);
  $('#again').onclick = () => go('practice');
  $('#nextpart')?.addEventListener('click', () => go('practice', { scope: state.scope + 1 }));
  const order = ['read', 'initials', 'hide', 'quiz', 'scramble', 'lines', 'type', 'typefull', 'recite'];
  $('#harder').onclick = () => go('practice', { mode: order[Math.min(order.indexOf(state.mode) + 1, order.length - 1)] });
  ctx.stage.scrollIntoView({ behavior: 'smooth' });
}

const PRACTICE = {
  // --- Read & Listen ---
  read(ctx) {
    const { P, scope, stage } = ctx;
    const lines = scopeLines(scope);
    // Build a speakable string and map character offsets to words.
    let str = ''; const offs = [];
    for (const l of lines) { let pos = 0; for (const tk of l.tokens) { if (tk.w != null) offs.push([str.length + pos, tk.w]); pos += (tk.sep ?? P.words[tk.w].s).length; } str += l.text + '\n'; }
    stage.innerHTML = `<div class="toolbar">
        <button class="btn primary" id="play">▶ Listen</button><button class="btn" id="stop">■ Stop</button>
        <label class="row" style="gap:6px">Speed <input type="range" id="rate" min="0.5" max="1.6" step="0.1" value="${DB.settings.ttsRate}"><span id="rv">${DB.settings.ttsRate}×</span></label>
        <label class="row" style="gap:4px"><input type="checkbox" id="loop"> Repeat</label>
        <label class="row" style="gap:4px"><input type="checkbox" id="lbl"> Line by line (pause after each line)</label>
        <span class="spacer"></span><button class="btn" id="mark">✓ Mark as read</button></div>
      ${renderReading(ctx, () => 'clickable')}
      <div class="sub" style="margin-top:10px">Tip: click any word to start listening from there.</div>`;
    const spans = new Map($$('.w', stage).map(s => [+s.dataset.w, s]));
    let playing = false;
    const hl = (wi) => { $$('.w.speaking', stage).forEach(s => s.classList.remove('speaking')); spans.get(wi)?.classList.add('speaking'); };
    const playFrom = (charStart = 0) => {
      playing = true; $('#play').textContent = '⏸ Pause';
      const lbl = $('#lbl').checked;
      let segEnd = str.length;
      if (lbl) { const nl = str.indexOf('\n', charStart); segEnd = nl < 0 ? str.length : nl + 1; }
      const seg = str.slice(charStart, segEnd);
      if (!seg.trim()) { if (segEnd < str.length) return playFrom(segEnd); return end(); }
      speak(seg, {
        rate: +$('#rate').value,
        onBoundary: e => { if (e.name && e.name !== 'word') return; const c = charStart + e.charIndex; let best = null; for (const [o, w] of offs) { if (o <= c) best = w; else break; } if (best != null) hl(best); },
        onEnd: () => { if (!playing) return; if (segEnd < str.length) { setTimeout(() => playing && playFrom(segEnd), lbl ? 1500 : 0); } else end(); }
      });
    };
    const end = () => { hl(-1); if ($('#loop')?.checked && playing) return playFrom(0); playing = false; const p = $('#play'); if (p) p.textContent = '▶ Listen'; };
    $('#play').onclick = () => {
      if (playing && speechSynthesis.speaking && !speechSynthesis.paused) { speechSynthesis.pause(); $('#play').textContent = '▶ Resume'; }
      else if (speechSynthesis.paused) { speechSynthesis.resume(); $('#play').textContent = '⏸ Pause'; }
      else playFrom(0);
    };
    $('#stop').onclick = () => { playing = false; stopSpeech(); end(); };
    $('#rate').oninput = e => { $('#rv').textContent = e.target.value + '×'; DB.settings.ttsRate = +e.target.value; save(); };
    stage.querySelector('.reading').addEventListener('click', e => {
      const w = e.target.closest('.w'); if (!w) return; const o = offs.find(x => x[1] === +w.dataset.w); if (o) playFrom(o[0]);
    });
    $('#mark').onclick = () => { logActivity(0, true); ctx.t.lastPracticed = todayKey(); save(); toast('Nice — now try First Letters or Hide Words'); };
    cleanup.push(() => { playing = false; stopSpeech(); });
    if (state.autoplay) { state.autoplay = false; setTimeout(() => playFrom(0), 300); }
  },

  // --- First letters ---
  initials(ctx) {
    const { stage } = ctx;
    stage.innerHTML = `<div class="toolbar"><button class="btn" id="showall">👁 Show all</button><button class="btn" id="hideall">🙈 Hide all</button>
      <button class="btn" id="lineby">Reveal next line</button><span class="spacer"></span><button class="btn primary" id="rate">I recited it — grade me</button></div>
      ${renderReading(ctx, () => 'initial clickable')}`;
    const R = $('.reading', stage);
    R.addEventListener('click', e => { const w = e.target.closest('.w'); if (w) { w.classList.toggle('initial'); w.classList.toggle('revealed'); } });
    $('#showall').onclick = () => $$('.w', R).forEach(w => { w.classList.remove('initial'); w.classList.add('revealed'); });
    $('#hideall').onclick = () => $$('.w', R).forEach(w => { w.classList.add('initial'); w.classList.remove('revealed'); });
    $('#lineby').onclick = () => { const line = $$('.line', R).find(l => $('.w.initial', l)); line && $$('.w', line).forEach(w => { w.classList.remove('initial'); w.classList.add('revealed'); }); };
    $('#rate').onclick = () => selfGrade(ctx, $$('.w.revealed', R).length / Math.max(1, $$('.w', R).length));
  },

  // --- Progressive hiding ---
  hide(ctx) {
    const { t, P, scope, stage } = ctx;
    const ws = scopeWords(scope);
    const rnd = seededRand(t.id + (t.hideSeed || 0));
    const rank = new Map(shuffle(ws, rnd).map((w, i) => [w, i / ws.length]));
    stage.innerHTML = `<div class="toolbar">
        <button class="btn" id="less">− Show more</button>
        <label class="row" style="gap:6px">Hidden <input type="range" id="lvl" min="0" max="100" step="10" value="${t.hideLevel}"> <b id="lv">${t.hideLevel}%</b></label>
        <button class="btn primary" id="more">＋ Hide more</button>
        <button class="btn" id="reshuffle" title="Hide a different set of words">🎲 Shuffle</button>
        <label class="row" style="gap:4px"><input type="checkbox" id="hint"> Show first letter</label>
        <span class="spacer"></span><button class="btn" id="rate">I recited it — grade me</button></div>
      <div id="rd"></div>`;
    let peeks = new Set();
    const draw = () => {
      const lvl = t.hideLevel / 100, hint = $('#hint').checked;
      $('#rd').innerHTML = renderReading(ctx, w => rank.get(w) < lvl && !peeks.has(w) ? (hint ? 'initial clickable' : 'masked clickable') : peeks.has(w) ? 'revealed clickable' : '');
      $('#lv').textContent = t.hideLevel + '%'; $('#lvl').value = t.hideLevel;
    };
    const set = v => { t.hideLevel = clamp(v, 0, 100); peeks = new Set(); save(); draw(); };
    $('#more').onclick = () => set(t.hideLevel + 10);
    $('#less').onclick = () => set(t.hideLevel - 10);
    $('#lvl').oninput = e => set(+e.target.value);
    $('#hint').onchange = draw;
    $('#reshuffle').onclick = () => { t.hideSeed = (t.hideSeed || 0) + 1; save(); go('practice'); };
    $('#rd').addEventListener('click', e => { const w = e.target.closest('.w.clickable'); if (w) { const i = +w.dataset.w; peeks.has(i) ? peeks.delete(i) : peeks.add(i); draw(); } });
    $('#rate').onclick = () => {
      const hidden = ws.filter(w => rank.get(w) < t.hideLevel / 100).length;
      const score = hidden ? (hidden - [...peeks].length) / hidden * (0.4 + 0.6 * t.hideLevel / 100) : 0.3;
      ctx.finish(score, `${peeks.size} peek${peeks.size === 1 ? '' : 's'} at ${t.hideLevel}% hidden.`);
    };
    draw();
  },

  // --- Type first letters ---
  type(ctx) { typingMode(ctx, false); },
  typefull(ctx) { typingMode(ctx, true); },

  // --- Line flashcards ---
  lines(ctx) {
    const { P, scope, stage } = ctx;
    const lines = scopeLines(scope).filter(l => l.wordIdx.length);
    let i = 0, got = 0, shown = false;
    const lineHtml = (l, cls = '') => l.tokens.map(tk => tk.sep != null ? esc(tk.sep) : `<span class="w ${cls}"><span class="first">${esc(P.words[tk.w].s[0])}</span><span class="rest">${esc(P.words[tk.w].s.slice(1))}</span></span>`).join('');
    const draw = () => {
      if (i >= lines.length) { stage.innerHTML = ''; return ctx.finish(got / lines.length, `${got} of ${lines.length} lines recalled.`); }
      const cue = i ? lines[i - 1] : null;
      stage.innerHTML = `<div class="flash">
        <div class="row"><span class="sub" style="margin:0">Line ${i + 1} of ${lines.length} · ✓ ${got}</span><span class="spacer"></span>
          <label class="row" style="gap:4px;font-size:14px"><input type="checkbox" id="hint" ${DB.settings.typeHints ? 'checked' : ''}> First-letter hint</label>
          <button class="btn small" id="say">🔊</button></div>
        <div class="progress"><div style="width:${i / lines.length * 100}%"></div></div>
        <div class="reading">
          <div class="cue">${cue ? lineHtml(cue) : '<i>(Beginning)</i> — ' + esc(ctx.t.title)}</div>
          <div class="para-gap"></div>
          <div class="answer ${shown ? '' : DB.settings.typeHints ? '' : 'blank'}">${shown ? lineHtml(lines[i], 'revealed') : DB.settings.typeHints ? lineHtml(lines[i], 'initial') : 'What comes next? Say it, then reveal.'}</div>
        </div>
        <div class="row" style="justify-content:center">${shown
          ? `<button class="btn" id="miss" style="color:var(--bad)">✗ Missed it <span class="kbd">1</span></button><button class="btn primary" id="hit">✓ Got it <span class="kbd">2</span></button>`
          : `<button class="btn primary" id="reveal">Reveal <span class="kbd">Space</span></button>`}</div></div>`;
      $('#hint').onchange = e => { DB.settings.typeHints = e.target.checked; save(); draw(); };
      $('#say').onclick = () => speak((cue ? cue.text + '. ' : '') + (shown ? lines[i].text : ''));
      $('#reveal')?.addEventListener('click', reveal);
      $('#hit')?.addEventListener('click', () => grade(true));
      $('#miss')?.addEventListener('click', () => grade(false));
    };
    const reveal = () => { shown = true; draw(); if (DB.settings.autoSpeakLines) speak(lines[i].text); };
    const grade = ok => { if (ok) got++; i++; shown = false; draw(); };
    setKeyHandler(e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space' && !shown && i < lines.length) { e.preventDefault(); reveal(); }
      else if (shown && e.key === '1') grade(false); else if (shown && e.key === '2') grade(true);
    });
    draw();
  },

  // --- Unscramble lines ---
  scramble(ctx) {
    const { scope, stage } = ctx;
    const lines = scopeLines(scope).filter(l => l.wordIdx.length).map((l, i) => ({ text: l.text, i }));
    if (lines.length < 2) { stage.innerHTML = '<div class="card">This part has only one line. Choose the whole text or a larger part to unscramble.</div>'; return; }
    // Long texts are done in chunks of 8 lines.
    const CH = 8; let chunkStart = 0, next = 0, mistakes = 0, pool = [];
    const newChunk = () => { pool = shuffle(lines.slice(chunkStart, chunkStart + CH)); };
    const draw = () => {
      const placed = lines.slice(0, next);
      stage.innerHTML = `<div class="sub">Placed ${next} of ${lines.length} · mistakes ${mistakes}</div>
        <div class="reading" style="margin-bottom:14px">${placed.length ? placed.map(l => `<div class="line placed">${esc(l.text)}</div>`).join('') : '<span class="sub">Pick the first line below…</span>'}</div>
        <div class="scramble-list">${pool.map(l => `<button class="scramble-item" data-i="${l.i}">${esc(l.text)}</button>`).join('')}</div>`;
      $$('.scramble-item', stage).forEach(b => b.onclick = () => {
        const li = +b.dataset.i;
        if (lines[next].text === lines[li].text) {
          pool = pool.filter(p => p.i !== li); next++;
          if (next >= lines.length) { stage.innerHTML = `<div class="reading">${lines.map(l => `<div class="line placed">${esc(l.text)}</div>`).join('')}</div>`; return ctx.finish(Math.max(0, 1 - mistakes / lines.length), `${mistakes} mistake${mistakes === 1 ? '' : 's'}.`); }
          if (!pool.length) { chunkStart += CH; newChunk(); }
          draw();
        } else { mistakes++; b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); $('.sub', stage).textContent = `Placed ${next} of ${lines.length} · mistakes ${mistakes}`; }
      });
    };
    newChunk(); draw();
  },

  // --- Fill in the blank quiz ---
  quiz(ctx) {
    const { P, scope, stage } = ctx;
    const ws = scopeWords(scope);
    const candidates = ws.filter(w => P.words[w].n.length > 2);
    const pickFrom = candidates.length >= 4 ? candidates : ws;
    const N = Math.min(10, pickFrom.length);
    const qs = shuffle(pickFrom).slice(0, N).sort((a, b) => a - b);
    const vocab = [...new Set(P.words.map(w => w.s.toLowerCase()))];
    let qi = 0, right = 0;
    const draw = () => {
      if (qi >= qs.length) { stage.innerHTML = ''; return ctx.finish(right / qs.length, `${right} of ${qs.length} correct.`); }
      const target = qs[qi], tw = P.words[target];
      const lines = scopeLines(scope); const line = lines.find(l => l.wordIdx.includes(target));
      const idx = lines.indexOf(line);
      const ctxLines = [lines[idx - 1], line].filter(Boolean);
      const distract = shuffle(vocab.filter(v => norm(v) !== tw.n)).sort((a, b) => Math.abs(a.length - tw.s.length) - Math.abs(b.length - tw.s.length)).slice(0, 8);
      const opts = shuffle([tw.s, ...shuffle(distract).slice(0, 3)]);
      stage.innerHTML = `<div class="flash"><div class="sub" style="margin:0">Question ${qi + 1} of ${qs.length} · ✓ ${right}</div>
        <div class="progress"><div style="width:${qi / qs.length * 100}%"></div></div>
        <div class="reading">${ctxLines.map(l => `<div class="line ${l === line ? '' : 'cue'}">${l.tokens.map(tk => tk.sep != null ? esc(tk.sep) : tk.w === target ? '<span class="blank-slot">?</span>' : esc(P.words[tk.w].s)).join('')}</div>`).join('')}
          <div class="quiz-opts">${opts.map((o, k) => `<button class="btn" data-o="${esc(o)}"><span class="kbd">${k + 1}</span> ${esc(o)}</button>`).join('')}</div></div></div>`;
      let answered = false;
      const answer = (btn) => {
        if (answered) return; answered = true;
        const ok = norm(btn.dataset.o) === tw.n; if (ok) right++;
        btn.classList.add(ok ? 'right' : 'wrong');
        $$('.quiz-opts .btn', stage).forEach(b => { if (norm(b.dataset.o) === tw.n) b.classList.add('right'); });
        $('.blank-slot', stage).textContent = tw.s;
        setTimeout(() => { qi++; draw(); }, ok ? 700 : 1600);
      };
      $$('.quiz-opts .btn', stage).forEach(b => b.onclick = () => answer(b));
      stage._answer = (k) => { const b = $$('.quiz-opts .btn', stage)[k]; b && answer(b); };
    };
    setKeyHandler(e => { if (/^[1-4]$/.test(e.key) && stage._answer) stage._answer(+e.key - 1); });
    draw();
  },

  // --- Recite & record ---
  async recite(ctx) {
    const { t, stage } = ctx;
    stage.innerHTML = `<div class="toolbar">
        <button class="btn primary" id="rec">● Start recording</button>
        <span id="recstat" class="row" style="gap:6px"></span>
        <label class="row" style="gap:4px"><input type="checkbox" id="peek"> Show text</label>
        <label class="row" style="gap:4px"><input type="checkbox" id="peekI" checked> Show first letters</label>
        <button class="btn" id="model">🔊 Hear it read</button>
        <span class="spacer"></span><button class="btn" id="grade">Grade my recitation</button></div>
      <div id="rd"></div>
      <h2>Your recordings</h2><div class="rec-list" id="recs"></div>`;
    const drawText = () => {
      const peek = $('#peek').checked, ini = $('#peekI').checked;
      $('#rd').innerHTML = renderReading(ctx, () => peek ? '' : ini ? 'initial' : 'masked');
    };
    $('#peek').onchange = drawText; $('#peekI').onchange = drawText; drawText();
    $('#model').onclick = () => speak(scopeLines(ctx.scope).map(l => l.text).join('\n'));
    const urls = [];
    cleanup.push(() => urls.forEach(u => URL.revokeObjectURL(u)));
    const drawRecs = async () => {
      const recs = await Rec.list(t.id);
      $('#recs').innerHTML = recs.length ? recs.map(r => { const u = URL.createObjectURL(r.blob); urls.push(u);
        return `<div class="card rec-item"><div style="min-width:170px"><b>${esc(r.scope)}</b><div class="sub" style="margin:0">${new Date(r.created).toLocaleString()} · ${fmtMin(r.seconds)}</div></div>
          <audio controls src="${u}" style="flex:1"></audio><button class="btn small danger" data-del="${r.id}">🗑</button></div>`; }).join('')
        : '<div class="sub">No recordings yet. Record yourself reciting, then listen back while following the text.</div>';
      $$('[data-del]', stage).forEach(b => b.onclick = async () => { await Rec.del(b.dataset.del); drawRecs(); });
    };
    drawRecs();
    let mr = null, chunks = [], recStart = 0, timer;
    const stopRec = () => { if (mr && mr.state !== 'inactive') mr.stop(); };
    cleanup.push(() => { clearInterval(timer); stopRec(); });
    $('#rec').onclick = async () => {
      if (mr && mr.state === 'recording') return stopRec();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mr = new MediaRecorder(stream); chunks = [];
        mr.ondataavailable = e => chunks.push(e.data);
        mr.onstop = async () => {
          stream.getTracks().forEach(tr => tr.stop()); clearInterval(timer);
          const secs = (Date.now() - recStart) / 1000;
          await Rec.add({ id: uid(), textId: t.id, created: Date.now(), seconds: secs, scope: ctx.scope.label, blob: new Blob(chunks, { type: mr.mimeType || 'audio/webm' }) });
          logActivity(0, false);
          if ($('#rec')) { $('#rec').textContent = '● Start recording'; $('#recstat').innerHTML = ''; drawRecs(); toast('Recording saved'); }
        };
        mr.start(); recStart = Date.now();
        $('#rec').textContent = '■ Stop recording';
        timer = setInterval(() => { const s = $('#recstat'); if (s) s.innerHTML = `<span class="rec-dot"></span> ${Math.floor((Date.now() - recStart) / 1000)}s`; }, 250);
      } catch (e) { toast('Microphone not available: ' + e.message, 4000); }
    };
    $('#grade').onclick = () => selfGrade(ctx, null);
  }
};

// Self-assessment dialog for modes without automatic scoring.
function selfGrade(ctx, hintScore) {
  modal(`<h2>How well did you know it?</h2>
    <div class="sub">Be honest — this sets when the text comes back for review.</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${[[1, '😣 Couldn\'t recall most of it'], [0.6, '😐 Needed several hints'], [0.85, '🙂 A few slips'], [1.0001, '😎 Perfect, word for word']].map(([v, l]) =>
        `<button class="btn" data-v="${v}" style="justify-content:flex-start">${l}</button>`).join('')}
    </div>`, (m, close) => {
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-v]'); if (!b) return; close();
      let v = +b.dataset.v; if (v === 1) v = 0.25; if (v > 1) v = 1;
      ctx.stage.innerHTML = ''; ctx.finish(v, '');
    });
  });
}

// Shared typing engine for "Type Initials" and "Type Words".
function typingMode(ctx, full) {
  const { P, scope, stage } = ctx;
  const ws = scopeWords(scope);
  const st = new Map(); // word -> 'ok' | 'err'
  let pos = 0, mistakes = 0, wrongHere = 0, hintOn = DB.settings.typeHints;
  stage.innerHTML = `<div class="toolbar">
      <label class="row" style="gap:4px"><input type="checkbox" id="hint" ${hintOn ? 'checked' : ''}> Show first-letter hints</label>
      <button class="btn" id="giveup">💡 Reveal word <span class="kbd">${full ? 'Tab' : '?'}</span></button>
      <button class="btn" id="restart">↻ Restart</button>
      <span class="spacer"></span><span class="sub" style="margin:0">${full ? 'Type each word, then Space' : 'Type the first letter of each word'}</span></div>
    ${full ? '<input id="tin" class="" style="width:100%;font-size:20px;margin-bottom:12px" placeholder="Type here…" autocomplete="off" spellcheck="false">' : ''}
    <div id="rd" tabindex="0" style="outline:none"></div>
    <div class="stats-bar"><span>Progress <b id="sp">0</b>/${ws.length}</span><span>Mistakes <b id="sm">0</b></span><span>Accuracy <b id="sa">100%</b></span></div>`;
  const draw = () => {
    $('#rd').innerHTML = renderReading(ctx, w => {
      const i = ws.indexOf(w);
      if (st.has(w)) return st.get(w);
      return 'future' + (hintOn ? ' hint' : '') + (i === pos ? ' cur' : '');
    });
    $('#sp').textContent = pos; $('#sm').textContent = mistakes;
    $('#sa').textContent = Math.round(Math.max(0, pos - [...st.values()].filter(v => v === 'err').length) / Math.max(1, pos) * 100) + '%';
    $('.w.cur', stage)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  const advance = (res) => {
    st.set(ws[pos], res); pos++; wrongHere = 0;
    if (pos >= ws.length) {
      draw(); const errs = [...st.values()].filter(v => v === 'err').length;
      ctx.finish(Math.max(0, (ws.length - errs - Math.max(0, mistakes - errs) * 0.25) / ws.length), `${errs} word${errs === 1 ? '' : 's'} missed, ${mistakes} wrong key${mistakes === 1 ? '' : 's'}.`);
      return true;
    }
    draw(); return false;
  };
  const wrong = () => {
    mistakes++; wrongHere++;
    const cur = $('.w.cur', stage); cur?.classList.add('err'); setTimeout(() => cur?.classList.remove('err'), 250);
    if (wrongHere >= 3) advance('err'); else { $('#sm').textContent = mistakes; }
  };
  $('#hint').onchange = e => { hintOn = e.target.checked; DB.settings.typeHints = hintOn; save(); draw(); };
  $('#restart').onclick = () => go('practice');
  $('#giveup').onclick = () => { if (pos < ws.length) { mistakes++; advance('err'); } (full ? $('#tin') : $('#rd')).focus(); };

  if (!full) {
    setKeyHandler(e => {
      if (pos >= ws.length || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') return;
      if (e.key === '?') { e.preventDefault(); mistakes++; advance('err'); return; }
      const k = norm(e.key); if (k.length !== 1) return;
      e.preventDefault();
      if (k === P.words[ws[pos]].n[0]) advance(wrongHere ? 'err' : 'ok'); else wrong();
    });
    $('#rd').focus();
  } else {
    const tin = $('#tin');
    const check = (final) => {
      const typed = norm(tin.value); if (!typed) return;
      const target = P.words[ws[pos]].n;
      const ok = DB.settings.strictTyping ? tin.value.trim() === P.words[ws[pos]].s : typed === target;
      if (ok) { tin.value = ''; advance(wrongHere ? 'err' : 'ok'); }
      else if (final) { wrong(); tin.select(); }
    };
    tin.addEventListener('input', () => { if (/\s$/.test(tin.value)) check(true); });
    tin.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); check(true); }
      if (e.key === 'Tab') { e.preventDefault(); if (pos < ws.length) { mistakes++; tin.value = ''; advance('err'); } }
    });
    tin.focus();
  }
  draw();
}

// ---------- Review ----------
function viewReview(main) {
  const due = dueTexts().sort((a, b) => a.nextReview.localeCompare(b.nextReview));
  const fresh = DB.texts.filter(t => !t.nextReview);
  const upcoming = DB.texts.filter(t => t.nextReview && !isDue(t)).sort((a, b) => a.nextReview.localeCompare(b.nextReview)).slice(0, 10);
  const row = (t, extra) => `<tr><td><b>${esc(t.title)}</b></td><td>${t.mastery}%</td><td>${extra}</td>
    <td style="text-align:right"><button class="btn small" data-go="${t.id}" data-m="type">Test</button> <button class="btn small" data-go="${t.id}" data-m="hide">Hide words</button></td></tr>`;
  main.innerHTML = `<h1>Review</h1><div class="sub">Spaced repetition brings each text back right before you'd forget it. Keep your streak alive!</div>
    ${due.length ? `<button class="btn primary" id="start">▶ Start review (${due.length} due)</button>` : '<div class="card">🎉 Nothing due right now. Great work!</div>'}
    ${due.length ? `<h2>Due now</h2><div class="card"><table class="list"><tr><th>Text</th><th>Mastery</th><th>Due</th><th></th></tr>${due.map(t => row(t, daysBetween(t.nextReview, todayKey()) > 0 ? `${daysBetween(t.nextReview, todayKey())} days overdue` : 'Today')).join('')}</table></div>` : ''}
    ${fresh.length ? `<h2>Not started</h2><div class="card"><table class="list"><tr><th>Text</th><th>Mastery</th><th></th><th></th></tr>${fresh.map(t => row(t, '')).join('')}</table></div>` : ''}
    ${upcoming.length ? `<h2>Coming up</h2><div class="card"><table class="list"><tr><th>Text</th><th>Mastery</th><th>Next review</th><th></th></tr>${upcoming.map(t => row(t, fmtDate(t.nextReview))).join('')}</table></div>` : ''}`;
  $('#start')?.addEventListener('click', () => go('practice', { textId: due[0].id, mode: 'type', scope: 'all', cumulative: false }));
  $$('[data-go]', main).forEach(b => b.onclick = () => go('practice', { textId: b.dataset.go, mode: b.dataset.m, scope: 'all', cumulative: false }));
}

// ---------- Progress / stats ----------
function viewStats(main) {
  const totalSec = Object.values(DB.activity).reduce((a, d) => a + d.seconds, 0);
  const sessions = DB.texts.reduce((a, t) => a + t.sessions.length, 0);
  const mastered = DB.texts.filter(t => t.mastery >= 90).length;
  const wordsMastered = DB.texts.reduce((a, t) => a + Math.round(wordCount(t.body) * t.mastery / 100), 0);
  const days = [...Array(30)].map((_, i) => addDays(todayKey(), i - 29));
  const maxS = Math.max(60, ...days.map(d => DB.activity[d]?.seconds || 0));
  const allSessions = DB.texts.flatMap(t => t.sessions.map(s => ({ ...s, title: t.title }))).sort((a, b) => b.ts - a.ts).slice(0, 15);
  const modeCounts = {}; DB.texts.forEach(t => t.sessions.forEach(s => modeCounts[s.mode] = (modeCounts[s.mode] || 0) + 1));
  main.innerHTML = `<h1>Progress</h1><div class="sub">Every minute counts.</div>
    <div class="kpis">
      <div class="card kpi"><div class="v">🔥 ${streak()}</div><div class="l">Current streak (best ${bestStreak()})</div></div>
      <div class="card kpi"><div class="v">${fmtMin(totalSec)}</div><div class="l">Total practice time</div></div>
      <div class="card kpi"><div class="v">${sessions}</div><div class="l">Sessions completed</div></div>
      <div class="card kpi"><div class="v">${mastered}/${DB.texts.length}</div><div class="l">Texts mastered (90%+)</div></div>
      <div class="card kpi"><div class="v">${wordsMastered}</div><div class="l">Words known by heart</div></div>
      <div class="card kpi"><div class="v">${dueTexts().length}</div><div class="l">Due for review</div></div>
    </div>
    <h2>Last 30 days</h2>
    <div class="card"><div class="chart">${days.map(d => { const s = DB.activity[d]?.seconds || 0; return `<div class="bar ${s ? '' : 'zero'}" style="height:${Math.max(2, s / maxS * 100)}%" title="${fmtDate(d)}: ${fmtMin(s)}"></div>`; }).join('')}</div>
      <div class="chart-labels">${days.map((d, i) => `<span>${i % 5 === 4 ? +d.slice(8) : ''}</span>`).join('')}</div>
      <div class="sub" style="margin:8px 0 0">Daily goal: ${DB.settings.dailyGoal} min · goal met on ${days.filter(d => (DB.activity[d]?.seconds || 0) >= DB.settings.dailyGoal * 60).length} of the last 30 days</div></div>
    <h2>Mastery by text</h2>
    <div class="card"><table class="list">${DB.texts.slice().sort((a, b) => b.mastery - a.mastery).map(t => `<tr><td>${esc(t.title)}</td><td style="width:50%"><div class="progress"><div style="width:${t.mastery}%"></div></div></td><td>${t.mastery}%</td></tr>`).join('') || '<tr><td>No texts</td></tr>'}</table></div>
    <h2>Favorite practice modes</h2>
    <div class="card">${Object.entries(modeCounts).sort((a, b) => b[1] - a[1]).map(([m, c]) => `<span class="tag" style="margin-right:6px">${esc(MODES[m]?.label || m)} × ${c}</span>`).join('') || '<span class="sub">No sessions yet</span>'}</div>
    <h2>Recent activity</h2>
    <div class="card"><table class="list"><tr><th>Date</th><th>Text</th><th>Mode</th><th>Score</th></tr>
      ${allSessions.map(s => `<tr><td>${fmtDate(s.date)}</td><td>${esc(s.title)}</td><td>${esc(MODES[s.mode]?.label || s.mode)}</td><td>${s.score}%</td></tr>`).join('') || '<tr><td colspan=4 class="sub">Nothing yet</td></tr>'}</table></div>`;
}

// ---------- Settings ----------
function viewSettings(main) {
  const S = DB.settings;
  const voices = voicesCache;
  main.innerHTML = `<h1>Settings</h1><div class="sub">Changes save automatically.</div>
  <div class="settings">
    <div class="card setting"><div><b>Theme</b><div class="desc">Light, dark, sepia or follow Windows</div></div>
      <select id="theme">${['system', 'light', 'dark', 'sepia'].map(v => `<option ${S.theme === v ? 'selected' : ''} value="${v}">${v[0].toUpperCase() + v.slice(1)}</option>`).join('')}</select></div>
    <div class="card setting"><div><b>Text size</b><div class="desc">Size of the text while practicing</div></div>
      <div class="row"><input type="range" id="fs" min="14" max="40" value="${S.fontSize}"><span id="fsv">${S.fontSize}px</span></div></div>
    <div class="card setting"><div><b>Split texts into parts by</b><div class="desc">How texts are broken into parts for practice</div></div>
      <select id="split">${[['paragraph', 'Blank lines (stanzas/paragraphs)'], ['sentence', 'Sentences'], ['lines4', 'Every 4 lines'], ['line', 'Every line']].map(([v, l]) => `<option value="${v}" ${S.split === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="card setting"><div><b>Reading voice</b><div class="desc">Voice used for Listen (uses the voices installed in Windows)</div></div>
      <select id="voice" style="max-width:260px"><option value="">Default</option>${voices.map(v => `<option ${S.ttsVoice === v.name ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></div>
    <div class="card setting"><div><b>Reading speed</b></div><div class="row"><input type="range" id="rate" min="0.5" max="1.6" step="0.1" value="${S.ttsRate}"><span id="ratev">${S.ttsRate}×</span><button class="btn small" id="testv">Test</button></div></div>
    <div class="card setting"><div><b>Speak lines when revealed</b><div class="desc">In Line Cards, read each line aloud on reveal</div></div><input type="checkbox" id="asl" ${S.autoSpeakLines ? 'checked' : ''}></div>
    <div class="card setting"><div><b>Strict typing</b><div class="desc">In Type Words, require exact capitalization and punctuation</div></div><input type="checkbox" id="strict" ${S.strictTyping ? 'checked' : ''}></div>
    <div class="card setting"><div><b>Daily goal</b><div class="desc">Minutes of practice per day</div></div><input type="number" id="goal" min="1" max="240" value="${S.dailyGoal}" style="width:80px"></div>
    <div class="card setting"><div><b>Daily reminder</b><div class="desc">Desktop notification when reviews are due (while Memo is open or minimized)</div></div><input type="time" id="rem" value="${S.reminderTime}"></div>
    <div class="card setting"><div><b>Backup</b><div class="desc">Save or restore your whole library (texts, progress, settings)</div></div>
      <div class="row"><button class="btn" id="bk">⬇ Back up</button><button class="btn" id="rs">⬆ Restore</button></div></div>
    <div class="card setting"><div><b>Reset</b><div class="desc">Clear progress, or erase everything</div></div>
      <div class="row"><button class="btn" id="rp">Reset progress</button><button class="btn danger" id="wipe">Erase all</button></div></div>
  </div>`;
  const set = (k, v) => { S[k] = v; save(); applyTheme(); updateSidebar(); };
  $('#theme').onchange = e => set('theme', e.target.value);
  $('#fs').oninput = e => { set('fontSize', +e.target.value); $('#fsv').textContent = e.target.value + 'px'; };
  $('#split').onchange = e => set('split', e.target.value);
  $('#voice').onchange = e => set('ttsVoice', e.target.value);
  $('#rate').oninput = e => { set('ttsRate', +e.target.value); $('#ratev').textContent = e.target.value + '×'; };
  $('#testv').onclick = () => speak('This is how your texts will sound.');
  $('#asl').onchange = e => set('autoSpeakLines', e.target.checked);
  $('#strict').onchange = e => set('strictTyping', e.target.checked);
  $('#goal').onchange = e => set('dailyGoal', clamp(+e.target.value || 10, 1, 240));
  $('#rem').onchange = e => { set('reminderTime', e.target.value); if (e.target.value && 'Notification' in window) Notification.requestPermission(); };
  $('#bk').onclick = backup; $('#rs').onclick = restore;
  $('#rp').onclick = async () => {
    if (!await confirmBox('Reset all progress? Your texts are kept.', 'Reset', true)) return;
    DB.texts.forEach(t => Object.assign(t, { mastery: 0, hideLevel: 0, interval: 0, ease: 2.5, nextReview: null, lastPracticed: null, sessions: [], sectionMastery: {} }));
    DB.activity = {}; save(); toast('Progress reset'); go('settings');
  };
  $('#wipe').onclick = async () => {
    if (!await confirmBox('Erase ALL texts, recordings and progress?', 'Erase everything', true)) return;
    DB = { texts: [], settings: { ...DEFAULT_SETTINGS }, activity: {}, reminded: '' }; save(); await Rec.clear(); applyTheme(); toast('Everything erased'); go('library');
  };
}
async function backup() {
  const r = await saveFile(`memo-backup-${todayKey()}.json`, JSON.stringify({ app: 'memo', version: 1, ...DB }, null, 1), [{ name: 'Memo backup', extensions: ['json'] }]);
  if (r) toast('Backup saved');
}
async function restore() {
  const [f] = await pickFiles([{ name: 'Memo backup', extensions: ['json'] }], false, '.json');
  if (!f) return;
  try {
    const d = JSON.parse(f.content); if (!Array.isArray(d.texts)) throw new Error('Not a Memo backup');
    const merge = await confirmBox(`Restore ${d.texts.length} texts? Choose OK to replace your current library.`, 'Replace library', true);
    if (!merge) return;
    DB = { texts: d.texts.map(t => ({ ...newText(), ...t })), settings: { ...DEFAULT_SETTINGS, ...d.settings }, activity: d.activity || {}, reminded: '' };
    save(); applyTheme(); toast('Library restored'); go('library');
  } catch (e) { toast('Could not restore: ' + e.message, 4000); }
}

// ---------- Help ----------
function viewHelp(main) {
  main.innerHTML = `<div class="help" style="max-width:780px"><h1>How to use Memo</h1>
  <p>Memo helps you learn poems, speeches, scripture, lines for a play, songs you wrote, vocabulary — anything — word for word.</p>
  <h2>1. Add a text</h2><p>Click <b>＋ New text</b>, paste your text, and leave a blank line between stanzas or paragraphs. Each block becomes a <b>part</b> you can learn one at a time. You can also import <span class="kbd">.txt</span> files (Ctrl+O).</p>
  <h2>2. Learn it in steps</h2><ol>
    <li><b>📖 Read & Listen</b> — read along while it's spoken. Click a word to start from there. Turn on <i>Repeat</i> or <i>Line by line</i>.</li>
    <li><b>🔤 First Letters</b> — only first letters are shown. Recite and click words to check.</li>
    <li><b>🙈 Hide Words</b> — hide 10%, 20%… 100% of the words. Use <b>Hide more</b> as you improve.</li>
    <li><b>❓ Fill the Blank</b> and <b>🔀 Unscramble</b> — quick games to strengthen recall and order.</li>
    <li><b>🃏 Line Cards</b> — see one line, recall the next, then grade yourself (<span class="kbd">Space</span>, <span class="kbd">1</span>, <span class="kbd">2</span>).</li>
    <li><b>⌨ Type Initials</b> — the classic test: type the first letter of each word from memory. Press <span class="kbd">?</span> to reveal a word.</li>
    <li><b>✍ Type Words</b> — type every word in full.</li>
    <li><b>🎙 Recite & Record</b> — record yourself reciting, then play it back while following the text.</li></ol>
  <h2>3. Part by part</h2><p>Pick a part at the top of the practice screen. Tick <b>Build up</b> to practice parts 1 through N together — the best way to stitch a long text together.</p>
  <h2>4. Review & streaks</h2><p>Every graded session updates the text's <b>mastery</b> and schedules the next <b>review</b> using spaced repetition. Visit <b>⏰ Review</b> daily, keep your 🔥 streak, and set a daily goal and reminder in Settings.</p>
  <h2>Keyboard shortcuts</h2><p><span class="kbd">Ctrl+N</span> new text · <span class="kbd">Ctrl+O</span> import · <span class="kbd">Ctrl + / −</span> zoom · <span class="kbd">F11</span> full screen</p>
  <h2>Your data</h2><p>Everything is stored privately on this computer. Use <b>Settings → Back up</b> to save a copy or move it to another PC.</p></div>`;
}

// ---------- reminders ----------
function checkReminder() {
  const r = DB.settings.reminderTime; if (!r || !('Notification' in window)) return;
  const now = new Date(); const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (hm >= r && DB.reminded !== todayKey()) {
    DB.reminded = todayKey(); save();
    const due = dueTexts().length;
    const sec = DB.activity[todayKey()]?.seconds || 0;
    if (due || sec < DB.settings.dailyGoal * 60) {
      const n = new Notification('Memo', { body: due ? `${due} text${due > 1 ? 's are' : ' is'} ready for review. Keep your ${streak()}-day streak going!` : `Time to practice — ${DB.settings.dailyGoal} minutes keeps your streak alive.` });
      n.onclick = () => go('review');
    }
  }
}

// ---------- boot ----------
$$('.nav-btn').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
window.native?.onMenu(a => ({ new: () => go('edit', { textId: null }), import: importTxt, backup, restore, help: () => go('help') })[a]?.());
window.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key.toLowerCase() === 'n' && !window.native) { e.preventDefault(); go('edit', { textId: null }); }
  if (e.key === 'Escape' && $('#modal-root').innerHTML) $('#modal-root').innerHTML = '';
});
setInterval(checkReminder, 30000); setTimeout(checkReminder, 3000);
setInterval(updateSidebar, 60000);
applyTheme();
go('library');
