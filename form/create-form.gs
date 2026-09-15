/**
 * create-form.gs — builds the whole consultation as a Google Form.
 *
 * HOW TO USE
 *   1. Go to https://script.google.com and start a new project.
 *   2. Delete the placeholder code, paste this file in, and save.
 *   3. Run createConsultationForm(). Approve the permissions prompt the first
 *      time — the script needs to create a form and a spreadsheet in your Drive.
 *   4. The execution log prints three URLs: the form's edit link, its public
 *      link, and the linked responses spreadsheet. Copy them into
 *      assets/js/config.js.
 *
 * WHY A SCRIPT RATHER THAN CLICKING IT TOGETHER
 *   There are 36 rating cells, 14 checkbox options and 56 country options. Built
 *   by hand, the question wording drifts from the wording the website matches
 *   against, and the charts quietly stop finding their columns. Generating the
 *   form guarantees the spreadsheet headers are exactly what assets/js/data.js
 *   expects.
 *
 * KEEP IN STEP WITH THE SITE
 *   The lists below mirror assets/js/taxonomy.js. Apps Script cannot import from
 *   the repository, so the two copies are checked by scripts/check-taxonomy.js —
 *   run `node scripts/check-taxonomy.js` after editing either file.
 */

/* ---------------------------------------------------------------------------
   Options
--------------------------------------------------------------------------- */

/** true  -> one grid per battery (compact: 3 questions, scrolls sideways on a phone)
 *  false -> one 0–10 scale question per policy area (36 questions, easier on a
 *           phone, noticeably longer). Either shape produces headers the site
 *           can match. */
var USE_GRID_FOR_RATINGS = true;

/** Create a linked responses spreadsheet automatically. */
var CREATE_RESPONSES_SHEET = true;

var FORM_TITLE = 'UK Youth Consultation — your priorities for the UK and the Commonwealth';

var FORM_DESCRIPTION =
  'Run by the UK Young Ambassadors. Your answers go to UK government departments and into the ' +
  'delegation’s position at the Commonwealth Heads of Government Meeting.\n\n' +
  'It takes about 9 minutes. You do not have to give your name or email address, and you can skip ' +
  'any question. Open to anyone aged 13 to 25 living in the UK or in a Commonwealth country.';

/* ---------------------------------------------------------------------------
   Content — mirrors assets/js/taxonomy.js
--------------------------------------------------------------------------- */

var POLICY_AREAS = [
  'Mental health and wellbeing',
  'Youth services and safe places to go',
  'Education and curriculum for life',
  'Jobs, apprenticeships and work experience',
  'Cost of living and financial security',
  'Transport and getting around',
  'Housing and a place to live',
  'Crime, safety and policing',
  'Equality, discrimination and racism',
  'Climate and the environment',
  'Democracy and youth voice',
  'Digital life and online safety'
];

var REINTRODUCE_OPTIONS = [
  'Education Maintenance Allowance (EMA) or an equivalent payment for 16–19 study',
  'Free or capped bus travel for under-25s',
  'Funded open-access youth clubs and youth workers in every area',
  'Sure Start style family and early years centres',
  'Independent careers advice in every school (a Connexions style service)',
  'Guaranteed work experience placements for every pupil',
  'Arts, music and drama in the curriculum, and free or low-cost music tuition',
  'Free school meals for more pupils, and holiday food provision',
  'A school nurse and a trained counsellor in every school',
  'Restored further education and adult skills funding, and lower tuition fees',
  'Funded national youth voice structures (a British Youth Council style body)',
  'Community sports facilities, playing fields and free swimming',
  'Cheaper rail travel and a wider young persons railcard',
  'Local libraries and community spaces with longer opening hours'
];

var UK_REGIONS = [
  'Scotland', 'Northern Ireland', 'North East England', 'North West England',
  'Yorkshire and the Humber', 'Wales', 'West Midlands', 'East Midlands',
  'East of England', 'South West England', 'South East England', 'London'
];

var AGE_BANDS = ['Under 13', '13 to 15', '16 to 18', '19 to 21', '22 to 25', 'Over 25'];

var COMMONWEALTH_COUNTRIES = [
  'Antigua and Barbuda', 'Australia', 'Bangladesh', 'Barbados', 'Belize', 'Botswana',
  'Brunei Darussalam', 'Cameroon', 'Canada', 'Cyprus', 'Dominica', 'Eswatini', 'Fiji',
  'Gabon', 'Ghana', 'Grenada', 'Guyana', 'India', 'Jamaica', 'Kenya', 'Kiribati',
  'Lesotho', 'Malawi', 'Malaysia', 'Maldives', 'Malta', 'Mauritius', 'Mozambique',
  'Namibia', 'Nauru', 'New Zealand', 'Nigeria', 'Pakistan', 'Papua New Guinea',
  'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'Seychelles', 'Sierra Leone', 'Singapore', 'Solomon Islands', 'South Africa',
  'Sri Lanka', 'The Bahamas', 'The Gambia', 'Togo', 'Tonga', 'Trinidad and Tobago',
  'Tuvalu', 'Uganda', 'United Kingdom', 'United Republic of Tanzania', 'Vanuatu', 'Zambia'
];

