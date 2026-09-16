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
    contactEmail: 'ukyoungambassadors@gmail.com'
  },

  /* --- Brand ---------------------------------------------------------------
     The header mark. If the file is missing the site falls back to a plain
     "UKYA" lettermark, so a broken path never leaves a gap in the header. */
  brand: {
    logo: 'assets/img/logos/ukya-logo.png',
    logoAlt: 'UK Young Ambassadors'
  },

  /* --- The Google Form ----------------------------------------------------
     1. Run form/create-form.gs in script.google.com to build the form.
     2. Open the form, press Send, then the < > (embed) tab, and copy the src.
     3. Paste the /viewform?embedded=true URL below as `embedUrl`, and the plain
        share link as `shareUrl`.
     Until embedUrl is set the consultation page shows the setup instructions
     instead of an empty grey box.                                            */
  form: {
    embedUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdeFgnkACJoToeW_YFtPyAwqFRkYW4p0q-PypPwii--lEhPVg/viewform?embedded=true',
    shareUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdeFgnkACJoToeW_YFtPyAwqFRkYW4p0q-PypPwii--lEhPVg/viewform',
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
    /* The responses sheet published to the web as CSV. This is a read-only
       published link, not the private edit link, which is what makes it
       readable by a static site. The underlying spreadsheet is
       https://docs.google.com/spreadsheets/d/1K0_3oKBKgHF_7wfpP8Wn6C6f3Hh4E2EqE2TaSCYwGsw/edit */
    publishedCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRd5PnyFcqgSkTtx_-7igsfm2BoOms0wZuX7IxnuzJn8Zj5uA7_lynyBDObXdPb9ABeqiX-MTMUN9EX/pub?gid=725590805&single=true&output=csv',
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
    { name: 'UK Young Ambassadors',    short: 'UKYA',  assetPath: 'assets/img/logos/ukya-logo.png', url: 'https://nya.org.uk/ukya/' },
    { name: 'Youth Council UK',        short: 'YCUK',  assetPath: '', url: 'https://nya.org.uk/youth-council-uk/' },
    { name: 'Department for Culture, Media and Sport', short: 'DCMS', assetPath: '', url: 'https://www.gov.uk/government/organisations/department-for-culture-media-and-sport' },
    { name: 'Foreign, Commonwealth & Development Office', short: 'FCDO', assetPath: '', url: 'https://www.gov.uk/government/organisations/foreign-commonwealth-development-office' },
    { name: 'National Youth Agency',   short: 'NYA',   assetPath: '', url: 'https://nya.org.uk/' },
    { name: 'The Commonwealth',        short: 'CW',    assetPath: '', url: 'https://thecommonwealth.org/' },
    { name: 'CHOGM Antigua and Barbuda 2026', short: 'CHOGM', assetPath: 'assets/img/logos/chogm-2026.png', url: '' }
  ],

  /* Partner organisations without an `assetPath` above are shown as a plain
     text name plate rather than a logo. Add an organisation's official asset
     only once you have its permission to use its identity.                    */
  draftMode: false,

  /* --- The team ------------------------------------------------------------
     `photo` is optional — a member without one gets an initials avatar, so the
     page never shows a broken image.                                          */
  team: {
    intro:
      'The UK Young Ambassadors (UKYA) represent the voices of young people from across the UK in ' +
      'European and Commonwealth institutes, policy places, and forums. The Young Ambassadors are ' +
      'elected in by youth organisations to represent UK young people and serve a term of three years.',
    members: [
      {
        name: 'Jasmine Brittan',
        role: 'UK Young Ambassador to the Commonwealth',
        photo: 'assets/img/team/jasmine-brittan.jpg'
      },
      {
        name: 'Falak Raja',
        role: 'UK Young Ambassador to the Commonwealth',
        photo: 'assets/img/team/falak-raja.jpg'
      }
    ],

    /* Links shown under the team, describing the wider programme. */
    links: [
      { label: 'UK Young Ambassadors', url: 'https://nya.org.uk/ukya/',
        blurb: 'The programme we are part of, run by the National Youth Agency.' },
      { label: 'Youth Council UK', url: 'https://nya.org.uk/youth-council-uk/',
        blurb: 'The national youth voice structure we work alongside across the four nations.' }
    ],

    /* Photographs of the delegation's work, shown as a carousel under the hero.
       Drop the files into assets/img/work/ and add a row here; any entry whose
       file is missing is removed from the carousel rather than shown broken.
       Photos are cropped to a wide frame — if one crops badly, give it a
       `focus` (any CSS object-position, e.g. 'center 25%' to favour the top). */
    gallery: [
      {
        src: 'assets/img/work/commonwealth-youth-forum-samoa.jpg',
        alt: 'Six delegates in front of the Commonwealth Youth Forum banner in Apia, Samoa.',
        caption: 'Commonwealth Youth Forum, Apia, Samoa, October 2024',
        focus: 'center 30%'
      },
      {
        src: 'assets/img/work/chogm-reception.jpg',
        alt: 'A large group of Commonwealth youth delegates in front of a CHOGM backdrop at a reception.',
        caption: 'Commonwealth youth delegates at a CHOGM reception'
      },
      {
        src: 'assets/img/work/for-youth-rights.jpg',
        alt: 'Three young people holding an orange flag reading "for youth rights".',
        caption: 'Campaigning for youth rights',
        focus: 'center 35%'
      },
      {
        src: 'assets/img/work/cop27-sharm-el-sheikh.jpg',
        alt: 'Two delegates in front of the COP27 sign at Sharm El-Sheikh, Egypt.',
        caption: 'COP27, Sharm El-Sheikh, Egypt, 2022',
        focus: 'center 35%'
      }
      /* The canoe procession at the opening of the Commonwealth Youth Forum has
         not been uploaded. To add it, put the file at
         assets/img/work/youth-forum-opening-samoa.jpg and uncomment this:
      ,{
        src: 'assets/img/work/youth-forum-opening-samoa.jpg',
        alt: 'Delegates carried on a decorated traditional canoe across the water at the opening of the Commonwealth Youth Forum.',
        caption: 'Arriving at the opening of the Commonwealth Youth Forum, Samoa'
      }
      */
    ]
  },

  /* --- Data protection ----------------------------------------------------- */
  privacy: {
    controller: 'UK Young Ambassadors',
    dpoEmail: 'ukyoungambassadors@gmail.com',
    retentionMonths: 24,
    privacyNoticeUrl: 'privacy.html'
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
if (typeof window !== 'undefined') window.CONFIG = CONFIG;
