/* =============================================================================
   charts.js — small SVG chart library, written for this site.

   Why not a chart library: the report is printed to PDF and the same marks have
   to survive both dark mode and a black-and-white printer. Hand-drawn SVG keeps
   the mark specs exact (<=24px bars, 4px rounded data-ends, 2px surface gaps,
   hairline grid) and keeps the page dependency-free — which matters for a site
   that a government department may host behind its own controls.

   Every chart: reads colours from CSS custom properties so themes just work,
   re-renders on container resize and on theme change, has a hover tooltip and
   an accompanying table view.
   ========================================================================== */

const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}, parent = null) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    node.setAttribute(k, v);
  }
  if (parent) parent.appendChild(node);
  return node;
}

function token(name, fallback = '#2a78d6') {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const SERIES = i => token(`--series-${((i) % 8) + 1}`);

/* Approximate text width. Used only to decide whether a value label fits inside
   a bar; if the estimate is wrong the label goes outside, which is always safe. */
const textWidth = (str, size = 12.5) => String(str).length * size * 0.56;

/* Greedy word wrap to a pixel width, capped at `maxLines`. The last line gets an
   ellipsis only if we genuinely ran out of lines — labels are never clipped by
   the mark itself. */
function wrapLabel(text, width, size = 12.5, maxLines = 2) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (textWidth(candidate, size) > width && line) {
      lines.push(line); line = w;
      if (lines.length === maxLines) break;
    } else line = candidate;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines) {
    const consumed = lines.join(' ').split(/\s+/).length;
    if (consumed < words.length) lines[maxLines - 1] = lines[maxLines - 1].replace(/[,.;]?$/, '') + '…';
  }
  return lines;
}

/* Bar path with rounded corners on the data end only, square at the baseline. */
function barPath(x, y, w, h, r, dir = 'right') {
  const rad = Math.max(0, Math.min(r, dir === 'right' ? w : h, (dir === 'right' ? h : w) / 2));
  if (rad <= 0.5) return `M${x},${y}h${w}v${h}h${-w}Z`;
  if (dir === 'right') {
    return `M${x},${y}H${x + w - rad}A${rad},${rad} 0 0 1 ${x + w},${y + rad}V${y + h - rad}` +
           `A${rad},${rad} 0 0 1 ${x + w - rad},${y + h}H${x}Z`;
  }
  if (dir === 'left') {
    return `M${x + w},${y}H${x + rad}A${rad},${rad} 0 0 0 ${x},${y + rad}V${y + h - rad}` +
           `A${rad},${rad} 0 0 0 ${x + rad},${y + h}H${x + w}Z`;
  }
  /* 'up' — a column growing from the baseline at the bottom. */
  return `M${x},${y + h}V${y + rad}A${rad},${rad} 0 0 1 ${x + rad},${y}H${x + w - rad}` +
         `A${rad},${rad} 0 0 1 ${x + w},${y + rad}V${y + h}Z`;
}

/* ---------- shared tooltip ------------------------------------------------- */

let tipEl = null;
function tip() {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'tip';
    tipEl.setAttribute('role', 'status');
    document.body.appendChild(tipEl);
  }
  return tipEl;
}
function showTip(evt, html) {
  const t = tip();
  t.innerHTML = html;
  t.style.left = `${evt.clientX}px`;
  t.style.top = `${evt.clientY - 8}px`;
  t.classList.add('is-visible');
}
function hideTip() { if (tipEl) tipEl.classList.remove('is-visible'); }

/* Attach hover + keyboard focus behaviour to a hit area. The hit rect is always
   at least as large as the mark, so small dots stay easy to hit. */
function bindTip(node, htmlFn) {
  node.addEventListener('mousemove', e => showTip(e, htmlFn()));
  node.addEventListener('mouseleave', hideTip);
  node.addEventListener('focus', e => {
    const r = node.getBoundingClientRect();
    showTip({ clientX: r.left + r.width / 2, clientY: r.top }, htmlFn());
  });
  node.addEventListener('blur', hideTip);
  node.setAttribute('tabindex', '0');
}