/* The three rating batteries. `title` becomes the spreadsheet column prefix, so
   it must stay in step with matchTokens in assets/js/taxonomy.js. */
var BATTERIES = [
  {
    id: 'performance',
    section: 'How well things work today',
    title: 'Thinking about young people you know, how well is each of these working for young people right now?',
    help: '0 means it is not working at all. 10 means it is working very well. Answer for young people generally, not only for yourself.',
    low: 'Not working at all',
    high: 'Working very well'
  },
  {
    id: 'long_term',
    section: 'What matters for the long term',
    title: 'How important is each of these to a young person’s long-term future — the next ten to fifteen years?',
    help: '0 means not important. 10 means critically important.',
    low: 'Not important',
    high: 'Critically important'
  },
  {
    id: 'short_term',
    section: 'What is urgent right now',
    title: 'How urgent is each of these for young people over the next twelve months?',
    help: '0 means not urgent. 10 means extremely urgent. Something can be urgent without being the most important thing in the long run — that difference is exactly what we are trying to measure.',
    low: 'Not urgent',
    high: 'Extremely urgent'
  }
];

var SCALE_COLUMNS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

/* ---------------------------------------------------------------------------
   Build
--------------------------------------------------------------------------- */

function createConsultationForm() {
  var form = FormApp.create(FORM_TITLE);
  form.setDescription(FORM_DESCRIPTION)
      .setCollectEmail(false)
      .setLimitOneResponsePerUser(false)
      .setProgressBar(true)
      .setShowLinkToRespondAgain(false)
      .setConfirmationMessage(
        'Thank you. Your answers are now part of the evidence we take to government.\n\n' +
        'You can see the results as they come in, and read the report we produce from them, on the ' +
        'consultation website.');

  addAboutYou_(form);
  addBringItBack_(form);
  addBiggestProblem_(form);
  BATTERIES.forEach(function (battery) { addRatingBattery_(form, battery); });
  addCommonwealth_(form);
  addEqualities_(form);

  var log = [
    '',
    'FORM CREATED',
    '  Edit:    ' + form.getEditUrl(),
    '  Share:   ' + form.getPublishedUrl(),
    '  Embed:   ' + form.getPublishedUrl().replace('/viewform', '/viewform?embedded=true')
  ];

  if (CREATE_RESPONSES_SHEET) {
    var ss = SpreadsheetApp.create(FORM_TITLE + ' (responses)');
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    log.push('  Responses sheet: ' + ss.getUrl());
    log.push('');
    log.push('NEXT: in that spreadsheet choose File > Share > Publish to web, select the responses');
    log.push('sheet, pick "Comma-separated values (.csv)", publish, and paste the URL into');
    log.push('assets/js/config.js as data.publishedCsvUrl.');
  }

  log.push('');
  log.push('Paste the Embed URL into config.js as form.embedUrl, and the Share URL as form.shareUrl.');
  Logger.log(log.join('\n'));
  return form.getEditUrl();
}

/* ---------- sections ------------------------------------------------------ */

function addAboutYou_(form) {
  form.addPageBreakItem()
      .setTitle('About you')
      .setHelpText('None of this identifies you. Every question here can be skipped.');

  form.addMultipleChoiceItem()
      .setTitle('What is your age?')
      .setChoiceValues(AGE_BANDS)
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Which nation or region of the UK do you live in?')
      .setChoiceValues(UK_REGIONS.concat(['I live outside the UK']))
      .setHelpText('If you are not sure which region you are in, pick the nearest large city’s region.')
      .setRequired(true);

  form.addListItem()
      .setTitle('If you live outside the UK, which country do you live in?')
      .setChoiceValues(COMMONWEALTH_COUNTRIES.concat(['Another country not listed']))
      .setHelpText('Leave blank if you live in the UK.')
      .setRequired(false);

  form.addTextItem()
      .setTitle('The first part of your postcode only, for example SW1A (optional)')
      .setHelpText('We use this to check which parts of the country we have reached. It cannot identify you, ' +
                   'and it is never published — only regional totals are.')
      .setRequired(false);

  form.addMultipleChoiceItem()
      .setTitle('Are you currently involved with a youth council, youth group or youth organisation?')
      .setChoiceValues(['Yes', 'No', 'Prefer not to say'])
      .setHelpText('This helps us see how far beyond the usual voices we have reached.')
      .setRequired(false);
}

function addBringItBack_(form) {
  form.addPageBreakItem()
      .setTitle('Bring it back')
      .setHelpText('Things that existed for young people and were cut, closed or withdrawn.');

  var checkbox = form.addCheckboxItem()
      .setTitle('What are the top three things you want the government to bring back for young people?')
      .setChoiceValues(REINTRODUCE_OPTIONS)
      .setHelpText('Choose up to three.')
      .setRequired(true);
  checkbox.setValidation(
    FormApp.createCheckboxValidation()
      .setHelpText('Please choose no more than three.')
      .requireSelectAtMost(3)
      .build());

  form.addParagraphTextItem()
      .setTitle('Is there anything else you would bring back that is not on that list?')
      .setRequired(false);
}

