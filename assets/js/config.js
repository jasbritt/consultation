/* =============================================================================
   config.js — everything you are likely to want to change lives here.
   Edit this file, commit, and the site updates. No build step.
   ========================================================================== */

const CONFIG = {

  /* --- The consultation itself ------------------------------------------- */
  consultation: {
    title: 'UK Youth Consultation for CHOGM',
    strapline: 'Young people’s priorities for the Commonwealth Heads of Government Meeting',
    /* Shown throughout the site. Confirm the host and dates before publishing. */
    chogmLabel: 'the next Commonwealth Heads of Government Meeting',
    opensOn: '2026-09-15',
    closesOn: '2026-12-12',
    targetResponses: 2000,
    contactEmail: 'youngambassadors@example.org'
  },

  /* --- The Google Form ----------------------------------------------------
     1. Run form/create-form.gs in script.google.com to build the form.
     2. Open the form, press Send, then the < > (embed) tab, and copy the src.
     3. Paste the /viewform?embedded=true URL below as `embedUrl`, and the plain
        share link as `shareUrl`.
     Until embedUrl is set the consultation page shows the setup instructions
     instead of an empty grey box.                                            */
  form: {
    embedUrl: '',                 // e.g. https://docs.google.com/forms/d/e/FORM_ID/viewform?embedded=true
    shareUrl: '',                 // e.g. https://forms.gle/xxxxxxxx
    estimatedMinutes: 9
  },

  /* --- Where the results come from ----------------------------------------
     In the responses spreadsheet: File > Share > Publish to web > choose the
     responses sheet > Comma-separated values (.csv) > Publish. Paste that URL
     here. It is a read-only, published-to-web link — no credentials involved,
     and it is the only way a static site can read the sheet.

     The results page also accepts, in order of precedence:
       1. ?csv=<url> in the address bar,
       2. a URL saved in this browser via the "Connect data" panel,
       3. this value,
       4. the bundled sample data (clearly badged as sample).                 */
  data: {
    publishedCsvUrl: '',
    sampleCsvUrl: 'assets/data/sample-responses.csv',
    /* Google's published-CSV endpoint sends permissive CORS headers, so the
       fetch works from any origin. If you ever host the sheet somewhere that
       does not, use the file-upload option on the results page instead. */
    refreshMinutes: 15
  },

  /* --- Partners -----------------------------------------------------------
     `assetPath` is empty by default and the site renders a typographic
     placeholder plate instead of a logo. Drop an official SVG or PNG into
     assets/img/logos/ and point `assetPath` at it once you have written
     permission to use that organisation's identity.                          */
  partners: [
    { name: 'UK Young Ambassadors',    short: 'UKYA',  assetPath: '', url: '' },
    { name: 'UK Youth Council',        short: 'UKYC',  assetPath: '', url: '' },
    { name: 'Department for Culture, Media and Sport', short: 'DCMS', assetPath: '', url: 'https://www.gov.uk/government/organisations/department-for-culture-media-and-sport' },
    { name: 'Foreign, Commonwealth & Development Office', short: 'FCDO', assetPath: '', url: 'https://www.gov.uk/government/organisations/foreign-commonwealth-development-office' },
    { name: 'National Youth Agency',   short: 'NYA',   assetPath: '', url: 'https://nya.org.uk/' },
    { name: 'The Commonwealth',        short: 'CW',    assetPath: '', url: 'https://thecommonwealth.org/' }
  ],

  /* Set to false once every partner above has approved their inclusion and you
     have replaced the placeholder plates with official assets. While true, the
     site carries a visible "draft — branding not yet approved" notice so nobody
     can mistake a work in progress for an endorsed government product.        */
  draftMode: true,

  /* --- The team ------------------------------------------------------------
     Replace with the real UK Young Ambassadors delegation. `role` is optional. */
  team: {
    intro:
      'We are the UK Young Ambassadors: a delegation of young people elected and ' +
      'selected to represent young people from across the four nations of the ' +
      'United Kingdom in international spaces, including the Commonwealth.',
    members: [
      { name: 'Add a name', role: 'UK Young Ambassador', nation: 'England',          bio: 'Replace this placeholder in assets/js/config.js.' },
      { name: 'Add a name', role: 'UK Young Ambassador', nation: 'Scotland',         bio: 'Replace this placeholder in assets/js/config.js.' },
      { name: 'Add a name', role: 'UK Young Ambassador', nation: 'Wales',            bio: 'Replace this placeholder in assets/js/config.js.' },
      { name: 'Add a name', role: 'UK Young Ambassador', nation: 'Northern Ireland', bio: 'Replace this placeholder in assets/js/config.js.' }
    ]
  },

  /* --- Data protection ----------------------------------------------------- */
  privacy: {
    controller: 'UK Young Ambassadors',
    dpoEmail: 'dataprotection@example.org',
    retentionMonths: 24,
    privacyNoticeUrl: 'privacy.html'
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
if (typeof window !== 'undefined') window.CONFIG = CONFIG;
