/* =============================================================================
   postcodes.js — UK postcode area → post town, county and approximate position.

   The form asks only for the outward code (the first half of a postcode, such
   as SW1A or M14), which is deliberately too coarse to identify anybody. This
   table resolves the letters at the front of it — the postcode *area* — to the
   post town it is named after, its county, and a point to draw on the map.

   ACCURACY, PLAINLY
   These are the post towns the areas are named for and an approximate centre
   for each, good to roughly a town. They are NOT official centroids, and an
   area can span more than one county (postcode geography does not follow county
   boundaries). For anything published as a statistic, replace this file with a
   proper source — the ONS Postcode Directory, or the free postcode data at
   doogal.co.uk — and keep the same shape: { town, county, lat, lon }.

   The map is therefore a picture of which parts of the country have been
   reached, not a precise plot of where each respondent lives.
   ========================================================================== */

const POSTCODE_AREAS = {
  AB: ['Aberdeen', 'Aberdeenshire', 57.149, -2.094],
  AL: ['St Albans', 'Hertfordshire', 51.752, -0.339],
  B:  ['Birmingham', 'West Midlands', 52.486, -1.890],
  BA: ['Bath', 'Somerset', 51.380, -2.360],
  BB: ['Blackburn', 'Lancashire', 53.748, -2.487],
  BD: ['Bradford', 'West Yorkshire', 53.795, -1.759],
  BH: ['Bournemouth', 'Dorset', 50.720, -1.880],
  BL: ['Bolton', 'Greater Manchester', 53.578, -2.429],
  BN: ['Brighton', 'East Sussex', 50.827, -0.152],
  BR: ['Bromley', 'Greater London', 51.406, 0.015],
  BS: ['Bristol', 'Bristol', 51.454, -2.588],
  BT: ['Belfast', 'Northern Ireland', 54.597, -5.930],
  CA: ['Carlisle', 'Cumbria', 54.892, -2.932],
  CB: ['Cambridge', 'Cambridgeshire', 52.205, 0.119],
  CF: ['Cardiff', 'South Glamorgan', 51.481, -3.179],
  CH: ['Chester', 'Cheshire', 53.190, -2.892],
  CM: ['Chelmsford', 'Essex', 51.736, 0.469],
  CO: ['Colchester', 'Essex', 51.889, 0.903],
  CR: ['Croydon', 'Greater London', 51.372, -0.098],
  CT: ['Canterbury', 'Kent', 51.280, 1.079],
  CV: ['Coventry', 'West Midlands', 52.407, -1.508],
  CW: ['Crewe', 'Cheshire', 53.099, -2.441],
  DA: ['Dartford', 'Kent', 51.446, 0.219],
  DD: ['Dundee', 'Angus', 56.462, -2.970],
  DE: ['Derby', 'Derbyshire', 52.922, -1.477],
  DG: ['Dumfries', 'Dumfries and Galloway', 55.070, -3.605],
  DH: ['Durham', 'County Durham', 54.777, -1.575],
  DL: ['Darlington', 'County Durham', 54.525, -1.553],
  DN: ['Doncaster', 'South Yorkshire', 53.523, -1.128],
  DT: ['Dorchester', 'Dorset', 50.715, -2.437],
  DY: ['Dudley', 'West Midlands', 52.509, -2.089],
  E:  ['London', 'Greater London', 51.530, -0.040],
  EC: ['London', 'Greater London', 51.518, -0.090],
  EH: ['Edinburgh', 'Midlothian', 55.953, -3.188],
  EN: ['Enfield', 'Greater London', 51.652, -0.081],
  EX: ['Exeter', 'Devon', 50.718, -3.534],
  FK: ['Falkirk', 'Stirlingshire', 56.001, -3.784],
  FY: ['Blackpool', 'Lancashire', 53.817, -3.036],
  G:  ['Glasgow', 'Lanarkshire', 55.861, -4.250],
  GL: ['Gloucester', 'Gloucestershire', 51.864, -2.244],
  GU: ['Guildford', 'Surrey', 51.236, -0.570],
  GY: ['Guernsey', 'Channel Islands', 49.455, -2.536],
  HA: ['Harrow', 'Greater London', 51.580, -0.341],
  HD: ['Huddersfield', 'West Yorkshire', 53.645, -1.785],
  HG: ['Harrogate', 'North Yorkshire', 53.992, -1.542],
  HP: ['Hemel Hempstead', 'Hertfordshire', 51.752, -0.449],
  HR: ['Hereford', 'Herefordshire', 52.056, -2.716],
  HS: ['Stornoway', 'Na h-Eileanan Siar', 58.210, -6.386],
  HU: ['Hull', 'East Yorkshire', 53.745, -0.336],
  HX: ['Halifax', 'West Yorkshire', 53.722, -1.859],
  IG: ['Ilford', 'Greater London', 51.559, 0.072],
  IM: ['Douglas', 'Isle of Man', 54.152, -4.486],
  IP: ['Ipswich', 'Suffolk', 52.059, 1.155],
  IV: ['Inverness', 'Inverness-shire', 57.478, -4.224],
  JE: ['Jersey', 'Channel Islands', 49.214, -2.131],
  KA: ['Kilmarnock', 'Ayrshire', 55.611, -4.496],
  KT: ['Kingston upon Thames', 'Surrey', 51.409, -0.306],
  KW: ['Kirkwall', 'Orkney', 58.981, -2.960],
  KY: ['Kirkcaldy', 'Fife', 56.113, -3.157],
  L:  ['Liverpool', 'Merseyside', 53.408, -2.991],
  LA: ['Lancaster', 'Lancashire', 54.047, -2.801],
  LD: ['Llandrindod Wells', 'Powys', 52.241, -3.379],
  LE: ['Leicester', 'Leicestershire', 52.636, -1.132],
  LL: ['Llandudno', 'Conwy', 53.324, -3.827],
  LN: ['Lincoln', 'Lincolnshire', 53.230, -0.540],
  LS: ['Leeds', 'West Yorkshire', 53.801, -1.549],
  LU: ['Luton', 'Bedfordshire', 51.879, -0.420],
  M:  ['Manchester', 'Greater Manchester', 53.480, -2.242],
  ME: ['Medway', 'Kent', 51.389, 0.523],
  MK: ['Milton Keynes', 'Buckinghamshire', 52.041, -0.759],
  ML: ['Motherwell', 'Lanarkshire', 55.790, -3.992],
  N:  ['London', 'Greater London', 51.564, -0.106],
  NE: ['Newcastle upon Tyne', 'Tyne and Wear', 54.978, -1.618],
  NG: ['Nottingham', 'Nottinghamshire', 52.954, -1.150],
  NN: ['Northampton', 'Northamptonshire', 52.240, -0.903],
  NP: ['Newport', 'Gwent', 51.584, -2.998],
  NR: ['Norwich', 'Norfolk', 52.630, 1.297],
  NW: ['London', 'Greater London', 51.549, -0.196],
  OL: ['Oldham', 'Greater Manchester', 53.541, -2.113],
  OX: ['Oxford', 'Oxfordshire', 51.752, -1.258],
  PA: ['Paisley', 'Renfrewshire', 55.846, -4.423],
  PE: ['Peterborough', 'Cambridgeshire', 52.573, -0.244],
  PH: ['Perth', 'Perthshire', 56.396, -3.437],
  PL: ['Plymouth', 'Devon', 50.376, -4.143],
  PO: ['Portsmouth', 'Hampshire', 50.805, -1.087],
  PR: ['Preston', 'Lancashire', 53.763, -2.703],
  RG: ['Reading', 'Berkshire', 51.454, -0.978],
  RH: ['Redhill', 'Surrey', 51.240, -0.170],
  RM: ['Romford', 'Greater London', 51.575, 0.183],
  S:  ['Sheffield', 'South Yorkshire', 53.381, -1.470],
  SA: ['Swansea', 'West Glamorgan', 51.622, -3.944],
  SE: ['London', 'Greater London', 51.480, -0.050],
  SG: ['Stevenage', 'Hertfordshire', 51.902, -0.202],
  SK: ['Stockport', 'Greater Manchester', 53.408, -2.158],
  SL: ['Slough', 'Berkshire', 51.511, -0.591],
  SM: ['Sutton', 'Greater London', 51.361, -0.194],
  SN: ['Swindon', 'Wiltshire', 51.559, -1.781],
  SO: ['Southampton', 'Hampshire', 50.909, -1.404],
  SP: ['Salisbury', 'Wiltshire', 51.069, -1.794],
  SR: ['Sunderland', 'Tyne and Wear', 54.906, -1.381],
  SS: ['Southend-on-Sea', 'Essex', 51.541, 0.710],
  ST: ['Stoke-on-Trent', 'Staffordshire', 53.003, -2.180],
  SW: ['London', 'Greater London', 51.465, -0.170],
  SY: ['Shrewsbury', 'Shropshire', 52.708, -2.754],
  TA: ['Taunton', 'Somerset', 51.015, -3.106],
  TD: ['Galashiels', 'Scottish Borders', 55.617, -2.808],
  TF: ['Telford', 'Shropshire', 52.678, -2.445],
  TN: ['Tonbridge', 'Kent', 51.195, 0.276],
  TQ: ['Torquay', 'Devon', 50.462, -3.525],
  TR: ['Truro', 'Cornwall', 50.263, -5.051],
  TS: ['Middlesbrough', 'North Yorkshire', 54.574, -1.235],
  TW: ['Twickenham', 'Greater London', 51.446, -0.331],
  UB: ['Southall', 'Greater London', 51.508, -0.377],
  W:  ['London', 'Greater London', 51.514, -0.190],
  WA: ['Warrington', 'Cheshire', 53.390, -2.597],
  WC: ['London', 'Greater London', 51.518, -0.120],
  WD: ['Watford', 'Hertfordshire', 51.657, -0.398],
  WF: ['Wakefield', 'West Yorkshire', 53.683, -1.505],
  WN: ['Wigan', 'Greater Manchester', 53.545, -2.632],
  WR: ['Worcester', 'Worcestershire', 52.193, -2.221],
  WS: ['Walsall', 'West Midlands', 52.586, -1.983],
  WV: ['Wolverhampton', 'West Midlands', 52.587, -2.128],
  YO: ['York', 'North Yorkshire', 53.960, -1.083],
  ZE: ['Lerwick', 'Shetland', 60.155, -1.145],

  /* Crown dependencies use ordinary areas (GY, JE, IM, above). Most Overseas
     Territories use a single fixed UK-format code each, so the whole code is
     the key. The three Caribbean territories whose own schemes happen not to
     collide with a UK area are here too. Everything that does collide is
     resolved from the region answer instead — see REGION_PLACES below. */
  AI:   ['The Valley', 'Anguilla', 18.217, -63.058],
  VG:   ['Road Town', 'British Virgin Islands', 18.428, -64.618],
  MSR:  ['Brades', 'Montserrat', 16.792, -62.211],
  GX:   ['Gibraltar', 'Gibraltar', 36.141, -5.353],
  FIQQ: ['Stanley', 'Falkland Islands', -51.696, -57.852],
  ASCN: ['Georgetown', 'Ascension Island', -7.930, -14.410],
  STHL: ['Jamestown', 'Saint Helena', -15.928, -5.717],
  TDCU: ['Edinburgh of the Seven Seas', 'Tristan da Cunha', -37.068, -12.311],
  TKCA: ['Cockburn Town', 'Turks and Caicos Islands', 21.467, -71.136],
  BBND: ['Diego Garcia', 'British Indian Ocean Territory', -7.313, 72.411],
  PCRN: ['Adamstown', 'Pitcairn Islands', -25.066, -130.101],
  SIQQ: ['King Edward Point', 'South Georgia', -54.283, -36.500],
  BIQQ: ['Rothera', 'British Antarctic Territory', -67.568, -68.127]
};