const tipRow = (label, value) =>
  `<span class="tip__row"><span>${escapeHtml(label)}</span><span class="tip__val">${escapeHtml(value)}</span></span>`;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- render harness -------------------------------------------------
   Charts are functions of (container, width). This wires each one to a
   ResizeObserver and to the theme-change event so colours and layout stay
   correct without the caller thinking about it.                              */
const registry = new Set();

function mount(container, draw) {
  /* A container can be re-mounted many times as filters change. Tear down the
     previous observer and theme listener first, or they accumulate and keep
     drawing into a container that has since been emptied. */
  if (container.__chartCleanup) container.__chartCleanup();

  const render = () => {
    const width = container.clientWidth || 640;
    container.innerHTML = '';
    try {
      draw(container, width);
    } catch (err) {
      console.error('Chart failed to render', err);
      container.innerHTML = '<p class="muted">This chart could not be drawn.</p>';
    }
  };
  render();

  let ro = null;
  if (typeof ResizeObserver !== 'undefined') {
    let last = container.clientWidth;
    ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      if (Math.abs(w - last) > 12) { last = w; render(); }
    });
    ro.observe(container);
  }
  registry.add(render);
  document.addEventListener('themechange', render);

  /* Printing re-lays the page out at paper width. A ResizeObserver may not have
     run by the time the print snapshot is taken, so redraw explicitly — this is
     what keeps the saved PDF from containing desktop-width charts. */
  const onBeforePrint = () => render();
  const onAfterPrint = () => render();
  window.addEventListener('beforeprint', onBeforePrint);
  window.addEventListener('afterprint', onAfterPrint);

  container.__chartCleanup = () => {
    if (ro) ro.disconnect();
    registry.delete(render);
    document.removeEventListener('themechange', render);
    window.removeEventListener('beforeprint', onBeforePrint);
    window.removeEventListener('afterprint', onAfterPrint);
    delete container.__chartCleanup;
  };
  return render;
}

/* ---------- 1. Horizontal bar chart ----------------------------------------
   The workhorse: magnitude by category. One series, so no legend — the title
   says what is plotted.                                                      */
