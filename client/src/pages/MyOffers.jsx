import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import './css/app.css';
import './css/offers.css';
import './css/openings.css';

const LOGO_COLORS = [
  'linear-gradient(135deg,#6366f1,#4338ca)',
  'linear-gradient(135deg,#f59e0b,#f97316)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#ec4899,#be185d)',
  'linear-gradient(135deg,#06b6d4,#0891b2)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
];
const pickColor = (s = '') => LOGO_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length];

const OFFER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];
const GRAB_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'proof_submitted', label: 'To confirm' },
  { key: 'approved', label: 'Done' },
  { key: 'rejected', label: 'Rejected' },
];

export default function MyOffers() {
  const [mode, setMode] = useState('offers'); // 'offers' | 'grabs'
  const [offers, setOffers] = useState([]);
  const [grabs, setGrabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    Promise.all([
      api.myOffers().catch(() => []),
      api.myClaims().catch(() => []),
    ]).then(([o, g]) => {
      setOffers(o || []);
      setGrabs(g || []);
    }).finally(() => setLoading(false));
  }, []);

  // reset tab when switching mode
  const switchMode = (m) => { setMode(m); setTab('all'); };

  /* ---------- OFFERS (referrals I gave -> I EARN rp) ---------- */
  const offerStats = useMemo(() => {
    const pending = offers.filter((o) => o.status === 'pending').length;
    const approved = offers.filter((o) => o.status === 'approved').length;
    const earned = offers.filter((o) => o.status === 'approved').reduce((s, o) => s + (o.request?.rp_cost || 0), 0);
    return { total: offers.length, pending, approved, earned };
  }, [offers]);
  const offerCounts = useMemo(() => ({
    all: offers.length,
    pending: offers.filter((o) => o.status === 'pending').length,
    approved: offers.filter((o) => o.status === 'approved').length,
    rejected: offers.filter((o) => o.status === 'rejected').length,
  }), [offers]);
  const offerView = useMemo(() => (tab === 'all' ? offers : offers.filter((o) => o.status === tab)), [offers, tab]);

  /* ---------- GRABS (openings I grabbed -> I PAY rp) ---------- */
  const grabStats = useMemo(() => {
    const pending = grabs.filter((g) => g.status === 'pending').length;
    const toConfirm = grabs.filter((g) => g.status === 'proof_submitted').length;
    const done = grabs.filter((g) => g.status === 'approved').length;
    const spent = grabs.filter((g) => g.status === 'approved').reduce((s, g) => s + (g.opening?.rp_price || 0), 0);
    return { total: grabs.length, pending, toConfirm, done, spent };
  }, [grabs]);
  const grabCounts = useMemo(() => ({
    all: grabs.length,
    pending: grabs.filter((g) => g.status === 'pending').length,
    proof_submitted: grabs.filter((g) => g.status === 'proof_submitted').length,
    approved: grabs.filter((g) => g.status === 'approved').length,
    rejected: grabs.filter((g) => g.status === 'rejected').length,
  }), [grabs]);
  const grabView = useMemo(() => (tab === 'all' ? grabs : grabs.filter((g) => g.status === tab)), [grabs, tab]);

  const chipClass = (s) => (s === 'proof_submitted' ? 'pending' : s);
  const chipLabel = (s) => (s === 'proof_submitted' ? 'confirm now' : s);

  return (
    <div className="page">
      <div className="offers-head-block">
        <h1>My activity 📊</h1>
        <p>Track referrals you gave and openings you grabbed — all in one place.</p>
      </div>

      {/* mode toggle */}
      <div className="mk-toggle">
        <a className={mode === 'offers' ? 'active' : ''} onClick={() => switchMode('offers')} style={{ cursor: 'pointer' }}>🤝 Offers</a>
        <a className={mode === 'grabs' ? 'active' : ''} onClick={() => switchMode('grabs')} style={{ cursor: 'pointer' }}>🎁 Grabs</a>
      </div>

      {mode === 'offers' ? (
        <>
          {/* OFFERS stats */}
          <div className="mo-stats">
            <div className="mo-stat"><div className="ic total">📤</div><div><b>{loading ? '—' : offerStats.total}</b><span>Offers made</span></div></div>
            <div className="mo-stat"><div className="ic pend">⏳</div><div><b>{loading ? '—' : offerStats.pending}</b><span>Awaiting review</span></div></div>
            <div className="mo-stat"><div className="ic appr">✅</div><div><b>{loading ? '—' : offerStats.approved}</b><span>Approved</span></div></div>
            <div className="mo-stat"><div className="ic earn">⚡</div><div><b>{loading ? '—' : offerStats.earned}</b><span>RP earned</span></div></div>
          </div>

          <div className="mo-tabs">
            {OFFER_TABS.map((t) => (
              <button key={t.key} className={`mo-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}<span className="cnt">{offerCounts[t.key]}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="mo-list">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 84, borderRadius: 16 }} />)}</div>
          ) : offerView.length === 0 ? (
            <div className="empty">
              <div className="em">📭</div>
              <h3>{tab === 'all' ? 'No offers yet' : `No ${tab} offers`}</h3>
              <p>{tab === 'all' ? "You haven't offered any referrals yet." : `You have no ${tab} offers.`}</p>
              <Link to="/browse" className="btn-cta">🔎 Browse requests</Link>
            </div>
          ) : (
            <div className="mo-list">
              {offerView.map((o) => {
                const req = o.request || {};
                const company = req.company_name || 'Company';
                const reward = req.rp_cost || 0;
                return (
                  <div className="mo-item" key={o.id}>
                    <div className="mo-card">
                      <div className="mo-logo" style={{ background: pickColor(company) }}>{company[0].toUpperCase()}</div>
                      <div className="mo-body">
                        <h3>{req.role_title || 'Referral request'}</h3>
                        <span className="co">🏢 {company}</span>
                        <div className="meta">
                          <span>📅 {new Date(o.created_at).toLocaleDateString()}</span>
                          <a href={o.proof_url} target="_blank" rel="noreferrer">🧾 Proof</a>
                          {req.id && <Link to={`/request/${req.id}`}>View →</Link>}
                        </div>
                      </div>
                      <div className="mo-right">
                        <span className={`chip ${o.status}`}>{o.status}</span>
                        {o.status === 'approved' && <span className="mo-reward earned">⚡ +{reward}</span>}
                        {o.status === 'pending' && <span className="mo-reward potential">⚡ {reward}</span>}
                        {o.status === 'rejected' && <span className="mo-reward lost">⚡ {reward}</span>}
                      </div>
                    </div>
                    {o.status === 'rejected' && o.rejection_reason && (
                      <div className="mo-reject"><b>Rejected:</b> {o.rejection_reason}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* GRABS stats */}
          <div className="mo-stats">
            <div className="mo-stat"><div className="ic total">🎁</div><div><b>{loading ? '—' : grabStats.total}</b><span>Openings grabbed</span></div></div>
            <div className="mo-stat"><div className="ic pend">⏳</div><div><b>{loading ? '—' : grabStats.pending}</b><span>Awaiting referral</span></div></div>
            <div className="mo-stat"><div className="ic appr">🎯</div><div><b>{loading ? '—' : grabStats.toConfirm}</b><span>To confirm</span></div></div>
            <div className="mo-stat"><div className="ic earn">⚡</div><div><b>{loading ? '—' : grabStats.spent}</b><span>RP spent</span></div></div>
          </div>

          <div className="mo-tabs">
            {GRAB_TABS.map((t) => (
              <button key={t.key} className={`mo-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}<span className="cnt">{grabCounts[t.key]}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="mo-list">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 84, borderRadius: 16 }} />)}</div>
          ) : grabView.length === 0 ? (
            <div className="empty">
              <div className="em">🎁</div>
              <h3>{tab === 'all' ? 'No grabs yet' : 'Nothing here'}</h3>
              <p>{tab === 'all' ? "You haven't grabbed any openings yet." : `No ${chipLabel(tab)} grabs.`}</p>
              <Link to="/openings" className="btn-cta">🎁 Browse openings</Link>
            </div>
          ) : (
            <div className="mo-list">
              {grabView.map((g) => {
                const op = g.opening || {};
                const company = op.company_name || 'Company';
                const price = op.rp_price || 0;
                return (
                  <div className="mo-item" key={g.id}>
                    <div className="mo-card">
                      <div className="mo-logo" style={{ background: pickColor(company) }}>{company[0].toUpperCase()}</div>
                      <div className="mo-body">
                        <h3>{op.role_title || 'Referral opening'}</h3>
                        <span className="co">🏢 {company}</span>
                        <div className="meta">
                          <span>📅 {new Date(g.created_at).toLocaleDateString()}</span>
                          {g.resume_url && <a href={g.resume_url} target="_blank" rel="noreferrer">📄 Resume</a>}
                          {g.proof_url && <a href={g.proof_url} target="_blank" rel="noreferrer">🧾 Proof</a>}
                          {op.id && <Link to={`/opening/${op.id}`}>View →</Link>}
                        </div>
                      </div>
                      <div className="mo-right">
                        <span className={`chip ${chipClass(g.status)}`}>{chipLabel(g.status)}</span>
                        {g.status === 'approved' && <span className="mo-reward lost">⚡ -{price}</span>}
                        {g.status === 'proof_submitted' && <span className="mo-reward potential">⚡ {price}</span>}
                        {g.status === 'pending' && <span className="mo-reward potential">⚡ {price}</span>}
                        {g.status === 'rejected' && <span className="mo-reward lost">⚡ {price}</span>}
                      </div>
                    </div>
                    {g.status === 'proof_submitted' && (
                      <div className="mo-reject" style={{ color: '#92400e', background: '#fffbeb', borderColor: '#fde68a' }}>
                        <b>Action needed:</b> the referrer submitted proof — <Link to={`/opening/${op.id}`} style={{ color: '#92400e', fontWeight: 700 }}>confirm to pay {price} RP →</Link>
                      </div>
                    )}
                    {g.status === 'rejected' && g.rejection_reason && (
                      <div className="mo-reject"><b>Rejected:</b> {g.rejection_reason}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
