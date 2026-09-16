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
     A scroll-snap carousel: swipe, trackpad and keyboard scrolling all work
     natively, and the buttons simply call scrollTo.

     Controls are built immediately rather than after the images load. Slides
     are lazy-loaded and a horizontally scrolled one may not load at all until
     it is scrolled to, so waiting on every image would leave the carousel
     inert. Instead a slide whose file is missing removes itself whenever it
     resolves and the dots are rebuilt, and if every slide fails the section
     removes itself.                                                          */
  function renderGallery() {
    const root = document.querySelector('[data-carousel]');
    const track = document.querySelector('[data-carousel-track]');
    if (!root || !track) return;

    const section = root.closest('[data-gallery-section]');
    const items = CONFIG.team.gallery || [];
    if (!items.length) { section?.remove(); return; }

    track.innerHTML = items.map((g, i) => `
      <figure class="shot" data-shot>
        <img src="${g.src}" alt="${g.alt || ''}" loading="${i === 0 ? 'eager' : 'lazy'}"
             ${g.focus ? `style="object-position:${g.focus}"` : ''}
             data-caption="${(g.caption || '').replace(/"/g, '&quot;')}">
      </figure>`).join('');

    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    const dots = root.querySelector('[data-carousel-dots]');
    const caption = root.querySelector('[data-carousel-caption]');

    let slides = [], current = 0;

    const goTo = i => {
      if (!slides.length) return;
      const target = slides[Math.max(0, Math.min(slides.length - 1, i))];
      track.scrollTo({ left: target.offsetLeft - track.offsetLeft });
    };

    const sync = () => {
      if (!slides.length) return;
      /* The slide whose centre is nearest the viewport centre is the current one. */
      const pos = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      slides.forEach((s, i) => {
        const centre = s.offsetLeft - track.offsetLeft + s.clientWidth / 2;
        const dist = Math.abs(centre - pos);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      current = best;
      dots.querySelectorAll('.carousel__dot')
          .forEach((d, i) => d.setAttribute('aria-current', String(i === current)));
      caption.textContent = slides[current].querySelector('img').dataset.caption || '';
      prev.disabled = current === 0;
      next.disabled = current === slides.length - 1;
    };

    /* Re-read the slides and rebuild the dots. Called once at start, and again
       whenever a slide drops out because its image could not be loaded. */
    const refresh = () => {
      slides = [...track.querySelectorAll('[data-shot]')];
      if (!slides.length) { section?.remove(); return; }

      slides.forEach((s, i) => s.setAttribute('aria-label', `${i + 1} of ${slides.length}`));
      const single = slides.length === 1;
      prev.hidden = next.hidden = single;
      dots.hidden = single;
      dots.innerHTML = single ? '' : slides.map((s, i) =>
        `<button class="carousel__dot" type="button" data-index="${i}"
                 aria-label="Show photograph ${i + 1} of ${slides.length}"></button>`).join('');
      dots.querySelectorAll('.carousel__dot').forEach(d =>
        d.addEventListener('click', () => goTo(Number(d.dataset.index))));
      sync();
    };

    track.querySelectorAll('img').forEach(img => {
      const drop = () => { img.closest('[data-shot]')?.remove(); refresh(); };
      if (img.complete && !img.naturalWidth) { drop(); return; }
      img.addEventListener('error', drop);
      img.addEventListener('load', sync);   // a late-loading slide can shift widths
    });

    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));
    track.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
    });

    /* Scroll fires far more often than a frame; coalesce to one update. */
    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { sync(); ticking = false; });
    });
    window.addEventListener('resize', sync);

    refresh();
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