function barChart(container, opts) {
  const {
    items,                       // [{ label, value, n, note }]
    max = null,
    format = v => v,
    unit = '',
    color = null,               // null -> sequential blue slot 450
    reference = null,           // { value, label } e.g. the 5.0 midpoint
    axisTicks = null,
    labelWidth = null,
    barThickness = 22,
    maxLines = 2,
    sort = false
  } = opts;

  mount(container, (root, width) => {
    const data = sort ? [...items].sort((a, b) => b.value - a.value) : items;
    const fill = color || token('--seq-450', '#2a78d6');

    const labelW = labelWidth ?? Math.round(Math.min(Math.max(width * 0.34, 120), 240));
    const valueW = 46;
    const padR = 10, padT = 8, padB = 26;
    const plotW = Math.max(60, width - labelW - valueW - padR);
    /* Wrap every label up front so the row height is set by the labels that
       actually wrap, not by the number of lines we were willing to allow. */
    const wrapped = data.map(d => wrapLabel(d.label, labelW - 14, 12.5, maxLines));
    const usedLines = Math.max(1, ...wrapped.map(w => w.length));
    const band = barThickness + 22 + Math.max(0, usedLines - 2) * 14;
    const height = padT + data.length * band + padB;

    const svg = el('svg', {
      class: 'chart', viewBox: `0 0 ${width} ${height}`, width, height,
      role: 'img', 'aria-label': opts.ariaLabel || 'Bar chart'
    }, root);

    const domainMax = max ?? Math.max(1, ...data.map(d => d.value));
    const x = v => labelW + (v / domainMax) * plotW;

    /* Gridlines first, so data sits on top of them. */
    const ticks = axisTicks || [0, domainMax / 2, domainMax];
    ticks.forEach(t => {
      el('line', { class: 'c-grid', x1: x(t), x2: x(t), y1: padT, y2: padT + data.length * band }, svg);
      const lbl = el('text', { class: 'c-axis', x: x(t), y: height - 8, 'text-anchor': 'middle' }, svg);
      lbl.textContent = format(t);
    });

    if (reference) {
      const rx = x(reference.value);
      el('line', { class: 'c-ref', x1: rx, x2: rx, y1: padT - 2, y2: padT + data.length * band }, svg);
      const rl = el('text', { class: 'c-ref-label', x: rx, y: padT - 6, 'text-anchor': 'middle' }, svg);
      rl.textContent = reference.label;
    }

    el('line', { class: 'c-baseline', x1: labelW, x2: labelW, y1: padT, y2: padT + data.length * band }, svg);

    data.forEach((d, i) => {
      const y = padT + i * band;
      const g = el('g', { class: 'c-row' }, svg);
      const barY = y + (band - barThickness) / 2;
      const w = Math.max(0, x(d.value) - labelW);

      /* Category label, wrapped rather than clipped. */
      const lines = wrapped[i];
      const startY = y + band / 2 - (lines.length - 1) * 7 + 4;
      lines.forEach((ln, li) => {
        const t = el('text', { class: 'c-label', x: labelW - 12, y: startY + li * 14, 'text-anchor': 'end' }, g);
        t.textContent = ln;
      });

      el('path', { class: 'c-bar', d: barPath(labelW, barY, w, barThickness, 4, 'right'), fill }, g);

      /* Value at the tip: inside the bar when it comfortably fits, outside
         otherwise. Never clipped, never overlapping the mark's edge. */
      const valText = format(d.value) + unit;
      const fits = w > textWidth(valText) + 20;
      const v = el('text', {
        class: fits ? 'c-value c-value--inside' : 'c-value',
        x: fits ? labelW + w - 8 : labelW + w + 8,
        y: barY + barThickness / 2 + 4.5,
        'text-anchor': fits ? 'end' : 'start'
      }, g);
      v.textContent = valText;

      const hit = el('rect', { class: 'c-hit', x: labelW, y, width: plotW + valueW, height: band, role: 'img',
        'aria-label': `${d.label}: ${valText}${d.n ? `, ${d.n} responses` : ''}` }, g);
      bindTip(hit, () =>
        `<span class="tip__title">${escapeHtml(d.label)}</span>` +
        tipRow(opts.valueLabel || 'Value', valText) +
        (d.n ? tipRow('Responses', d.n.toLocaleString('en-GB')) : '') +
        (d.note ? `<span class="muted">${escapeHtml(d.note)}</span>` : '')
      );
    });
  });
}

/* ---------- 2. Diverging bar (the priority gap) ----------------------------
   Two hues either side of a neutral zero — blue where importance outruns
   delivery, red where delivery outruns importance.                           */
