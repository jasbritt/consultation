/* =============================================================================
   check-headers.js — does every question still find its column?

   The site never matches a spreadsheet column on its exact question text; each
   header is scored against the taxonomy and the best candidate wins. That
   survives rewording, but not every rewording, and a column that stops matching
   is silent: the chart reads "No answers to this question yet" rather than
   erroring. This is the pre-flight.

   It needs the header row of the responses sheet and nothing else — no
   responses, no credentials. Copy row 1 of the sheet, or run it over a
   downloaded CSV.

   Run: node scripts/check-headers.js path/to/responses.csv
        pbpaste | node scripts/check-headers.js          (paste row 1, then ^D)
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const T = require('../assets/js/taxonomy.js');
const D = require('../assets/js/data.js');
const { parseCsv } = require('../assets/js/csv.js');

/* Question text is full of commas, so the header row is parsed as CSV rather
   than split on the comma. */
function readHeaders(text) {
  const firstLine = parseCsv(text)[0];
  return (firstLine || []).map(h => String(h).trim()).filter(Boolean);
}

const file = process.argv[2];
const text = file ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
const headers = readHeaders(text);

if (!headers.length) {
  console.error('No header row found. Pass a CSV file, or pipe in row 1 of the sheet.');
  process.exit(2);
}

const map = D.buildColumnMap(headers);
let missing = 0;

console.log(`\n${headers.length} columns read from ${file ? path.relative(process.cwd(), file) : 'standard input'}\n`);

/* Every field the results page reads, and whether it found a home. `optional`
   fields are the ones no chart depends on. */
const FIELDS = [
  ['timestamp', 'When the response arrived'],
  ['age', 'Age band'],
  ['ukRegion', 'Nation or region'],
  ['postcodeArea', 'Postcode area', true],
  ['reintroduce', 'What to bring back'],
  ['reintroduceText', 'Bring back, in their own words', true],
  ['ukProblem', 'Biggest problem, UK'],
  ['ukProblemWhy', 'Why, UK', true],
  ['cwProblem', 'Biggest problem, Commonwealth'],
  ['cwProblemWhy', 'Why, Commonwealth', true],
  ['cwPriorities', 'Commonwealth priorities', true],
  ['chogmMessage', 'Message to Heads of Government'],
  ['gender', 'Gender', true],
  ['ethnicity', 'Ethnicity', true],
  ['disability', 'Disability', true],
  ['situation', 'Education or employment', true],
  ['careExperience', 'Care experience', true],
  ['organisation', 'Youth organisation', true],
  ['consent', 'Consent', true]
];

console.log('Questions');
FIELDS.forEach(([key, label, optional]) => {
  const col = map.fields[key];
  if (!col && !optional) missing++;
  const mark = col ? '  ok  ' : (optional ? '  --  ' : ' FAIL ');
  console.log(`${mark} ${label.padEnd(32)} ${col ? `-> ${col.slice(0, 64)}` : (optional ? 'not in this form' : 'NO COLUMN MATCHED')}`);
});

console.log('\nRating grids');
T.RATING_BATTERIES.forEach(b => {
  const found = Object.keys(map.ratings[b.id]).length;
  const ok = found === T.POLICY_AREAS.length;
  if (!ok) missing++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${b.label.padEnd(32)} ${found}/${T.POLICY_AREAS.length} policy areas`);
  if (!ok) {
    const absent = T.POLICY_AREAS.filter(a => !map.ratings[b.id][a.id]).map(a => a.label);
    console.log(`        not matched: ${absent.join(', ')}`);
  }
});

if (map.unmatched.length) {
  console.log(`\nColumns the analysis ignores (${map.unmatched.length})`);
  map.unmatched.forEach(h => console.log(`        ${h.slice(0, 88)}`));
  console.log('        Harmless if these are questions you do not chart.');
}

console.log(missing
  ? `\n${missing} question(s) could not be matched. The charts for those will be empty.\n`
  : '\nEvery charted question found its column.\n');
process.exit(missing ? 1 : 0);
