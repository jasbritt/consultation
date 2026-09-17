/* =============================================================================
   data.js — load responses, work out which spreadsheet column is which
   question, normalise every row, and aggregate.

   The awkward part is column matching. Google Sheets names each column after
   the full question text, and that text changes the moment somebody edits a
   word in the form. So nothing here matches on an exact string: each column is
   scored against the taxonomy and the best scoring candidate wins. The results
   page exposes the resulting map in a "column mapping" panel so a mismatch is
   visible rather than silent.
   ========================================================================== */

const T = (typeof window !== 'undefined' ? window.TAXONOMY : require('./taxonomy.js'));
const CSV = (typeof window !== 'undefined' ? window : require('./csv.js'));

/* ---------- helpers -------------------------------------------------------- */

/* Lowercase, strip accents and punctuation, collapse whitespace. Everything is
   compared in this space so "Long-term" and "long term" are the same thing. */
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9']+/g, ' ')
    .trim();
}
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
function median(a) {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const round1 = v => v === null ? null : Math.round(v * 10) / 10;

/* ---------- column mapping ------------------------------------------------- */

/* Ratings: a column belongs to a battery+area pair when the header mentions the
   policy area AND something that identifies the battery. Covers both shapes
   Google produces — a grid row ("...next twelve months [Housing]") and a
   standalone scale item ("Short term — Housing and a place to live"). */
function matchRatingColumn(header) {
  const h = norm(header);
  const area = T.POLICY_AREAS.find(a => {
    const full = norm(a.label);
    const head = norm(a.label.split(/ and | & |,/)[0]);      // "Housing" from "Housing and a place to live"
    return h.includes(full) || (head.length > 5 && h.includes(head));
  });
  if (!area) return null;

  const battery = T.RATING_BATTERIES.find(b =>
    b.matchTokens.some(tok => h.includes(norm(tok))) || h.includes(norm(b.shortLabel))
  );
  if (!battery) return null;
  return { battery: battery.id, area: area.id };
}

/* Short tokens are matched on word boundaries, longer phrases as substrings.
   Without this, the token "age" matches "message" and "uk" matches any word
   that happens to contain those letters. */
function hasToken(haystack, token) {
  const t = norm(token);
  if (!t) return false;
  if (!t.includes(' ') && t.length <= 4) return new RegExp(`(^| )${t}( |$)`).test(haystack);
  return haystack.includes(t);
}

/* Everything that is not a rating is matched by keyword sets: every `all` token
   must appear, and at least one `any` token must appear. First rule to match a
   header claims it, so order the rules most-specific first. */
const FIELD_RULES = [
  { key: 'timestamp',      all: [],                 any: ['timestamp', 'date submitted'] },
  { key: 'age',            all: ['age'],            any: ['age'] },
  { key: 'ukRegion',       all: [],                 any: ['which nation or region', 'nation or region of the uk', 'where in the uk', 'region do you live'] },
  { key: 'postcodeArea',   all: [],                 any: ['postcode'] },
  { key: 'reintroduce',    all: [],                 any: ['bring back', 'reintroduce', 'reinstate'] },
  { key: 'reintroduceText',all: [],                 any: ['anything else you would bring back', 'in your own words bring back'] },
  { key: 'ukProblem',      all: ['uk'],             any: ['biggest problem facing young people'] },
  { key: 'ukProblemWhy',   all: ['uk'],             any: ['tell us why', 'why did you choose'] },
  { key: 'cwProblem',      all: ['commonwealth'],   any: ['biggest problem facing young people'] },
  { key: 'cwProblemWhy',   all: ['commonwealth'],   any: ['tell us why', 'why did you choose'] },
  { key: 'cwPriorities',   all: [],                 any: ['push hardest'] },
  { key: 'chogmMessage',   all: [],                 any: ['heads of government', 'one thing you would say', 'message to leaders'] },
  { key: 'gender',         all: [],                 any: ['gender'] },
  { key: 'ethnicity',      all: [],                 any: ['ethnic'] },
  { key: 'disability',     all: [],                 any: ['disability', 'long term health condition'] },
  { key: 'situation',      all: [],                 any: ['best describes what you are doing', 'education employment or training'] },
  { key: 'careExperience', all: [],                 any: ['care experienc', 'looked after'] },
  { key: 'organisation',   all: [],                 any: ['youth organisation', 'youth council or youth group'] },
  { key: 'consent',        all: [],                 any: ['consent', 'privacy notice'] }
];

function buildColumnMap(headers) {
  const map = {
    fields: {},
    ratings: { performance: {}, long_term: {}, short_term: {} },
    unmatched: []
  };

  headers.forEach(header => {
    const rating = matchRatingColumn(header);
    if (rating) { map.ratings[rating.battery][rating.area] = header; return; }

    const h = norm(header);
    const rule = FIELD_RULES.find(r =>
      !map.fields[r.key] &&
      r.all.every(tok => hasToken(h, tok)) &&
      r.any.some(tok => hasToken(h, tok))
    );
    if (rule) { map.fields[rule.key] = header; return; }
    map.unmatched.push(header);
  });

  return map;
}

/* ---------- value coercion ------------------------------------------------- */

function toRating(v) {
  if (v === undefined || v === null || v === '') return null;
  /* Tolerates "7", "7 ", "7 - works well" and "7/10". */
  const m = String(v).match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return (n >= 0 && n <= 10) ? n : null;
}

function matchFromList(value, list, extraKeys = []) {
  const v = norm(value);
  if (!v) return null;
  let hit = list.find(item => norm(item.label) === v);
  if (!hit) hit = list.find(item => v.includes(norm(item.label)) || norm(item.label).includes(v));
  if (!hit) hit = list.find(item => extraKeys.some(k => item[k] && norm(item[k]) === v));
  return hit ? hit.id : null;
}

/* Checkbox answers arrive as one cell joined with ", ". Several of our option
   labels contain commas themselves, so splitting is unsafe — we test for each
   option's distinctive comma-free phrase instead. */
function matchReintroduce(value) {
  const v = norm(value);
  if (!v) return [];
  return T.REINTRODUCE_OPTIONS.filter(o => v.includes(norm(o.match))).map(o => o.id);
}

function parseTimestamp(v) {
  if (!v) return null;
  /* Google writes DD/MM/YYYY HH:MM:SS for UK locale sheets, which Date parses
     as an American date or not at all. Handle it explicitly, then fall back. */
  const uk = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ ,]*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (uk) {
    const [, d, mo, y, hh, mm, ss] = uk;
    return new Date(+y, +mo - 1, +d, +hh, +mm, +(ss || 0));
  }
  const dt = new Date(v);
  return isNaN(dt) ? null : dt;
}

