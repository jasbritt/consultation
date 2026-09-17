/* =============================================================================
   make-sample-data.js — writes assets/data/sample-responses.csv.

   THIS IS SYNTHETIC DATA. No real young person said any of this. It exists so
   that the results and report pages can be designed, reviewed and demonstrated
   before the consultation opens, and so that a broken data connection is
   obvious (the site badges sample data in the status pill). Delete the file, or
   point config.data.publishedCsvUrl at the real sheet, and it is never read.

   The column headers here are exactly what form/create-form.gs produces, so
   this doubles as a fixture for the column-matching logic in data.js.

   Run: node scripts/make-sample-data.js
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const T = require('../assets/js/taxonomy.js');
const { toCsv } = require('../assets/js/csv.js');

/* Deterministic RNG so the sample data does not churn the diff on every run. */
let seed = 20261115;
function rnd() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];
function weightedPick(entries) {          // entries: [[value, weight], ...]
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = rnd() * total;
  for (const [value, w] of entries) { if ((r -= w) <= 0) return value; }
  return entries[entries.length - 1][0];
}
/* Box–Muller, clamped and rounded — ratings cluster around a mean rather than
   spreading uniformly, which is how real scale data behaves. */
function ratingAround(mean, sd = 2.1) {
  const u = Math.max(rnd(), 1e-9), v = Math.max(rnd(), 1e-9);
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.max(0, Math.min(10, Math.round(mean + z * sd)));
}

/* Rough shares of the UK 13–25 population, so the map looks like the country. */
const REGION_WEIGHTS = [
  ['london', 14], ['south_east', 14], ['north_west', 11], ['east', 9.5], ['west_mids', 9],
  ['south_west', 8.5], ['yorkshire', 8], ['scotland', 8], ['east_mids', 7.5],
  ['wales', 4.7], ['north_east', 3.8], ['ni', 2.8],
  /* A thin tail from the Crown Dependencies and the Overseas Territories, so
     the sample exercises the line that names them beneath the tile map. */
  ['jersey', 0.35], ['guernsey', 0.3], ['isle_of_man', 0.35], ['gibraltar', 0.4],
  ['falklands', 0.15], ['bermuda', 0.15]
];

/* Population means for each battery. The interesting shape is deliberate and
   is what the quadrant and gap charts are built to reveal:
     - delivery is rated worst where importance is rated highest
     - climate is high long term, middling short term
     - cost of living is the reverse                                          */
const MEANS = {
  mental_health:  { perf: 3.1, long: 8.9, short: 8.4 },
  youth_services: { perf: 3.0, long: 7.4, short: 7.1 },
  education:      { perf: 4.7, long: 8.5, short: 7.2 },
  work:           { perf: 4.1, long: 8.4, short: 7.6 },
  cost_of_living: { perf: 2.9, long: 8.3, short: 8.9 },
  transport:      { perf: 3.6, long: 7.0, short: 7.3 },
  housing:        { perf: 2.7, long: 8.6, short: 7.5 },
  safety:         { perf: 4.2, long: 7.6, short: 7.4 },
  equality:       { perf: 5.0, long: 7.9, short: 6.9 },
  climate:        { perf: 4.3, long: 8.2, short: 6.1 },
  democracy:      { perf: 4.4, long: 6.9, short: 5.7 },
  digital:        { perf: 5.3, long: 7.3, short: 6.8 }
};

const REINTRODUCE_WEIGHTS = [
  ['youth_clubs', 26], ['bus_travel', 22], ['ema', 20], ['school_nurse', 19], ['careers', 15],
  ['arts_music', 13], ['school_meals', 12], ['work_ex', 11], ['fe_funding', 10], ['sports', 9],
  ['sure_start', 7], ['rail_card', 7], ['libraries', 6], ['youth_voice', 5]
];

const UK_PROBLEM_WEIGHTS = [
  ['mental_health', 24], ['cost_of_living', 22], ['housing', 14], ['work', 10], ['youth_services', 8],
  ['education', 7], ['safety', 6], ['transport', 4], ['equality', 3], ['climate', 2], ['digital', 2], ['democracy', 1]
];
const CW_PROBLEM_WEIGHTS = [
  ['climate', 21], ['work', 18], ['education', 16], ['equality', 11], ['cost_of_living', 10],
  ['safety', 7], ['mental_health', 6], ['democracy', 5], ['digital', 3], ['housing', 2], ['transport', 1], ['youth_services', 1]
];

