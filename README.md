# UK Youth Consultation for CHOGM

A consultation platform for the UK Young Ambassadors: a public website with an
embedded Google Form and a live results dashboard with maps and charts, built to
gather young people's priorities for the UK and the Commonwealth.

Plain HTML, CSS and JavaScript. **No build step, no dependencies, no server.**
Anything that serves static files will host it.

---

## What is here

| Page | What it does |
| --- | --- |
| `index.html` | Who the delegation is, why the consultation exists, what happens to responses |
| `consultation.html` | The embedded Google Form, plus every question published up front |
| `results.html` | Live dashboard — response map, ratings, priority gap, filters, data download |
| `privacy.html` | Data protection notice (a template — have it reviewed) |

## The questions

Five substantive sections, about nine minutes:

1. **Bring it back** — the top three things to reintroduce for young people, from
   fourteen options naming provision that was actually withdrawn (EMA, youth
   clubs, school counsellors, capped bus fares, Sure Start, careers advice…).
2. **The biggest problem** — facing young people in the UK, and facing young
   people across the Commonwealth, asked identically so they can be compared.
3. **How well it works today** — all twelve policy areas rated 0–10.
4. **Long-term importance** — the same twelve rated 0–10.
5. **Short-term urgency** — the same twelve rated 0–10.

Plus demographics and a free-text question: *if you could say one thing directly
to the Heads of Government, what would it be?*

The twelve policy areas are adapted from the priority areas carried by the
British Youth Council and the UK Youth Parliament, so the results can be set
against existing youth-voice evidence rather than starting from scratch.

The full question list is in **[`form/QUESTIONS.md`](form/QUESTIONS.md)**. The
reasoning behind the wording — including why the rating question is asked three
times rather than once — is in **[`docs/METHODOLOGY.md`](docs/METHODOLOGY.md)**.

## The analysis

Asking only "how important is this?" produces a list on which everything is
important. Asking about delivery alongside importance produces something a
department can act on:

- **Priority gap** = long-term importance − how well it works today.
  A large positive gap is an area young people say matters enormously and is
  being delivered badly. This is the headline number in the report.
- **Horizon split** = long-term importance − short-term urgency.
  Separates crises to manage from where preventative investment belongs.

Both are computed in `assets/js/data.js`. Use **Download aggregates** on the
results page to pull every figure out as a CSV for writing up.

## Images

The site expects five image files. Any that are missing degrade gracefully — the
header falls back to a lettermark, a member without a photo gets an initials
avatar, and a carousel photo that fails to load drops out of the carousel (with
the whole section removing itself if none load) — so nothing ever renders
broken.

| Path | What it is |
| --- | --- |
| `assets/img/logos/ukya-logo.png` | The UKYA logo, used in the header and the partner strip |
| `assets/img/team/jasmine-brittan.jpg` | Team photo |
| `assets/img/team/falak-raja.jpg` | Team photo |
| `assets/img/work/commonwealth-youth-forum-samoa.jpg` | Carousel photo |
| `assets/img/work/youth-forum-opening-samoa.jpg` | Carousel photo |
| `assets/img/work/chogm-reception.jpg` | Carousel photo |
| `assets/img/work/commonwealth-secretary-general.jpg` | Carousel photo |
| `assets/img/work/commonwealth-meeting-speaking.jpg` | Carousel photo |
| `assets/img/work/for-youth-rights.jpg` | Carousel photo |
| `assets/img/work/cop27-sharm-el-sheikh.jpg` | Carousel photo |

The carousel crops to a wide frame. If a photo crops badly — a portrait one, for
instance — give its entry a `focus` in `config.js` (any CSS `object-position`,
such as `'center 25%'` to favour the top of the image).

If your files are a different format, either rename them to match or change the
paths in `assets/js/config.js` (`brand.logo`, `team.members[].photo`,
`team.gallery[].src`).

## Getting started

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

Out of the box it runs on bundled **synthetic sample data**, badged as such on
every page, so you can see the whole thing working before a single real response
exists.

To connect the real thing, follow **[`docs/SETUP.md`](docs/SETUP.md)**. In short:
run `form/create-form.gs` in Google Apps Script to build the form, publish the
responses sheet to the web as CSV, and paste two URLs into
`assets/js/config.js`.

## Publishing on GitHub Pages

The repository is already the source of truth for the site. To put it online:

