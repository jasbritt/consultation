/* =============================================================================
   map.js — respondents by UK nation and region, drawn as a tile cartogram.

   Why a cartogram rather than a geographic outline: on a true map of the UK,
   London is a dot and the Highlands are enormous, so a colour gradient reads as
   "the countryside answered" when the opposite is true. Equal-area tiles give
   every nation and region the same visual weight, which is the honest encoding
   when the quantity is "how many young people replied". ONS and the BBC use the
   same device. The tile positions in taxonomy.js keep the rough geography so it
   is still navigable at a glance.

   Encoding: one hue, light to dark, six classes — the sequential rule. A region
   with no responses gets the neutral "no data" step, never the lightest blue,
   so "nobody answered" never looks like "a few answered".
   ========================================================================== */

const SEQ_STEPS = ['--seq-150', '--seq-250', '--seq-350', '--seq-450', '--seq-550', '--seq-700'];

/* Perceived luminance, used only to pick white or ink for the label sitting
   inside a filled tile — the one place text may sit on a data colour. */
function luminance(hex) {
  const m = hex.replace('#', '');
  const v = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* Class breaks. Linear across the observed range keeps the legend readable and
   the classes comparable between refreshes. */
function classify(count, max) {
  if (!count) return null;
  if (max <= 0) return 0;
  const idx = Math.ceil((count / max) * SEQ_STEPS.length) - 1;
  return Math.max(0, Math.min(SEQ_STEPS.length - 1, idx));
}

function choropleth(container, { items, total, unitLabel = 'responses' }) {
  const T = window.TAXONOMY;
  const C = window.CHARTS;

  C.mount(container, (root, width) => {
    const byId = Object.fromEntries(items.map(i => [i.id, i.count]));
    const max = Math.max(0, ...items.map(i => i.count));

    const cols = 4, rows = 5;
    const gap = 6;
    const boxW = Math.max(180, Math.min(width, 460));
    const tile = Math.floor((boxW - gap * (cols - 1)) / cols);
    const w = cols * tile + gap * (cols - 1);
    const h = rows * tile + gap * (rows - 1);

    const svg = C.el('svg', {
      class: 'chart', viewBox: `0 0 ${w} ${h}`, width: w, height: h,
      role: 'img',
      'aria-label': `Tile map of the United Kingdom showing ${unitLabel} by nation and region. ` +
        T.UK_REGIONS.map(r => `${r.label}: ${byId[r.id] || 0}`).join('. ')
    }, root);

    const zero = C.token('--seq-zero', '#f0efec');
    const inkOnLight = C.token('--ink', '#0b0b0b');

    T.UK_REGIONS.forEach(region => {
      const count = byId[region.id] || 0;
      const cls = classify(count, max);
      const fill = cls === null ? zero : C.token(SEQ_STEPS[cls]);
      const onDark = cls !== null && luminance(fill) < 0.5;
      const labelInk = cls === null ? C.token('--ink-muted', '#898781') : (onDark ? '#ffffff' : inkOnLight);

      const x = (region.tile.col - 1) * (tile + gap);
      const y = region.tile.row * (tile + gap);
      const share = total ? Math.round((count / total) * 100) : 0;

      const g = C.el('g', {
        class: 'tile', role: 'img', tabindex: '0',
        'aria-label': `${region.label}: ${count} ${unitLabel}, ${share}% of all responses`
      }, svg);

      C.el('rect', { x, y, width: tile, height: tile, rx: 8, fill, stroke: 'none' }, g);

      const code = C.el('text', {
        x: x + tile / 2, y: y + tile / 2 - 2, 'text-anchor': 'middle',
        'font-size': Math.max(11, Math.round(tile * 0.2)), 'font-weight': 700,
        fill: labelInk, 'font-family': 'var(--font)'
      }, g);
      code.textContent = region.short;

      const num = C.el('text', {
        x: x + tile / 2, y: y + tile / 2 + Math.max(14, tile * 0.22), 'text-anchor': 'middle',
        'font-size': Math.max(10, Math.round(tile * 0.17)),
        fill: labelInk, opacity: .92, 'font-family': 'var(--font)',
        style: 'font-variant-numeric: tabular-nums'
      }, g);
      num.textContent = count.toLocaleString('en-GB');

      C.bindTip(g, () =>
        `<span class="tip__title">${C.escapeHtml(region.label)}</span>` +
        C.tipRow(unitLabel.replace(/^./, c => c.toUpperCase()), count.toLocaleString('en-GB')) +
        C.tipRow('Share of total', `${share}%`));
    });
  });
}

/* The legend is a separate element so it can sit beside the map at wide widths
   and beneath it on a phone. */
function choroplethLegend(container, { max, unitLabel = 'responses' }) {
  const C = window.CHARTS;
  C.mount(container, root => {
    const wrap = document.createElement('div');
    wrap.className = 'scale-bar';
    wrap.innerHTML =
      `<div class="scale-bar__ramp" aria-hidden="true">${
        SEQ_STEPS.map(s => `<span style="background:${C.token(s)}"></span>`).join('')
      }</div>
       <div class="scale-bar__ends"><span>1</span><span>${Math.max(1, max).toLocaleString('en-GB')} ${unitLabel}</span></div>
       <div class="scale-bar__ends" style="margin-top:.4rem">
         <span style="display:inline-flex;align-items:center;gap:.4rem">
           <span style="width:12px;height:12px;border-radius:3px;background:${C.token('--seq-zero')};display:inline-block"></span>
           No responses yet
         </span>
       </div>`;
    root.appendChild(wrap);
  });
}

if (typeof window !== 'undefined') window.MAPS = { choropleth, choroplethLegend, classify, luminance };