const CHOGM_MESSAGES = [
  'Stop talking about young people as the future and start treating us as the present. We are already paying rent, already working, already voting in some of your countries.',
  'Every promise made about climate finance has a deadline that falls after you have all left office. Bring the deadlines forward.',
  'If you want us to trust institutions, give us something to trust. Fund youth services properly and keep them open.',
  'Mental health support should not depend on which postcode you live in, or which country.',
  'We cannot build a future in countries we cannot afford to live in. Housing is the whole argument.',
  'Put a young person in the room when the decision is being made, not in the photograph afterwards.',
  'Education across the Commonwealth should prepare us for the jobs that will exist, not the ones that did.',
  'The cost of getting to college is the reason people drop out. Fix transport and you fix attendance.',
  'Youth unemployment is not a young person problem, it is an economy problem. Stop framing it as our failure.',
  'Listen to young people from small island states before it is too late to listen to them at all.',
  'Give us votes at 16 and watch how quickly politics starts taking young people seriously.',
  'Commonwealth mobility should mean something. Let young people study and work across member states without impossible visa costs.',
  'You measure success in GDP. Measure it in whether an 18-year-old can see a future where they live.',
  'Fund the youth workers. They are the only adults some of us actually trust.',
  'Online harm is not a side issue. It is where we live most of our lives.',
  'Racism is still shaping who gets opportunities in every country here. Say so out loud.',
  'Apprenticeships that pay less than rent are not opportunities, they are a trap.',
  'Climate adaptation money needs to reach communities, not consultants.',
  'Talk to young people who are not already in youth parliaments. We are not the hard-to-reach ones, you are.',
  'Make the commitments measurable and publish who missed them.',
  'Young carers and care-experienced young people are invisible in every policy document I have read.',
  'If the Commonwealth means anything, it should mean a young person in Fiji and a young person in Wales both get heard.',
  'We are tired of consultations that go nowhere. Publish what you did with this one.',
  'Bring back the things that were cut before you announce anything new.',
  'Girls across the Commonwealth are still leaving education early. That should embarrass every leader in the room.'
];

const UK_WHY = [
  'Waiting lists where I live are over a year, and people get worse while they wait.',
  'Everyone I know is choosing between transport to college and lunch.',
  'There is nowhere to go in the evening since the youth centre closed.',
  'Rent takes most of my wages and I still live with my parents.',
  'My school had one careers adviser for eight hundred students.',
  'Apprenticeships near me pay so little that you need parents who can support you.',
  'People my age are scared on public transport and nobody talks about it.',
  'The support exists on paper but nobody can actually access it.',
  'Everything costs more and nothing about young people’s pay has changed.',
  'You cannot plan a future when you cannot afford anywhere to live.'
];

const CW_WHY = [
  'Young people in some member states cannot finish school because of cost, not ability.',
  'Climate change is already displacing people my age in Pacific member states.',
  'There are not enough jobs for the number of graduates being produced.',
  'Girls are still being taken out of education early in too many countries.',
  'Online access decides who gets opportunities and it is very unequal.',
  'Youth unemployment across the Commonwealth is the common thread in all of this.',
  'Corruption means money meant for young people does not reach us.',
  'Young people are excluded from decisions in almost every member state.'
];

const REINTRODUCE_TEXT = [
  'Free school transport past the age of 16.',
  'Youth centres open at weekends, not just weekdays.',
  'Proper funding for school counselling.',
  'Cheaper driving lessons and tests for young people in rural areas.',
  'Free swimming for under-18s.',
  'Music lessons that are not only for people who can pay.',
  '', '', '', '', '', '', '', '', ''   /* most people leave it blank */
];

