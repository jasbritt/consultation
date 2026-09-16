/* =============================================================================
   version-assets.js — stamp a content hash onto every local CSS/JS reference.

   WHY THIS EXISTS
   A browser caches assets/js/ui.js and assets/css/site.css independently of the
   HTML that loads them. Change the markup and a script together and a returning
   visitor can end up running yesterday's JavaScript against today's HTML. That
   is not theoretical: removing the hero caption element while a cached ui.js
   still wrote to it threw "Cannot set properties of null", which killed the
   carousel — no photographs, dead dots — while stale CSS stacked the cards.

   Stamping the file's content hash into the URL makes the two move together: if
   the file changed, the URL changed, so the browser must fetch it.

   Run: node scripts/version-assets.js     (after changing anything in assets/)
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const hashOf = file =>
  crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 8);

const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
let stamped = 0, missing = [];

pages.forEach(page => {
  const file = path.join(ROOT, page);
  let html = fs.readFileSync(file, 'utf8');

  /* Matches href="assets/…css" and src="assets/…js", with or without an
     existing ?v= stamp, and leaves anything remote alone. Icons are
     deliberately excluded: a browser keys its favicon cache by site rather
     than by URL, so a stamp buys nothing, and Safari has been known not to
     fetch an icon that carries a query string at all. */
  html = html.replace(/(href|src)="(assets\/[^"?#]+\.(?:css|js))(\?v=[a-f0-9]+)?"/g,
    (whole, attr, assetPath) => {
      const onDisk = path.join(ROOT, assetPath);
      if (!fs.existsSync(onDisk)) { missing.push(`${page} -> ${assetPath}`); return whole; }
      stamped++;
      return `${attr}="${assetPath}?v=${hashOf(onDisk)}"`;
    });

  fs.writeFileSync(file, html);
});

console.log(`Stamped ${stamped} asset reference(s) across ${pages.length} page(s).`);
if (missing.length) {
  console.log('\nReferenced but not on disk:');
  missing.forEach(m => console.log('  ' + m));
  process.exit(1);
}
