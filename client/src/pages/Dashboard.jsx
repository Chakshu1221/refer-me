import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

export default function Dashboard() {
  const { profile } = useAuth();
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myRequests().then(setMine).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Hi {profile?.full_name?.split(' ')[0] || 'there'} 👋</h2>
          <p className="hint" style={{ marginTop: 0 }}>
            {profile?.current_company} · Trust score {profile?.trust_score}
            {profile?.is_premium && <span className="badge premium" style={{ marginLeft: 8 }}>PREMIUM</span>}
          </p>
        </div>
        <span className="rp-pill" style={{ fontSize: 16 }}>⚡ {profile?.rp_balance} RP</span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
        <Link to="/browse" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3>🔎 Give a referral</h3>
          <p className="meta">Browse open requests, refer someone, upload proof and earn RP.</p>
        </Link>
        <Link to="/create" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3>🙋 Ask for a referral</h3>
          <p className="meta">Post a role you want. Spend RP only when you approve a referral.</p>
        </Link>
      </div>

      <h3 style={{ marginTop: 24 }}>My requests</h3>
      {loading ? <p className="hint">Loading…</p> : mine.length === 0 ? (
        <p className="hint">No requests yet. <Link to="/create">Create one →</Link></p>
      ) : (
        <div className="grid">
          {mine.map((r) => (
            <Link to={`/request/${r.id}`} key={r.id} className="card" style={{ color: 'inherit' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>{r.role_title}</h3>
                <span className={`badge ${r.status}`}>{r.status}</span>
              </div>
              <p className="meta">{r.company_name} · {r.rp_cost} RP</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
