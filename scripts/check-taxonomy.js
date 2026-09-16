/* =============================================================================
   check-taxonomy.js — keeps form/create-form.gs and assets/js/taxonomy.js honest.

   Google Apps Script cannot import from this repository, so the question content
   exists twice. If the two copies drift, the form still works and the website
   still loads — but columns stop matching and charts quietly empty out. This
   script compares the two, and then does the more important check: it builds the
   exact spreadsheet headers the form will produce and runs them through the real
   column matcher, in both the grid and the scale-item layouts.

   Run: node scripts/check-taxonomy.js
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const T = require('../assets/js/taxonomy.js');
const D = require('../assets/js/data.js');

const gs = fs.readFileSync(path.join(__dirname, '..', 'form', 'create-form.gs'), 'utf8');

let failures = 0;
const check = (ok, message, detail) => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${message}`);
  if (!ok) { failures++; if (detail) console.log(`        ${detail}`); }
};

/* Unescape the JavaScript string literals used in the .gs file. */
const unescapeJs = s => s
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/\\'/g, "'")
  .replace(/\\\\/g, '\\');

/* Pull a `var NAME = [ ... ];` array of single-quoted strings out of the file. */
function gsArray(name) {
  const m = gs.match(new RegExp(`var ${name} = \\[([\\s\\S]*?)\\];`));
  if (!m) return null;
  return (m[1].match(/'(?:[^'\\]|\\.)*'/g) || []).map(q => unescapeJs(q.slice(1, -1)));
}

function compare(label, fromGs, fromTaxonomy) {
  if (!fromGs) { check(false, `${label}: not found in create-form.gs`); return; }
  const missing = fromTaxonomy.filter(x => !fromGs.includes(x));
  const extra = fromGs.filter(x => !fromTaxonomy.includes(x));
  check(missing.length === 0 && extra.length === 0,
    `${label}: ${fromGs.length} option(s) identical in both files`,
    [missing.length ? `missing from create-form.gs: ${missing.join(' | ')}` : '',
     extra.length ? `only in create-form.gs: ${extra.join(' | ')}` : ''].filter(Boolean).join('  '));
}

console.log('\nContent mirrored between taxonomy.js and create-form.gs');
compare('Policy areas', gsArray('POLICY_AREAS'), T.POLICY_AREAS.map(a => a.label));
compare('Bring-back options', gsArray('REINTRODUCE_OPTIONS'), T.REINTRODUCE_OPTIONS.map(o => o.label));
compare('UK regions', gsArray('UK_REGIONS'), T.UK_REGIONS.map(r => r.label));
compare('Age bands', gsArray('AGE_BANDS'), T.AGE_BANDS.map(b => b.label));

/* ---- the headers the form will actually produce -------------------------- */
const batteryTitles = (gs.match(/title: '(?:[^'\\]|\\.)*'/g) || [])
  .map(t => unescapeJs(t.replace(/^title: '/, '').replace(/'$/, '')));

console.log('\nRating columns match, in grid layout');
check(batteryTitles.length === T.RATING_BATTERIES.length,
  `${batteryTitles.length} rating battery title(s) found in create-form.gs`);

batteryTitles.forEach((title, i) => {
  const expected = T.RATING_BATTERIES[i];
  const results = T.POLICY_AREAS.map(area => {
    const header = `${title} [${area.label}]`;                 // Google's grid header shape
    const hit = D.matchRatingColumn(header);
    return hit && hit.battery === expected.id && hit.area === area.id;
  });
  const bad = results.filter(r => !r).length;
  check(bad === 0, `"${expected.label}": all ${T.POLICY_AREAS.length} grid columns resolve correctly`,
    bad ? `${bad} column(s) did not resolve to the ${expected.id} battery` : '');
});

console.log('\nRating columns match, in scale-item layout (USE_GRID_FOR_RATINGS = false)');
batteryTitles.forEach((title, i) => {
  const expected = T.RATING_BATTERIES[i];
  const bad = T.POLICY_AREAS.filter(area => {
    const hit = D.matchRatingColumn(`${title} — ${area.label}`);
    return !hit || hit.battery !== expected.id || hit.area !== area.id;
  }).length;
  check(bad === 0, `"${expected.label}": all ${T.POLICY_AREAS.length} scale columns resolve correctly`);
});

/* ---- the non-rating questions -------------------------------------------- */
/* Page-break titles name a section of the form, not a question, so they never
   become a spreadsheet column — exclude them before checking coverage. */
const sectionTitles = (gs.match(/addPageBreakItem\(\)[\s\S]{0,60}?\.setTitle\('(?:[^'\\]|\\.)*'\)/g) || [])
  .map(t => unescapeJs(t.replace(/^[\s\S]*\.setTitle\('/, '').replace(/'\)$/, '')));
const batterySections = (gs.match(/section: '(?:[^'\\]|\\.)*'/g) || [])
  .map(t => unescapeJs(t.replace(/^section: '/, '').replace(/'$/, '')));

const setTitles = (gs.match(/\.setTitle\('(?:[^'\\]|\\.)*'\)/g) || [])
  .map(t => unescapeJs(t.replace(/^\.setTitle\('/, '').replace(/'\)$/, '')))
  .filter(t => !batteryTitles.includes(t))
  .filter(t => !sectionTitles.includes(t) && !batterySections.includes(t));

console.log('\nOther questions map to a known field');
const map = D.buildColumnMap(['Timestamp'].concat(setTitles));
['timestamp', 'age', 'ukRegion', 'postcodeArea', 'organisation', 'reintroduce',
 'reintroduceText', 'ukProblem', 'ukProblemWhy', 'cwProblem', 'cwProblemWhy', 'cwPriorities',
 'chogmMessage', 'gender', 'ethnicity', 'disability', 'situation', 'careExperience', 'consent']
  .forEach(key => check(Boolean(map.fields[key]), `"${key}" is matched by a question in the form`));

check(map.unmatched.length === 0,
  'every question in the form is used by the analysis',
  map.unmatched.length ? `unused: ${map.unmatched.join(' | ')}` : '');

console.log(failures ? `\n${failures} check(s) failed.\n` : '\nAll checks passed.\n');
process.exit(failures ? 1 : 0);