/* ---------- normalisation -------------------------------------------------- */

function normaliseRecords(records, map) {
  const f = map.fields;
  const get = (rec, key) => (f[key] ? (rec[f[key]] || '') : '');

  return records.map(rec => {
    const ratings = {};
    T.RATING_BATTERIES.forEach(b => {
      ratings[b.id] = {};
      Object.entries(map.ratings[b.id]).forEach(([areaId, header]) => {
        const val = toRating(rec[header]);
        if (val !== null) ratings[b.id][areaId] = val;
      });
    });

    return {
      timestamp:   parseTimestamp(get(rec, 'timestamp')),
      age:         matchFromList(get(rec, 'age'), T.AGE_BANDS),
      ukRegion:    matchFromList(get(rec, 'ukRegion'), T.UK_REGIONS, ['short']),
      postcodeArea: get(rec, 'postcodeArea').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4),
      ratings,
      reintroduce: matchReintroduce(get(rec, 'reintroduce')),
      ukProblem:   matchFromList(get(rec, 'ukProblem'), T.POLICY_AREAS),
      cwProblem:   matchFromList(get(rec, 'cwProblem'), T.POLICY_AREAS),
      texts: {
        reintroduce:  get(rec, 'reintroduceText'),
        ukProblemWhy: get(rec, 'ukProblemWhy'),
        cwProblemWhy: get(rec, 'cwProblemWhy'),
        chogmMessage: get(rec, 'chogmMessage')
      },
      demographics: {
        gender: get(rec, 'gender'), ethnicity: get(rec, 'ethnicity'),
        disability: get(rec, 'disability'), situation: get(rec, 'situation'),
        careExperience: get(rec, 'careExperience'), organisation: get(rec, 'organisation')
      },
      raw: rec
    };
  });
}

