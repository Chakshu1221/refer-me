/* ============================================================
   GLOBAL RESPONSIVE FIXES  —  Refer Me!
   Import this LAST in main.jsx so it overrides page CSS:
     import './pages/css/responsive.css';
   Fixes: navbar overflow, min-width overflow, grids, heroes,
   tables, long text, sticky panels, on mobile & tablet.
   ============================================================ */

/* ---------- 0. Universal overflow guard ---------- */
*, *::before, *::after { box-sizing: border-box; }
html, body {
  max-width: 100%;
  overflow-x: hidden;            /* kill any accidental horizontal scroll */
}
img, svg, video, canvas { max-width: 100%; height: auto; }
input, textarea, select, button { max-width: 100%; }

/* long unbroken strings (emails, urls, company names) never push width */
.dh-title h1, .job-title h3, .mo-body h3, .pf-namebox h1,
.pv-title h3, .offer-who b, .asker-info b, .dv-item .info b {
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* ============================================================
   1. NAVBAR  — the main offender on phones
   ============================================================ */
.nav-inner { flex-wrap: nowrap; gap: 10px; }
.nav-brand { flex: 0 0 auto; }

@media (max-width: 780px) {
  .nav-inner { padding: 10px 14px; gap: 8px; }
  /* desktop text links already hidden; also move Sign-out into the menu */
  .nav-signout { display: none !important; }
  .nav-right { gap: 8px; margin-left: auto; }
  .nav-rp { font-size: 12px; padding: 6px 10px; }
  .nav-avatar { width: 34px; height: 34px; font-size: 13px; }
  .nav-burger { width: 38px; height: 38px; flex: 0 0 auto; }
}

/* very small phones: shrink the RP pill further so nothing clips */
@media (max-width: 380px) {
  .nav-rp { font-size: 11px; padding: 5px 8px; }
  .nav-brand { font-size: 17px; }
  .nav-brand .dot { width: 28px; height: 28px; font-size: 15px; }
}

/* mobile dropdown menu: make room for account actions */
.nav-mobile.open .nav-mobile-signout {
  margin-top: 6px; border-top: 1px solid var(--border); padding-top: 12px;
  color: var(--danger) !important; font-weight: 700;
}

/* ============================================================
   2. PAGE CONTAINER + HERO PADDING
   ============================================================ */
@media (max-width: 560px) {
  .page { padding: 18px 14px 48px; }
  .dash-hero, .browse-hero, .pr-hero, .detail-hero, .create-card, .pf-section, .panel-card {
    padding-left: 18px; padding-right: 18px;
  }
  .dash-hero { padding: 22px 18px; }
  .browse-hero { padding: 22px 18px; }
  .pr-hero { padding: 30px 18px; }
}

/* ============================================================
   3. NEUTRALISE min-width THAT FORCES HORIZONTAL SCROLL
   ============================================================ */
@media (max-width: 680px) {
  .dash-hi,
  .pf-namebox,
  .search-field,
  .btn-post,
  .asker,
  .offer-who,
  .dash-rp-big { min-width: 0 !important; }

  /* buttons that were flex:1 with min-width shouldn't overflow */
  .btn-post { width: 100%; }
  .create-actions { flex-direction: column; align-items: stretch; }
  .create-actions .btn-cancel { width: 100%; }
}

/* ============================================================
   4. GRIDS — force sensible columns on small screens
   ============================================================ */
@media (max-width: 620px) {
  .stat-grid { grid-template-columns: 1fr 1fr !important; }
  .action-grid { grid-template-columns: 1fr !important; }
  .req-grid { grid-template-columns: 1fr !important; }
  .browse-grid { grid-template-columns: 1fr !important; }
  .create-layout { grid-template-columns: 1fr !important; }
  .detail-layout { grid-template-columns: 1fr !important; }
  .pr-plans { grid-template-columns: 1fr !important; }
  .two-col { grid-template-columns: 1fr !important; }
  .uploads-row { grid-template-columns: 1fr !important; }
  .pf-grid { grid-template-columns: 1fr !important; }
  .mo-stats { grid-template-columns: 1fr 1fr !important; }
  .form-grid.two { grid-template-columns: 1fr !important; }
  .dv-add { grid-template-columns: 1fr !important; }
}

/* tablet: keep 2-up where 3-up is too tight */
@media (min-width: 621px) and (max-width: 900px) {
  .browse-grid { grid-template-columns: 1fr 1fr !important; }
  .create-layout,
  .detail-layout { grid-template-columns: 1fr !important; }
}

/* ============================================================
   5. STICKY PANELS — don't stick once stacked (mobile/tablet)
   ============================================================ */
@media (max-width: 900px) {
  .preview-wrap,
  .side-panel { position: static !important; top: auto !important; }
}

/* ============================================================
   6. DASHBOARD / DETAIL header rows wrap cleanly
   ============================================================ */
@media (max-width: 560px) {
  .dash-hero-row { flex-direction: column; align-items: flex-start; gap: 14px; }
  .dash-rp-big { width: 100%; justify-content: flex-start; }
  .dh-top { flex-wrap: wrap; }
  .dh-reward { margin-top: 4px; }
  .offer-actions { flex-wrap: wrap; }
  .offer-actions .btn-approve,
  .offer-actions .btn-reject { flex: 1 1 auto; }
}

/* ============================================================
   7. SEARCH BAR + TOOLBARS
   ============================================================ */
@media (max-width: 560px) {
  .search-bar { flex-direction: column; }
  .search-field { width: 100%; }
  .search-go { width: 100%; }
  .browse-toolbar { align-items: stretch; }
  .browse-sort { margin-left: 0; }
  .browse-sort select { width: 100%; }
  .filter-chips { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
}

/* ============================================================
   8. COMPARISON TABLE (premium) stays inside viewport
   ============================================================ */
.compare { overflow-x: auto; }
@media (max-width: 420px) {
  .compare-row { grid-template-columns: 1.3fr .7fr .7fr; font-size: 11.5px; padding: 11px 10px; }
}

/* ============================================================
   9. PROFILE identity row + document vault
   ============================================================ */
@media (max-width: 560px) {
  .pf-idrow { gap: 12px; }
  .pf-edit-btn { width: 100%; justify-content: center; margin-top: 4px; }
  .pf-stats { grid-template-columns: 1fr; }
  .dv-item { flex-wrap: wrap; }
  .dv-item .dv-actions { width: 100%; }
  .dv-item .dv-actions .dv-view,
  .dv-item .dv-actions .dv-del { flex: 1; text-align: center; }
  .pf-account { flex-direction: column; align-items: stretch; }
  .pf-signout { width: 100%; }
}

/* ============================================================
   10. MODAL / LIGHTBOX safe on small screens
   ============================================================ */
@media (max-width: 480px) {
  .modal { padding: 20px; }
  .modal-actions { flex-direction: column; }
  .modal-actions .btn-reject,
  .modal-actions .modal-cancel { width: 100%; }
  .lightbox-close { top: 14px; right: 16px; }
}

/* ============================================================
   11. AUTH (login/setup) — already split-screen; tighten small
   ============================================================ */
@media (max-width: 560px) {
  .auth-card, .setup-card { padding: 26px 20px; }
  .segmented { grid-template-columns: repeat(3, 1fr); }
  .segmented button { padding: 9px 2px; }
}
