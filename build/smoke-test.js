// End-to-end smoke test of the INSTALLED Windows app (run on a Windows machine / CI runner).
// Usage: node build/smoke-test.js "C:\path\to\Memo.exe"
// Drives the real app with Playwright, takes window + desktop screenshots, and checks
// that typing tests, full screen, data persistence and theming work.
const { _electron } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const exe = process.argv[2];
const OUT = path.join(__dirname, '..', 'smoke-shots');
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function desktopShot(name) { // whole Windows screen: real window frame, taskbar icon
  const file = path.join(OUT, name + '.png');
  const ps = `Add-Type -AssemblyName System.Windows.Forms,System.Drawing;
    $b=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp=New-Object System.Drawing.Bitmap $b.Width,$b.Height;
    $g=[System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.Location,[System.Drawing.Point]::Empty,$b.Size);
    $bmp.Save('${file.replace(/'/g, "''")}'); $g.Dispose(); $bmp.Dispose()`;
  try { execFileSync('powershell', ['-NoProfile', '-Command', ps], { timeout: 30000 }); console.log('desktop screenshot:', name); }
  catch (e) { console.log('desktop screenshot failed:', e.message.split('\n')[0]); }
}

async function launch() {
  const app = await _electron.launch({ executablePath: exe, args: process.argv.slice(3), timeout: 60000 }); // extra args: e.g. an app folder when testing an unpackaged build
  const win = await app.firstWindow();
  // Wait for the app itself to render, not Playwright's load events: those can be missed
  // when Electron finishes loading before Playwright attaches (a timing race seen on CI).
  await win.waitForSelector('#main .text-card, #main .empty', { timeout: 60000 });
  await sleep(800);
  return { app, win };
}
const shot = async (win, name) => { await win.evaluate(() => { document.querySelector('#modal-root').innerHTML = ''; const h = document.querySelector('#ach-host'); if (h) h.innerHTML = ''; document.querySelectorAll('canvas.confetti').forEach(c => c.style.display = 'none'); }); await sleep(300); await win.screenshot({ path: path.join(OUT, name + '.png') }); };