function divergingBar(container, opts) {
  const { items, format = v => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)), domain = null } = opts;

  mount(container, (root, width) => {
    const data = [...items].sort((a, b) => b.value - a.value);
    const labelW = Math.round(Math.min(Math.max(width * 0.34, 120), 240));
    const padT = 10, padB = 26, padR = 52;
    const plotW = Math.max(60, width - labelW - padR);
    const band = 40, thickness = 22;
    const height = padT + data.length * band + padB;

    const lim = domain ?? Math.max(1, ...data.map(d => Math.abs(d.value)));
    const mid = labelW + plotW / 2;
    const x = v => mid + (v / lim) * (plotW / 2);

    const svg = el('svg', { class: 'chart', viewBox: `0 0 ${width} ${height}`, width, height,
      role: 'img', 'aria-label': opts.ariaLabel || 'Diverging bar chart' }, root);

    const pos = token('--series-1', '#2a78d6');
    const neg = token('--series-8', '#e34948');

    [-lim, -lim / 2, 0, lim / 2, lim].forEach(t => {
      el('line', { class: t === 0 ? 'c-baseline' : 'c-grid', x1: x(t), x2: x(t), y1: padT, y2: padT + data.length * band }, svg);
      const lb = el('text', { class: 'c-axis', x: x(t), y: height - 8, 'text-anchor': 'middle' }, svg);
      lb.textContent = t === 0 ? '0' : (t > 0 ? `+${t.toFixed(1)}` : t.toFixed(1));
    });

    data.forEach((d, i) => {
      const y = padT + i * band;
      const g = el('g', { class: 'c-row' }, svg);
      const barY = y + (band - thickness) / 2;
      const positive = d.value >= 0;
      const w = Math.abs(x(d.value) - mid);
      const bx = positive ? mid : mid - w;

      const lines = wrapLabel(d.label, labelW - 14, 12.5, 2);
      const startY = y + band / 2 - (lines.length - 1) * 7 + 4;
      lines.forEach((ln, li) => {
        const t = el('text', { class: 'c-label', x: labelW - 12, y: startY + li * 14, 'text-anchor': 'end' }, g);
        t.textContent = ln;
      });

      el('path', {
        class: 'c-bar', fill: positive ? pos : neg,
        d: barPath(bx, barY, w, thickness, 4, positive ? 'right' : 'left')
      }, g);

      const v = el('text', {
        class: 'c-value',
        x: positive ? bx + w + 8 : bx - 8,
        y: barY + thickness / 2 + 4.5,
        'text-anchor': positive ? 'start' : 'end'
      }, g);
      v.textContent = format(d.value);

      const hit = el('rect', { class: 'c-hit', x: labelW, y, width: plotW, height: band, role: 'img',
        'aria-label': `${d.label}: ${format(d.value)}` }, g);
      bindTip(hit, () =>
        `<span class="tip__title">${escapeHtml(d.label)}</span>` +
        tipRow(opts.valueLabel || 'Gap', format(d.value)) +
        (d.detail ? d.detail.map(r => tipRow(r[0], r[1])).join('') : '')
      );
    });
  });
}

/* ---------- 3. Dumbbell / connected dot plot -------------------------------
   Two series per category with the distance between them as the story. Legend
   always present; dots carry a 2px surface ring so they read where they cross. */
