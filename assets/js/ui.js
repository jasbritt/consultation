/* =============================================================================
   ui.js — site chrome: theme, navigation, and the config-driven fragments
   (partner strip, team bios, dates) that would otherwise be copy-pasted into
   every page.
   ========================================================================== */

(function () {
  const CONFIG = window.CONFIG;

  /* ---------- theme -------------------------------------------------------
     Three states: explicit light, explicit dark, or follow the operating
     system. The toggle cycles through them and charts redraw on 'themechange'
     because their colours come from CSS custom properties.                   */
  const STORE_KEY = 'chogm:theme';

  function storedTheme() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function applyTheme(value) {
    if (value === 'light' || value === 'dark') document.documentElement.setAttribute('data-theme', value);
    else document.documentElement.removeAttribute('data-theme');
    document.dispatchEvent(new CustomEvent('themechange'));
  }
  function currentMode() {
    const stored = storedTheme();
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  applyTheme(storedTheme());

  function initThemeToggle() {
    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    const paint = () => {
      const dark = currentMode() === 'dark';
      btn.innerHTML = dark
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      btn.setAttribute('title', btn.getAttribute('aria-label'));
    };
    paint();
    btn.addEventListener('click', () => {
      const next = currentMode() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(STORE_KEY, next); } catch (e) { /* private mode: session only */ }
      applyTheme(next);
      paint();
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!storedTheme()) { applyTheme(null); paint(); }
    });
  }

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

  /* ---------- partner strip ------------------------------------------------
     Renders an official asset when config points at one, and a neutral
     typographic plate when it does not. The plate is deliberately not a
     lookalike of anyone's identity — it is a placeholder, and draft mode says
     so in as many words.                                                      */
  function renderPartners() {
    const host = document.querySelector('[data-partners]');
    if (!host) return;
    host.innerHTML = CONFIG.partners.map(p => {
      const inner = p.assetPath
        ? `<img src="${p.assetPath}" alt="${p.name}">`
        : `<span class="partner__plate"><span class="partner__short">${p.short}</span>
             <span class="partner__name">${p.name}</span></span>`;
      return p.url
        ? `<a class="partner" href="${p.url}" rel="noopener">${inner}</a>`
        : `<div class="partner">${inner}</div>`;
    }).join('');
  }

  function renderDraftNotice() {
    document.querySelectorAll('[data-draft-notice]').forEach(host => {
      if (!CONFIG.draftMode) { host.remove(); return; }
      host.innerHTML =
        `<div class="notice notice--draft" role="note">
           <span class="notice__icon" aria-hidden="true">⚠</span>
           <p><strong>Draft — not yet an approved publication.</strong> Organisation names are shown as
           placeholders while permission to use each identity is sought. No endorsement by any government
           department or partner organisation is implied. Set <code>draftMode: false</code> in
           <code>assets/js/config.js</code> once approvals and official assets are in place.</p>
         </div>`;
    });
  }

  function renderTeam() {
    const host = document.querySelector('[data-team]');
    if (!host) return;
    const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    host.innerHTML = CONFIG.team.members.map(m => `
      <div class="card person">
        <span class="person__avatar" aria-hidden="true">${initials(m.name)}</span>
        <div>
          <div class="person__name">${m.name}</div>
          <div class="person__role">${[m.role, m.nation].filter(Boolean).join(' · ')}</div>
        </div>
        <p>${m.bio || ''}</p>
      </div>`).join('');
  }

  /* ---------- go ----------------------------------------------------------- */
  function init() {
    initThemeToggle();
    initNav();
    fillConfigText();
    renderPartners();
    renderDraftNotice();
    renderTeam();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.UI = { applyTheme, currentMode, fmtDate };
})();
