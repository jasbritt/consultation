/* =============================================================================
   taxonomy.js — single source of truth for the consultation's question content.
   Consumed by: consultation.html (question preview), data.js (column matching),
   results.js / report.js (labels and ordering), form/create-form.gs (mirror copy).

   IMPORTANT: form/create-form.gs holds a mirrored copy of these lists because
   Google Apps Script cannot import from this file. If you edit a policy area or
   a region here, make the same edit there. scripts/check-taxonomy.js verifies
   the two copies still agree — run `node scripts/check-taxonomy.js`.
   ========================================================================== */

/* -----------------------------------------------------------------------------
   Policy priority areas.
   Adapted from the priority areas and campaign themes carried by the British
   Youth Council (its manifesto work, Youth Select Committee topics and the UK
   Youth Parliament "Make Your Mark" ballot), consolidated into twelve areas that
   are short enough to rate three times over without exhausting a respondent.
   `id` is stable and is what gets written to the data layer — never change an id
   once responses have been collected; change only `label`.
-------------------------------------------------------------------------------*/
const POLICY_AREAS = [
  { id: 'mental_health',   label: 'Mental health and wellbeing',              blurb: 'Waiting times, CAMHS, counselling in schools and colleges, early support hubs.' },
  { id: 'youth_services',  label: 'Youth services and safe places to go',     blurb: 'Open-access youth clubs, detached and community youth work, places to meet.' },
  { id: 'education',       label: 'Education and curriculum for life',        blurb: 'Curriculum content, assessment, financial and life skills, SEND support.' },
  { id: 'work',            label: 'Jobs, apprenticeships and work experience', blurb: 'Entry-level work, apprenticeship quality and pay, careers advice, placements.' },
  { id: 'cost_of_living',  label: 'Cost of living and financial security',    blurb: 'Youth rates of pay, benefits for under-25s, food and energy costs, student finance.' },
  { id: 'transport',       label: 'Transport and getting around',             blurb: 'Bus and rail fares, rural connectivity, concessionary travel for young people.' },
  { id: 'housing',         label: 'Housing and a place to live',              blurb: 'Affordability, renting, youth homelessness, leaving care and supported housing.' },
  { id: 'safety',          label: 'Crime, safety and policing',               blurb: 'Serious violence, feeling safe in public, stop and search, victim support.' },
  { id: 'equality',        label: 'Equality, discrimination and racism',      blurb: 'Racism, sexism, LGBT+ equality, disability rights, faith-based hate.' },
  { id: 'climate',         label: 'Climate and the environment',              blurb: 'Emissions, green skills and jobs, nature, air quality, climate justice.' },
  { id: 'democracy',       label: 'Democracy and youth voice',                blurb: 'Votes at 16, youth councils and parliaments, being consulted on decisions.' },
  { id: 'digital',         label: 'Digital life and online safety',           blurb: 'Online harms, social media and wellbeing, digital access and skills, AI.' }
];

/* -----------------------------------------------------------------------------
   "Reintroduce" options — provision that has been reduced, closed or withdrawn
   in the UK over roughly the last fifteen years. Respondents pick up to three.
   Keeping this as a structured list (plus a free-text box) is what makes the
   answers chartable; a pure free-text question would need manual coding.
-------------------------------------------------------------------------------*/
const REINTRODUCE_OPTIONS = [
  { id: 'ema',            label: 'Education Maintenance Allowance (EMA) or an equivalent payment for 16–19 study', match: 'education maintenance allowance' },
  { id: 'bus_travel',     label: 'Free or capped bus travel for under-25s', match: 'capped bus travel' },
  { id: 'youth_clubs',    label: 'Funded open-access youth clubs and youth workers in every area', match: 'open-access youth clubs' },
  { id: 'sure_start',     label: 'Sure Start style family and early years centres', match: 'sure start' },
  { id: 'careers',        label: 'Independent careers advice in every school (a Connexions style service)', match: 'independent careers advice' },
  { id: 'work_ex',        label: 'Guaranteed work experience placements for every pupil', match: 'guaranteed work experience' },
  { id: 'arts_music',     label: 'Arts, music and drama in the curriculum, and free or low-cost music tuition', match: 'music and drama in the curriculum' },
  { id: 'school_meals',   label: 'Free school meals for more pupils, and holiday food provision', match: 'free school meals' },
  { id: 'school_nurse',   label: 'A school nurse and a trained counsellor in every school', match: 'school nurse' },
  { id: 'fe_funding',     label: 'Restored further education and adult skills funding, and lower tuition fees', match: 'further education and adult skills' },
  { id: 'youth_voice',    label: 'Funded national youth voice structures (a British Youth Council style body)', match: 'national youth voice structures' },
  { id: 'sports',         label: 'Community sports facilities, playing fields and free swimming', match: 'community sports facilities' },
  { id: 'rail_card',      label: 'Cheaper rail travel and a wider young persons railcard', match: 'railcard' },
  { id: 'libraries',      label: 'Local libraries and community spaces with longer opening hours', match: 'local libraries' }
];

