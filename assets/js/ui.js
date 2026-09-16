/* =============================================================================
   ui.js — site chrome: theme, navigation, and the config-driven fragments
   (partner strip, team bios, dates) that would otherwise be copy-pasted into
   every page.
   ========================================================================== */

(function () {
  const CONFIG = window.CONFIG;

  /* ---------- theme -------------------------------------------------------
     There is no in-page theme control. The stylesheet still honours the
     viewer's operating-system light/dark preference through
     prefers-color-scheme, which needs no JavaScript.                         */

  /* ---------- navigation --------------------------------------------------- */
  function initNav() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav]');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
    }
    /* Mark the current page without hard-coding it in five files. */
    const page = document.body.dataset.page;
    document.querySelectorAll('[data-nav] a[data-page]').forEach(a => {
      if (a.dataset.page === page) a.setAttribute('aria-current', 'page');
    });
  }

  /* ---------- config-driven text ------------------------------------------
     <span data-config="consultation.closesOn" data-format="date"></span>      */
  function readPath(obj, path) {
    return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
  }
  const fmtDate = iso => {
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  function fillConfigText() {
    document.querySelectorAll('[data-config]').forEach(node => {
      const value = readPath(CONFIG, node.dataset.config);
      if (value === undefined || value === null || value === '') return;
      node.textContent = node.dataset.format === 'date' ? fmtDate(value)
        : node.dataset.format === 'number' ? Number(value).toLocaleString('en-GB')
        : value;
    });
    document.querySelectorAll('[data-config-href]').forEach(node => {
      const value = readPath(CONFIG, node.dataset.configHref);
      if (!value) return;
      /* An email address in config becomes a mailto: link; a URL is used as-is. */
      const href = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : value;
      node.setAttribute('href', href);
    });
    document.querySelectorAll('[data-year]').forEach(n => { n.textContent = new Date().getFullYear(); });
  }

  /* ---------- header logo -------------------------------------------------
     Swaps the lettermark for the real logo where one is configured. If the
     file 404s the image removes itself and the lettermark stays, so a missing
     asset degrades to the old header rather than to a broken image icon.     */
  function renderLogo() {
    const brand = CONFIG.brand || {};
    if (!brand.logo) return;
    document.querySelectorAll('[data-brand-crest]').forEach(host => {
      const img = new Image();
      img.src = brand.logo;
      img.alt = '';
      img.onload = () => {
        host.classList.add('brandmark__crest--image');
        host.textContent = '';
        host.appendChild(img);
      };
    });
  }

  /* ---------- partner strip ------------------------------------------------
     Renders an official asset when config points at one, and a neutral
     typographic plate when it does not. The plate is deliberately not a
     lookalike of anyone's identity — it is a placeholder, and draft mode says
     so in as many words.                                                      */
  function renderPartners() {
    const host = document.querySelector('[data-partners]');
    if (!host) return;
    /* A configured logo that fails to load falls back to the name plate, so a
       wrong path shows the organisation's name rather than a broken image. */
    const plate = p =>
      `<span class="partner__plate"><span class="partner__short">${p.short}</span>` +
      `<span class="partner__name">${p.name}</span></span>`;

    host.innerHTML = CONFIG.partners.map(p => {
      const inner = p.assetPath
        ? `<img src="${p.assetPath}" alt="${p.name}" onerror="this.outerHTML=${
             JSON.stringify(plate(p)).replace(/"/g, '&quot;')}">`
        : plate(p);
      return p.url
        ? `<a class="partner" href="${p.url}" rel="noopener">${inner}</a>`
        : `<div class="partner">${inner}</div>`;
    }).join('');
  }

  function renderTeam() {
    const host = document.querySelector('[data-team]');
    if (!host) return;
    const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    host.innerHTML = CONFIG.team.members.map(m => `
      <div class="card person">
        ${m.photo
          ? `<img class="person__photo" src="${m.photo}" alt="${m.name}" loading="lazy"
                  onerror="this.replaceWith(Object.assign(document.createElement('span'),
                           {className:'person__avatar', textContent:'${initials(m.name)}'}))">`
          : `<span class="person__avatar" aria-hidden="true">${initials(m.name)}</span>`}
        <div>
          <div class="person__name">${m.name}</div>
          <div class="person__role">${m.role || ''}</div>
        </div>
        <p>${m.bio || ''}</p>
      </div>`).join('');

    const linkHost = document.querySelector('[data-team-links]');
    if (linkHost && CONFIG.team.links) {
      linkHost.innerHTML = CONFIG.team.links.map(l => `
        <a class="card link-card" href="${l.url}" rel="noopener" target="_blank">
          <span class="link-card__label">${l.label}</span>
          <span class="link-card__blurb">${l.blurb}</span>
          <span class="link-card__cue" aria-hidden="true">Visit →</span>
        </a>`).join('');
    }
  }

  /* ---------- photographs of the delegation's work ------------------------
     Each figure hides itself if its file is missing, and the whole section
     hides if none of them load — so an empty assets/img/work/ folder leaves
     no trace on the page.                                                    */
  function renderGallery() {
    const host = document.querySelector('[data-gallery]');
    if (!host) return;
    const items = (CONFIG.team.gallery || []);
    if (!items.length) { host.closest('[data-gallery-section]')?.remove(); return; }

    host.innerHTML = items.map(g => `
      <figure class="shot" data-shot>
        <img src="${g.src}" alt="${g.alt || ''}" loading="lazy">
        <figcaption>${g.caption || ''}</figcaption>
      </figure>`).join('');

    let loaded = 0, settled = 0;
    const done = () => {
      if (++settled === items.length && loaded === 0) {
        host.closest('[data-gallery-section]')?.remove();
      }
    };
    host.querySelectorAll('[data-shot] img').forEach(img => {
      img.addEventListener('load', () => { loaded++; done(); });
      img.addEventListener('error', () => { img.closest('[data-shot]').remove(); done(); });
      if (img.complete && img.naturalWidth) { loaded++; settled++; }
    });
  }

  /* ---------- go ----------------------------------------------------------- */
  function init() {
    initNav();
    fillConfigText();
    renderPartners();
    renderLogo();
    renderTeam();
    renderGallery();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.UI = { fmtDate };
})();