function dumbbell(container, opts) {
  const { items, seriesA, seriesB, domain = [0, 10], format = v => v.toFixed(1) } = opts;

  mount(container, (root, width) => {
    const data = [...items].sort((a, b) => b.b - a.b);
    const labelW = Math.round(Math.min(Math.max(width * 0.32, 120), 230));
    const padT = 8, padB = 28, padR = 46;
    const plotW = Math.max(60, width - labelW - padR);
    const band = 34, height = padT + data.length * band + padB;
    const [lo, hi] = domain;
    const x = v => labelW + ((v - lo) / (hi - lo)) * plotW;

    const svg = el('svg', { class: 'chart', viewBox: `0 0 ${width} ${height}`, width, height,
      role: 'img', 'aria-label': opts.ariaLabel || 'Connected dot plot' }, root);

    const cA = token('--series-1'), cB = token('--series-2');
    const surface = token('--surface', '#fcfcfb');

    for (let t = lo; t <= hi; t += (hi - lo) / 5) {
      el('line', { class: 'c-grid', x1: x(t), x2: x(t), y1: padT, y2: padT + data.length * band }, svg);
      const lb = el('text', { class: 'c-axis', x: x(t), y: height - 10, 'text-anchor': 'middle' }, svg);
      lb.textContent = Math.round(t);
    }
    el('line', { class: 'c-baseline', x1: labelW, x2: labelW, y1: padT, y2: padT + data.length * band }, svg);

    data.forEach((d, i) => {
      const y = padT + i * band + band / 2;
      const g = el('g', { class: 'c-row' }, svg);

      const lines = wrapLabel(d.label, labelW - 14, 12.5, 2);
      const startY = y - (lines.length - 1) * 7 + 4;
      lines.forEach((ln, li) => {
        const t = el('text', { class: 'c-label', x: labelW - 12, y: startY + li * 14, 'text-anchor': 'end' }, g);
        t.textContent = ln;
      });

      el('line', { class: 'c-connector', x1: x(d.a), x2: x(d.b), y1: y, y2: y }, g);
      el('circle', { class: 'c-dot c-dot-ring', cx: x(d.a), cy: y, r: 5.5, fill: cA, stroke: surface }, g);
      el('circle', { class: 'c-dot c-dot-ring', cx: x(d.b), cy: y, r: 5.5, fill: cB, stroke: surface }, g);

      const hit = el('rect', { class: 'c-hit', x: labelW, y: y - band / 2, width: plotW + padR, height: band, role: 'img',
        'aria-label': `${d.label}: ${seriesA.label} ${format(d.a)}, ${seriesB.label} ${format(d.b)}` }, g);
      bindTip(hit, () =>
        `<span class="tip__title">${escapeHtml(d.label)}</span>` +
        tipRow(seriesA.label, format(d.a)) +
        tipRow(seriesB.label, format(d.b)) +
        tipRow('Difference', (d.b - d.a >= 0 ? '+' : '') + (d.b - d.a).toFixed(1))
      );
    });
  });
}

/* ---------- 4. Quadrant scatter -------------------------------------------
   Short-term urgency against long-term importance. One series, direct labels —
   the whole point is reading which area sits in which quadrant.              */