/* ---------- header names — must mirror form/create-form.gs ---------------- */
const H = {
  timestamp: 'Timestamp',
  age: 'What is your age?',
  region: 'Which nation or region of the UK do you live in?',
  postcode: 'The first part of your postcode only, for example SW1A (optional)',
  organisation: 'Are you currently involved with a youth council, youth group or youth organisation?',
  reintroduce: 'What are the top three things you want the government to bring back for young people?',
  reintroduceText: 'Is there anything else you would bring back that is not on that list?',
  ukProblem: 'What is the biggest problem facing young people across the UK today?',
  ukWhy: 'In your own words, why did you choose that for the UK?',
  cwProblem: 'What is the biggest problem facing young people across the Commonwealth today?',
  cwWhy: 'In your own words, why did you choose that for the Commonwealth?',
  cwPriorities: 'Which of these should the UK push hardest on across the Commonwealth?',
  chogm: 'If you could say one thing directly to the Heads of Government, what would it be?',
  gender: 'Which of these best describes your gender?',
  ethnicity: 'Which of these best describes your ethnic background?',
  disability: 'Do you have a disability or a long-term health condition?',
  situation: 'Which best describes what you are doing at the moment?',
  care: 'Have you ever been in care, or are you care experienced?',
  consent: 'I have read the privacy notice and I am happy for my answers to be used in this consultation'
};
const ratingHeader = (battery, area) => `${battery.question} [${area.label}]`;

/* Postcode areas that actually fall in each nation and region, so a synthetic
   London respondent gets a London postcode. Without this the map contradicts
   the region filter — filtering to London still showed sixteen postcode areas,
   because the postcode was picked at random from the whole country. */
const REGION_POSTCODES = {
  scotland:   ['G1','G12','EH8','AB10','DD1','IV2','KY1','PA1','ML1','FK1','KA1','PH1'],
  ni:         ['BT1','BT9','BT15','BT47'],
  north_east: ['NE1','NE6','SR2','DH1','DL1','TS1'],
  north_west: ['M14','M1','L18','L1','PR1','BL1','OL1','WN1','WA1','CH1','CA1','LA1','FY1','BB1','SK1'],
  yorkshire:  ['LS6','LS1','BD1','S10','HU1','YO1','WF1','HD1','HX1','HG1','DN1'],
  wales:      ['CF10','CF24','SA1','NP20','LL30','LD1'],
  west_mids:  ['B29','B1','CV1','DY1','WS1','WV1','ST1','WR1','HR1','TF1'],
  east_mids:  ['NG7','NG1','LE1','DE1','LN1','NN1'],
  east:       ['CB1','NR1','IP1','CO1','CM1','SS1','PE1','LU1','AL1','SG1','HP1','MK1'],
  south_west: ['BS8','BS1','BA1','EX1','PL4','TR1','TQ1','GL1','SN1','DT1','TA1'],
  south_east: ['RG1','GU1','SL1','OX1','PO1','SO14','BN1','ME1','CT1','TN1','RH1','KT1'],
  london:     ['SW1A','SE1','E1','EC1A','N1','NW1','W1A','WC1A','BR1','CR0','EN1','HA1','IG1','RM1','SM1','TW1','UB1'],
  jersey:     ['JE1','JE2','JE3'],
  guernsey:   ['GY1','GY2','GY8'],
  isle_of_man:['IM1','IM2','IM4'],
  gibraltar:  ['GX11'],
  falklands:  ['FIQQ'],
  /* Bermuda runs its own scheme and its prefixes collide with UK areas, so the
     sample leaves the postcode blank — see assets/js/postcodes.js. */
  bermuda:    []
};