/* Territories whose respondents sit outside the UK view, so the map can say so. */
const OVERSEAS_KEYS = ['AI', 'VG', 'MSR', 'GX', 'FIQQ', 'ASCN', 'STHL', 'TDCU', 'TKCA',
                       'BBND', 'PCRN', 'SIQQ', 'BIQQ'];

/* Where each Crown Dependency and Overseas Territory sits, keyed by the region
   id in taxonomy.js.

   Several of them run postcode schemes whose prefixes collide head-on with UK
   areas: the Cayman Islands use KY1-1001 and KY is Kirkcaldy; Bermuda uses
   parish codes including CR (Croydon), FL (Falkirk), DD (Dundee) and SN
   (Swindon); the Sovereign Base Areas use BFPO. Read on its own, a Caymanian's
   postcode puts them in Fife. But nobody answers the postcode question without
   first answering the region question, and the two together are unambiguous —
   so the region is what decides, and the postcode only refines it. */
const REGION_PLACES = {
  akrotiri:      ['Episkopi Cantonment', 'Akrotiri and Dhekelia', 34.668, 32.864],
  anguilla:      ['The Valley', 'Anguilla', 18.217, -63.058],
  bermuda:       ['Hamilton', 'Bermuda', 32.294, -64.781],
  bat:           ['Rothera', 'British Antarctic Territory', -67.568, -68.127],
  biot:          ['Diego Garcia', 'British Indian Ocean Territory', -7.313, 72.411],
  bvi:           ['Road Town', 'British Virgin Islands', 18.428, -64.618],
  cayman:        ['George Town', 'Cayman Islands', 19.286, -81.367],
  falklands:     ['Stanley', 'Falkland Islands', -51.696, -57.852],
  gibraltar:     ['Gibraltar', 'Gibraltar', 36.141, -5.353],
  guernsey:      ['St Peter Port', 'Guernsey', 49.455, -2.536],
  isle_of_man:   ['Douglas', 'Isle of Man', 54.152, -4.486],
  jersey:        ['St Helier', 'Jersey', 49.187, -2.107],
  montserrat:    ['Brades', 'Montserrat', 16.792, -62.211],
  pitcairn:      ['Adamstown', 'Pitcairn Islands', -25.066, -130.101],
  st_helena:     ['Jamestown', 'Saint Helena', -15.928, -5.717],
  south_georgia: ['King Edward Point', 'South Georgia', -54.283, -36.500],
  turks_caicos:  ['Cockburn Town', 'Turks and Caicos Islands', 21.467, -71.136]
};

