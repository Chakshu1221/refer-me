import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { openingsApi } from '../lib/openingsApi.js';
import './css/app.css';
import './css/openings.css';

export default function MyOpenings() {
  const [tab, setTab] = useState('posted');
  const [posted, setPosted] = useState([]);
  const [claimed, setClaimed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      openingsApi.mine().catch(() => []),
      openingsApi.claimed().catch(() => []),
    ]).then(([p, c]) => { setPosted(p || []); setClaimed(c || []); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="offers-head-block">
        <h1>My openings 🎁</h1>
        <p>Openings you posted, and openings you grabbed from others.</p>
      </div>

      <div className="mkt-toggle">
        <a className={tab === 'posted' ? 'active' : ''} onClick={() => setTab('posted')}>📤 Posted ({posted.length})</a>
        <a className={tab === 'claimed' ? 'active' : ''} onClick={() => setTab('claimed')}>🎟️ Grabbed ({claimed.length})</a>
      </div>

      {loading ? (
        <div className="op-grid">{[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}</div>
      ) : tab === 'posted' ? (
        posted.length === 0 ? (
          <div className="empty"><div className="em">📤</div><h3>No openings posted</h3>
            <p>Offer a referral at your company and start earning RP.</p>
            <Link to="/offer" className="btn-cta">🎁 Offer a referral</Link></div>
        ) : (
          <div className="op-grid">
            {posted.map((o) => {
              const left = (o.slots_total ?? 1) - (o.slots_used ?? 0);
              return (
                <Link to={`/opening/${o.id}`} key={o.id} className="op-card">
                  <div className="op-head">
                    <div className="op-logo">{(o.company_name || '?')[0].toUpperCase()}</div>
                    <div className="op-title"><h3>{o.role_title}</h3><span className="co">🏢 {o.company_name}</span></div>
                  </div>
                  <div className="op-foot">
                    <span className={`chip ${o.status === 'open' ? 'open' : o.status === 'filled' ? 'fulfilled' : 'closed'}`}>{o.status}</span>
                    <span className="op-price">⚡ {o.rp_price}</span>
                  </div>
                  <p className="op-slots" style={{ marginTop: 8 }}>🎟️ {left}/{o.slots_total} slots left</p>
                </Link>
              );
            })}
          </div>
        )
      ) : (
        claimed.length === 0 ? (
          <div className="empty"><div className="em">🎟️</div><h3>No grabs yet</h3>
            <p>Browse openings and grab a referral slot.</p>
            <Link to="/openings" className="btn-cta">🎁 Browse openings</Link></div>
        ) : (
          <div className="op-grid">
            {claimed.map((c) => {
              const o = c.opening || {};
              return (
                <Link to={`/opening/${o.id}`} key={c.id} className="op-card">
                  <div className="op-head">
                    <div className="op-logo">{(o.company_name || '?')[0].toUpperCase()}</div>
                    <div className="op-title"><h3>{o.role_title || 'Opening'}</h3><span className="co">🏢 {o.company_name}</span></div>
                  </div>
                  <div className="op-foot">
                    <span className={`chip ${c.status === 'approved' ? 'approved' : c.status === 'rejected' ? 'rejected' : 'pending'}`}>{c.status}</span>
                    <span className="op-price">⚡ {o.rp_price}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
