import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import './css/app.css';

export default function Dashboard() {
  const { profile } = useAuth();
  const [mine, setMine] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.myRequests().catch(() => []),
      api.myOffers().catch(() => []),
    ]).then(([r, o]) => {
      setMine(r || []);
      setOffers(o || []);
    }).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const open = mine.filter((r) => r.status === 'open').length;
    const fulfilled = mine.filter((r) => r.status === 'fulfilled').length;
    const approvedOffers = offers.filter((o) => o.status === 'approved').length;
    return { total: mine.length, open, fulfilled, approvedOffers };
  }, [mine, offers]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const recent = mine.slice(0, 4);

  return (
    <div className="page">
      {/* HERO */}
      <div className="dash-hero">
        <div className="dash-hero-row">
          <div className="dash-hi">
            <h1>
              Hi {firstName} 👋
              {profile?.is_premium && <span className="dash-badge">💎 PREMIUM</span>}
            </h1>
            <p>
              {profile?.role_title ? `${profile.role_title} · ` : ''}
              {profile?.current_company || 'Welcome back'} · Trust score {profile?.trust_score ?? 100}
            </p>
          </div>
          <div className="dash-rp-big">
            <span className="ic">⚡</span>
            <div>
              <b>{profile?.rp_balance ?? 0}</b>
              <span>Referral Points</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stat-grid">
        <div className="stat"><div className="ic i1">📨</div><b>{loading ? '—' : stats.total}</b><span>Requests posted</span></div>
        <div className="stat"><div className="ic i2">🟢</div><b>{loading ? '—' : stats.open}</b><span>Currently open</span></div>
        <div className="stat"><div className="ic i3">🎯</div><b>{loading ? '—' : stats.fulfilled}</b><span>Fulfilled</span></div>
        <div className="stat"><div className="ic i4">🤝</div><b>{loading ? '—' : stats.approvedOffers}</b><span>Referrals given</span></div>
      </div>

      {/* QUICK ACTIONS -> match new flow (Browse + Post) */}
      <div className="action-grid">
        <Link to="/browse" className="action-card a-give">
          <span className="big">🔎</span>
          <div>
            <h3>Browse the board</h3>
            <p>See who's seeking referrals and who's offering them. Help someone and earn RP, or grab an opening.</p>
          </div>
          <span className="arrow">→</span>
        </Link>
        <Link to="/post" className="action-card a-ask">
          <span className="big">📝</span>
          <div>
            <h3>Post something</h3>
            <p>Ask for a referral you want, or offer one you can give at your company.</p>
          </div>
          <span className="arrow">→</span>
        </Link>
      </div>

      {/* MY REQUESTS */}
      <div className="section-title">
        <h2>My requests</h2>
        {mine.length > 0 && <Link to="/post">+ Post</Link>}
      </div>

      {loading ? (
        <div className="req-grid">
          <div className="skeleton sk-card" />
          <div className="skeleton sk-card" />
        </div>
      ) : recent.length === 0 ? (
        <div className="empty">
          <div className="em">📭</div>
          <h3>No requests yet</h3>
          <p>Post your first request or offer and let the community help.</p>
          <Link to="/post" className="btn-cta">📝 Post something</Link>
        </div>
      ) : (
        <div className="req-grid">
          {recent.map((r) => (
            <Link to={`/request/${r.id}`} key={r.id} className="req-card">
              <div className="req-top">
                <h3>{r.role_title}</h3>
                <span className={`chip ${r.status}`}>{r.status}</span>
              </div>
              <p className="req-company">🏢 {r.company_name}</p>
              <div className="req-foot">
                <span className="req-rp">⚡ {r.rp_cost} RP</span>
                <span className="req-meta">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
