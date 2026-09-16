/* =============================================================================
   results.js — the live dashboard.
   Loads the response data, applies the filters, and draws every figure. All
   derived numbers come from data.js so the report page computes them the same
   way; this file is presentation only.
   ========================================================================== */

(function () {
  const CONFIG = window.CONFIG, T = window.TAXONOMY, D = window.DATA, C = window.CHARTS, M = window.MAPS;

  const $ = sel => document.querySelector(sel);
  const state = { dataset: null, filters: { region: '', age: '' }, quoteLimit: 6 };
  const pct = v => `${Math.round(v * 100)}%`;
  const num = v => Number(v || 0).toLocaleString('en-GB');


  /* Round an axis up to a readable maximum, and give it ticks that land on
     round numbers. Bars are always anchored at zero, so a shorter axis
     magnifies nothing — it only stops two thirds of the plot being empty. */
  function niceMax(values) {
    const top = Math.max(0, ...values);
    const step = top <= 20 ? 5 : top <= 50 ? 10 : 25;
    return Math.max(step, Math.min(100, Math.ceil(top / step) * step));
  }
  function axisTicksFor(max) {
    const step = max <= 20 ? 5 : max <= 50 ? 10 : 25;
    const ticks = [];
    for (let t = 0; t <= max + 0.001; t += step) ticks.push(t);
    return ticks;
  }

  /* ---------- status ------------------------------------------------------- */
  function setStatus(kind, text) {
    const pill = $('#status-pill');
    pill.className = `status-pill status-pill--${kind}`;
    $('#status-text').textContent = text;
  }

  /* ---------- filters ------------------------------------------------------ */
  function initFilters() {
    const region = $('#filter-region');
    T.UK_REGIONS.forEach(r => region.add(new Option(r.label, r.id)));

    const age = $('#filter-age');
    T.AGE_BANDS.forEach(b => age.add(new Option(b.label, b.id)));

    region.addEventListener('change', e => { state.filters.region = e.target.value; render(); });
    age.addEventListener('change', e => { state.filters.age = e.target.value; render(); });
  }

  function filteredRows() {
    const { region, age } = state.filters;
    return state.dataset.rows.filter(r => {
      if (region && r.ukRegion !== region) return false;
      if (age && r.age !== age) return false;
      return true;
    });
  }

  function filterCaption() {
    const bits = [];
    if (state.filters.region) bits.push(T.UK_REGIONS.find(r => r.id === state.filters.region).label);
    if (state.filters.age) bits.push(`aged ${T.AGE_BANDS.find(a => a.id === state.filters.age).label}`);
    return bits.length ? ` Filtered to ${bits.join(', ')}.` : '';
  }

  /* A chart drawn from a handful of responses invites over-reading. Say so
     rather than quietly drawing it. */
  function baseNote(n, unit = 'responses') {
    const caption = `Based on ${num(n)} ${unit}.${filterCaption()}`;
    return n > 0 && n < 30
      ? `${caption} Treat with caution — too few responses to be representative.`
      : caption;
  }

  /* ---------- rendering ---------------------------------------------------- */
  function render() {
    const rows = filteredRows();
    const s = D.summarise(rows);
    state.summary = s;

    renderHeadline(s, rows);
    renderMap(s);
    renderReintroduce(s);
    renderProblems(s);
    renderPerformance(s);
    renderHorizon(s);
    renderQuadrant(s);
    renderGap(s);
    renderDemographics(s);
    renderQuotes(rows);

    $('#loading-state').hidden = true;
    $('#error-state').hidden = true;
    $('#dashboard').hidden = false;
  }

  function renderHeadline(s, rows) {
    $('#stat-total').textContent = num(s.total);
    const target = CONFIG.consultation.targetResponses;
    $('#stat-total-note').textContent = state.dataset.source.kind === 'sample'
      ? 'Sample data for demonstration'
      : target ? `${pct(Math.min(1, s.total / target))} of the ${num(target)} target` : '';

    $('#stat-regions').textContent = `${s.regionsCovered} / 12`;

    const topGap = [...s.gaps].filter(g => g.gap !== null).sort((a, b) => b.gap - a.gap)[0];
    if (topGap) {
      $('#stat-gap').textContent = `+${topGap.gap.toFixed(1)}`;
      $('#stat-gap-note').textContent = `${topGap.label} — rated ${topGap.longTerm} for long-term importance, ${topGap.performance} for how well it works`;
    } else {
      $('#stat-gap').textContent = '—';
      $('#stat-gap-note').textContent = 'No ratings yet';
    }

    const topBack = s.reintroduce.items[0];
    if (topBack && topBack.count) {
      $('#stat-reintroduce').textContent = topBack.label.split(/[(—]/)[0].trim();
      $('#stat-reintroduce-note').textContent = `Chosen by ${pct(topBack.share)} of respondents`;
    } else {
      $('#stat-reintroduce').textContent = '—';
      $('#stat-reintroduce-note').textContent = 'No answers yet';
    }
  }

  function renderMap(s) {
    const items = s.byRegion.items;
    const max = Math.max(0, ...items.map(i => i.count));
    M.choropleth($('#map-host'), { items, total: s.total, unitLabel: 'responses' });
    M.choroplethLegend($('#map-legend'), { max, unitLabel: 'responses' });

    /* A ranked list beside the map: the ordering a cartogram cannot show. */
    const ranked = [...items].sort((a, b) => b.count - a.count).slice(0, 6);
    $('#map-ranking').innerHTML =
      `<h3 style="font-size:var(--step--1);text-transform:uppercase;letter-spacing:.06em;color:var(--ink-muted)">Most responses</h3>
       <ol style="margin:0;padding-left:1.1rem;font-size:var(--step--1);color:var(--ink-2)">${
        ranked.map(r => `<li>${C.escapeHtml(r.label)} — <strong class="tnum">${num(r.count)}</strong></li>`).join('')
      }</ol>`;

    $('#map-foot').textContent =
      `${num(s.total - s.byRegion.missing)} of ${num(s.total)} responses are mapped to a ` +
      `UK nation or region.${filterCaption()}`;

    C.withTable($('#fig-map'), {
      caption: 'Responses by UK nation and region',
      columns: [{ label: 'Nation or region' }, { label: 'Responses', numeric: true }, { label: 'Share', numeric: true }],
      rows: [...items].sort((a, b) => b.count - a.count)
        .map(r => [r.label, num(r.count), s.total ? pct(r.count / s.total) : '—'])
    });
  }

  function renderReintroduce(s) {
    const data = s.reintroduce;
    const items = data.items.filter(i => i.count > 0);
    if (!items.length) { emptyFigure('#chart-reintroduce', 'No answers to this question yet.'); return; }

    const axisMax = niceMax(items.map(i => i.share * 100));
    C.barChart($('#chart-reintroduce'), {
      items: items.map(i => ({ label: i.label, value: Math.round(i.share * 100), n: i.count })),
      /* Bars still start at zero; the axis just stops short of 100% because
         nothing gets near it when respondents pick three options from fourteen. */
      max: axisMax, unit: '%', format: v => Math.round(v),
      valueLabel: 'Share of respondents', labelWidth: 300, maxLines: 3,
      axisTicks: axisTicksFor(axisMax),
      ariaLabel: 'What young people want government to bring back, by share of respondents'
    });
    $('#reintroduce-foot').textContent =
      `Respondents chose up to three, so shares add to more than 100%. ${baseNote(data.answered, 'respondents answering this question')}`;

    C.withTable($('#fig-reintroduce'), {
      caption: 'Things young people want brought back',
      columns: [{ label: 'Option' }, { label: 'Chosen by', numeric: true }, { label: 'Share', numeric: true }],
      rows: items.map(i => [i.label, num(i.count), pct(i.share)])
    });
  }

  function problemChart(hostSel, figSel, footSel, counts, title) {
    const items = counts.items.filter(i => i.count > 0).sort((a, b) => b.count - a.count);
    if (!items.length) { emptyFigure(hostSel, 'No answers to this question yet.'); return; }
    const answered = counts.total - counts.missing;

    C.barChart($(hostSel), {
      items: items.map(i => ({ label: i.label, value: Math.round(i.count / answered * 100), n: i.count })),
      max: Math.max(20, Math.ceil(Math.max(...items.map(i => i.count / answered * 100)) / 10) * 10),
      unit: '%', format: v => Math.round(v), valueLabel: 'Share of respondents',
      ariaLabel: title
    });
    $(footSel).textContent = baseNote(answered, 'respondents answering this question');

    C.withTable($(figSel), {
      caption: title,
      columns: [{ label: 'Policy area' }, { label: 'Chose it', numeric: true }, { label: 'Share', numeric: true }],
      rows: items.map(i => [i.label, num(i.count), pct(i.count / answered)])
    });
  }

  function renderProblems(s) {
    problemChart('#chart-uk-problem', '#fig-uk-problem', '#uk-problem-foot', s.ukProblem,
      'The biggest problem facing young people in the UK');
    problemChart('#chart-cw-problem', '#fig-cw-problem', '#cw-problem-foot', s.cwProblem,
      'The biggest problem facing young people across the Commonwealth');
  }

  function renderPerformance(s) {
    const items = s.performance.filter(a => a.mean !== null);
    if (!items.length) { emptyFigure('#chart-performance', 'No ratings yet.'); return; }

    C.barChart($('#chart-performance'), {
      items: items.map(a => ({ label: a.label, value: a.mean, n: a.n,
                               note: `${pct(a.lowShare)} rated it 3 or below` })),
      max: 10, sort: true, format: v => v.toFixed(1),
      valueLabel: 'Mean score out of 10',
      axisTicks: [0, 2, 4, 6, 8, 10],
      reference: { value: 5, label: 'mid-point' },
      ariaLabel: 'Mean rating out of ten for how well each policy area works for young people today'
    });
    const worst = [...items].sort((a, b) => a.mean - b.mean)[0];
    $('#performance-foot').textContent =
      `Lowest rated: ${worst.label} at ${worst.mean} out of 10. ${baseNote(Math.max(...items.map(a => a.n)))}`;

    C.withTable($('#fig-performance'), {
      caption: 'How well each policy area works for young people today',
      columns: [{ label: 'Policy area' }, { label: 'Mean /10', numeric: true }, { label: 'Median', numeric: true },
                { label: 'Rated 7+', numeric: true }, { label: 'Rated 0–3', numeric: true }, { label: 'Responses', numeric: true }],
      rows: [...items].sort((a, b) => b.mean - a.mean)
        .map(a => [a.label, a.mean.toFixed(1), String(a.median), pct(a.topShare), pct(a.lowShare), num(a.n)])
    });
  }

  function renderHorizon(s) {
    const byId = id => ({
      short: s.shortTerm.find(x => x.id === id),
      long: s.longTerm.find(x => x.id === id)
    });
    const items = T.POLICY_AREAS
      .map(a => { const { short, long } = byId(a.id); return { label: a.label, a: short.mean, b: long.mean }; })
      .filter(i => i.a !== null && i.b !== null);
    if (!items.length) { emptyFigure('#chart-horizon', 'No ratings yet.'); return; }

    $('#horizon-legend').innerHTML = `
      <span class="legend__item"><span class="legend__swatch" style="background:var(--series-1)"></span>Urgent in the next 12 months</span>
      <span class="legend__item"><span class="legend__swatch" style="background:var(--series-2)"></span>Important for the long term</span>`;

    C.dumbbell($('#chart-horizon'), {
      items,
      seriesA: { label: 'Short-term urgency' },
      seriesB: { label: 'Long-term importance' },
      domain: [0, 10],
      ariaLabel: 'Short-term urgency compared with long-term importance for each policy area'
    });

    const widest = [...items].sort((a, b) => Math.abs(b.b - b.a) - Math.abs(a.b - a.a))[0];
    $('#horizon-foot').textContent =
      `Widest gap between the two horizons: ${widest.label}. ${baseNote(s.ratedTotal, 'respondents who completed the ratings')}`;

    C.withTable($('#fig-horizon'), {
      caption: 'Short-term urgency and long-term importance',
      columns: [{ label: 'Policy area' }, { label: 'Short term /10', numeric: true },
                { label: 'Long term /10', numeric: true }, { label: 'Difference', numeric: true }],
      rows: [...items].sort((a, b) => b.b - a.b)
        .map(i => [i.label, i.a.toFixed(1), i.b.toFixed(1), (i.b - i.a >= 0 ? '+' : '') + (i.b - i.a).toFixed(1)])
    });
  }

  function renderQuadrant(s) {
    const points = s.gaps.filter(g => g.shortTerm !== null && g.longTerm !== null)
      .map(g => ({ label: g.label, short: shortName(g.label), x: g.shortTerm, y: g.longTerm, n: g.n }));
    if (!points.length) { emptyFigure('#chart-quadrant', 'No ratings yet.'); return; }

    const values = points.flatMap(p => [p.x, p.y]);
    const lo = Math.max(0, Math.floor(Math.min(...values) - 0.6));
    const hi = Math.min(10, Math.ceil(Math.max(...values) + 0.6));

    C.quadrantScatter($('#chart-quadrant'), {
      points, domain: [lo, hi],
      xLabel: 'Urgent in the next 12 months',
      yLabel: 'Important long term',
      quadrantLabels: { topRight: 'Act now', topLeft: 'Invest early' },
      ariaLabel: 'Policy areas plotted by short-term urgency against long-term importance'
    });

    const actNow = points.filter(p => p.x >= (lo + hi) / 2 && p.y >= (lo + hi) / 2)
      .sort((a, b) => (b.x + b.y) - (a.x + a.y)).map(p => p.label);
    $('#quadrant-foot').textContent = actNow.length
      ? `Both urgent and strategically important: ${actNow.slice(0, 4).join(', ')}.`
      : baseNote(s.ratedTotal);

    C.withTable($('#fig-quadrant'), {
      caption: 'Short-term urgency against long-term importance',
      columns: [{ label: 'Policy area' }, { label: 'Urgency /10', numeric: true }, { label: 'Importance /10', numeric: true }],
      rows: points.map(p => [p.label, p.x.toFixed(1), p.y.toFixed(1)])
    });
  }

  function renderGap(s) {
    const items = s.gaps.filter(g => g.gap !== null)
      .map(g => ({
        label: g.label, value: g.gap,
        detail: [['Long-term importance', g.longTerm.toFixed(1)], ['Works today', g.performance.toFixed(1)]]
      }));
    if (!items.length) { emptyFigure('#chart-gap', 'No ratings yet.'); return; }

    C.divergingBar($('#chart-gap'), {
      items, valueLabel: 'Priority gap',
      ariaLabel: 'Priority gap: long-term importance minus how well each area works today'
    });

    const top = [...items].sort((a, b) => b.value - a.value)[0];
    $('#gap-foot').textContent =
      `Largest gap: ${top.label}, +${top.value.toFixed(1)} points. ${baseNote(s.ratedTotal, 'respondents who completed the ratings')}`;

    C.withTable($('#fig-gap'), {
      caption: 'Priority gap by policy area',
      columns: [{ label: 'Policy area' }, { label: 'Importance /10', numeric: true },
                { label: 'Works today /10', numeric: true }, { label: 'Gap', numeric: true }],
      rows: s.gaps.filter(g => g.gap !== null).sort((a, b) => b.gap - a.gap)
        .map(g => [g.label, g.longTerm.toFixed(1), g.performance.toFixed(1),
                   (g.gap >= 0 ? '+' : '') + g.gap.toFixed(1)])
    });
  }

  function renderDemographics(s) {
    const ages = s.byAge.items.filter(i => i.count > 0);
    if (ages.length) {
      C.barChart($('#chart-age'), {
        items: ages.map(i => ({ label: i.label, value: i.count })),
        format: v => num(v), valueLabel: 'Responses', labelWidth: 110,
        ariaLabel: 'Respondents by age band'
      });
      $('#age-foot').textContent = baseNote(s.total - s.byAge.missing, 'respondents who gave an age');
      C.withTable($('#fig-age'), {
        caption: 'Respondents by age band',
        columns: [{ label: 'Age' }, { label: 'Responses', numeric: true }, { label: 'Share', numeric: true }],
        rows: ages.map(i => [i.label, num(i.count), pct(i.count / Math.max(1, s.total - s.byAge.missing))])
      });
    } else emptyFigure('#chart-age', 'No age data yet.');

  }

  function renderQuotes(rows) {
    const all = D.verbatims(rows, 'chogmMessage', { minLength: 25 });
    const host = $('#quotes');
    if (!all.length) {
      host.innerHTML = '<p class="muted">No free-text answers to this question yet.</p>';
      $('#quotes-foot').textContent = '';
      $('#btn-more-quotes').hidden = true;
      return;
    }
    const shown = all.slice(0, state.quoteLimit);
    host.innerHTML = shown.map(q => `
      <figure class="quote">
        <blockquote>“${C.escapeHtml(q.text)}”</blockquote>
        <figcaption>${C.escapeHtml([q.age, q.region].filter(Boolean).join(', '))}</figcaption>
      </figure>`).join('');
    $('#quotes-foot').textContent = `Showing ${shown.length} of ${num(all.length)} free-text answers.`;
    $('#btn-more-quotes').hidden = shown.length >= all.length;
  }

  function emptyFigure(sel, message) {
    const host = $(sel);
    if (host) host.innerHTML = `<p class="muted" style="padding:var(--sp-5) 0">${message}</p>`;
  }

  /* "Mental health and wellbeing" -> "Mental health", for scatter point labels. */
  function shortName(label) {
    return label.split(/ and | & |,/)[0].trim();
  }

  /* ---------- the map, with no data behind it -----------------------------
     Drawn whenever the results cannot be read. Somebody arriving at a broken
     dashboard should still see the twelve nations and regions the consultation
     covers, and where their own answer would land, rather than an error alone. */
  function renderPlaceholderMap() {
    const host = $('#error-map');
    if (!host || host.dataset.drawn) return;
    const empty = T.UK_REGIONS.map(r => ({ id: r.id, label: r.label, short: r.short, count: 0 }));
    M.choropleth(host, { items: empty, total: 0, unitLabel: 'responses' });
    $('#error-map-note').innerHTML =
      `<p class="muted" style="font-size:var(--step--1);margin:0">
         Twelve nations and regions, each an equal-sized tile so that no part of the country is
         visually lost. Once responses arrive, each tile is shaded by how many young people there
         have taken part.
       </p>
       <p style="margin-top:var(--sp-4)"><a class="btn btn--primary btn--sm" href="consultation.html">Add your voice</a></p>`;
    host.dataset.drawn = '1';
  }

  /* ---------- downloads ---------------------------------------------------- */
  function downloadAggregates() {
    const s = state.summary;
    const rows = [['UK Young Ambassadors — CHOGM youth consultation: aggregate results'],
                  ['Generated', new Date().toISOString()],
                  ['Responses in this view', s.total],
                  ['Filters', filterCaption().trim() || 'none'], []];

    rows.push(['Responses by UK nation and region'], ['Nation or region', 'Responses']);
    s.byRegion.items.forEach(i => rows.push([i.label, i.count]));
    rows.push([]);

    rows.push(['Policy area ratings (mean out of 10)'],
              ['Policy area', 'Works today', 'Long-term importance', 'Short-term urgency', 'Priority gap', 'Responses']);
    s.gaps.forEach(g => rows.push([g.label, g.performance, g.longTerm, g.shortTerm, g.gap, g.n]));
    rows.push([]);

    rows.push(['Things to bring back'], ['Option', 'Times chosen', 'Share of respondents']);
    s.reintroduce.items.forEach(i => rows.push([i.label, i.count, `${Math.round(i.share * 100)}%`]));
    rows.push([]);

    rows.push(['Biggest problem — UK'], ['Policy area', 'Responses']);
    s.ukProblem.items.forEach(i => rows.push([i.label, i.count]));
    rows.push([]);
    rows.push(['Biggest problem — Commonwealth'], ['Policy area', 'Responses']);
    s.cwProblem.items.forEach(i => rows.push([i.label, i.count]));

    const blob = new Blob([window.toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chogm-consultation-aggregates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ---------- data source panel -------------------------------------------- */
  function initConnectPanel() {
    const panel = $('#connect-panel'), btn = $('#btn-connect'), msg = $('#connect-message');
    btn.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      btn.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) {
        try { $('#csv-url').value = localStorage.getItem('chogm:csvUrl') || CONFIG.data.publishedCsvUrl || ''; }
        catch (e) { /* private mode */ }
      }
    });

    $('#btn-save-url').addEventListener('click', async () => {
      const url = $('#csv-url').value.trim();
      if (!url) { msg.textContent = 'Paste a published CSV link first.'; return; }
      try { localStorage.setItem('chogm:csvUrl', url); } catch (e) {
        msg.textContent = 'This browser is blocking storage, so the link will apply to this visit only.';
      }
      await load();
    });

    $('#btn-clear-url').addEventListener('click', async () => {
      try { localStorage.removeItem('chogm:csvUrl'); } catch (e) { /* ignore */ }
      $('#csv-url').value = '';
      msg.textContent = 'Reset to the link in config.js.';
      await load();
    });

    $('#csv-file').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          state.dataset = D.buildDataset(String(reader.result), { kind: 'live', origin: `file: ${file.name}` });
          setStatus('live', `${num(state.dataset.rows.length)} responses from ${file.name}`);
          state.quoteLimit = 6;
          render();
          msg.textContent = 'Loaded from your device. Nothing was uploaded anywhere.';
        } catch (err) {
          msg.textContent = `That file could not be read: ${err.message}`;
        }
      };
      reader.readAsText(file);
    });
  }

  /* ---------- load --------------------------------------------------------- */
  async function load() {
    $('#error-state').hidden = true;
    setStatus('', 'Loading…');
    try {
      state.dataset = await D.loadDataset(CONFIG);
      const src = state.dataset.source;
      setStatus(src.kind === 'sample' ? 'sample' : 'live',
        src.kind === 'sample'
          ? 'Showing sample data — no live responses connected'
          : `${num(state.dataset.rows.length)} responses · updated ${state.dataset.loadedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`);
      state.quoteLimit = 6;
      render();
    } catch (err) {
      console.error(err);
      setStatus('error', 'Could not load the data');
      $('#loading-state').hidden = true;
      $('#dashboard').hidden = true;
      $('#error-state').hidden = false;
      $('#error-message').textContent = err.message;
      renderPlaceholderMap();
    }
  }

  /* ---------- go ----------------------------------------------------------- */
  initFilters();
  initConnectPanel();
  $('#btn-refresh').addEventListener('click', load);
  $('#btn-retry').addEventListener('click', load);
  $('#btn-download').addEventListener('click', downloadAggregates);
  $('#btn-more-quotes').addEventListener('click', () => {
    state.quoteLimit += 12;
    renderQuotes(filteredRows());
  });

  load();

  /* Poll for new responses while the page is open and visible — useful on a
     screen at an event. Skipped while the tab is hidden. */
  if (CONFIG.data.refreshMinutes > 0) {
    setInterval(() => {
      if (!document.hidden && state.dataset && state.dataset.source.kind === 'live') load();
    }, CONFIG.data.refreshMinutes * 60 * 1000);
  }
})();