(async () => {
  let { app, win } = await launch();
  const info = await app.evaluate(({ app }) => ({ name: app.getName(), version: app.getVersion(), userData: app.getPath('userData'), electron: process.versions.electron }));
  console.log('app info:', JSON.stringify(info));
  check('App launches from installed Memo.exe', true, `${info.name} ${info.version}, Electron ${info.electron}`);
  check('Window title is Memo', (await win.title()) === 'Memo', await win.title());
  check('Sample texts are present', (await win.$$('.text-card')).length >= 3);
  check('Sidebar icon image loads', await win.evaluate(() => { const i = document.querySelector('.logo-img'); return i && i.complete && i.naturalWidth > 0; }));
  // Sound: recorded keyboard packs decode and play in the real Windows app
  await win.mouse.click(400, 300); await sleep(300);
  const snd = await win.evaluate(async () => {
    window.__played = 0; const st = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...a) { window.__played++; return st.apply(this, a); };
    const out = { setting: DB.settings.sound, state: null, decoded: {} };
    for (const k of ['clicky', 'studio', 'thock']) out.decoded[k] = ((await loadPack(k)) || []).length;
    for (let i = 0; i < 5; i++) keySound(); sfx('done');
    out.state = AC && AC.state; out.played = window.__played;
    return out;
  });
  check('Key sounds are on by default (recorded pack)', snd.setting === 'studio', snd.setting);
  check('Audio engine is running', snd.state === 'running', snd.state);
  check('All 3 recorded keyboard packs decode (10 samples each)', Object.values(snd.decoded).every(n => n === 10), JSON.stringify(snd.decoded));
  check('Key presses play recorded samples', snd.played >= 5, `${snd.played} sounds started`);
  await shot(win, '01-library');
  desktopShot('00-desktop-library');

  // Text screen
  await win.click('.text-card:has-text("Sonnet 18")'); await sleep(1300);
  check('Mode screen shows 3 columns', (await win.$$('.group')).length === 3);
  check('Mode screen shows 9 mode buttons', (await win.$$('.mode-tile')).length === 9);
  await shot(win, '02-text-hub');

  // Typing test (should go full screen on Windows)
  await win.click('[data-m=typefull]'); await sleep(1200);
  const fs1 = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen());
  check('Test mode goes full screen', fs1);
  check('Sidebar hidden during test', await win.evaluate(() => getComputedStyle(document.querySelector('#sidebar')).display === 'none'));
  const words = await win.evaluate(() => [...document.querySelectorAll('.tw')].map(w => w.textContent.replace(/[^\p{L}\p{N}]/gu, '')));
  for (let i = 0; i < 20; i++) {
    if (i === 2) { await win.keyboard.type('compxre', { delay: 25 }); for (let k = 0; k < 3; k++) await win.keyboard.press('Backspace'); await win.keyboard.type('are', { delay: 25 }); } // typo fixed before space
    else if (i === 6) await win.keyboard.type('sumner', { delay: 25 }); // wrong word, submitted
    else await win.keyboard.type(words[i], { delay: 25 });
    await win.keyboard.press('Space');
  }
  await sleep(500);
  const st = await win.evaluate(() => [...document.querySelectorAll('.tw')].slice(0, 20).map(w => w.className.includes('err') ? 'E' : '.').join(''));
  check('Fixed typo counts as correct; only the submitted wrong word is red', st === '......E.............', st + '  (E = marked wrong; word 3 had a fixed typo, word 7 was submitted wrong)');
  check('No per-letter red while typing a word', await win.evaluate(() => { const c = document.querySelector('.tw.cur'); return !c || !c.querySelector('.l.bad'); }));
  await shot(win, '03-typing-test');
  desktopShot('04-desktop-fullscreen-test');
  for (let i = 20; i < words.length; i++) { await win.keyboard.type(words[i], { delay: 8 }); if (i < words.length - 1) await win.keyboard.press('Space'); }
  await sleep(1800);
  const summary = await win.evaluate(() => document.querySelector('#donebox .sub')?.textContent || '');
  check('Test finishes with results', /1 word missed/.test(summary), summary.slice(0, 90));
  await shot(win, '05-test-results');
  await win.click('#hub'); await sleep(800);
  const fs2 = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen());
  check('Leaving the test exits full screen', !fs2);

  // Create a text + change theme, then restart and check both persisted
  await win.click('[data-view=library]'); await win.click('#new');
  await win.fill('#title', 'Smoke Test Poem'); await win.fill('#body', 'Roses grow by the garden wall,\nlistening to the evening call.');
  await win.click('#save'); await sleep(500);
  await win.click('[data-view=customize]'); await sleep(400); await win.click('[data-theme=midnight]'); await sleep(400);
  await win.click('[data-caret=block]'); await sleep(600);
  await shot(win, '06-customize');
  await win.click('[data-view=profile]'); await sleep(1300); await shot(win, '07-profile');
  await app.close(); await sleep(1500);

  ({ app, win } = await launch());
  check('Added text survives an app restart', (await win.$$('.text-card:has-text("Smoke Test Poem")')).length === 1);
  check('Theme survives an app restart', (await win.evaluate(() => document.documentElement.dataset.themeKey)) === 'midnight');
  check('XP / level survives an app restart', await win.evaluate(() => (DB.game?.xp || 0) > 0));
  await win.click('.text-card:has-text("Sonnet 18")'); await sleep(1300); await shot(win, '08-hub-midnight-after-restart');
  desktopShot('09-desktop-midnight');
  await win.click('[data-weak]'); await sleep(800); await shot(win, '10-weak-spots');
  await app.close();

  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ info, results }, null, 2));
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('SMOKE TEST CRASHED:', e); fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ crash: String(e), results }, null, 2)); process.exit(2); });