function quadrantScatter(container, opts) {
  const { points, xLabel, yLabel, domain = [4, 10], quadrantLabels = {} } = opts;

  mount(container, (root, width) => {
    const padL = 54, padR = 16, padT = 16, padB = 52;
    const plotW = Math.max(120, width - padL - padR);
    const plotH = Math.max(220, Math.min(plotW * 0.72, 420));
    const height = padT + plotH + padB;

    const [lo, hi] = domain;
    const x = v => padL + ((v - lo) / (hi - lo)) * plotW;
    const y = v => padT + plotH - ((v - lo) / (hi - lo)) * plotH;
    const midX = (lo + hi) / 2, midY = (lo + hi) / 2;

    const svg = el('svg', { class: 'chart', viewBox: `0 0 ${width} ${height}`, width, height,
      role: 'img', 'aria-label': opts.ariaLabel || 'Scatter plot' }, root);

    /* Quadrant wash — the faintest possible cue that this is a 2x2 read. */
    el('rect', { class: 'c-quadrant', x: x(midX), y: padT, width: x(hi) - x(midX), height: y(midY) - padT, opacity: .7 }, svg);

    for (let t = lo; t <= hi; t += 1) {
      el('line', { class: 'c-grid', x1: x(t), x2: x(t), y1: padT, y2: padT + plotH }, svg);
      el('line', { class: 'c-grid', x1: padL, x2: padL + plotW, y1: y(t), y2: y(t) }, svg);
      const xt = el('text', { class: 'c-axis', x: x(t), y: padT + plotH + 18, 'text-anchor': 'middle' }, svg);
      xt.textContent = t;
      const yt = el('text', { class: 'c-axis', x: padL - 10, y: y(t) + 4, 'text-anchor': 'end' }, svg);
      yt.textContent = t;
    }
    el('line', { class: 'c-ref', x1: x(midX), x2: x(midX), y1: padT, y2: padT + plotH }, svg);
    el('line', { class: 'c-ref', x1: padL, x2: padL + plotW, y1: y(midY), y2: y(midY) }, svg);
    el('line', { class: 'c-baseline', x1: padL, x2: padL + plotW, y1: padT + plotH, y2: padT + plotH }, svg);
    el('line', { class: 'c-baseline', x1: padL, x2: padL, y1: padT, y2: padT + plotH }, svg);

    const xl = el('text', { class: 'c-label c-label--strong', x: padL + plotW / 2, y: height - 16, 'text-anchor': 'middle' }, svg);
    xl.textContent = xLabel;
    const yl = el('text', { class: 'c-label c-label--strong', x: 16, y: padT + plotH / 2,
      'text-anchor': 'middle', transform: `rotate(-90 16 ${padT + plotH / 2})` }, svg);
    yl.textContent = yLabel;

    if (quadrantLabels.topRight) {
      const q = el('text', { class: 'c-quadrant-label', x: x(hi) - 6, y: padT + 14, 'text-anchor': 'end' }, svg);
      q.textContent = quadrantLabels.topRight;
    }
    if (quadrantLabels.topLeft) {
      const q = el('text', { class: 'c-quadrant-label', x: padL + 6, y: padT + 14 }, svg);
      q.textContent = quadrantLabels.topLeft;
    }

    const fill = token('--series-1');
    const surface = token('--surface', '#fcfcfb');

    /* Direct labels are the whole point of this chart, so they have to be placed
       rather than just offset. Each label tries four positions around its dot
       and takes the first that neither collides with a label already placed nor
       runs outside the plot; a label that would overflow the right edge tries
       the left side first. */
    const placed = [];
    const overlaps = (a, b) =>
      a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;

    points.forEach(p => {
      const cx = x(p.x), cy = y(p.y);
      const g = el('g', { class: 'c-row' }, svg);
      el('circle', { class: 'c-dot c-dot-ring', cx, cy, r: 6, fill, stroke: surface }, g);

      const text = p.short || p.label;
      const tw = textWidth(text), th = 14;
      const right = { x: cx + 11, y: cy + 4, anchor: 'start', x1: cx + 11, x2: cx + 11 + tw };
      const left  = { x: cx - 11, y: cy + 4, anchor: 'end',   x1: cx - 11 - tw, x2: cx - 11 };
      const above = { x: cx, y: cy - 11, anchor: 'middle', x1: cx - tw / 2, x2: cx + tw / 2 };
      const below = { x: cx, y: cy + 20, anchor: 'middle', x1: cx - tw / 2, x2: cx + tw / 2 };

      const wouldOverflow = cx + 11 + tw > padL + plotW;
      const candidates = (wouldOverflow ? [left, above, below, right] : [right, left, above, below])
        .map(c => ({ ...c, y1: c.y - th + 3, y2: c.y + 4 }))
        .filter(c => c.x1 >= 2 && c.x2 <= width - 2);

      /* Where the points are dense every position collides with something. Rather
         than defaulting to the first, score the candidates by how much they
         overlap and take the least-bad one. */
      const overlapArea = (a, b) => overlaps(a, b)
        ? (Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * (Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1))
        : 0;
      const scored = candidates.map(c => ({ c, cost: placed.reduce((sum, q) => sum + overlapArea(c, q), 0) }));
      const spot = (scored.find(sc => sc.cost === 0)
                 || scored.sort((a, b) => a.cost - b.cost)[0] || {}).c
                || { ...right, y1: cy - 10, y2: cy + 8 };

      const label = el('text', { class: 'c-label', x: spot.x, y: spot.y, 'text-anchor': spot.anchor }, g);
      label.textContent = text;
      placed.push(spot);

      const hit = el('circle', { class: 'c-hit', cx, cy, r: 14, role: 'img',
        'aria-label': `${p.label}: ${xLabel} ${p.x.toFixed(1)}, ${yLabel} ${p.y.toFixed(1)}` }, g);
      bindTip(hit, () =>
        `<span class="tip__title">${escapeHtml(p.label)}</span>` +
        tipRow(xLabel, p.x.toFixed(1)) +
        tipRow(yLabel, p.y.toFixed(1)) +
        (p.n ? tipRow('Responses', p.n.toLocaleString('en-GB')) : ''));
    });
  });
}