/* ---------- aggregation ---------------------------------------------------- */

/* Counts for a categorical field, returned in the taxonomy's own order so that
   a colour or a map tile never shifts between refreshes. */
function countBy(rows, pick, list) {
  const counts = new Map(list.map(i => [i.id, 0]));
  let missing = 0;
  rows.forEach(r => {
    const v = pick(r);
    if (v && counts.has(v)) counts.set(v, counts.get(v) + 1); else missing++;
  });
  return {
    items: list.map(i => ({ id: i.id, label: i.label, short: i.short, count: counts.get(i.id) })),
    missing,
    total: rows.length
  };
}

/* Mean / median / n / distribution for one battery across all policy areas. */
function batteryStats(rows, batteryId) {
  return T.POLICY_AREAS.map(area => {
    const values = rows.map(r => r.ratings[batteryId]?.[area.id])
                       .filter(v => typeof v === 'number');
    const dist = Array.from({ length: 11 }, (_, i) => values.filter(v => v === i).length);
    return {
      id: area.id, label: area.label, blurb: area.blurb,
      n: values.length,
      mean: round1(mean(values)),
      median: median(values),
      /* Share rating 7+ — the "this is working / this matters a lot" share. */
      topShare: values.length ? values.filter(v => v >= 7).length / values.length : null,
      lowShare: values.length ? values.filter(v => v <= 3).length / values.length : null,
      dist
    };
  });
}

/* The priority gap: how important something is judged to be, minus how well it
   is judged to be working. A large positive gap is where policy attention is
   most obviously missing, and it is the single most report-ready number here. */
function priorityGaps(rows) {
  const perf = Object.fromEntries(batteryStats(rows, 'performance').map(s => [s.id, s]));
  const long = Object.fromEntries(batteryStats(rows, 'long_term').map(s => [s.id, s]));
  const short = Object.fromEntries(batteryStats(rows, 'short_term').map(s => [s.id, s]));

  return T.POLICY_AREAS.map(a => {
    const p = perf[a.id], l = long[a.id], s = short[a.id];
    return {
      id: a.id, label: a.label, blurb: a.blurb,
      performance: p.mean, longTerm: l.mean, shortTerm: s.mean,
      n: Math.min(p.n, l.n, s.n),
      gap: (l.mean !== null && p.mean !== null) ? round1(l.mean - p.mean) : null,
      urgencyGap: (s.mean !== null && p.mean !== null) ? round1(s.mean - p.mean) : null,
      horizon: (l.mean !== null && s.mean !== null) ? round1(l.mean - s.mean) : null
    };
  });
}

function reintroduceCounts(rows) {
  const counts = new Map(T.REINTRODUCE_OPTIONS.map(o => [o.id, 0]));
  let answered = 0;
  rows.forEach(r => {
    if (r.reintroduce.length) answered++;
    r.reintroduce.forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
  });
  return {
    answered,
    items: T.REINTRODUCE_OPTIONS
      .map(o => ({ id: o.id, label: o.label, count: counts.get(o.id),
                   share: answered ? counts.get(o.id) / answered : 0 }))
      .sort((a, b) => b.count - a.count)
  };
}