/* "SW1A" -> "SW", "M14" -> "M", "FIQQ" -> "FIQQ". */
function areaOf(outward) {
  const code = String(outward || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!code) return null;
  if (POSTCODE_AREAS[code]) return code;              // a whole-code territory
  const letters = (code.match(/^[A-Z]+/) || [])[0];
  return letters && POSTCODE_AREAS[letters] ? letters : null;
}

/* Resolve one response to a point. `regionId` is the answer to the region
   question and is optional, but without it a colliding territory postcode is
   read as the UK area it looks like.

   A respondent is only ever placed when they gave a postcode. Naming a
   territory is enough to say where the dot belongs, but not enough to say they
   wanted one, and the map's footnote counts responses placed by postcode. */
function locate(outward, regionId) {
  const area = areaOf(outward);
  const place = regionId ? REGION_PLACES[regionId] : null;

  if (place) {
    if (!outward) return null;
    /* A whole-code territory postcode is more specific than the region it sits
       in — ASCN and TDCU are both inside "Saint Helena, Ascension and Tristan
       da Cunha" — so prefer it when one was given. */
    if (area && OVERSEAS_KEYS.includes(area)) {
      const [town, county, lat, lon] = POSTCODE_AREAS[area];
      return { key: area, area, town, county, lat, lon, overseas: true };
    }
    const [town, county, lat, lon] = place;
    return { key: `region:${regionId}`, area, town, county, lat, lon, overseas: true };
  }

  if (!area) return null;
  const [town, county, lat, lon] = POSTCODE_AREAS[area];
  return { key: area, area, town, county, lat, lon, overseas: OVERSEAS_KEYS.includes(area) };
}

const POSTCODES = { POSTCODE_AREAS, OVERSEAS_KEYS, REGION_PLACES, areaOf, locate };
if (typeof module !== 'undefined' && module.exports) module.exports = POSTCODES;
if (typeof window !== 'undefined') window.POSTCODES = POSTCODES;
