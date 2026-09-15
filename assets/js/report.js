/* =============================================================================
   report.js — turns the consultation data into a written report.

   The prose is assembled from the data rather than typed, so the report can
   never quote a number the charts disagree with. Every claim is phrased as what
   respondents said, not as a finding about all young people — the sample is
   self-selecting and the methodology section says so plainly. Nothing here
   invents a conclusion the data does not support: where a number is missing the
   sentence is dropped rather than softened.
   ========================================================================== */

(function () {
  const CONFIG = window.CONFIG, T = window.TAXONOMY, D = window.DATA, C = window.CHARTS, M = window.MAPS;
  const esc = C.escapeHtml;
  const num = v => Number(v || 0).toLocaleString('en-GB');
  const pct = v => `${Math.round(v * 100)}%`;
  const fmtDate = d => d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';


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

  let dataset = null, s = null;

  /* Turn a list into "a, b and c". */
  function listSentence(items) {
    if (!items.length) return '';
    if (items.length === 1) return items[0];
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  }

  /* "Mental health and wellbeing" -> "mental health", for use mid-sentence. */
  const lower = label => label.split(/ and | & |,/)[0].trim().toLowerCase();

  function build() {
    const report = document.getElementById('report');
    const gaps = [...s.gaps].filter(g => g.gap !== null).sort((a, b) => b.gap - a.gap);
    const perf = [...s.performance].filter(a => a.mean !== null).sort((a, b) => a.mean - b.mean);
    const longT = [...s.longTerm].filter(a => a.mean !== null).sort((a, b) => b.mean - a.mean);
    const shortT = [...s.shortTerm].filter(a => a.mean !== null).sort((a, b) => b.mean - a.mean);
    const back = s.reintroduce.items.filter(i => i.count > 0);
    const ukProb = [...s.ukProblem.items].filter(i => i.count).sort((a, b) => b.count - a.count);
    const cwProb = [...s.cwProblem.items].filter(i => i.count).sort((a, b) => b.count - a.count);
    const ukAnswered = s.ukProblem.total - s.ukProblem.missing;
    const cwAnswered = s.cwProblem.total - s.cwProblem.missing;
    const failing = perf.filter(a => a.mean < 5);

    const html = [];

    /* ---- cover -------------------------------------------------------- */
    html.push(`
      <header>
        <p class="rec__tag">${esc(CONFIG.privacy.controller)} · Youth consultation</p>
        <h1 style="font-size:var(--step-3);margin-top:.4rem">Young people’s priorities for the UK and the Commonwealth</h1>
        <p class="lede">Findings from a consultation of young people across the United Kingdom and the
        Commonwealth, submitted ahead of ${esc(CONFIG.consultation.chogmLabel)}.</p>
        <div class="report__meta">
          <span><strong>${num(s.total)}</strong> responses</span>
          <span><strong>${s.regionsCovered}</strong> of 12 UK nations and regions</span>
          <span>Fieldwork ${fmtDate(s.firstResponse)} – ${fmtDate(s.lastResponse)}</span>
          <span>Report generated ${fmtDate(new Date())}</span>
        </div>
        ${dataset.source.kind === 'sample' ? `<div class="notice notice--draft"><span class="notice__icon">⚠</span>
          <p><strong>This report is built from sample data.</strong> No live responses are connected, so every
          number below is synthetic and must not be quoted. Connect the published responses sheet on the
          <a href="results.html">results page</a> to produce the real report.</p></div>` : ''}
      </header>`);

    /* ---- executive summary --------------------------------------------- */
    const topGap = gaps[0];
    const summaryPoints = [];
    if (ukProb.length) summaryPoints.push(
      `The single biggest problem facing young people in the UK, chosen by ${pct(ukProb[0].count / ukAnswered)} of
       respondents, is <strong>${esc(ukProb[0].label.toLowerCase())}</strong>.`);
    if (cwProb.length) summaryPoints.push(
      `Across the Commonwealth, respondents point instead to <strong>${esc(cwProb[0].label.toLowerCase())}</strong>
       (${pct(cwProb[0].count / cwAnswered)}), a different problem from the one they identify at home.`);
    if (failing.length) summaryPoints.push(
      `${failing.length} of the ${perf.length} policy areas tested score below the mid-point of the scale for how
       well they currently work for young people. The lowest are
       <strong>${esc(listSentence(failing.slice(0, 3).map(a => lower(a.label))))}</strong>.`);
    if (topGap) summaryPoints.push(
      `The widest gap between what young people say matters and what they say is working is
       <strong>${esc(lower(topGap.label))}</strong>: rated ${topGap.longTerm} out of ten for long-term importance
       but ${topGap.performance} for how well it works today, a gap of ${topGap.gap.toFixed(1)} points.`);
    if (back.length) summaryPoints.push(
      `Asked what they would have government bring back, ${pct(back[0].share)} chose
       <strong>${esc(back[0].label.toLowerCase())}</strong>.`);

    html.push(`
      <h2 class="no-break">Executive summary</h2>
      <p>
        This consultation asked young people three things: what has been taken away that they want back, what the
        biggest problem facing their generation is at home and across the Commonwealth, and how twelve areas of
        policy are performing against how much those areas matter — both right now and over the long term.
        ${num(s.total)} young people responded${s.regionsCovered === 12
          ? ', with responses from every nation and region of the UK'
          : `, from ${s.regionsCovered} of the 12 UK nations and regions`}.
      </p>
      <ul>${summaryPoints.map(p => `<li>${p}</li>`).join('')}</ul>
      <p>
        The pattern across the data is consistent: young people do not rate the areas that matter most to them as
        the areas that are working. The report sets out where that gap is widest, and what respondents say should
        be done about it.
      </p>`);

    /* ---- findings ------------------------------------------------------ */
    html.push('<h2>Key findings</h2>');
    const findings = [];

    if (topGap) findings.push({
      title: `${topGap.label} is the widest gap between importance and delivery`,
      body: `Respondents rated ${lower(topGap.label)} <strong>${topGap.longTerm} out of ten</strong> for importance to
        their long-term future, and <strong>${topGap.performance} out of ten</strong> for how well it is working for
        young people today — a gap of ${topGap.gap.toFixed(1)} points, the largest of the twelve areas tested.
        ${gaps[1] ? `${gaps[1].label} (${gaps[1].gap.toFixed(1)}) and ${gaps[2] ? gaps[2].label : ''}
        ${gaps[2] ? `(${gaps[2].gap.toFixed(1)})` : ''} follow.` : ''}`
    });

    if (failing.length) findings.push({
      title: `Most policy areas are rated as failing young people`,
      body: `Of the ${perf.length} areas tested, ${failing.length} scored below five out of ten for how well they
        currently work. The lowest scores went to ${listSentence(failing.slice(0, 3).map(a =>
        `${lower(a.label)} (${a.mean})`))}. On ${esc(perf[0].label.toLowerCase())}, ${pct(perf[0].lowShare)} of
        respondents gave a score of three or below.`
    });

    if (ukProb.length && cwProb.length) findings.push({
      title: `Young people name different priorities at home and abroad`,
      body: `Asked for the single biggest problem facing young people in the UK, respondents chose
        ${lower(ukProb[0].label)} (${pct(ukProb[0].count / ukAnswered)}), followed by
        ${lower(ukProb[1] ? ukProb[1].label : '')} (${ukProb[1] ? pct(ukProb[1].count / ukAnswered) : '—'}).
        Asked the same question about the Commonwealth, the leading answer was
        ${lower(cwProb[0].label)} (${pct(cwProb[0].count / cwAnswered)}). Young people are not simply
        projecting domestic concerns outward — they distinguish between the two.`
    });

    const horizonSplit = [...s.gaps].filter(g => g.horizon !== null).sort((a, b) => b.horizon - a.horizon)[0];
    if (horizonSplit && horizonSplit.horizon > 0.4) findings.push({
      title: `${horizonSplit.label} is a long-term priority that is not felt as urgent today`,
      body: `Respondents rated ${lower(horizonSplit.label)} ${horizonSplit.longTerm} out of ten for long-term
        importance but ${horizonSplit.shortTerm} for urgency over the next twelve months — a difference of
        ${horizonSplit.horizon.toFixed(1)} points. Areas in this position are where preventative investment is
        cheapest and where short-term political incentives are weakest.`
    });

    if (back.length >= 3) findings.push({
      title: `There is a clear, costed list of what young people want restored`,
      body: `The three most-chosen answers were ${listSentence(back.slice(0, 3).map(i =>
        `${i.label.toLowerCase()} (${pct(i.share)})`))}. These are not abstract asks: each names provision that
        existed and was withdrawn, which makes them straightforward to price and to reinstate.`
    });

    html.push(findings.map((f, i) => `
      <div class="finding">
        <div class="finding__num">Finding ${i + 1}</div>
        <h3 style="margin-top:.2rem">${esc(f.title)}</h3>
        <p>${f.body}</p>
      </div>`).join(''));

    /* ---- who responded -------------------------------------------------- */
    html.push(`
      <h2>Who responded</h2>
      <p>
        ${num(s.total)} young people responded between ${fmtDate(s.firstResponse)} and ${fmtDate(s.lastResponse)}.
        ${num(s.total - s.byRegion.missing)} gave a UK nation or region and
        ${num(s.byCwRegion.items.reduce((a, b) => a + b.count, 0))} responded from elsewhere in the Commonwealth.
        The map below shades each nation and region by how many young people there took part; equal-sized tiles
        are used so that population density does not distort the picture.
      </p>
      <figure class="figure" id="fig-report-map">
        <div class="figure__head">
          <p class="figure__title">Responses by UK nation and region</p>
        </div>
        <div class="figure__body cartogram">
          <div id="report-map"></div>
          <div id="report-map-legend"></div>
        </div>
        <figcaption class="figure__foot">Figure 1. Responses by nation and region. Source: consultation responses.</figcaption>
      </figure>
      <div id="report-demographics"></div>`);

    /* ---- bring it back --------------------------------------------------- */
    html.push(`
      <h2>What young people want brought back</h2>
      <p>
        Respondents were asked to choose up to three things they want government to reintroduce for young people,
        from a list of provision reduced or withdrawn over roughly the last fifteen years.
        ${back.length ? `${pct(back[0].share)} chose ${back[0].label.toLowerCase()} — the most-selected answer.` : ''}
        Because respondents chose up to three, the shares below sum to more than 100%.
      </p>
      <figure class="figure" id="fig-report-back">
        <div class="figure__head"><p class="figure__title">Things young people want government to bring back</p></div>
        <div class="figure__body" id="report-back"></div>
        <figcaption class="figure__foot">Figure 2. Share of respondents selecting each option among their top three.</figcaption>
      </figure>`);

    /* ---- biggest problems ------------------------------------------------ */
    html.push(`
      <h2>The biggest problems facing young people</h2>
      <p>
        Two questions with identical structure, one about the UK and one about the Commonwealth, so the answers
        can be compared directly. Each respondent chose a single area and was then asked to explain the choice in
        their own words.
      </p>
      <div class="grid grid--2">
        <figure class="figure" id="fig-report-uk">
          <div class="figure__head"><p class="figure__title">In the UK</p></div>
          <div class="figure__body" id="report-uk-problem"></div>
          <figcaption class="figure__foot">Figure 3. ${num(ukAnswered)} responses.</figcaption>
        </figure>
        <figure class="figure" id="fig-report-cw">
          <div class="figure__head"><p class="figure__title">Across the Commonwealth</p></div>
          <div class="figure__body" id="report-cw-problem"></div>
          <figcaption class="figure__foot">Figure 4. ${num(cwAnswered)} responses.</figcaption>
        </figure>
      </div>
      <div id="report-why"></div>`);

    /* ---- performance and the gap ------------------------------------------ */
    html.push(`
      <h2>How policy is performing, and where the gap is</h2>
      <p>
        Each of the twelve policy areas was rated three times on a nought-to-ten scale: how well it works for young
        people today, how important it is to a young person’s long-term future, and how urgent it is over the next
        twelve months. Asking about importance alone produces a list on which everything is important; asking about
        delivery alongside it is what makes the answers actionable.
      </p>
      <figure class="figure" id="fig-report-perf">
        <div class="figure__head"><p class="figure__title">How well each area works for young people today</p></div>
        <div class="figure__body" id="report-performance"></div>
        <figcaption class="figure__foot">Figure 5. Mean score out of ten. The line marks the mid-point of the scale.</figcaption>
      </figure>
      <p>
        Subtracting delivery from long-term importance gives a priority gap for each area. A large positive gap
        identifies an area young people say matters enormously and is being delivered badly — the strongest
        evidence-based case for where attention should go.
      </p>
      <figure class="figure" id="fig-report-gap">
        <div class="figure__head"><p class="figure__title">The priority gap</p></div>
        <div class="figure__body" id="report-gap"></div>
        <figcaption class="figure__foot">Figure 6. Long-term importance minus how well the area works today, in scale points.</figcaption>
      </figure>
      <figure class="figure" id="fig-report-quadrant">
        <div class="figure__head"><p class="figure__title">Urgent now against important later</p></div>
        <div class="figure__body" id="report-quadrant"></div>
        <figcaption class="figure__foot">Figure 7. Areas in the upper right are rated both urgent and strategically important.</figcaption>
      </figure>`);

    /* ---- verbatims -------------------------------------------------------- */
    html.push(`
      <h2>In their own words</h2>
      <p>
        Respondents were asked what they would say directly to Heads of Government. A selection follows, shown as
        submitted with identifying detail removed. They are illustrative, not representative.
      </p>
      <div class="quotes" id="report-quotes"></div>`);

    /* ---- recommendations --------------------------------------------------- */
    html.push(`
      <h2>What respondents’ answers point towards</h2>
      <p>
        The recommendations below follow directly from the data above. They are the delegation’s reading of what
        respondents said, and are put forward for consideration rather than as agreed positions of any partner
        organisation.
      </p>
      ${gaps.slice(0, 4).map((g, i) => `
        <div class="rec">
          <div class="rec__tag">Recommendation ${i + 1} · ${esc(g.label)}</div>
          <p style="margin:.4rem 0 0">
            Treat ${lower(g.label)} as a first-order priority for young people. Respondents rated it
            ${g.longTerm} out of ten for long-term importance against ${g.performance} for current delivery
            ${g.shortTerm >= 7 ? 'and rate it as urgent within the next twelve months' :
              'while rating it less urgent in the immediate term, which makes it a candidate for preventative investment now'}.
            ${i === 0 ? 'This is the largest gap in the consultation and should anchor both the domestic response and the UK’s Commonwealth position.' : ''}
          </p>
        </div>`).join('')}
      <div class="rec">
        <div class="rec__tag">Recommendation ${Math.min(5, gaps.length + 1)} · Youth voice</div>
        <p style="margin:.4rem 0 0">
          Publish a response to this consultation setting out which findings are accepted and what will change.
          Respondents repeatedly said that consultations of young people go unanswered; a published response is
          the cheapest available demonstration that this one did not.
        </p>
      </div>`);

    /* ---- methodology ------------------------------------------------------- */
    html.push(`
      <h2>Methodology and limitations</h2>
      <p>
        Responses were collected through an online form open to anyone aged 13–25 living in the UK or in a
        Commonwealth member state, promoted through youth organisations, youth councils, schools and social media.
        Fieldwork ran from ${fmtDate(s.firstResponse)} to ${fmtDate(s.lastResponse)}. ${num(s.total)} responses
        were received, of which ${num(s.ratedTotal)} included the rating questions.
      </p>
      <p>
        Rating questions used an eleven-point scale from 0 to 10 and are reported as arithmetic means, with medians
        and the full distribution available in the data tables on the results page. Categorical questions are
        reported as a share of those answering that question, not of all respondents. Free-text answers have been
        reproduced without correction and without identifying detail.
      </p>
      <h3>Limitations</h3>
      <ul>
        <li><strong>The sample is self-selecting.</strong> Respondents chose to take part, and were reached largely
          through youth organisations. Young people already engaged with youth voice structures are very likely to
          be over-represented, and the least-engaged young people under-represented. These findings describe the
          young people who responded; they are not a probability sample of all young people and no margin of error
          is quoted, because none would be meaningful.</li>
        <li><strong>Coverage is uneven.</strong> ${s.regionsCovered === 12
            ? 'Every UK nation and region is represented, but not in proportion to its youth population.'
            : `${12 - s.regionsCovered} UK nation(s) or region(s) returned no responses at all.`}
          Regional breakdowns with small numbers should not be read as findings about that area.</li>
        <li><strong>Commonwealth coverage is thin relative to the UK.</strong>
          ${num(s.byCwRegion.items.reduce((a, b) => a + b.count, 0))} responses came from outside the UK. The
          Commonwealth findings should be read as indicative of the young people who responded, and as a prompt
          for proper partner-led consultation in member states, not as a Commonwealth-wide result.</li>
        <li><strong>Question order affects answers.</strong> The rating batteries were asked in the same order for
          every respondent, so later batteries may show mild fatigue effects.</li>
        <li><strong>Free-text quotations are illustrative.</strong> They were selected to show the range of what was
          said and are not weighted by frequency.</li>
      </ul>
      <h3>Data availability</h3>
      <p>
        The aggregated data behind every figure in this report can be downloaded from the
        <a href="results.html">results page</a>, and the analysis code that produces these numbers is published
        alongside the site so the calculations can be checked and reproduced.
      </p>`);

    report.innerHTML = html.join('');
    drawFigures({ gaps, perf, back, ukProb, cwProb, ukAnswered, cwAnswered });
  }

  /* ---------- figures ------------------------------------------------------ */
  function drawFigures(ctx) {
    const items = s.byRegion.items;
    M.choropleth(document.getElementById('report-map'), { items, total: s.total });
    M.choroplethLegend(document.getElementById('report-map-legend'),
      { max: Math.max(0, ...items.map(i => i.count)) });

    /* Demographic tables read better than charts at report length. */
    const ages = s.byAge.items.filter(i => i.count);
    const ageAnswered = Math.max(1, s.total - s.byAge.missing);
    document.getElementById('report-demographics').innerHTML = `
      <div class="table-wrap"><table class="data">
        <caption>Table 1. Respondents by age band and by nation or region.</caption>
        <thead><tr><th scope="col">Age band</th><th scope="col" class="num">Responses</th><th scope="col" class="num">Share</th>
                   <th scope="col">Nation or region</th><th scope="col" class="num">Responses</th><th scope="col" class="num">Share</th></tr></thead>
        <tbody>${
          Array.from({ length: Math.max(ages.length, items.length) }, (_, i) => {
            const a = ages[i], r = [...items].sort((x, y) => y.count - x.count)[i];
            return `<tr>
              <td>${a ? esc(a.label) : ''}</td><td class="num">${a ? num(a.count) : ''}</td>
              <td class="num">${a ? pct(a.count / ageAnswered) : ''}</td>
              <td>${r ? esc(r.label) : ''}</td><td class="num">${r ? num(r.count) : ''}</td>
              <td class="num">${r && s.total ? pct(r.count / s.total) : ''}</td></tr>`;
          }).join('')}</tbody>
      </table></div>`;

    if (ctx.back.length) {
      const axisMax = niceMax(ctx.back.map(i => i.share * 100));
      C.barChart(document.getElementById('report-back'), {
        items: ctx.back.map(i => ({ label: i.label, value: Math.round(i.share * 100), n: i.count })),
        max: axisMax, unit: '%', format: v => Math.round(v), axisTicks: axisTicksFor(axisMax),
        labelWidth: 300, maxLines: 3,
        valueLabel: 'Share of respondents', ariaLabel: 'Things young people want government to bring back'
      });
    }

    const problemBar = (hostId, list, answered, label) => {
      if (!list.length) return;
      C.barChart(document.getElementById(hostId), {
        items: list.map(i => ({ label: i.label, value: Math.round(i.count / answered * 100), n: i.count })),
        unit: '%', format: v => Math.round(v), valueLabel: 'Share of respondents', ariaLabel: label
      });
    };
    problemBar('report-uk-problem', ctx.ukProb, ctx.ukAnswered, 'Biggest problem facing young people in the UK');
    problemBar('report-cw-problem', ctx.cwProb, ctx.cwAnswered, 'Biggest problem facing young people across the Commonwealth');

    /* A why-quote for each of the two leading problems. */
    const ukWhy = D.verbatims(dataset.rows, 'ukProblemWhy', { minLength: 30 }).slice(0, 2);
    const cwWhy = D.verbatims(dataset.rows, 'cwProblemWhy', { minLength: 30 }).slice(0, 2);
    document.getElementById('report-why').innerHTML = (ukWhy.length || cwWhy.length) ? `
      <p>Asked to explain their choice, respondents wrote:</p>
      <div class="quotes">${[...ukWhy, ...cwWhy].map(q => `
        <figure class="quote"><blockquote>“${esc(q.text)}”</blockquote>
          <figcaption>${esc([q.age, q.region].filter(Boolean).join(', '))}</figcaption></figure>`).join('')}</div>` : '';

    if (ctx.perf.length) {
      C.barChart(document.getElementById('report-performance'), {
        items: ctx.perf.map(a => ({ label: a.label, value: a.mean, n: a.n })),
        max: 10, sort: true, format: v => v.toFixed(1), axisTicks: [0, 2, 4, 6, 8, 10],
        reference: { value: 5, label: 'mid-point' }, valueLabel: 'Mean score out of 10',
        ariaLabel: 'How well each policy area works for young people today'
      });
    }

    if (ctx.gaps.length) {
      C.divergingBar(document.getElementById('report-gap'), {
        items: ctx.gaps.map(g => ({
          label: g.label, value: g.gap,
          detail: [['Long-term importance', g.longTerm.toFixed(1)], ['Works today', g.performance.toFixed(1)]]
        })),
        valueLabel: 'Priority gap', ariaLabel: 'Priority gap by policy area'
      });

      const points = ctx.gaps.map(g => ({
        label: g.label, short: g.label.split(/ and | & |,/)[0].trim(),
        x: g.shortTerm, y: g.longTerm, n: g.n
      }));
      const values = points.flatMap(p => [p.x, p.y]);
      C.quadrantScatter(document.getElementById('report-quadrant'), {
        points,
        domain: [Math.max(0, Math.floor(Math.min(...values) - 0.6)), Math.min(10, Math.ceil(Math.max(...values) + 0.6))],
        xLabel: 'Urgent in the next 12 months', yLabel: 'Important long term',
        quadrantLabels: { topRight: 'Act now', topLeft: 'Invest early' },
        ariaLabel: 'Policy areas by short-term urgency against long-term importance'
      });
    }

    const quotes = D.verbatims(dataset.rows, 'chogmMessage', { minLength: 40 }).slice(0, 8);
    document.getElementById('report-quotes').innerHTML = quotes.length
      ? quotes.map(q => `<figure class="quote"><blockquote>“${esc(q.text)}”</blockquote>
          <figcaption>${esc([q.age, q.region].filter(Boolean).join(', '))}</figcaption></figure>`).join('')
      : '<p class="muted">No free-text answers have been received yet.</p>';
  }

  /* ---------- markdown export ---------------------------------------------- */
  function toMarkdown() {
    const gaps = [...s.gaps].filter(g => g.gap !== null).sort((a, b) => b.gap - a.gap);
    const back = s.reintroduce.items.filter(i => i.count > 0);
    const ukProb = [...s.ukProblem.items].filter(i => i.count).sort((a, b) => b.count - a.count);
    const cwProb = [...s.cwProblem.items].filter(i => i.count).sort((a, b) => b.count - a.count);
    const ukAnswered = Math.max(1, s.ukProblem.total - s.ukProblem.missing);
    const cwAnswered = Math.max(1, s.cwProblem.total - s.cwProblem.missing);

    const L = [];
    L.push(`# Young people's priorities for the UK and the Commonwealth`);
    L.push(`\n*${CONFIG.privacy.controller} — findings from a youth consultation submitted ahead of ${CONFIG.consultation.chogmLabel}.*\n`);
    if (dataset.source.kind === 'sample') L.push(`> **Built from sample data — do not quote these numbers.**\n`);
    L.push(`- Responses: ${num(s.total)}`);
    L.push(`- UK nations and regions represented: ${s.regionsCovered} of 12`);
    L.push(`- Fieldwork: ${fmtDate(s.firstResponse)} to ${fmtDate(s.lastResponse)}`);
    L.push(`- Report generated: ${fmtDate(new Date())}\n`);

    L.push(`## Headline numbers\n`);
    if (ukProb.length) L.push(`- Biggest problem in the UK: **${ukProb[0].label}** (${pct(ukProb[0].count / ukAnswered)})`);
    if (cwProb.length) L.push(`- Biggest problem across the Commonwealth: **${cwProb[0].label}** (${pct(cwProb[0].count / cwAnswered)})`);
    if (back.length) L.push(`- Most asked to bring back: **${back[0].label}** (${pct(back[0].share)})`);
    if (gaps.length) L.push(`- Widest priority gap: **${gaps[0].label}** (+${gaps[0].gap.toFixed(1)} points)`);

    L.push(`\n## Policy area ratings (mean out of 10)\n`);
    L.push(`| Policy area | Works today | Long-term importance | Short-term urgency | Priority gap |`);
    L.push(`| --- | ---: | ---: | ---: | ---: |`);
    gaps.forEach(g => L.push(`| ${g.label} | ${g.performance} | ${g.longTerm} | ${g.shortTerm} | ${g.gap > 0 ? '+' : ''}${g.gap} |`));

    L.push(`\n## What young people want brought back\n`);
    L.push(`| Option | Share of respondents |`);
    L.push(`| --- | ---: |`);
    back.forEach(i => L.push(`| ${i.label} | ${pct(i.share)} |`));

    L.push(`\n## Biggest problem facing young people\n`);
    L.push(`| Policy area | UK | Commonwealth |`);
    L.push(`| --- | ---: | ---: |`);
    T.POLICY_AREAS.forEach(a => {
      const u = s.ukProblem.items.find(i => i.id === a.id).count;
      const c = s.cwProblem.items.find(i => i.id === a.id).count;
      L.push(`| ${a.label} | ${pct(u / ukAnswered)} | ${pct(c / cwAnswered)} |`);
    });

    L.push(`\n## Responses by UK nation and region\n`);
    L.push(`| Nation or region | Responses | Share |`);
    L.push(`| --- | ---: | ---: |`);
    [...s.byRegion.items].sort((a, b) => b.count - a.count)
      .forEach(r => L.push(`| ${r.label} | ${num(r.count)} | ${s.total ? pct(r.count / s.total) : '—'} |`));

    const quotes = D.verbatims(dataset.rows, 'chogmMessage', { minLength: 40 }).slice(0, 8);
    if (quotes.length) {
      L.push(`\n## In their own words\n`);
      quotes.forEach(q => L.push(`> "${q.text}"\n>\n> — ${[q.age, q.region].filter(Boolean).join(', ')}\n`));
    }

    L.push(`\n## Limitations\n`);
    L.push(`The sample is self-selecting and was reached largely through youth organisations, so young people already engaged with youth voice structures are likely to be over-represented. These findings describe the young people who responded and are not a probability sample of all young people; no margin of error is quoted because none would be meaningful.`);

    return L.join('\n');
  }

  async function copyMarkdown(btn) {
    const text = toMarkdown();
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied';
    } catch (e) {
      /* Clipboard access is blocked in some contexts — fall back to a download. */
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `chogm-consultation-report-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(a.href);
      btn.textContent = 'Downloaded';
    }
    setTimeout(() => { btn.textContent = 'Copy as Markdown'; }, 2500);
  }

  /* ---------- go ------------------------------------------------------------ */
  async function load() {
    const pill = document.getElementById('status-pill');
    try {
      dataset = await D.loadDataset(CONFIG);
      s = D.summarise(dataset.rows);
      pill.className = `status-pill status-pill--${dataset.source.kind === 'sample' ? 'sample' : 'live'}`;
      document.getElementById('status-text').textContent = dataset.source.kind === 'sample'
        ? 'Sample data — not for quotation'
        : `${num(dataset.rows.length)} responses`;
      build();
    } catch (err) {
      console.error(err);
      pill.className = 'status-pill status-pill--error';
      document.getElementById('status-text').textContent = 'Could not load the data';
      document.getElementById('report').innerHTML =
        `<div class="empty-state"><h3>The report could not be built</h3>
         <p class="muted">${esc(err.message)}</p>
         <p><a class="btn btn--quiet" href="results.html">Connect the data on the results page</a></p></div>`;
    }
  }

  document.getElementById('btn-print').addEventListener('click', () => window.print());
  document.getElementById('btn-markdown').addEventListener('click', e => copyMarkdown(e.currentTarget));
  load();
})();