/* -----------------------------------------------------------------------------
   Where respondents live, in alphabetical order: the twelve UK nations and
   regions (ITL1 / former NUTS1), the three Crown Dependencies, the fourteen
   British Overseas Territories, and a final option for anyone outside all of
   them. The consultation is for young people living in the UK, so that last
   option exists to be filtered out, not to be counted.

   `tile` is the column/row slot in the cartogram on the results page — see
   map.js — and `short` is the tile label. Only the twelve ITL1 nations and
   regions carry them: the cartogram is a map of the UK, and a territory eight
   thousand miles away has no honest square on it. Everything without a tile is
   still counted, still charted, and still placed on the live map by postcode.
   The presence of `tile` is what marks a nation or region as one of the twelve,
   so do not add one to a territory.
-------------------------------------------------------------------------------*/
const UK_REGIONS = [
  { id: 'akrotiri',      label: 'Akrotiri and Dhekelia' },
  { id: 'anguilla',      label: 'Anguilla' },
  { id: 'bermuda',       label: 'Bermuda' },
  { id: 'bat',           label: 'British Antarctic Territory' },
  { id: 'biot',          label: 'British Indian Ocean Territory' },
  { id: 'bvi',           label: 'British Virgin Islands' },
  { id: 'cayman',        label: 'Cayman Islands' },
  { id: 'east_mids',     label: 'East Midlands',            short: 'EM',  tile: { col: 3, row: 3 } },
  { id: 'east',          label: 'East of England',          short: 'EoE', tile: { col: 4, row: 3 } },
  { id: 'falklands',     label: 'Falkland Islands' },
  { id: 'gibraltar',     label: 'Gibraltar' },
  { id: 'guernsey',      label: 'Guernsey' },
  { id: 'isle_of_man',   label: 'Isle of Man' },
  { id: 'jersey',        label: 'Jersey' },
  { id: 'london',        label: 'London',                   short: 'LDN', tile: { col: 4, row: 4 } },
  { id: 'montserrat',    label: 'Montserrat' },
  { id: 'north_east',    label: 'North East England',       short: 'NE',  tile: { col: 3, row: 1 } },
  { id: 'north_west',    label: 'North West England',       short: 'NW',  tile: { col: 2, row: 2 } },
  { id: 'ni',            label: 'Northern Ireland',         short: 'NI',  tile: { col: 2, row: 1 } },
  { id: 'pitcairn',      label: 'Pitcairn Islands' },
  { id: 'st_helena',     label: 'Saint Helena, Ascension and Tristan da Cunha' },
  { id: 'scotland',      label: 'Scotland',                 short: 'SCO', tile: { col: 3, row: 0 } },
  { id: 'south_east',    label: 'South East England',       short: 'SE',  tile: { col: 3, row: 4 } },
  { id: 'south_georgia', label: 'South Georgia and the South Sandwich Islands' },
  { id: 'south_west',    label: 'South West England',       short: 'SW',  tile: { col: 2, row: 4 } },
  { id: 'turks_caicos',  label: 'Turks and Caicos Islands' },
  { id: 'wales',         label: 'Wales',                    short: 'WAL', tile: { col: 1, row: 3 } },
  { id: 'west_mids',     label: 'West Midlands',            short: 'WM',  tile: { col: 2, row: 3 } },
  { id: 'yorkshire',     label: 'Yorkshire and the Humber', short: 'Y&H', tile: { col: 3, row: 2 } },
  { id: 'outside_uk',    label: 'I live outside the UK' }
];

const AGE_BANDS = [
  { id: 'u13',   label: 'Under 13' },
  { id: '13_15', label: '13 to 15' },
  { id: '16_18', label: '16 to 18' },
  { id: '19_21', label: '19 to 21' },
  { id: '22_25', label: '22 to 25' },
  { id: 'o25',   label: 'Over 25' }
];

/* -----------------------------------------------------------------------------
   The three rating batteries. Each is asked across all twelve POLICY_AREAS.
   `matchTokens` are the words data.js looks for in a spreadsheet column header to
   decide which battery a column belongs to — see data.js buildColumnMap().
-------------------------------------------------------------------------------*/
const RATING_BATTERIES = [
  {
    id: 'performance',
    label: 'How well it works today',
    shortLabel: 'Works today',
    question: 'Thinking about young people you know, how well is each of these working for young people right now?',
    scaleLow: 'Not working at all',
    scaleHigh: 'Working very well',
    matchTokens: ['working for young people right now', 'how well is each', 'works today', 'working right now']
  },
  {
    id: 'long_term',
    label: 'Long-term importance',
    shortLabel: 'Long term',
    question: 'How important is each of these to a young person’s long-term future — the next ten to fifteen years?',
    scaleLow: 'Not important',
    scaleHigh: 'Critically important',
    matchTokens: ['long-term future', 'long term future', 'next ten to fifteen', 'long-term importance']
  },
  {
    id: 'short_term',
    label: 'Short-term urgency',
    shortLabel: 'Short term',
    question: 'How urgent is each of these for young people over the next twelve months?',
    scaleLow: 'Not urgent',
    scaleHigh: 'Extremely urgent',
    matchTokens: ['next twelve months', 'next 12 months', 'how urgent', 'short-term urgency']
  }
];

/* Exported for both browser (<script src>) and Node (scripts/*.js). */
const TAXONOMY = {
  POLICY_AREAS, REINTRODUCE_OPTIONS, UK_REGIONS, AGE_BANDS, RATING_BATTERIES
};
if (typeof module !== 'undefined' && module.exports) module.exports = TAXONOMY;
if (typeof window !== 'undefined') window.TAXONOMY = TAXONOMY;
