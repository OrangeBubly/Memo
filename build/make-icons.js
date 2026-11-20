// Renders build/icon.svg to PNGs and packs a multi-size Windows .ico.
// Usage: node build/make-icons.js   (needs Playwright's Chromium)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const dir = __dirname;
const svg = fs.readFileSync(path.join(dir, 'icon.svg'), 'utf8');
const SIZES = [16, 24, 32, 48, 64, 128, 256];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pngs = {};
  for (const s of [...SIZES, 512]) {
    await page.setViewportSize({ width: s, height: s });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${s}" height="${s}" `)}</body></html>`);
    pngs[s] = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: s, height: s } });
  }
  await browser.close();
  fs.writeFileSync(path.join(dir, 'icon.png'), pngs[512]);
  fs.writeFileSync(path.join(dir, 'icon-256.png'), pngs[256]);

  // ICO container with embedded PNG images (supported since Windows Vista).
  const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(SIZES.length, 4);
  const entries = []; const datas = []; let offset = 6 + 16 * SIZES.length;
  for (const s of SIZES) {
    const data = pngs[s]; const e = Buffer.alloc(16);
    e.writeUInt8(s >= 256 ? 0 : s, 0); e.writeUInt8(s >= 256 ? 0 : s, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(data.length, 8); e.writeUInt32LE(offset, 12);
    entries.push(e); datas.push(data); offset += data.length;
  }
  fs.writeFileSync(path.join(dir, 'icon.ico'), Buffer.concat([header, ...entries, ...datas]));
  console.log('wrote icon.png, icon-256.png, icon.ico');
})();
