/* =============================================================================
   consultation.js — embeds the Google Form (or explains how to connect one)
   and renders the published question list from the taxonomy, so the preview
   can never drift out of step with the analysis.
   ========================================================================== */

(function () {
  const CONFIG = window.CONFIG;
  const T = window.TAXONOMY;
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- the form ----------------------------------------------------- */
  function renderForm() {
    const host = document.getElementById('form-host');
    if (!host) return;

    if (CONFIG.form.embedUrl) {
      host.innerHTML =
        `<iframe class="form-frame" src="${esc(CONFIG.form.embedUrl)}"
                 title="Consultation form" loading="lazy">Loading the form…</iframe>`;
      const fallback = document.getElementById('form-fallback');
      const link = document.getElementById('form-direct-link');
      if (fallback && link) {
        link.href = CONFIG.form.shareUrl || CONFIG.form.embedUrl.replace('?embedded=true', '');
        link.target = '_blank';
        fallback.hidden = false;
      }
      return;
    }

    /* No form connected yet — show the operator exactly what to do rather than
       showing the public an empty grey rectangle. */
    host.classList.remove('form-shell');
    host.innerHTML = `
      <div class="card">
        <span class="qtag">Setup needed</span>
        <h3 style="margin-top:var(--sp-3)">Connect the Google Form</h3>
        <p>The consultation form has not been linked yet. It takes about five minutes.</p>
        <ol class="setup-steps">
          <li><div><strong>Create the form.</strong> Open <a href="https://script.google.com" rel="noopener">script.google.com</a>,
            start a new project, paste in the contents of <code>form/create-form.gs</code> from this
            repository and run <code>createConsultationForm</code>. It builds every question in the list
            below, in order, with the right scales and validation, and prints the form URL in the log.</div></li>
          <li><div><strong>Embed it.</strong> Open the form, press <em>Send</em>, choose the
            <code>&lt; &gt;</code> embed tab and copy the <code>src</code> value. Paste it into
            <code>form.embedUrl</code> in <code>assets/js/config.js</code>, and paste the short
            <code>forms.gle</code> link into <code>form.shareUrl</code>.</div></li>
          <li><div><strong>Publish the responses.</strong> In the form’s <em>Responses</em> tab create the
            linked spreadsheet. In that spreadsheet choose <em>File › Share › Publish to web</em>, select the
            responses sheet, pick <em>Comma-separated values (.csv)</em> and publish. Paste the resulting URL
            into <code>data.publishedCsvUrl</code> in <code>assets/js/config.js</code>.</div></li>
          <li><div><strong>Check it.</strong> Submit one test response, then open the
            <a href="results.html">results page</a>. Your answer should appear on the map and in every chart.
            Delete the test row from the spreadsheet afterwards.</div></li>
        </ol>
      </div>`;
  }

  /* ---------- the published question list ---------------------------------- */
  const scaleNote = b =>
    `Rated 0–10, where 0 is “${esc(b.scaleLow)}” and 10 is “${esc(b.scaleHigh)}”.`;

  function group(tag, title, intro, bodyHtml, open = false) {
    return `
      <details class="qgroup"${open ? ' open' : ''}>
        <summary><span class="qtag">${esc(tag)}</span> ${esc(title)}</summary>
        <div class="qgroup__body">
          ${intro ? `<p>${intro}</p>` : ''}
          ${bodyHtml}
        </div>
      </details>`;
  }

  const list = items => `<ul class="qitems">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;

  function renderQuestions() {
    const host = document.getElementById('question-preview');
    if (!host) return;

    const areas = T.POLICY_AREAS.map(a => `<strong>${esc(a.label)}</strong> — ${esc(a.blurb)}`);

    const blocks = [];

    blocks.push(group('Section 1', 'About you', 
      'Nothing here identifies you. Every question can be skipped, and each has a “prefer not to say” option.',
      list([
        'How old are you? ' + T.AGE_BANDS.map(b => esc(b.label)).join(' · '),
        'Which nation or region of the UK do you live in? ' + T.UK_REGIONS.map(r => esc(r.label)).join(' · ') + ' · I live outside the UK',
        'If you live outside the UK, which country do you live in?',
        'The first part of your postcode only, for example <code>SW1A</code> (optional — used to map coverage, never to identify you)',
        'Are you currently involved with a youth council, youth group or youth organisation?',
        'Optional equalities questions: gender, ethnicity, disability or long-term health condition, care experience, and what you are currently doing (education, employment, training, or none of these)'
      ]), true));

    blocks.push(group('Section 2', 'Bring it back',
      'Provision that has been cut, closed or withdrawn for young people over roughly the last fifteen years. Pick up to three.',
      list([
        '<strong>What are the top three things you want the government to bring back for young people?</strong> Choose up to three:',
        list(T.REINTRODUCE_OPTIONS.map(o => esc(o.label))).replace('<ul class="qitems">', '<ul class="qitems" style="margin-top:.4rem">'),
        'Is there anything else you would bring back that is not on that list? (optional, free text)'
      ])));

    blocks.push(group('Section 3', 'The biggest problem',
      'Two questions with the same structure — one about home, one about the Commonwealth — so the answers can be compared directly.',
      list([
        '<strong>What is the biggest problem facing young people across the UK today?</strong> Choose one area, then tell us why in your own words.',
        '<strong>What is the biggest problem facing young people across the Commonwealth today?</strong> Choose one area, then tell us why in your own words.',
        'Both questions use the same twelve policy areas listed in section 4, plus “something else”.'
      ])));

    T.RATING_BATTERIES.forEach((b, i) => {
      blocks.push(group(`Section ${4 + i}`, b.label, `<strong>${esc(b.question)}</strong><br>${scaleNote(b)}`,
        list(areas)));
    });

    blocks.push(group('Section 7', 'The Commonwealth and CHOGM',
      'The delegation carries these answers into the room.',
      list([
        'Which of the policy areas above should the UK push hardest on across the Commonwealth? (choose up to three)',
        'If you could say one thing directly to the Heads of Government, what would it be? (free text — answers may be quoted anonymously in the report)',
        'Would you like to hear what happened to your answers? (optional email, kept separately from your responses and used only to send the published report)'
      ])));

    host.innerHTML = blocks.join('');
  }

  renderForm();
  renderQuestions();
})();
