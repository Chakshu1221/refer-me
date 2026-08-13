/* ============================================================
   AUTH / LOGIN SCREEN — premium, responsive
   Mobile-first, scales to tablet & laptop.
   ============================================================ */

.auth-wrap {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 1fr;
  background: #0b1020;
  color: var(--text);
}

/* On laptop/tablet: two columns (story + form) */
@media (min-width: 900px) {
  .auth-wrap { grid-template-columns: 1.05fr 1fr; }
}

/* ---------------- LEFT: brand story panel ---------------- */
.auth-brand {
  position: relative;
  overflow: hidden;
  display: none;                 /* hidden on phones to save space */
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  color: #fff;
  background:
    radial-gradient(1100px 700px at -10% -10%, #6d5efc55, transparent 60%),
    radial-gradient(900px 600px at 110% 20%, #f59e0b40, transparent 55%),
    radial-gradient(800px 800px at 50% 120%, #22d3ee33, transparent 55%),
    linear-gradient(135deg, #1e1b4b 0%, #0b1020 60%);
}
@media (min-width: 900px) { .auth-brand { display: flex; } }

/* animated floating blobs */
.auth-brand::before,
.auth-brand::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: .55;
  animation: floatBlob 14s ease-in-out infinite;
}
.auth-brand::before {
  width: 320px; height: 320px; top: -60px; right: -40px;
  background: radial-gradient(circle, #7c6cff, transparent 70%);
}
.auth-brand::after {
  width: 280px; height: 280px; bottom: -50px; left: -30px;
  background: radial-gradient(circle, #f59e0b, transparent 70%);
  animation-delay: -6s;
}
@keyframes floatBlob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(20px, -24px) scale(1.08); }
}

.auth-brand-top { position: relative; z-index: 2; }
.auth-logo {
  display: inline-flex; align-items: center; gap: 10px;
  font-weight: 800; font-size: 22px; letter-spacing: -.5px;
}
.auth-logo .dot {
  width: 34px; height: 34px; border-radius: 10px;
  display: grid; place-items: center; font-size: 18px;
  background: linear-gradient(135deg, #7c6cff, #4f46e5);
  box-shadow: 0 8px 24px #4f46e566;
}
.auth-logo b span { color: var(--accent); }

.auth-headline {
  position: relative; z-index: 2;
  margin: 40px 0;
}
.auth-headline h1 {
  font-size: clamp(30px, 3.4vw, 46px);
  line-height: 1.1; margin: 0 0 16px;
  font-weight: 800; letter-spacing: -1px;
}
.auth-headline h1 em {
  font-style: normal;
  background: linear-gradient(120deg, #a78bfa, #f59e0b);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.auth-headline p {
  font-size: 17px; line-height: 1.6; color: #c7d2fe; max-width: 440px;
}

/* feature list */
.auth-feats { position: relative; z-index: 2; display: grid; gap: 14px; margin-top: 8px; }
.auth-feat {
  display: flex; gap: 14px; align-items: flex-start;
  padding: 14px 16px; border-radius: 14px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.10);
  backdrop-filter: blur(6px);
}
.auth-feat .ico {
  flex: 0 0 auto; width: 40px; height: 40px; border-radius: 11px;
  display: grid; place-items: center; font-size: 19px;
  background: rgba(255,255,255,.10);
}
.auth-feat h4 { margin: 0 0 3px; font-size: 15px; }
.auth-feat p  { margin: 0; font-size: 13.5px; color: #b6c0e6; line-height: 1.45; }

/* floating stat card */
.auth-stat {
  position: relative; z-index: 2;
  margin-top: 28px;
  display: inline-flex; align-items: center; gap: 14px;
  padding: 14px 18px; border-radius: 16px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  box-shadow: 0 20px 50px rgba(0,0,0,.35);
  animation: floatCard 6s ease-in-out infinite;
}
@keyframes floatCard {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-8px); }
}
.auth-stat .rp {
  width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center;
  font-size: 22px; background: linear-gradient(135deg, #f59e0b, #f97316);
}
.auth-stat b { display: block; font-size: 18px; }
.auth-stat span { font-size: 12.5px; color: #b6c0e6; }

/* ---------------- RIGHT: sign-in panel ---------------- */
.auth-panel {
  display: flex; align-items: center; justify-content: center;
  padding: 32px 20px;
  background:
    radial-gradient(700px 500px at 50% -10%, #eef2ff, transparent 70%),
    var(--bg);
}
.auth-card {
  width: 100%; max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 36px 30px;
  box-shadow: 0 30px 60px -20px rgba(30, 27, 75, .25);
  animation: cardIn .5s cubic-bezier(.2,.7,.3,1) both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* mobile mini-brand (only shows when left panel hidden) */
.auth-mini-brand {
  display: flex; align-items: center; gap: 10px;
  justify-content: center; margin-bottom: 18px;
}
@media (min-width: 900px) { .auth-mini-brand { display: none; } }
.auth-mini-brand .dot {
  width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center;
  font-size: 20px; color: #fff;
  background: linear-gradient(135deg, #7c6cff, #4f46e5);
  box-shadow: 0 10px 24px #4f46e544;
}
.auth-mini-brand b { font-size: 22px; font-weight: 800; letter-spacing: -.5px; }
.auth-mini-brand b span { color: var(--accent); }

.auth-card h2 {
  margin: 0 0 6px; font-size: 26px; font-weight: 800;
  letter-spacing: -.5px; text-align: center;
}
.auth-card .sub {
  margin: 0 0 26px; text-align: center;
  color: var(--muted); font-size: 15px;
}

/* Google button — big, tactile */
.g-btn {
  width: 100%;
  display: inline-flex; align-items: center; justify-content: center; gap: 12px;
  padding: 14px 18px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff; color: #1f2937;
  font-weight: 600; font-size: 15.5px;
  transition: transform .15s ease, box-shadow .2s ease, border-color .2s ease;
}
.g-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px -10px rgba(79,70,229,.4);
  border-color: #c7d2fe;
}
.g-btn:active { transform: translateY(0); }
.g-btn svg { flex: 0 0 auto; }

/* divider */
.auth-divider {
  display: flex; align-items: center; gap: 12px;
  color: var(--muted); font-size: 12.5px; margin: 22px 0;
}
.auth-divider::before, .auth-divider::after {
  content: ''; height: 1px; flex: 1; background: var(--border);
}

/* trust chips */
.auth-chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.auth-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px; border-radius: 999px;
  background: #f1f5f9; color: #475569;
  font-size: 12.5px; font-weight: 600;
}

.auth-foot {
  margin-top: 24px; text-align: center;
  font-size: 12.5px; color: var(--muted); line-height: 1.6;
}
.auth-foot a { font-weight: 600; }

/* loading state */
.auth-loading {
  min-height: 100vh; min-height: 100dvh;
  display: grid; place-items: center; background: var(--bg);
}
.spinner {
  width: 34px; height: 34px; border-radius: 50%;
  border: 3px solid var(--border); border-top-color: var(--primary);
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* small tablet tweak */
@media (min-width: 600px) and (max-width: 899px) {
  .auth-card { max-width: 460px; padding: 40px 36px; }
}
