/* =============================================================================
   livemap.js — a pan-and-zoom map of where responses have come from.

   Each respondent's outward postcode is resolved to its postcode area (see
   postcodes.js) and drawn as one dot per area, sized by how many people there
   replied. Clicking a dot names the post town and county.

   WHY THERE IS A FALLBACK
   The map needs Leaflet and map tiles from the network. Plenty of school,
   college and government networks block third-party CDNs and tile servers
   outright, and this page has to work on them. So if Leaflet does not load
   within a few seconds, the page falls back to the tile cartogram — which needs
   nothing but the response data and is what this page used before.
   ========================================================================== */

const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const UK_VIEW = { center: [54.6, -3.2], zoom: 5 };

/* Load a script/stylesheet once, rejecting if it does not arrive. */
function loadOnce(tag, attrs, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`${tag}[data-livemap]`);
    if (existing && existing.dataset.loaded === '1') return resolve();

    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    el.setAttribute('data-livemap', '');
    const timer = setTimeout(() => reject(new Error('timed out')), timeout);
    el.onload = () => { clearTimeout(timer); el.dataset.loaded = '1'; resolve(); };
    el.onerror = () => { clearTimeout(timer); reject(new Error('failed to load')); };
    document.head.appendChild(el);
  });
}

/* Group rows by place. The region answer is passed alongside the postcode
   because several territories use prefixes that collide with UK areas, and the
   pair resolves what neither does alone. Rows without a usable postcode are
   counted separately so the map can say how many it could not place. */
function locations(rows) {
  const byPlace = new Map();
  let unplaced = 0;
  rows.forEach(r => {
    const found = window.POSTCODES.locate(r.postcodeArea, r.ukRegion);
    if (!found) { unplaced++; return; }
    const entry = byPlace.get(found.key) || { ...found, count: 0 };
    entry.count++;
    byPlace.set(found.key, entry);
  });
  return { places: [...byPlace.values()].sort((a, b) => b.count - a.count), unplaced };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* Dot radius grows with the square root of the count, so area — not radius —
   tracks the number of people, which is how a circle is read. */
const radiusFor = (count, max) => 6 + Math.sqrt(count / Math.max(1, max)) * 16;

async function render(host, rows, { onFallback } = {}) {
  const { places, unplaced } = locations(rows);
  const C = window.CHARTS;

  try {
    await Promise.all([
      loadOnce('link', { rel: 'stylesheet', href: LEAFLET_CSS }),
      loadOnce('script', { src: LEAFLET_JS, crossorigin: 'anonymous' })
    ]);
    if (!window.L) throw new Error('Leaflet did not define L');
  } catch (err) {
    console.warn('Live map unavailable, falling back to the tile map:', err.message);
    if (onFallback) onFallback(err);
    return { ok: false, places, unplaced };
  }

  const L = window.L;
  host.innerHTML = '';
  const canvas = document.createElement('div');
  canvas.className = 'livemap__canvas';
  host.appendChild(canvas);

  const map = L.map(canvas, {
    center: UK_VIEW.center, zoom: UK_VIEW.zoom,
    scrollWheelZoom: false,        // so the page still scrolls past the map
    worldCopyJump: true
  });
  map.on('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());

  L.tileLayer(TILES, { attribution: TILE_ATTRIBUTION, maxZoom: 18 }).addTo(map);

  const max = Math.max(1, ...places.map(p => p.count));
  const markers = [];
  places.forEach(p => {
    const marker = L.circleMarker([p.lat, p.lon], {
      radius: radiusFor(p.count, max),
      color: '#ffffff', weight: 2, opacity: 1,
      fillColor: '#2a78d6', fillOpacity: .78
    }).addTo(map);

    /* The town and county, as asked — with the number of responses beneath,
       because one dot can stand for many people. */
    marker.bindPopup(
      `<strong>${escapeHtml(p.town)}, ${escapeHtml(p.county)}</strong>` +
      `<br><span class="livemap__count">${p.count} response${p.count === 1 ? '' : 's'}</span>`);
    marker.bindTooltip(`${p.town}, ${p.county}`);
    markers.push({ ...p, marker });
  });

  /* The edge arrows. Respondents in the Crown Dependencies and the Overseas
     Territories sit far outside the UK view, so panning by a screen width would
     never reach them — each arrow jumps to the next respondent location in that
     direction instead, and says so. */
  function jump(direction) {
    const here = map.getCenter().lng;
    const candidates = markers
      .filter(m => direction < 0 ? m.lon < here - 0.5 : m.lon > here + 0.5)
      .sort((a, b) => direction < 0 ? b.lon - a.lon : a.lon - b.lon);
    if (candidates.length) {
      const next = candidates[0];
      map.flyTo([next.lat, next.lon], next.overseas ? 7 : Math.max(map.getZoom(), 6), { duration: 1.1 });
      next.marker.openPopup();
    } else {
      map.panBy([direction * host.clientWidth * 0.6, 0], { animate: true });
    }
  }

  ['west', 'east'].forEach(side => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `livemap__arrow livemap__arrow--${side}`;
    btn.innerHTML =
      `<span class="livemap__arrow-icon" aria-hidden="true">${side === 'west' ? '‹' : '›'}</span>` +
      `<span class="livemap__arrow-text">Scroll this way to see respondents from the British Overseas Territories</span>`;
    btn.setAttribute('aria-label',
      `Scroll ${side} to see respondents from the Crown Dependencies and British Overseas Territories`);
    btn.addEventListener('click', () => jump(side === 'west' ? -1 : 1));
    host.appendChild(btn);
  });

  /* Leaflet measures the container on creation; if it was laid out since (a
     filter change, a resize), tell it to look again. */
  setTimeout(() => map.invalidateSize(), 0);
  window.addEventListener('resize', () => map.invalidateSize());

  host.__livemap = map;
  return { ok: true, map, places, unplaced };
}

/* A map left behind by a previous render holds listeners and tiles. */
function destroy(host) {
  if (host && host.__livemap) { host.__livemap.remove(); delete host.__livemap; }
}

if (typeof window !== 'undefined') window.LIVEMAP = { render, destroy, locations };
