# Setup runbook

Everything you need to do to take this from a repository to a live consultation.
Allow about an hour for the first four steps.

---

## Before you publish — the checklist

- [ ] **1. Build the Google Form** (below)
- [ ] **2. Connect the form and the responses sheet** to `assets/js/config.js`
- [ ] **3. Replace the team placeholders** in `assets/js/config.js`
- [ ] **4. Get written permission for every logo** before adding it
- [ ] **5. Have the privacy notice reviewed** by whoever is data controller
- [ ] **6. Test a real submission** end to end
- [ ] **7. Check the results page** reads "not published yet" until the sheet is connected
- [ ] **8. Set `draftMode: false`** once 4 and 5 are genuinely done
- [ ] **9. Publish the site**

---

## 1. Build the Google Form

1. Go to [script.google.com](https://script.google.com) and start a new project.
2. Delete the placeholder code and paste in the whole of `form/create-form.gs`.
3. Save, then run `createConsultationForm`. Approve the permissions prompt — the
   script creates a form and a spreadsheet in your Drive and does nothing else.
4. Open **View → Logs**. It prints the form's edit URL, its share URL, its embed
   URL and the responses spreadsheet URL. Keep all four.

The form has 36 rating cells laid out as three grids. If you would rather have
one 0–10 question per policy area — longer, but easier on a phone — set
`USE_GRID_FOR_RATINGS = false` at the top of the script before running it. The
website reads either layout.

## 2. Connect it to the site

In the responses spreadsheet: **File → Share → Publish to web**, select the
responses sheet, choose **Comma-separated values (.csv)**, and press Publish.

Then edit `assets/js/config.js`:

```js
form: {
  embedUrl: 'https://docs.google.com/forms/d/e/FORM_ID/viewform?embedded=true',
  shareUrl: 'https://forms.gle/xxxxxxxx',
},
data: {
  publishedCsvUrl: 'https://docs.google.com/spreadsheets/d/e/.../pub?output=csv',
}
```

Publishing to the web makes the response data readable by anyone with the link.
That is unavoidable for a static site reading a sheet, and it is why the form
collects no names or email addresses. **Do not add an email question to the form
and then publish the sheet.**

If you would rather not publish the sheet at all, leave `publishedCsvUrl` empty
and use **Connect data → Upload a CSV** on the results page to load a download
from Sheets by hand. Nothing leaves the browser.

## 3. Replace the placeholders

In `assets/js/config.js`:

- `consultation` — dates, contact address, response target. Confirm the CHOGM
  host and dates before describing them anywhere on the site.
- `team.members` — the delegation. Name, role, photo path and a sentence each.
- `team.gallery` — photographs of the delegation's work, with captions.
- `privacy` — the data controller's name and a real contact address.

Images go in `assets/img/` — see the table in the README for the paths the site
looks for. Anything missing degrades to a lettermark, an initials avatar, or a
hidden section, so a missing file never renders broken.

## 4. Logos — read this before adding any

The site ships with **typographic placeholder plates**, not logos. Government
and charity identities are protected, and using a department's logo implies its
endorsement.

Before you add any organisation's mark:

- get **written permission** from that organisation's communications team;
- ask for their **official asset** and their brand guidelines — do not recreate
  a logo, download one from a search engine, or approximate one;
- check any conditions they attach (minimum size, clear space, whether the mark
  may appear alongside others, whether "in partnership with" is accurate).

Then drop the file into `assets/img/logos/` and point `assetPath` at it:

```js
{ name: 'National Youth Agency', short: 'NYA', assetPath: 'assets/img/logos/nya.svg', url: 'https://nya.org.uk/' }
```

Until then, leave `assetPath` empty. While `draftMode: true` the site carries a
visible notice saying the branding is not approved and no endorsement is implied.
**Do not set `draftMode: false` until every logo on the page is there with
permission.** If a partner has agreed to be named but not to supply a logo, leave
the plate: a name in text is a much weaker claim than a crest.

## 5. Privacy notice

`privacy.html` is a working template, not legal advice. Whoever is acting as data
controller must review it. Pay particular attention to:

- the retention period, which must match what you actually do;
- the honest limitation that anonymous responses usually cannot be individually
  deleted on request;
- the under-13 position — the form is for 13–25, and responses recording an age
  under 13 should be deleted from the spreadsheet before analysis. Do this
  manually as part of the weekly check below; the site does not filter them for
  you, because silently dropping rows is worse than deleting them deliberately.

## 6. Test it

1. Submit one full response through the embedded form on `consultation.html`.
2. Open `results.html`. Your answer should appear in the totals and on the map.
3. Open the **Diagnostics** panel at the bottom of the results page. Every
   question should be matched to a column and nothing should be listed as unused.
4. Delete your test row from the spreadsheet.

If a rating column shows as unmatched, the wording in the form has drifted from
`assets/js/taxonomy.js`. Run `node scripts/check-taxonomy.js` to see exactly
which.

## 7. The sample data

You do not have to do anything here. The results page never shows the sample on
its own: with nothing connected it says the results are not published yet, and
if a live connection breaks it says so rather than quietly substituting
synthetic numbers. A visitor cannot tell the difference between real and
synthetic figures, and nor can a screenshot of them.

To see the sample deliberately — designing the page, or demonstrating it before
any responses exist — add `?sample=1` to the results URL:

```
results.html?sample=1
```

It is badged as sample data in the status pill and under the response count.

The file is also what `scripts/check-data.js` runs against, so deleting it costs
you that check. If you want it gone from the deployed site anyway:

```bash
rm assets/data/sample-responses.csv     # regenerate: node scripts/make-sample-data.js
```

---

## Publishing the site

It is plain HTML, CSS and JavaScript with no build step and no dependencies, so
anything that serves files will do.

**GitHub Pages:** Settings → Pages → Deploy from a branch → pick the branch and
`/ (root)`.

**Netlify, Cloudflare Pages, Vercel:** drag the folder in, or connect the repo.
No build command, publish directory `/`.

**A department's own hosting:** copy the folder. There is nothing to install.

Locally:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Use a server rather than opening the files
directly — `file://` blocks the `fetch` that loads the response data.

---

## While the consultation is open

**Weekly:**
- Delete any responses recording an age under 13, and any obvious duplicates or
  abuse, from the responses spreadsheet.
- Check the results page still loads and the diagnostics panel is clean.
- Look at the region map. Wherever the tile is pale, that is where to push next.

**Before each promotion push,** use the region filter to check the base size in
the area you are targeting, so you can say honestly how well represented it is.

**Do not** edit question wording once responses have started arriving. It changes
the spreadsheet column header and splits the data into two columns. If you
absolutely must, run `node scripts/check-taxonomy.js` afterwards and expect to
merge columns by hand.

---

## Checks you can run

```bash
node scripts/check-headers.js FILE  # every question still finds its column
node scripts/check-data.js          # parse the data and print what was found
node scripts/check-taxonomy.js      # form and site content still agree
node scripts/make-questions-doc.js  # regenerate form/QUESTIONS.md
node scripts/make-sample-data.js    # regenerate the synthetic sample data
```

`check-data.js` takes an optional path, so you can point it at a real export:

```bash
node scripts/check-data.js ~/Downloads/responses.csv
```

### After any change to the form

Reword a question in Google Forms and the site keeps up, because no column is
matched on its exact text. But a heavy rewrite can still lose one, and the
failure is quiet — the chart reads "No answers to this question yet" rather
than erroring. So after editing the form, check the header row:

```bash
node scripts/check-headers.js ~/Downloads/responses.csv
```

It needs row 1 of the responses sheet and nothing else, so you can also just
copy that row and paste it in:

```bash
pbpaste | node scripts/check-headers.js     # then Ctrl-D
```

It prints every question against the column it matched, flags any it could not
place, and lists columns the analysis ignores.