function verbatims(rows, key, { minLength = 12, limit = Infinity } = {}) {
  return rows
    .filter(r => (r.texts[key] || '').trim().length >= minLength)
    .map(r => ({
      text: r.texts[key].trim(),
      region: T.UK_REGIONS.find(x => x.id === r.ukRegion)?.label || 'Location not given',
      age: T.AGE_BANDS.find(x => x.id === r.age)?.label || null
    }))
    .slice(0, limit);
}

/* Everything the dashboard and the report need, computed once per filter change. */
function summarise(rows) {
  const ratedRows = rows.filter(r => Object.keys(r.ratings.performance).length > 0);
  return {
    total: rows.length,
    ratedTotal: ratedRows.length,
    byRegion: countBy(rows, r => r.ukRegion, T.UK_REGIONS),
    byAge: countBy(rows, r => r.age, T.AGE_BANDS),
    ukProblem: countBy(rows, r => r.ukProblem, T.POLICY_AREAS),
    cwProblem: countBy(rows, r => r.cwProblem, T.POLICY_AREAS),
    performance: batteryStats(rows, 'performance'),
    longTerm: batteryStats(rows, 'long_term'),
    shortTerm: batteryStats(rows, 'short_term'),
    gaps: priorityGaps(rows),
    reintroduce: reintroduceCounts(rows),
    /* The twelve ITL1 nations and regions only — `tile` is what marks them.
       A reply from Gibraltar is welcome but it is not UK coverage. */
    regionsCovered: T.UK_REGIONS.filter(reg => reg.tile && rows.some(r => r.ukRegion === reg.id)).length,
    firstResponse: rows.map(r => r.timestamp).filter(Boolean).sort((a, b) => a - b)[0] || null,
    lastResponse: rows.map(r => r.timestamp).filter(Boolean).sort((a, b) => b - a)[0] || null
  };
}

/* ---------- loading -------------------------------------------------------- */

/* Resolve which source to use, in the documented order of precedence. */
function resolveSource(config) {
  const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const fromUrl = params.get('csv');
  if (fromUrl) return { url: fromUrl, kind: 'live', origin: 'address bar' };

  let saved = null;
  try { saved = localStorage.getItem('chogm:csvUrl'); } catch (e) { /* private mode */ }
  if (saved) return { url: saved, kind: 'live', origin: 'saved in this browser' };

  if (config.data.publishedCsvUrl) return { url: config.data.publishedCsvUrl, kind: 'live', origin: 'config.js' };
  return { url: config.data.sampleCsvUrl, kind: 'sample', origin: 'bundled sample' };
}

async function loadDataset(config) {
  const source = resolveSource(config);
  const res = await fetch(source.url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not read the data source (HTTP ${res.status}). Check the sheet is published to the web.`);
  const text = await res.text();

  /* A sheet that is not published returns Google's HTML sign-in page with a
     200, so sniff the payload rather than trusting the status code. */
  if (/^\s*<(!doctype|html)/i.test(text)) {
    throw new Error('That link returned a web page rather than CSV. In Sheets use File › Share › Publish to web and pick "Comma-separated values (.csv)".');
  }
  return buildDataset(text, source);
}

function buildDataset(csvText, source = { kind: 'live', origin: 'uploaded file' }) {
  const { headers, records } = CSV.parseCsvToObjects(csvText);
  const map = buildColumnMap(headers);
  const rows = normaliseRecords(records, map);
  return { headers, map, rows, source, loadedAt: new Date() };
}

const DATA = {
  norm, hasToken, mean, median, round1, buildColumnMap, normaliseRecords, summarise,
  batteryStats, priorityGaps, reintroduceCounts, verbatims, countBy,
  loadDataset, buildDataset, resolveSource, matchRatingColumn
};
if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
if (typeof window !== 'undefined') window.DATA = DATA;