/* ---------- 5. Stacked distribution bar (0–10 spread) ---------------------- */
function distributionBar(container, opts) {
  const { dist, total } = opts;                     // dist = 11 counts, 0..10
  mount(container, (root, width) => {
    const h = 26, gap = 2;
    const svg = el('svg', { class: 'chart', viewBox: `0 0 ${width} ${h}`, width, height: h,
      role: 'img', 'aria-label': 'Distribution of ratings from 0 to 10' }, root);
    if (!total) return;
    let cursor = 0;
    dist.forEach((count, score) => {
      if (!count) return;
      const w = (count / total) * width - gap;
      if (w <= 0) return;
      const step = ['--seq-100','--seq-150','--seq-200','--seq-250','--seq-300','--seq-350',
                    '--seq-400','--seq-450','--seq-500','--seq-600','--seq-700'][score];
      const g = el('g', {}, svg);
      el('rect', { x: cursor, y: 0, width: w, height: h, rx: 3, fill: token(step) }, g);
      bindTip(el('rect', { class: 'c-hit', x: cursor, y: 0, width: w, height: h }, g), () =>
        tipRow(`Rated ${score}`, `${count} (${Math.round(count / total * 100)}%)`));
      cursor += w + gap;
    });
  });
}

/* ---------- table view ------------------------------------------------------
   Every chart ships one. Identity and value are then available without colour,
   without hover, and to a screen reader as a plain table.                     */
function tableView(container, { columns, rows, caption }) {
  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const t = document.createElement('table');
  t.className = 'data';
  if (caption) { const c = document.createElement('caption'); c.textContent = caption; t.appendChild(c); }
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>${columns.map(c =>
    `<th scope="col"${c.numeric ? ' class="num"' : ''}>${escapeHtml(c.label)}</th>`).join('')}</tr>`;
  const tbody = document.createElement('tbody');
  tbody.innerHTML = rows.map(r => `<tr>${r.map((cell, i) =>
    `<td${columns[i].numeric ? ' class="num"' : ''}>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
  t.append(thead, tbody);
  wrap.appendChild(t);
  container.appendChild(wrap);
  return wrap;
}

/* A figure with a "show the numbers" toggle beneath it. */
function withTable(figureEl, tableSpec) {
  const foot = figureEl.querySelector('.figure__foot');
  if (!foot) return;
  /* Re-rendering a figure must replace its table toggle, not add a second one. */
  figureEl.querySelectorAll('[data-table-host]').forEach(n => n.remove());
  foot.querySelectorAll('[data-table-toggle]').forEach(n => n.remove());

  const btn = document.createElement('button');
  btn.className = 'btn btn--quiet btn--sm no-print';
  btn.type = 'button';
  btn.setAttribute('data-table-toggle', '');
  btn.textContent = 'Show the numbers';
  btn.setAttribute('aria-expanded', 'false');
  const host = document.createElement('div');
  host.hidden = true;
  host.setAttribute('data-table-host', '');
  figureEl.appendChild(host);
  btn.addEventListener('click', () => {
    const open = !host.hidden;
    host.hidden = open;
    btn.setAttribute('aria-expanded', String(!open));
    btn.textContent = open ? 'Show the numbers' : 'Hide the numbers';
    if (!open && !host.dataset.built) { tableView(host, tableSpec); host.dataset.built = '1'; }
  });
  foot.appendChild(btn);
}

const CHARTS = {
  barChart, divergingBar, dumbbell, quadrantScatter, distributionBar,
  tableView, withTable, token, SERIES, escapeHtml, mount, el, barPath, wrapLabel, bindTip, tipRow
};
if (typeof window !== 'undefined') window.CHARTS = CHARTS;
