/* =============================================================================
   make-graphics.js — render promo/graphics.html to PNGs at native sizes.
   Run: NODE_PATH=<playwright path> node scripts/make-graphics.js
   ========================================================================== */
const { chromium } = require('playwright');
const path = require('path');

const BOARDS = [
  { id: 'story',  file: 'ukya-consultation-story.png',  w: 1080, h: 1920 },
  { id: 'square', file: 'ukya-consultation-square.png', w: 1080, h: 1080 }
];

(async () => {
  const root = path.join(__dirname, '..');
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 2200 }, deviceScaleFactor: 1 })).newPage();
  await page.goto('file://' + path.join(root, 'promo', 'graphics.html'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  for (const b of BOARDS) {
    const el = await page.$('#' + b.id);
    const out = path.join(root, 'promo', b.file);
    await el.screenshot({ path: out });
    const box = await el.boundingBox();
    const ok = Math.round(box.width) === b.w && Math.round(box.height) === b.h;
    console.log(`${b.file}  ${Math.round(box.width)}x${Math.round(box.height)}  ${ok ? 'correct size' : 'WRONG SIZE'}`);
  }
  await browser.close();
})();