1. Go to **Settings → Pages** in the repository.
2. Under **Build and deployment**, set *Source* to **Deploy from a branch**.
3. Pick the branch the site lives on and the **`/ (root)`** folder, then **Save**.

Within a minute or two the site is live at
`https://<username>.github.io/consultation/`. Every push to that branch
redeploys it automatically.

All paths in the site are relative, so it works correctly from a subpath like
`/consultation/` without any base-URL configuration. The empty `.nojekyll` file
in the root tells Pages to serve the files as they are rather than running them
through Jekyll.

### Updating the live site without using git

The two files most likely to need changing — `assets/js/config.js` and anything
under `assets/img/` — can be edited straight from the GitHub web interface, with
no local tooling:

- **To edit config.js:** open it in the repository, click the pencil icon,
  make the change and press *Commit changes*.
- **To add images:** open `assets/img/work/` (or `team/`, `logos/`), then use
  **Add file → Upload files** and drag them in.

Each commit redeploys the site. This matters because a local copy of the folder
and the repository can drift apart: treat the repository as authoritative, and
the live site always matches it.

## Two things to read before you publish

**Logos.** The site ships with typographic placeholder plates, not logos. Do not
add any organisation's mark — DCMS, FCDO, NYA, or anyone else — without written
permission from that organisation. A department's logo on a page implies its
endorsement. While `draftMode: true` in `config.js`, the site carries a visible
notice saying the branding is not approved and no endorsement is implied. Turn it
off only when that is genuinely no longer true.

**The privacy notice** in `privacy.html` is a working template, not legal advice.
It needs reviewing by whoever is acting as data controller.

## Project layout

```
index.html  consultation.html  results.html  privacy.html
assets/
  css/site.css            design tokens, light and dark
  css/print.css           PDF and paper output
  js/config.js            ← everything you are likely to change
  js/taxonomy.js          the questions, as data (single source of truth)
  js/csv.js               RFC 4180 parser
  js/data.js              column matching, normalisation, aggregation
  js/charts.js            SVG chart library (bar, diverging, dumbbell, scatter)
  js/map.js               UK tile cartogram
  js/results.js           the dashboard
  data/sample-responses.csv   synthetic — delete before going live
form/
  create-form.gs          builds the whole Google Form in one run
  QUESTIONS.md            generated question list
docs/
  SETUP.md                the runbook
  METHODOLOGY.md          survey design, analysis, limitations
scripts/
  check-data.js           parse a CSV and report what was found
  check-taxonomy.js       form and site content still agree
  make-questions-doc.js   regenerate QUESTIONS.md
  make-sample-data.js     regenerate the sample data
```

## Checks

```bash
node scripts/check-data.js         # end-to-end: parse, match, aggregate
node scripts/check-taxonomy.js     # the form and the site still agree
```

`check-taxonomy.js` matters more than it sounds. Google names each spreadsheet
column after the full question text, so editing a word in the form can silently
orphan a chart. That script builds the exact headers the form will produce and
runs them through the real column matcher — in both the grid and the scale-item
layouts — so drift is caught before it reaches the data.

`check-data.js` accepts a path, so you can point it at a real export:

```bash
node scripts/check-data.js ~/Downloads/responses.csv
```

## Design notes

- **Charts are hand-written SVG**, not a library. The same marks have to survive
  dark mode and a black-and-white printer, so the mark specs (≤24px bars, 4px
  rounded data-ends, 2px surface gaps, hairline grid) are held exactly, and there
  is no CDN to depend on.
- **Colour follows the data's job**: one hue light-to-dark for magnitude on the
  map, two hues either side of a neutral zero for the priority gap, a fixed
  categorical order everywhere else. Every chart has a table view, so identity is
  never carried by colour alone.
- **The map is a tile cartogram, not a geographic outline.** On a real map of the
  UK, London is a dot and the Highlands are enormous, so a gradient reads as "the
  countryside answered" when the opposite is true. Equal-area tiles give every
  nation and region the same visual weight, which is the honest encoding when the
  quantity is "how many young people replied".
- **Column matching is fuzzy on purpose.** Each spreadsheet header is scored
  against the taxonomy rather than matched exactly, so editing a question's
  wording does not break the charts. The results page exposes the resulting map
  in a diagnostics panel, so a mismatch is visible rather than silent.
- **Small bases are flagged.** Any chart drawn from fewer than 30 responses says
  so on its face.