function buildRow(i) {
  /* Pick first: weightedPick inside a find() predicate would re-roll for every
     element and almost never match. */
  const regionId = weightedPick(REGION_WEIGHTS);
  const region = T.UK_REGIONS.find(r => r.id === regionId);

  const age = weightedPick([['13_15', 18], ['16_18', 32], ['19_21', 26], ['22_25', 19], ['u13', 2], ['o25', 3]]);

  /* Up to three "bring back" choices, joined the way Google Forms joins them. */
  const chosen = new Set();
  const howMany = weightedPick([[3, 62], [2, 24], [1, 14]]);
  let guard = 0;
  while (chosen.size < howMany && guard++ < 50) chosen.add(weightedPick(REINTRODUCE_WEIGHTS));
  const reintroduce = [...chosen]
    .map(id => T.REINTRODUCE_OPTIONS.find(o => o.id === id).label)
    .join(', ');

  /* Pick the ids first. Calling weightedPick inside a find() predicate would
     re-roll it for every element and almost never match. */
  const ukProblemId = weightedPick(UK_PROBLEM_WEIGHTS);
  const cwProblemId = weightedPick(CW_PROBLEM_WEIGHTS);
  const areaLabel = id => T.POLICY_AREAS.find(a => a.id === id).label;

  const row = {
    [H.timestamp]: timestampFor(i),
    [H.age]: T.AGE_BANDS.find(b => b.id === age).label,
    [H.region]: region.label,
    [H.postcode]: rnd() < 0.55 ? (pick(REGION_POSTCODES[region.id] || []) || '') : '',
    [H.organisation]: weightedPick([['Yes', 34], ['No', 58], ['Prefer not to say', 8]]),
    [H.reintroduce]: reintroduce,
    [H.reintroduceText]: pick(REINTRODUCE_TEXT),
    [H.ukProblem]: areaLabel(ukProblemId),
    [H.ukWhy]: rnd() < 0.45 ? pick(UK_WHY) : '',
    [H.cwProblem]: areaLabel(cwProblemId),
    [H.cwWhy]: rnd() < 0.35 ? pick(CW_WHY) : '',
    [H.cwPriorities]: [weightedPick(CW_PROBLEM_WEIGHTS), weightedPick(CW_PROBLEM_WEIGHTS)]
      .filter((v, idx, arr) => arr.indexOf(v) === idx)
      .map(areaLabel).join(', '),
    [H.chogm]: rnd() < 0.38 ? pick(CHOGM_MESSAGES) : '',
    [H.gender]: weightedPick([['Female', 52], ['Male', 40], ['Non-binary', 4], ['Prefer not to say', 4]]),
    [H.ethnicity]: weightedPick([['White', 72], ['Asian or Asian British', 10], ['Black, Black British, Caribbean or African', 7],
                                 ['Mixed or multiple ethnic groups', 5], ['Other ethnic group', 2], ['Prefer not to say', 4]]),
    [H.disability]: weightedPick([['No', 74], ['Yes', 18], ['Prefer not to say', 8]]),
    [H.situation]: weightedPick([['In school or college', 42], ['At university', 21], ['Working', 22],
                                 ['Apprenticeship or training', 7], ['Not in education, employment or training', 5], ['Prefer not to say', 3]]),
    [H.care]: weightedPick([['No', 88], ['Yes', 6], ['Prefer not to say', 6]]),
    [H.consent]: 'Yes'
  };

  /* A realistic share of people stop before finishing the rating grids. */
  const completes = rnd() < 0.88;
  T.RATING_BATTERIES.forEach(battery => {
    T.POLICY_AREAS.forEach(area => {
      const key = ratingHeader(battery, area);
      if (!completes && rnd() < 0.6) { row[key] = ''; return; }
      const m = MEANS[area.id];
      const mean = battery.id === 'performance' ? m.perf : battery.id === 'long_term' ? m.long : m.short;
      row[key] = String(ratingAround(mean));
    });
  });

  return row;
}

/* Responses arrive unevenly — a burst when a partner shares the link. */
function timestampFor(i) {
  const start = new Date(2026, 8, 15, 9, 0, 0).getTime();
  const days = Math.floor((i / TOTAL) * 74 + rnd() * 3);
  const d = new Date(start + days * 86400000 + Math.floor(rnd() * 43200000));
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const TOTAL = 874;

const rows = Array.from({ length: TOTAL }, (_, i) => buildRow(i));

const headers = [
  H.timestamp, H.age, H.region, H.postcode, H.organisation,
  H.reintroduce, H.reintroduceText, H.ukProblem, H.ukWhy, H.cwProblem, H.cwWhy,
  ...T.RATING_BATTERIES.flatMap(b => T.POLICY_AREAS.map(a => ratingHeader(b, a))),
  H.cwPriorities, H.chogm,
  H.gender, H.ethnicity, H.disability, H.situation, H.care, H.consent
];

const csv = toCsv([headers, ...rows.map(r => headers.map(h => r[h] ?? ''))]);
const out = path.join(__dirname, '..', 'assets', 'data', 'sample-responses.csv');
fs.writeFileSync(out, csv + '\r\n');
console.log(`Wrote ${rows.length} synthetic responses and ${headers.length} columns to ${path.relative(process.cwd(), out)}`);
