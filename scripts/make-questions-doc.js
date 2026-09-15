/* =============================================================================
   make-questions-doc.js — writes form/QUESTIONS.md from the taxonomy, so the
   published question list can never disagree with the analysis.
   Run: node scripts/make-questions-doc.js
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const T = require('../assets/js/taxonomy.js');

const L = [];
const bullet = items => items.forEach(i => L.push(`- ${i}`));

L.push('# The consultation questions');
L.push('');
L.push('> Generated from `assets/js/taxonomy.js` by `node scripts/make-questions-doc.js`.');
L.push('> Edit the taxonomy, not this file. The Google Form is generated from the same');
L.push('> content by `form/create-form.gs`.');
L.push('');
L.push('Estimated completion time: about nine minutes. Required questions are marked.');
L.push('');

L.push('## Section 1 — About you');
L.push('');
L.push('**What is your age?** *(required)*');
L.push('');
bullet(T.AGE_BANDS.map(b => b.label));
L.push('');
L.push('**Which nation or region of the UK do you live in?** *(required)*');
L.push('');
bullet(T.UK_REGIONS.map(r => r.label).concat(['I live outside the UK']));
L.push('');
L.push('**If you live outside the UK, which country do you live in?**');
L.push('');
L.push(`A dropdown of the ${T.COMMONWEALTH_COUNTRIES.length} Commonwealth member states, plus "another country not listed".`);
L.push('');
L.push('**The first part of your postcode only, for example SW1A** *(optional)*');
L.push('');
L.push('**Are you currently involved with a youth council, youth group or youth organisation?**');
L.push('');
bullet(['Yes', 'No', 'Prefer not to say']);
L.push('');

L.push('## Section 2 — Bring it back');
L.push('');
L.push('**What are the top three things you want the government to bring back for young people?** *(required, choose up to three)*');
L.push('');
bullet(T.REINTRODUCE_OPTIONS.map(o => o.label));
L.push('');
L.push('**Is there anything else you would bring back that is not on that list?** *(optional, free text)*');
L.push('');

L.push('## Section 3 — The biggest problem');
L.push('');
L.push('**What is the biggest problem facing young people across the UK today?** *(required, choose one)*');
L.push('');
L.push('**What is the biggest problem facing young people across the Commonwealth today?** *(required, choose one)*');
L.push('');
L.push('Both questions offer the twelve policy areas below plus "something else", and each is followed by an optional free-text question asking why.');
L.push('');

L.push('## The twelve policy areas');
L.push('');
L.push('Adapted from the priority areas and campaign themes carried by the British Youth Council — its manifesto work, Youth Select Committee topics and the UK Youth Parliament "Make Your Mark" ballot — consolidated into twelve areas short enough to rate three times over.');
L.push('');
L.push('| # | Policy area | Covers |');
L.push('| --- | --- | --- |');
T.POLICY_AREAS.forEach((a, i) => L.push(`| ${i + 1} | **${a.label}** | ${a.blurb} |`));
L.push('');

T.RATING_BATTERIES.forEach((b, i) => {
  L.push(`## Section ${4 + i} — ${b.label}`);
  L.push('');
  L.push(`**${b.question}**`);
  L.push('');
  L.push(`Rated 0–10 for each of the twelve policy areas, where 0 is "${b.scaleLow}" and 10 is "${b.scaleHigh}".`);
  L.push('');
});

L.push('## Section 7 — The Commonwealth and CHOGM');
L.push('');
L.push('**Which of these should the UK push hardest on across the Commonwealth?** *(choose up to three, from the twelve policy areas)*');
L.push('');
L.push('**If you could say one thing directly to the Heads of Government, what would it be?** *(optional, free text — may be quoted anonymously)*');
L.push('');

L.push('## Section 8 — About you (optional)');
L.push('');
L.push('Equalities monitoring. Every question is optional and every one has a "prefer not to say" option: gender, ethnic background, disability or long-term health condition, current activity (education, employment, training or none), and care experience.');
L.push('');
L.push('**I have read the privacy notice and I am happy for my answers to be used in this consultation** *(required)*');
L.push('');

const out = path.join(__dirname, '..', 'form', 'QUESTIONS.md');
fs.writeFileSync(out, L.join('\n'));
console.log(`Wrote ${path.relative(process.cwd(), out)} (${L.length} lines)`);