function addBiggestProblem_(form) {
  form.addPageBreakItem()
      .setTitle('The biggest problem')
      .setHelpText('Two questions with the same shape — one about home, one about the Commonwealth — ' +
                   'so the answers can be compared.');

  form.addMultipleChoiceItem()
      .setTitle('What is the biggest problem facing young people across the UK today?')
      .setChoiceValues(POLICY_AREAS.concat(['Something else']))
      .setRequired(true);

  form.addParagraphTextItem()
      .setTitle('In your own words, why did you choose that for the UK?')
      .setHelpText('Answers to this question may be quoted anonymously in the published report.')
      .setRequired(false);

  form.addMultipleChoiceItem()
      .setTitle('What is the biggest problem facing young people across the Commonwealth today?')
      .setChoiceValues(POLICY_AREAS.concat(['Something else']))
      .setHelpText('The Commonwealth is 56 member states across Africa, Asia, the Caribbean and Americas, ' +
                   'Europe and the Pacific — about 2.7 billion people, more than half of them under 30.')
      .setRequired(true);

  form.addParagraphTextItem()
      .setTitle('In your own words, why did you choose that for the Commonwealth?')
      .setRequired(false);
}

function addRatingBattery_(form, battery) {
  form.addPageBreakItem()
      .setTitle(battery.section)
      .setHelpText(battery.help);

  if (USE_GRID_FOR_RATINGS) {
    form.addGridItem()
        .setTitle(battery.title)
        .setRows(POLICY_AREAS)
        .setColumns(SCALE_COLUMNS)
        .setHelpText('0 = ' + battery.low + '   ·   10 = ' + battery.high)
        .setRequired(false);
  } else {
    /* One scale per area. The battery title is repeated in each question title
       so the spreadsheet header still identifies which battery it belongs to. */
    POLICY_AREAS.forEach(function (area) {
      form.addScaleItem()
          .setTitle(battery.title + ' — ' + area)
          .setBounds(0, 10)
          .setLabels(battery.low, battery.high)
          .setRequired(false);
    });
  }
}

function addCommonwealth_(form) {
  form.addPageBreakItem()
      .setTitle('The Commonwealth and CHOGM')
      .setHelpText('What the delegation should take into the room.');

  var priorities = form.addCheckboxItem()
      .setTitle('Which of these should the UK push hardest on across the Commonwealth?')
      .setChoiceValues(POLICY_AREAS)
      .setHelpText('Choose up to three.')
      .setRequired(false);
  priorities.setValidation(
    FormApp.createCheckboxValidation()
      .setHelpText('Please choose no more than three.')
      .requireSelectAtMost(3)
      .build());

  form.addParagraphTextItem()
      .setTitle('If you could say one thing directly to the Heads of Government, what would it be?')
      .setHelpText('Answers may be quoted anonymously in the published report and read aloud at the summit. ' +
                   'Please do not include anything that identifies you or anyone else.')
      .setRequired(false);
}

function addEqualities_(form) {
  form.addPageBreakItem()
      .setTitle('About you (optional)')
      .setHelpText('These questions let us check who we have and have not reached, and report honestly on it. ' +
                   'Every one is optional.');

  form.addMultipleChoiceItem()
      .setTitle('Which of these best describes your gender?')
      .setChoiceValues(['Female', 'Male', 'Non-binary', 'I describe myself another way', 'Prefer not to say'])
      .setRequired(false);

  form.addMultipleChoiceItem()
      .setTitle('Which of these best describes your ethnic background?')
      .setChoiceValues([
        'Asian or Asian British',
        'Black, Black British, Caribbean or African',
        'Mixed or multiple ethnic groups',
        'White',
        'Other ethnic group',
        'Prefer not to say'])
      .setRequired(false);

  form.addMultipleChoiceItem()
      .setTitle('Do you have a disability or a long-term health condition?')
      .setChoiceValues(['Yes', 'No', 'Prefer not to say'])
      .setRequired(false);

  form.addMultipleChoiceItem()
      .setTitle('Which best describes what you are doing at the moment?')
      .setChoiceValues([
        'In school or college',
        'At university',
        'Apprenticeship or training',
        'Working',
        'Not in education, employment or training',
        'Prefer not to say'])
      .setRequired(false);

  form.addMultipleChoiceItem()
      .setTitle('Have you ever been in care, or are you care experienced?')
      .setChoiceValues(['Yes', 'No', 'Prefer not to say'])
      .setRequired(false);

  form.addMultipleChoiceItem()
      .setTitle('I have read the privacy notice and I am happy for my answers to be used in this consultation')
      .setChoiceValues(['Yes'])
      .setHelpText('Your answers are anonymous, are reported only as totals and anonymous quotations, and are ' +
                   'deleted after 24 months.')
      .setRequired(true);
}
