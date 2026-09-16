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

  renderForm();
})();
