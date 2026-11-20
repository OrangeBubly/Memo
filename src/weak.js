'use strict';
/* =========================================================================
   Memo — Weak Spots: remembers which words you miss in every mode and
   drills the lines you keep failing until they stick.
   Loaded before app.js; everything here is called at runtime only.
   ========================================================================= */

function bodySig(body) { let h = 0; for (const c of body) h = (h * 31 + c.charCodeAt(0)) | 0; return h + ':' + body.length; }

// Per-text record of misses (m) and hits (h) for each word index. Reset when the text is edited.
function weakData(t) {
  const sig = bodySig(t.body);
  if (!t.weak || t.weak.sig !== sig) t.weak = { sig, w: {}, cleared: 0 };
  return t.weak;
}
function markWord(t, wi, ok, weight = 1) {
  if (!t || wi == null) return;
  const d = weakData(t), r = d.w[wi] ||= { m: 0, h: 0 };
  if (ok) r.h += weight; else { r.m += weight; r.last = Date.now(); }
  save();
}
// How "weak" a word is: misses minus credit for later successes.
function wordWeakness(t, wi) { const r = weakData(t).w[wi]; return r ? Math.max(0, r.m - 0.6 * r.h) : 0; }
function lineWeakness(t, line) {
  if (!line.wordIdx.length) return 0;
  const ws = line.wordIdx.map(w => wordWeakness(t, w));
  const sum = ws.reduce((a, b) => a + b, 0);
  return Math.max(...ws) * 0.6 + sum / Math.sqrt(ws.length) * 0.4;
}
function lineMisses(t, line) { const d = weakData(t); return Math.round(line.wordIdx.reduce((a, w) => a + (d.w[w]?.m || 0), 0)); }

// The hardest lines in the current scope, returned in text order.
function hardLines(t, P, scope, max = 6) {
  return scope.secs.flatMap(s => s.lines).filter(l => l.wordIdx.length)
    .map(l => ({ line: l, score: lineWeakness(t, l), misses: lineMisses(t, l) }))
    .filter(x => x.score >= 0.9)
    .sort((a, b) => b.score - a.score).slice(0, max)
    .sort((a, b) => a.line.wordIdx[0] - b.line.wordIdx[0]);
}
function heatClass(t, wi) { const v = wordWeakness(t, wi); return v <= 0.2 ? '' : v < 1 ? 'heat1' : v < 2 ? 'heat2' : v < 3.5 ? 'heat3' : 'heat4'; }

// Banner shown on the text hub.
function weakBannerHtml(t, P, scope) {
  const hard = hardLines(t, P, scope);
  const tracked = Object.keys(weakData(t).w).length;
  if (!hard.length) return `<div class="weak-banner calm"><span class="wb-ic">🎯</span><div style="flex:1"><b>Weak Spots</b>
    <div class="sub" style="margin:0">${tracked ? 'No trouble spots right now — nice! Keep testing and any line you miss will show up here.' : 'Take a test or quiz and Memo will track the words you miss, so you can drill just the hard parts.'}</div></div>
    <button class="btn" data-weak>View heatmap</button></div>`;
  return `<div class="weak-banner"><span class="wb-ic">🎯</span><div style="flex:1"><b>${hard.length} weak spot${hard.length === 1 ? '' : 's'} to fix</b>
    <div class="sub" style="margin:0">“${esc(hard[0].line.text.slice(0, 70))}${hard[0].line.text.length > 70 ? '…' : ''}”${hard.length > 1 ? ` and ${hard.length - 1} more` : ''}</div></div>
    <button class="btn primary" data-weak>Drill weak spots →</button></div>`;
}

