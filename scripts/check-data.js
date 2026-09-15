/* =============================================================================
   check-data.js — smoke test for the analysis pipeline.
   Parses a CSV (the bundled sample by default), runs the same column matching
   and aggregation the site uses, and prints what it found. Fails loudly if a
   question could not be matched to a column.

   Run: node scripts/check-data.js [path-to-csv]
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const T = require('../assets/js/taxonomy.js');
const D = require('../assets/js/data.js');

const file = process.argv[2] || path.join(__dirname, '..', 'assets', 'data', 'sample-responses.csv');
const dataset = D.buildDataset(fs.readFileSync(file, 'utf8'), { kind: 'test', origin: file });
const s = D.summarise(dataset.rows);

let failures = 0;
const check = (ok, message) => { console.log(`${ok ? '  ok  ' : ' FAIL '} ${message}`); if (!ok) failures++; };

console.log(`\nSource: ${path.relative(process.cwd(), file)}`);
console.log(`Columns: ${dataset.headers.length}   Responses: ${dataset.rows.length}\n`);

console.log('Column matching');
['timestamp', 'age', 'ukRegion', 'reintroduce', 'ukProblem', 'cwProblem', 'chogmMessage']
  .forEach(k => check(Boolean(dataset.map.fields[k]), `field "${k}" matched to a column`));
T.RATING_BATTERIES.forEach(b => {
  const found = Object.keys(dataset.map.ratings[b.id]).length;
  check(found === T.POLICY_AREAS.length, `${b.label}: ${found}/${T.POLICY_AREAS.length} policy areas matched`);
});
check(dataset.map.unmatched.length === 0,
  `every column used${dataset.map.unmatched.length ? ` (unused: ${dataset.map.unmatched.join(' | ')})` : ''}`);

console.log('\nNormalisation');
check(s.byRegion.items.reduce((a, b) => a + b.count, 0) > 0, 'responses mapped to UK regions');
check(s.byCwRegion.items.reduce((a, b) => a + b.count, 0) > 0, 'responses mapped to Commonwealth regions');
check(s.byAge.missing === 0, `every response has a recognised age band (${s.byAge.missing} unmatched)`);
check(s.reintroduce.answered > 0, `"bring back" answers decoded (${s.reintroduce.answered} respondents)`);
check(s.ukProblem.missing === 0, `every UK problem answer matched a policy area (${s.ukProblem.missing} unmatched)`);
check(s.cwProblem.missing === 0, `every Commonwealth problem answer matched (${s.cwProblem.missing} unmatched)`);
check(s.gaps.every(g => g.gap !== null), 'a priority gap was computed for every policy area');

console.log('\nResponses by nation and region');
[...s.byRegion.items].sort((a, b) => b.count - a.count)
  .forEach(r => console.log(`  ${r.label.padEnd(30)} ${String(r.count).padStart(4)}`));
console.log(`  ${'Outside the UK'.padEnd(30)} ${String(s.byCwRegion.items.reduce((a, b) => a + b.count, 0)).padStart(4)}`);

console.log('\nPolicy areas — mean scores out of ten');
console.log(`  ${'Area'.padEnd(34)} works  long  short   gap`);
[...s.gaps].sort((a, b) => b.gap - a.gap).forEach(g =>
  console.log(`  ${g.label.padEnd(34)} ${String(g.performance).padStart(4)}  ${String(g.longTerm).padStart(4)}  ` +
              `${String(g.shortTerm).padStart(4)}  ${(g.gap > 0 ? '+' : '') + g.gap}`));

console.log('\nTop five things to bring back');
s.reintroduce.items.slice(0, 5).forEach(i =>
  console.log(`  ${Math.round(i.share * 100).toString().padStart(3)}%  ${i.label}`));

console.log(`\nFree-text answers to the CHOGM question: ${D.verbatims(dataset.rows, 'chogmMessage', { minLength: 25 }).length}`);

console.log(failures ? `\n${failures} check(s) failed.\n` : '\nAll checks passed.\n');
process.exit(failures ? 1 : 0);
