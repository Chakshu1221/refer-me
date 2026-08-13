import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import './css/app.css';
import './css/offers.css';

const LOGO_COLORS = [
  'linear-gradient(135deg,#6366f1,#4338ca)',
  'linear-gradient(135deg,#f59e0b,#f97316)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#ec4899,#be185d)',
  'linear-gradient(135deg,#06b6d4,#0891b2)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
];
const pickColor = (s = '') => LOGO_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length];

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function MyOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    api.myOffers().then((d) => setOffers(d || [])).catch(() => setOffers([])).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const pending = offers.filter((o) => o.status === 'pending').length;
    const approved = offers.filter((o) => o.status === 'approved').length;
    const earned = offers
      .filter((o) => o.status === 'approved')
      .reduce((sum, o) => sum + (o.request?.rp_cost || 0), 0);
    return { total: offers.length, pending, approved, earned };
  }, [offers]);

  const counts = useMemo(() => ({
    all: offers.length,
    pending: offers.filter((o) => o.status === 'pending').length,
    approved: offers.filter((o) => o.status === 'approved').length,
    rejected: offers.filter((o) => o.status === 'rejected').length,
  }), [offers]);

  const view = useMemo(
    () => (tab === 'all' ? offers : offers.filter((o) => o.status === tab)),
    [offers, tab]
  );

  return (
    <div className="page">
      <div className="offers-head-block">
        <h1>My referral offers 🤝</h1>
        <p>Track every referral you've offered. RP is credited the moment a requester approves your proof.</p>
      </div>

      {/* STATS */}
      <div className="mo-stats">
        <div className="mo-stat">
          <div className="ic total">📤</div>
          <div><b>{loading ? '—' : stats.total}</b><span>Offers made</span></div>
        </div>
        <div className="mo-stat">
          <div className="ic pend">⏳</div>
          <div><b>{loading ? '—' : stats.pending}</b><span>Awaiting review</span></div>
        </div>
        <div className="mo-stat">
          <div className="ic appr">✅</div>
          <div><b>{loading ? '—' : stats.approved}</b><span>Approved</span></div>
        </div>
        <div className="mo-stat">
          <div className="ic earn">⚡</div>
          <div><b>{loading ? '—' : stats.earned}</b><span>RP earned</span></div>
        </div>
      </div>

      {/* TABS */}
      <div className="mo-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`mo-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
            <span className="cnt">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* LIST */}
      {loading ? (
        <div className="mo-list">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 84, borderRadius: 16 }} />)}
        </div>
      ) : view.length === 0 ? (
        <div className="empty">
          <div className="em">📭</div>
          <h3>{tab === 'all' ? 'No offers yet' : `No ${tab} offers`}</h3>
          <p>{tab === 'all'
            ? "You haven't offered any referrals yet. Help someone and start earning RP."
            : `You have no ${tab} offers right now.`}</p>
          <Link to="/browse" className="btn-cta">🔎 Browse requests</Link>
        </div>
      ) : (
        <div className="mo-list">
          {view.map((o) => {
            const req = o.request || {};
            const company = req.company_name || 'Company';
            const reward = req.rp_cost || 0;
            return (
              <div className="mo-item" key={o.id}>
                <div className="mo-card">
                  <div className="mo-logo" style={{ background: pickColor(company) }}>
                    {company[0].toUpperCase()}
                  </div>
                  <div className="mo-body">
                    <h3>{req.role_title || 'Referral request'}</h3>
                    <span className="co">🏢 {company}</span>
                    <div className="meta">
                      <span>📅 {new Date(o.created_at).toLocaleDateString()}</span>
                      <a href={o.proof_url} target="_blank" rel="noreferrer">🧾 Proof</a>
                      {req.id && <Link to={`/request/${req.id}`}>View request →</Link>}
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
    </div>
  );
}