// ---------- The Weak Spots mode ----------
function weakMode(ctx) {
  const { t, P, scope, stage } = ctx;
  const hard = hardLines(t, P, scope);
  const allLines = P.sections.flatMap(s => s.lines);
  const d = weakData(t);

  // Intro: heatmap + list of hard lines
  stage.innerHTML = `
    <div class="card weak-intro">
      ${hard.length ? `<div class="row"><div><h2 style="margin:0">${hard.length} line${hard.length === 1 ? '' : 's'} you keep missing</h2>
          <div class="sub" style="margin:4px 0 0">You'll type each one from memory with the line before it as a cue. Miss it and it comes back until you get it.</div></div>
          <span class="spacer"></span><button class="btn primary" id="start">▶ Start drill</button></div>
        <div class="weak-list">${hard.map((h, i) => `<div class="weak-item"><span class="wi-n">${i + 1}</span><span class="wi-t">${esc(h.line.text)}</span>
          <span class="tag due">missed ${h.misses}×</span></div>`).join('')}</div>`
      : `<h2 style="margin:0">No weak spots ${Object.keys(d.w).length ? 'right now 🎉' : 'yet'}</h2>
         <div class="sub" style="margin:6px 0 12px">${Object.keys(d.w).length ? 'Everything you have missed before has since been answered correctly.' : 'Weak spots come from your mistakes in Type Initials, Type Words, Fill the Blank, Line Cards, Unscramble and peeks in Hide Words.'}</div>
         <button class="btn primary" id="totest">⌨ Take a Type Words test</button>`}
    </div>
    <h2>Heatmap <span class="sub" style="font-size:13px;font-weight:400">· darker = missed more often</span></h2>
    <div class="heat-legend"><span class="heat1">rarely</span><span class="heat2">sometimes</span><span class="heat3">often</span><span class="heat4">constantly</span>
      <span class="spacer"></span>${Object.keys(d.w).length ? '<button class="btn small" id="resetweak">Reset weak-spot data</button>' : ''}</div>
    ${renderReading(ctx, w => heatClass(t, w))}`;
  $('#totest')?.addEventListener('click', () => go('practice', { mode: 'typefull' }));
  $('#resetweak')?.addEventListener('click', async () => {
    if (!await confirmBox('Forget all tracked mistakes for this text?', 'Reset')) return;
    t.weak = null; save(); go('practice');
  });
  $('#start')?.addEventListener('click', () => drill());

  function drill() {
    const queue = hard.map(h => ({ ...h, attempts: 0, cleared: false }));
    const order = queue.slice();
    let done = 0;
    const next = () => {
      const item = queue.shift();
      if (!item) return finishDrill();
      item.attempts++;
      const li = allLines.indexOf(item.line), cue = allLines[li - 1];
      stage.innerHTML = `
        <div class="drill-head"><span class="sub" style="margin:0">Line ${done + 1} of ${order.length}${item.attempts > 1 ? ` · attempt ${item.attempts}` : ''}</span>
          <span class="spacer"></span><span class="sub" style="margin:0">${order.filter(o => o.cleared).length} cleared</span></div>
        <div class="progress" style="margin-bottom:18px"><div style="width:${order.filter(o => o.cleared).length / order.length * 100}%"></div></div>
        <div class="drill-cue">${cue ? `<span class="sub" style="margin:0">…after</span> ${esc(cue.text)}` : '<span class="sub" style="margin:0">This is the first line of the text.</span>'}</div>
        <div id="drillbox"></div>`;
      typingMode({
        t, P, stage: $('#drillbox'), scope: { secs: [{ lines: [item.line] }], label: 'Weak spot' },
        finish(score) {
          const perfect = score >= 0.999;
          if (perfect) { item.cleared = true; done++; d.cleared = (d.cleared || 0) + 1; save(); }
          else if (item.attempts < 3) queue.push(item);
          else done++;
          const fb = document.createElement('div');
          fb.className = 'drill-fb ' + (perfect ? 'ok' : 'bad');
          fb.innerHTML = perfect ? '✓ Nailed it' : item.attempts < 3 ? '✗ Not quite — study it, it will come back' : '✗ Moving on — keep this one in mind';
          $('#drillbox')?.prepend(fb);
          if (perfect) sfx('combo');
          setTimeout(next, perfect ? 900 : 2600);
        }
      }, true, { drill: true });
    };
    const finishDrill = () => {
      const cleared = order.filter(o => o.cleared);
      const score = order.reduce((a, o) => a + (o.cleared ? 1 / o.attempts : 0), 0) / order.length;
      stage.innerHTML = `<div class="weak-list">${order.map(o => `<div class="weak-item"><span class="wi-n">${o.cleared ? '✓' : '✗'}</span>
        <span class="wi-t">${esc(o.line.text)}</span><span class="tag ${o.cleared ? '' : 'due'}">${o.cleared ? (o.attempts === 1 ? 'first try' : `${o.attempts} tries`) : 'still weak'}</span></div>`).join('')}</div>`;
      ctx.finish(score, `Cleared ${cleared.length} of ${order.length} weak spot${order.length === 1 ? '' : 's'}.`, '', { weakCleared: cleared.length });
    };
    next();
  }
}
